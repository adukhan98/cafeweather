import {
  CommunityRepositoryUnavailableError,
  type CommunityRepository,
  type RateLimitAttempt,
  type SuggestionRecord,
} from "../db/repositories";
import { HttpError } from "../http-errors";

export type TurnstileVerification = Readonly<{
  secret: string;
  token: string;
  remoteIp?: string;
  expectedHostname: string;
  expectedAction: string;
}>;

export type TurnstileVerifier = (
  input: TurnstileVerification,
) => Promise<boolean>;

export class TurnstileUnavailableError extends Error {
  override readonly name = "TurnstileUnavailableError";

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export async function verifyTurnstileRemote({
  secret,
  token,
  remoteIp,
  expectedHostname,
  expectedAction,
}: TurnstileVerification): Promise<boolean> {
  const body = new FormData();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  let response: Response;
  try {
    response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
  } catch (error) {
    throw new TurnstileUnavailableError(
      "Turnstile verification transport failed.",
      { cause: error },
    );
  }
  if (!response.ok) {
    throw new TurnstileUnavailableError(
      "Turnstile verification service is unavailable.",
    );
  }

  const result = (await response.json()) as {
    success?: boolean;
    hostname?: string;
    action?: string;
  };
  return (
    result.success === true &&
    result.hostname === expectedHostname &&
    result.action === expectedAction
  );
}

export class CommunityService {
  constructor(
    private readonly repository?: CommunityRepository,
    private readonly turnstileSecret?: string,
    private readonly verifyTurnstile: TurnstileVerifier = verifyTurnstileRemote,
  ) {}

  private available(): CommunityRepository {
    if (!this.repository) {
      throw new HttpError(
        503,
        "community_unavailable",
        "Community features are temporarily unavailable.",
      );
    }
    return this.repository;
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof CommunityRepositoryUnavailableError) {
        throw new HttpError(
          503,
          "community_unavailable",
          "Community features are temporarily unavailable.",
        );
      }
      throw error;
    }
  }

  async checkTurnstile({
    token,
    remoteIp,
    expectedHostname,
    expectedAction,
    required,
  }: {
    token?: string;
    remoteIp?: string;
    expectedHostname: string;
    expectedAction: string;
    required: boolean;
  }): Promise<void> {
    if (!this.turnstileSecret) {
      if (required) {
        throw new HttpError(
          503,
          "turnstile_unavailable",
          "Human verification is not configured.",
        );
      }
      return;
    }
    if (!token) {
      throw new HttpError(
        400,
        "turnstile_failed",
        "Human verification failed.",
      );
    }

    let valid: boolean;
    try {
      valid = await this.verifyTurnstile({
        secret: this.turnstileSecret,
        token,
        remoteIp,
        expectedHostname,
        expectedAction,
      });
    } catch (error) {
      if (
        error instanceof TurnstileUnavailableError ||
        (error instanceof Error && error.name === "TurnstileUnavailableError")
      ) {
        throw new HttpError(
          503,
          "turnstile_unavailable",
          "Human verification is temporarily unavailable.",
        );
      }
      throw error;
    }
    if (!valid) {
      throw new HttpError(
        400,
        "turnstile_failed",
        "Human verification failed.",
      );
    }
  }

  async consumeRateLimit(attempt: RateLimitAttempt) {
    const result = await this.write(() =>
      this.available().consumeRateLimit(attempt),
    );
    if (!result.allowed) {
      throw new HttpError(
        429,
        "rate_limited",
        "Too many community requests. Please try again later.",
      );
    }
    return result;
  }

  async addReaction(cafeId: string, visitorHash: string, kind: string) {
    const changed = await this.write(() =>
      this.available().addReaction(cafeId, visitorHash, kind),
    );
    return { active: true, changed };
  }

  async removeReaction(cafeId: string, visitorHash: string, kind: string) {
    const changed = await this.write(() =>
      this.available().removeReaction(cafeId, visitorHash, kind),
    );
    return { active: false, changed };
  }

  async createSuggestion(suggestion: SuggestionRecord) {
    return this.write(() => this.available().createSuggestion(suggestion));
  }
}
