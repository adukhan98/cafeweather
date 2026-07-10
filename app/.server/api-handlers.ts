import { z } from "zod";
import type { CafeFilters } from "../contracts/filters";
import type {
  CatalogueRepository,
  CommunityRepository,
} from "./db/repositories";
import {
  D1CatalogueRepository,
  D1CommunityRepository,
} from "./db/repositories";
import { errorResponse, HttpError, type FieldErrors } from "./http-errors";
import {
  createRateLimitAttempt,
  DEFAULT_RATE_LIMITS,
  type RateLimitConfig,
} from "./rate-limit";
import { CatalogueService } from "./services/catalogue";
import {
  CommunityService,
  type TurnstileVerifier,
} from "./services/community";
import { getVisitorIdentity } from "./visitor";

const MAX_BODY_BYTES = 16_384;
const reactionKindSchema = z.enum([
  "cozy",
  "quiet",
  "work-friendly",
  "date-friendly",
  "late-night",
  "great-coffee",
  "great-tea",
]);
const suggestionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(5).max(240),
  mapUrl: z.url().startsWith("https://").optional(),
  reason: z.string().trim().min(10).max(1_000),
  recommendation: z.string().trim().max(500).optional(),
  website: z.string().max(500).optional().default(""),
  turnstileToken: z.string().max(2_048).optional(),
});

export type ApiDependencies = Readonly<{
  catalogueRepository?: CatalogueRepository;
  communityRepository?: CommunityRepository;
  visitorSecret?: string;
  turnstileSecret?: string;
  turnstileHostname?: string;
  turnstileAction?: string;
  verifyTurnstile?: TurnstileVerifier;
  production?: boolean;
  rateLimits?: RateLimitConfig;
}>;

type ApiEnv = Env & {
  DB?: D1Database;
  VISITOR_HMAC_SECRET?: string;
  TURNSTILE_SECRET?: string;
  TURNSTILE_HOSTNAME?: string;
  TURNSTILE_ACTION?: string;
};

export function createApiHandlerFromEnv(env: Env) {
  const apiEnv = env as ApiEnv;
  return createApiHandler({
    catalogueRepository: apiEnv.DB
      ? new D1CatalogueRepository(apiEnv.DB)
      : undefined,
    communityRepository: apiEnv.DB
      ? new D1CommunityRepository(apiEnv.DB)
      : undefined,
    visitorSecret: apiEnv.VISITOR_HMAC_SECRET,
    turnstileSecret: apiEnv.TURNSTILE_SECRET,
    turnstileHostname: apiEnv.TURNSTILE_HOSTNAME,
    turnstileAction: apiEnv.TURNSTILE_ACTION,
  });
}

function requestId(request: Request): string {
  return request.headers.get("cf-ray") ?? crypto.randomUUID();
}

function ensureOrigin(request: Request): void {
  const supplied = request.headers.get("origin");
  if (!supplied || supplied !== new URL(request.url).origin) {
    throw new HttpError(
      403,
      "origin_rejected",
      "The request origin is not allowed.",
    );
  }
}

function values(search: URLSearchParams, key: string): string[] | undefined {
  const result = search
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return result.length > 0 ? result : undefined;
}

function filters(search: URLSearchParams): CafeFilters {
  return {
    search: search.get("search") ?? search.get("q") ?? undefined,
    neighborhoods: values(search, "neighborhoods"),
    moods: values(search, "moods"),
    offerings: values(search, "offerings"),
    attributes: values(search, "attributes"),
  };
}

function toFieldErrors(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    (result[field] ??= []).push(issue.message);
  }
  return result;
}

async function readJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new HttpError(
      413,
      "request_too_large",
      "The request body is too large.",
    );
  }
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_BODY_BYTES) {
        try {
          await reader.cancel("request body too large");
        } catch {
          // The size rejection remains authoritative even if cancellation fails.
        }
        throw new HttpError(
          413,
          "request_too_large",
          "The request body is too large.",
        );
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const body = new TextDecoder().decode(bytes);
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(
      400,
      "invalid_json",
      "The request body is not valid JSON.",
    );
  }
}

function decodePathSegment(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new HttpError(
      400,
      "malformed_path_encoding",
      "A route parameter is not valid percent-encoding.",
    );
  }
}

function isProductionRequest(request: Request, configured?: boolean): boolean {
  if (configured !== undefined) return configured;
  const hostname = new URL(request.url).hostname;
  return !(
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".test")
  );
}

function visitorSecretForWrite(
  request: Request,
  dependencies: ApiDependencies,
): { secret: string; production: boolean } {
  const production = isProductionRequest(request, dependencies.production);
  const secret = dependencies.visitorSecret;
  // Exact production rule: the configured string must contain at least 32
  // UTF-8 bytes. Hex/base64 secrets are accepted as their encoded text when
  // that text itself meets the same 32-byte minimum.
  if (
    !secret ||
    (production && new TextEncoder().encode(secret).byteLength < 32)
  ) {
    throw new HttpError(
      503,
      "visitor_identity_unavailable",
      "Community features are temporarily unavailable.",
    );
  }
  return { secret, production };
}

function allowedMethods(path: string): readonly string[] | null {
  if (
    path === "/api/v1/facets" ||
    path === "/api/v1/cafes" ||
    path === "/api/v1/roulette" ||
    /^\/api\/v1\/cafes\/[^/]+$/u.test(path)
  ) {
    return ["GET"];
  }
  if (path === "/api/v1/suggestions") return ["POST"];
  if (/^\/api\/v1\/cafes\/[^/]+\/reactions\/[^/]+$/u.test(path)) {
    return ["PUT", "DELETE"];
  }
  return null;
}

