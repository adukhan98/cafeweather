import {
  reactionKinds,
  type ApiErrorBody,
  type PendingSuggestion,
  type ReactionAggregate,
  type ReactionKind,
  type ReactionMutation,
  type SuggestionInput,
} from "../contracts/community";

type ReactionsResponse = Readonly<{ reactions: readonly ReactionAggregate[] }>;
type ReactionResponse = Readonly<{ reaction: ReactionMutation }>;
type SuggestionResponse = Readonly<{ suggestion: PendingSuggestion }>;

export class CommunityApiError extends Error {
  override readonly name = "CommunityApiError";

  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string,
    readonly fieldErrors?: Readonly<Record<string, readonly string[]>>,
    readonly retryAfterSeconds?: number,
    readonly timedOut = false,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export type CommunityApiClient = Readonly<{
  getReactions: (
    slug: string,
    signal?: AbortSignal,
  ) => Promise<readonly ReactionAggregate[]>;
  setReaction: (
    slug: string,
    kind: ReactionKind,
    active: boolean,
    signal?: AbortSignal,
  ) => Promise<ReactionMutation>;
  submitSuggestion: (
    input: SuggestionInput,
    signal?: AbortSignal,
  ) => Promise<PendingSuggestion>;
}>;

function retryAfterSeconds(response: Response): number | undefined {
  const value = response.headers.get("retry-after");
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return Math.max(0, Math.ceil((timestamp - Date.now()) / 1_000));
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const error = (value as { error?: unknown }).error;
  const fieldErrors = object(error)
    ? (error as { fieldErrors?: unknown }).fieldErrors
    : undefined;
  return Boolean(
    object(error) &&
      typeof error.code === "string" &&
      typeof error.message === "string" &&
      typeof error.requestId === "string" &&
      (fieldErrors === undefined ||
        (object(fieldErrors) &&
          Object.values(fieldErrors).every(
            (messages) =>
              Array.isArray(messages) &&
              messages.every((message) => typeof message === "string"),
          ))),
  );
}

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function reactionKind(value: unknown): value is ReactionKind {
  return (
    typeof value === "string" && reactionKinds.includes(value as ReactionKind)
  );
}

function aggregate(value: unknown): value is ReactionAggregate {
  return (
    object(value) &&
    reactionKind(value.kind) &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count >= 0 &&
    typeof value.active === "boolean"
  );
}

function invalidResponse(): CommunityApiError {
  return new CommunityApiError(
    "The community service returned an invalid response.",
    502,
    "invalid_response",
  );
}

async function decodeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort(externalSignal?.reason);

  if (externalSignal?.aborted) onExternalAbort();
  else {
    externalSignal?.addEventListener("abort", onExternalAbort, { once: true });
  }

  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException("Timed out", "TimeoutError"));
  }, timeoutMs);

  try {
    const response = await fetch(path, {
      ...init,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      signal: controller.signal,
    });
    const decoded = await decodeJson(response);
    if (!response.ok) {
      const body = isApiErrorBody(decoded) ? decoded : undefined;
      throw new CommunityApiError(
        body?.error.message ?? "The community request could not be completed.",
        response.status,
        body?.error.code ?? "request_failed",
        body?.error.requestId,
        body?.error.fieldErrors,
        retryAfterSeconds(response),
      );
    }
    return decoded as T;
  } catch (error) {
    if (timedOut) {
      throw new CommunityApiError(
        "The request took too long. Try again.",
        408,
        "request_timed_out",
        undefined,
        undefined,
        undefined,
        true,
        { cause: error },
      );
    }
    if (
      externalSignal?.aborted ||
      (error instanceof DOMException && error.name === "AbortError") ||
      error instanceof CommunityApiError
    ) {
      throw error;
    }
    throw new CommunityApiError(
      "The community service could not be reached. Try again.",
      0,
      "network_error",
      undefined,
      undefined,
      undefined,
      false,
      { cause: error },
    );
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

export const communityApi: CommunityApiClient = {
  async getReactions(slug, signal) {
    const result = await requestJson<ReactionsResponse>(
      `/api/v1/cafes/${encodeURIComponent(slug)}/reactions`,
      { method: "GET" },
      8_000,
      signal,
    );
    if (
      !object(result) ||
      !Array.isArray(result.reactions) ||
      result.reactions.length !== reactionKinds.length ||
      !result.reactions.every(aggregate) ||
      new Set(result.reactions.map((reaction) => reaction.kind)).size !==
        reactionKinds.length
    ) {
      throw invalidResponse();
    }
    return result.reactions;
  },

  async setReaction(slug, kind, active, signal) {
    const result = await requestJson<ReactionResponse>(
      `/api/v1/cafes/${encodeURIComponent(slug)}/reactions/${encodeURIComponent(kind)}`,
      { method: active ? "PUT" : "DELETE" },
      8_000,
      signal,
    );
    if (
      !object(result) ||
      !aggregate(result.reaction) ||
      typeof result.reaction.changed !== "boolean"
    ) {
      throw invalidResponse();
    }
    return result.reaction as ReactionMutation;
  },

  async submitSuggestion(input, signal) {
    const result = await requestJson<SuggestionResponse>(
      "/api/v1/suggestions",
      { method: "POST", body: JSON.stringify(input) },
      10_000,
      signal,
    );
    if (
      !object(result) ||
      !object(result.suggestion) ||
      typeof result.suggestion.id !== "string" ||
      result.suggestion.status !== "pending"
    ) {
      throw invalidResponse();
    }
    return result.suggestion as PendingSuggestion;
  },
};
