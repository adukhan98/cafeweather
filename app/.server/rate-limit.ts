import type { RateLimitAttempt } from "./db/repositories";
import { HttpError } from "./http-errors";
import { hmacHex } from "./visitor";

export type RateLimitConfig = Readonly<{
  reactions: number;
  suggestions: number;
  bucketSeconds: number;
}>;

export const DEFAULT_RATE_LIMITS: RateLimitConfig = {
  reactions: 60,
  suggestions: 3,
  bucketSeconds: 3_600,
};

export async function createRateLimitAttempt({
  request,
  secret,
  action,
  config,
  production,
  now = Date.now(),
}: {
  request: Request;
  secret: string;
  action: RateLimitAttempt["action"];
  config: RateLimitConfig;
  production: boolean;
  now?: number;
}): Promise<RateLimitAttempt> {
  const ip = request.headers.get("cf-connecting-ip")?.trim();
  if (!ip && production) {
    throw new HttpError(
      503,
      "rate_limit_unavailable",
      "Community write protection is unavailable.",
    );
  }
  if (
    !Number.isInteger(config.bucketSeconds) ||
    config.bucketSeconds <= 0 ||
    !Number.isInteger(config.reactions) ||
    config.reactions <= 0 ||
    !Number.isInteger(config.suggestions) ||
    config.suggestions <= 0
  ) {
    throw new HttpError(
      503,
      "rate_limit_unavailable",
      "Community write protection is unavailable.",
    );
  }

  const nowSeconds = Math.floor(now / 1_000);
  const bucket = Math.floor(nowSeconds / config.bucketSeconds);
  const expiresAt = (bucket + 1) * config.bucketSeconds;
  const clientKey = ip || "local-development-client";
  const keyHash = await hmacHex(
    secret,
    `rate-limit:${action}:${bucket}:${clientKey}`,
  );

  return {
    keyHash,
    action,
    bucket,
    limit: action === "reaction" ? config.reactions : config.suggestions,
    now: nowSeconds,
    expiresAt,
  };
}