function withCookie(response: Response, setCookie?: string): Response {
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

export function createApiHandler(dependencies: ApiDependencies) {
  const catalogue = new CatalogueService(dependencies.catalogueRepository);
  const community = new CommunityService(
    dependencies.communityRepository,
    dependencies.turnstileSecret,
    dependencies.verifyTurnstile,
  );
  const rateLimits = dependencies.rateLimits ?? DEFAULT_RATE_LIMITS;

  return async function handle(request: Request): Promise<Response> {
    const id = requestId(request);
    try {
      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/u, "") || "/";

      if (path === "/api/v1/facets" && request.method === "GET") {
        const result = await catalogue.facets();
        return Response.json({
          facets: result.facets,
          meta: { source: result.source },
        });
      }

      if (path === "/api/v1/cafes" && request.method === "GET") {
        const result = await catalogue.list(filters(url.searchParams));
        return Response.json({
          cafes: result.cafes,
          meta: { source: result.source, count: result.cafes.length },
        });
      }

      if (path === "/api/v1/roulette" && request.method === "GET") {
        const seed =
          url.searchParams.get("seed") ?? new Date().toISOString().slice(0, 10);
        const result = await catalogue.roulette(
          filters(url.searchParams),
          seed,
          url.searchParams.get("previousId") ?? undefined,
        );
        if (!result.cafe) {
          throw new HttpError(
            404,
            "no_matching_cafes",
            "No cafes match those filters.",
          );
        }
        return Response.json({
          cafe: result.cafe,
          meta: { source: result.source, seed },
        });
      }

      if (path === "/api/v1/suggestions" && request.method === "POST") {
        ensureOrigin(request);
        const parsed = suggestionSchema.safeParse(await readJson(request));
        if (!parsed.success) {
          throw new HttpError(
            400,
            "validation_failed",
            "Please correct the highlighted fields.",
            toFieldErrors(parsed.error),
          );
        }
        if (parsed.data.website) {
          throw new HttpError(
            400,
            "bot_detected",
            "The submission was rejected.",
          );
        }
        const { secret, production } = visitorSecretForWrite(
          request,
          dependencies,
        );
        await community.consumeRateLimit(
          await createRateLimitAttempt({
            request,
            secret,
            action: "suggestion",
            config: rateLimits,
            production,
          }),
        );
        await community.checkTurnstile({
          token: parsed.data.turnstileToken,
          remoteIp: request.headers.get("cf-connecting-ip") ?? undefined,
          expectedHostname:
            dependencies.turnstileHostname ?? new URL(request.url).hostname,
          expectedAction: dependencies.turnstileAction ?? "suggestion",
          required: production,
        });
        const visitor = await getVisitorIdentity(
          request,
          secret,
        );
        const suggestion = await community.createSuggestion({
          name: parsed.data.name,
          address: parsed.data.address,
          mapUrl: parsed.data.mapUrl,
          reason: parsed.data.reason,
          recommendation: parsed.data.recommendation,
          visitorHash: visitor.visitorHash,
        });
        return withCookie(
          Response.json({ suggestion }, { status: 202 }),
          visitor.setCookie,
        );
      }

      const reaction = path.match(
        /^\/api\/v1\/cafes\/([^/]+)\/reactions\/([^/]+)$/u,
      );
      if (
        reaction &&
        (request.method === "PUT" || request.method === "DELETE")
      ) {
        ensureOrigin(request);
        const cafeId = decodePathSegment(reaction[1]);
        const kindResult = reactionKindSchema.safeParse(
          decodePathSegment(reaction[2]),
        );
        if (!kindResult.success) {
          throw new HttpError(
            400,
            "validation_failed",
            "The reaction kind is not allowed.",
            { kind: kindResult.error.issues.map(({ message }) => message) },
          );
        }
        const detail = await catalogue.findBySlug(cafeId);
        if (!detail.cafe) {
          throw new HttpError(404, "cafe_not_found", "Cafe not found.");
        }
        const { secret, production } = visitorSecretForWrite(
          request,
          dependencies,
        );
        const visitor = await getVisitorIdentity(
          request,
          secret,
        );
        await community.consumeRateLimit(
          await createRateLimitAttempt({
            request,
            secret,
            action: "reaction",
            config: rateLimits,
            production,
          }),
        );
        const result =
          request.method === "PUT"
            ? await community.addReaction(
                detail.cafe.id,
                visitor.visitorHash,
                kindResult.data,
              )
            : await community.removeReaction(
                detail.cafe.id,
                visitor.visitorHash,
                kindResult.data,
              );
        return withCookie(
          Response.json({ reaction: result }),
          visitor.setCookie,
        );
      }

      const detail = path.match(/^\/api\/v1\/cafes\/([^/]+)$/u);
      if (detail && request.method === "GET") {
        const result = await catalogue.findBySlug(decodePathSegment(detail[1]));
        if (!result.cafe) {
          throw new HttpError(404, "cafe_not_found", "Cafe not found.");
        }
        return Response.json({
          cafe: result.cafe,
          meta: { source: result.source },
        });
      }

      const methods = allowedMethods(path);
      if (methods) {
        throw new HttpError(
          405,
          "method_not_allowed",
          `Use ${methods.join(" or ")} for this resource.`,
        );
      }

      throw new HttpError(404, "route_not_found", "API route not found.");
    } catch (error) {
      if (error instanceof HttpError) return errorResponse(error, id);
      return errorResponse(
        new HttpError(500, "internal_error", "An unexpected error occurred."),
        id,
      );
    }
  };
}
