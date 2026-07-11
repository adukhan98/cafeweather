import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import { reactionKinds } from "../../app/contracts/community";
import {
  createApiHandler,
  createApiHandlerFromEnv,
  type ApiDependencies,
} from "../../app/.server/api-handlers";

const origin = "https://cafe-weather.test";
const submissionId = "018f47a2-7749-7ad5-9658-4be5d31e1b2c";

class MemoryCommunityRepository {
  readonly reactions = new Set<string>();
  readonly suggestions: Array<Record<string, unknown>> = [];
  readonly rateLimitAttempts: Array<{
    keyHash: string;
    action: string;
    bucket: number;
    limit: number;
    now: number;
    expiresAt: number;
  }> = [];
  readonly rateLimitCounts = new Map<string, number>();

  async addReaction(cafeId: string, visitorHash: string, kind: string) {
    const key = `${cafeId}:${visitorHash}:${kind}`;
    const changed = !this.reactions.has(key);
    this.reactions.add(key);
    return changed;
  }

  async removeReaction(cafeId: string, visitorHash: string, kind: string) {
    return this.reactions.delete(`${cafeId}:${visitorHash}:${kind}`);
  }

  async listReactions(cafeId: string, visitorHash: string) {
    return reactionKinds.flatMap((kind) => {
      const suffix = `:${kind}`;
      const matching = [...this.reactions].filter(
        (reaction) => reaction.startsWith(`${cafeId}:`) && reaction.endsWith(suffix),
      );
      return matching.length > 0
        ? [{
            kind,
            count: matching.length,
            active: matching.includes(`${cafeId}:${visitorHash}:${kind}`),
          }]
        : [];
    });
  }

  async createSuggestion(suggestion: Record<string, unknown>) {
    if (!this.suggestions.some(({ id }) => id === suggestion.id)) {
      this.suggestions.push(suggestion);
    }
    return { id: String(suggestion.id), status: "pending" as const };
  }

  async consumeRateLimit(attempt: {
    keyHash: string;
    action: string;
    bucket: number;
    limit: number;
    now: number;
    expiresAt: number;
  }) {
    this.rateLimitAttempts.push(attempt);
    const key = `${attempt.keyHash}:${attempt.action}:${attempt.bucket}`;
    const count = (this.rateLimitCounts.get(key) ?? 0) + 1;
    this.rateLimitCounts.set(key, count);
    return {
      allowed: count <= attempt.limit,
      count,
      retryAfterSeconds: Math.max(
        1,
        attempt.expiresAt - Math.floor(Date.now() / 1_000),
      ),
    };
  }
}

function createHarness(overrides: Partial<ApiDependencies> = {}) {
  const communityRepository = new MemoryCommunityRepository();
  const handler = createApiHandler({
    communityRepository,
    visitorSecret: "test-secret-at-least-32-characters-long",
    ...overrides,
  });

  async function request(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    if (init.method && init.method !== "GET" && !headers.has("origin")) {
      headers.set("origin", origin);
    }
    return handler(new Request(`${origin}${path}`, { ...init, headers }));
  }

  return { communityRepository, handler, request };
}

describe("Cafe Weather API handlers", () => {
  it("creates the resource handler from the typed Cloudflare environment", async () => {
    const handler = createApiHandlerFromEnv({} as Env);
    const response = await handler(new Request(`${origin}/api/v1/cafes`));

    expect(response.status).toBe(200);
    expect((await response.json()).meta.source).toBe("seed");
  });

  it("returns the seeded catalogue when no D1 catalogue binding exists", async () => {
    const { request } = createHarness();

    const response = await request("/api/v1/cafes?moods=cozy");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cafes.length).toBeGreaterThan(0);
    expect(body.cafes.every((cafe: { moods: string[] }) => cafe.moods.includes("cozy"))).toBe(true);
    expect(body.meta.source).toBe("seed");
  });

  it("returns an authoritative partial D1 catalogue without adding seed records", async () => {
    const partialRepository = {
      async list() {
        return [cafes[0]];
      },
      async findBySlug(slug: string) {
        return cafes[0].slug === slug ? cafes[0] : null;
      },
    };
    const { request } = createHarness({ catalogueRepository: partialRepository });

    const response = await request("/api/v1/cafes");
    const body = await response.json();

    expect(body.cafes).toEqual([cafes[0]]);
    expect(body.meta.source).toBe("d1");
  });

  it("returns 404 when authoritative D1 has no matching detail", async () => {
    const catalogueRepository = {
      async list() {
        return [];
      },
      async findBySlug() {
        return null;
      },
    };
    const { request } = createHarness({ catalogueRepository });

    const response = await request(
      "/api/v1/cafes/larrys-place-parkdale",
    );

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("cafe_not_found");
  });

  it("returns sorted facet metadata", async () => {
    const { request } = createHarness();
    const response = await request("/api/v1/facets");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.facets.neighborhoods).toContain("Parkdale");
    expect(body.facets.moods).toContain("cozy");
    expect(body.facets.moods).toEqual([...body.facets.moods].sort());
  });

  it("returns a cafe detail by slug", async () => {
    const { request } = createHarness();
    const response = await request("/api/v1/cafes/larrys-place-parkdale");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cafe.name).toBe("Larry's Place");
  });

  it("uses the standard error envelope for a missing cafe", async () => {
    const { request } = createHarness();
    const response = await request("/api/v1/cafes/not-a-cafe");
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      error: {
        code: "cafe_not_found",
        message: "Cafe not found.",
        requestId: expect.any(String),
      },
    });
  });

  it("returns Zod field errors for an invalid suggestion", async () => {
    const { request } = createHarness();
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "",
        address: "x",
        reason: "short",
        submissionId,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("validation_failed");
    expect(body.error.fieldErrors).toMatchObject({
      name: expect.any(Array),
      address: expect.any(Array),
      reason: expect.any(Array),
    });
  });

  it("rejects a filled suggestion honeypot without writing", async () => {
    const { request, communityRepository } = createHarness();
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
        website: "https://spam.example",
        submissionId,
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("bot_detected");
    expect(communityRepository.suggestions).toHaveLength(0);
  });

  it("rejects cross-origin community writes", async () => {
    const { request } = createHarness();
    const response = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions/cozy",
      { method: "PUT", headers: { origin: "https://evil.example" } },
    );

    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("origin_rejected");
  });

  it("adds and removes a reaction idempotently for the same visitor", async () => {
    const { request, communityRepository } = createHarness();
    const path = "/api/v1/cafes/larrys-place-parkdale/reactions/cozy";
    const first = await request(path, { method: "PUT" });
    const cookie = first.headers.get("set-cookie") ?? "";
    const second = await request(path, { method: "PUT", headers: { cookie } });
    const removed = await request(path, { method: "DELETE", headers: { cookie } });
    const removedAgain = await request(path, { method: "DELETE", headers: { cookie } });

    expect(await first.json()).toEqual({
      reaction: { kind: "cozy", active: true, changed: true, count: 1 },
    });
    expect(await second.json()).toEqual({
      reaction: { kind: "cozy", active: true, changed: false, count: 1 },
    });
    expect(await removed.json()).toEqual({
      reaction: { kind: "cozy", active: false, changed: true, count: 0 },
    });
    expect(await removedAgain.json()).toEqual({
      reaction: { kind: "cozy", active: false, changed: false, count: 0 },
    });
    expect(communityRepository.reactions).toHaveLength(0);
    expect(first.headers.get("cache-control")).toBe("private, no-store");
    expect(second.headers.get("cache-control")).toBe("private, no-store");
    expect(removed.headers.get("cache-control")).toBe("private, no-store");
    expect(removedAgain.headers.get("cache-control")).toBe("private, no-store");
  });

  it("prevents storage of community mutation errors without changing public catalogue caching", async () => {
    const { request } = createHarness();

    const communityError = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions/cozy",
      { method: "PUT", headers: { origin: "https://evil.example" } },
    );
    const catalogue = await request("/api/v1/cafes");

    expect(communityError.headers.get("cache-control")).toBe("private, no-store");
    expect(catalogue.headers.get("cache-control")).toBeNull();
  });

  it("returns all reaction kinds in contract order with private cookie-aware caching", async () => {
    const { request, communityRepository } = createHarness({
      turnstileSecret: "unused-turnstile-secret",
      verifyTurnstile: async () => {
        throw new Error("GET reactions must not invoke Turnstile");
      },
    });

    const response = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions",
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      reactions: reactionKinds.map((kind) => ({ kind, count: 0, active: false })),
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Cookie");
    expect(response.headers.get("set-cookie")).toContain("cw_visitor=");
    expect(communityRepository.rateLimitAttempts).toHaveLength(0);
    expect(JSON.stringify(body)).not.toMatch(/visitor|hash|cw_visitor/iu);
  });

  it("restores active reaction state from the signed visitor cookie after reload", async () => {
    const { request } = createHarness();
    const mutation = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions/quiet",
      { method: "PUT" },
    );
    const cookie = mutation.headers.get("set-cookie") ?? "";

    const reloaded = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions",
      { headers: { cookie } },
    );
    const body = await reloaded.json();

    expect(reloaded.headers.get("set-cookie")).toBeNull();
    expect(body.reactions.find(({ kind }: { kind: string }) => kind === "quiet"))
      .toEqual({ kind: "quiet", count: 1, active: true });
  });

  it("rotates a tampered visitor cookie without exposing identity material", async () => {
    const { request } = createHarness();
    const first = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions",
    );
    const original = first.headers.get("set-cookie")?.split(";", 1)[0] ?? "";
    const tampered = `${original.slice(0, -1)}${original.endsWith("a") ? "b" : "a"}`;

    const rotated = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions",
      { headers: { cookie: tampered } },
    );
    const body = await rotated.json();

    expect(rotated.status).toBe(200);
    expect(rotated.headers.get("set-cookie")).toContain("cw_visitor=");
    expect(rotated.headers.get("set-cookie")).not.toContain(tampered);
    expect(JSON.stringify(body)).not.toMatch(/visitor|hash|cw_visitor/iu);
  });

  it("verifies the published cafe before reading its reactions", async () => {
    const { request } = createHarness();

    const response = await request("/api/v1/cafes/not-a-cafe/reactions");

    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("cafe_not_found");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("creates a pending suggestion with a 202 response", async () => {
    const { request, communityRepository } = createHarness();
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
        submissionId,
      }),
    });

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body).toEqual({
      suggestion: { id: expect.stringMatching(/^[a-f0-9]{64}$/u), status: "pending" },
    });
    expect(body.suggestion.id).not.toBe(submissionId);
    expect(communityRepository.suggestions).toHaveLength(1);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(JSON.stringify(communityRepository.suggestions)).not.toContain(
      submissionId,
    );
  });

  it("accepts a map-only suggestion and normalizes blank address text", async () => {
    const { request, communityRepository } = createHarness();

    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A mapped cafe",
        address: "   ",
        mapUrl: "  https://maps.example/cafe  ",
        reason: "A useful map-only recommendation.",
        submissionId,
      }),
    });

    expect(response.status).toBe(202);
    expect(communityRepository.suggestions[0]).toMatchObject({
      address: undefined,
      mapUrl: "https://maps.example/cafe",
    });
  });

  it("maps the address-or-map cross-field error to both fields", async () => {
    const { request, communityRepository } = createHarness();

    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A locationless cafe",
        reason: "A recommendation without usable location data.",
        submissionId,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("validation_failed");
    expect(body.error.fieldErrors.address).toEqual([
      "Enter an address or an HTTPS map URL.",
    ]);
    expect(body.error.fieldErrors.mapUrl).toEqual([
      "Enter an address or an HTTPS map URL.",
    ]);
    expect(communityRepository.suggestions).toHaveLength(0);
  });

  it("rejects an insecure suggestion map URL", async () => {
    const { request } = createHarness();

    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "An insecure map cafe",
        mapUrl: "http://maps.example/cafe",
        reason: "A recommendation with an insecure map URL.",
        submissionId,
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.mapUrl).toEqual(
      expect.any(Array),
    );
  });

  it("rejects a suggestion map URL longer than 2048 characters", async () => {
    const { request } = createHarness();

    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "An oversized map cafe",
        mapUrl: `https://maps.example/${"x".repeat(2_100)}`,
        reason: "A recommendation with an oversized map URL.",
        submissionId,
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.mapUrl).toEqual(
      expect.any(Array),
    );
  });

  it("requires a normal UUID submission id", async () => {
    const { request, communityRepository } = createHarness();

    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A cafe with a bad replay key",
        address: "100 Queen Street West, Toronto",
        reason: "A recommendation with an invalid submission key.",
        submissionId: "not-a-uuid",
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.fieldErrors.submissionId).toEqual(
      expect.any(Array),
    );
    expect(communityRepository.suggestions).toHaveLength(0);
  });

  it("replays the same visitor submission id without creating another row", async () => {
    const { request, communityRepository } = createHarness();
    const input = {
      method: "POST",
      body: JSON.stringify({
        name: "A replay-safe cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A recommendation safe to retry after a timeout.",
        submissionId,
      }),
    } as const;

    const first = await request("/api/v1/suggestions", input);
    const cookie = first.headers.get("set-cookie") ?? "";
    const replay = await request("/api/v1/suggestions", {
      ...input,
      headers: { cookie },
    });

    expect(first.status).toBe(202);
    expect(replay.status).toBe(202);
    expect(await replay.json()).toEqual(await first.json());
    expect(communityRepository.suggestions).toHaveLength(1);
  });

  it("runs rate limiting and Turnstile again before accepting a replay", async () => {
    let turnstileCalls = 0;
    const { request, communityRepository } = createHarness({
      turnstileSecret: "turnstile-secret",
      verifyTurnstile: async () => {
        turnstileCalls += 1;
        return true;
      },
    });
    const input = {
      method: "POST",
      body: JSON.stringify({
        name: "A verified replay cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A recommendation whose retries stay abuse-protected.",
        submissionId,
        turnstileToken: "valid-token",
      }),
    } as const;

    const first = await request("/api/v1/suggestions", input);
    const replay = await request("/api/v1/suggestions", {
      ...input,
      headers: { cookie: first.headers.get("set-cookie") ?? "" },
    });

    expect(first.status).toBe(202);
    expect(replay.status).toBe(202);
    expect(turnstileCalls).toBe(2);
    expect(communityRepository.rateLimitAttempts).toHaveLength(2);
    expect(communityRepository.suggestions).toHaveLength(1);
  });

  it("returns service unavailable for community writes without D1", async () => {
    const handler = createApiHandler({
      visitorSecret: "test-secret-at-least-32-characters-long",
    });
    const response = await handler(
      new Request(
        `${origin}/api/v1/cafes/larrys-place-parkdale/reactions/cozy`,
        { method: "PUT", headers: { origin } },
      ),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("community_unavailable");
  });

  it("returns the same roulette result for the same seed and filters", async () => {
    const { request } = createHarness();
    const path = "/api/v1/roulette?seed=friday-afternoon&moods=cozy";
    const first = await request(path);
    const second = await request(path);

    expect(first.status).toBe(200);
    expect((await first.json()).cafe.id).toBe((await second.json()).cafe.id);
  });

  it("rejects oversized JSON requests before parsing", async () => {
    const { request } = createHarness();
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({ value: "x".repeat(17_000) }),
    });

    expect(response.status).toBe(413);
    expect((await response.json()).error.code).toBe("request_too_large");
  });

  it("cancels a no-content-length request stream after it exceeds 16 KiB", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(10_000)));
        controller.enqueue(new TextEncoder().encode("x".repeat(7_000)));
      },
      cancel() {
        cancelled = true;
      },
    });
    const { handler } = createHarness();
    const response = await handler(
      new Request(`${origin}/api/v1/suggestions`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );

    expect(response.status).toBe(413);
    expect((await response.json()).error.code).toBe("request_too_large");
    expect(cancelled).toBe(true);
  });

  it("still returns 413 when oversized-stream cancellation rejects", async () => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(17_000)));
      },
      cancel() {
        throw new Error("cancel failed");
      },
    });
    const { handler } = createHarness();

    const response = await handler(
      new Request(`${origin}/api/v1/suggestions`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );

    expect(response.status).toBe(413);
  });

  it("returns 400 for malformed percent-encoding in route parameters", async () => {
    const { request } = createHarness();

    const response = await request("/api/v1/cafes/%E0%A4%A");

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("malformed_path_encoding");
  });

  it("returns 405 for known resources with unsupported methods", async () => {
    const { request } = createHarness();

    const cafesResponse = await request("/api/v1/cafes", { method: "POST" });
    const suggestionsResponse = await request("/api/v1/suggestions");
    const reactionResponse = await request(
      "/api/v1/cafes/larrys-place-parkdale/reactions/cozy",
      { method: "POST" },
    );

    expect(cafesResponse.status).toBe(405);
    expect((await cafesResponse.json()).error.code).toBe("method_not_allowed");
    expect(cafesResponse.headers.get("allow")).toBe("GET");
    expect(suggestionsResponse.status).toBe(405);
    expect(suggestionsResponse.headers.get("allow")).toBe("POST");
    expect(reactionResponse.status).toBe(405);
    expect(reactionResponse.headers.get("allow")).toBe("PUT, DELETE");
  });

  it("rate-limits reactions by HMAC IP bucket without retaining the raw IP", async () => {
    const { request, communityRepository } = createHarness({
      rateLimits: { reactions: 2, suggestions: 3, bucketSeconds: 3_600 },
    });
    const path = "/api/v1/cafes/larrys-place-parkdale/reactions/cozy";
    const headers = { "cf-connecting-ip": "203.0.113.42" };

    const first = await request(path, { method: "PUT", headers });
    const second = await request(path, { method: "PUT", headers });
    const limited = await request(path, { method: "PUT", headers });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(limited.status).toBe(429);
    expect((await limited.json()).error.code).toBe("rate_limited");
    expect(limited.headers.get("retry-after")).toMatch(/^\d+$/u);
    expect(communityRepository.rateLimitAttempts[0].keyHash).toMatch(/^[a-f0-9]{64}$/u);
    expect(JSON.stringify(communityRepository.rateLimitAttempts)).not.toContain(
      "203.0.113.42",
    );
  });

  it("rate-limits suggestions before a second write", async () => {
    const { request, communityRepository } = createHarness({
      rateLimits: { reactions: 60, suggestions: 1, bucketSeconds: 3_600 },
    });
    const input = {
      method: "POST",
      headers: { "cf-connecting-ip": "203.0.113.43" },
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
        submissionId,
      }),
    } as const;

    const first = await request("/api/v1/suggestions", input);
    const limited = await request("/api/v1/suggestions", input);

    expect(first.status).toBe(202);
    expect(limited.status).toBe(429);
    expect(communityRepository.suggestions).toHaveLength(1);
  });

  it("fails closed when production community writes lack a client IP", async () => {
    const communityRepository = new MemoryCommunityRepository();
    const handler = createApiHandler({
      communityRepository,
      visitorSecret: "test-secret-at-least-32-characters-long",
      production: true,
    });

    const response = await handler(
      new Request(
        `${origin}/api/v1/cafes/larrys-place-parkdale/reactions/cozy`,
        { method: "PUT", headers: { origin } },
      ),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("rate_limit_unavailable");
  });

  it("fails closed on a production visitor secret shorter than 32 UTF-8 bytes", async () => {
    const communityRepository = new MemoryCommunityRepository();
    const handler = createApiHandler({
      communityRepository,
      visitorSecret: "too-short",
      production: true,
    });

    const response = await handler(
      new Request(
        `${origin}/api/v1/cafes/larrys-place-parkdale/reactions/cozy`,
        {
          method: "PUT",
          headers: {
            origin,
            "cf-connecting-ip": "203.0.113.45",
          },
        },
      ),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe(
      "visitor_identity_unavailable",
    );
    expect(communityRepository.reactions).toHaveLength(0);
  });

  it("fails closed when a production visitor secret is missing", async () => {
    const communityRepository = new MemoryCommunityRepository();
    const handler = createApiHandler({
      communityRepository,
      production: true,
    });

    const response = await handler(
      new Request(
        `${origin}/api/v1/cafes/larrys-place-parkdale/reactions/cozy`,
        {
          method: "PUT",
          headers: {
            origin,
            "cf-connecting-ip": "203.0.113.47",
          },
        },
      ),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe(
      "visitor_identity_unavailable",
    );
    expect(communityRepository.reactions).toHaveLength(0);
  });

  it("accepts a production visitor secret with at least 32 UTF-8 bytes", async () => {
    const communityRepository = new MemoryCommunityRepository();
    const handler = createApiHandler({
      communityRepository,
      visitorSecret: "x".repeat(32),
      production: true,
    });

    const response = await handler(
      new Request(
        `${origin}/api/v1/cafes/larrys-place-parkdale/reactions/cozy`,
        {
          method: "PUT",
          headers: {
            origin,
            "cf-connecting-ip": "203.0.113.46",
          },
        },
      ),
    );

    expect(response.status).toBe(200);
  });

  it("fails closed for production suggestions without Turnstile configuration", async () => {
    const communityRepository = new MemoryCommunityRepository();
    const handler = createApiHandler({
      communityRepository,
      visitorSecret: "test-secret-at-least-32-characters-long",
      production: true,
    });
    const response = await handler(
      new Request(`${origin}/api/v1/suggestions`, {
        method: "POST",
        headers: {
          origin,
          "content-type": "application/json",
          "cf-connecting-ip": "203.0.113.44",
        },
        body: JSON.stringify({
          name: "A new cafe",
          address: "100 Queen Street West, Toronto",
          reason: "A thoughtful local recommendation.",
          submissionId,
        }),
      }),
    );

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("turnstile_unavailable");
    expect(communityRepository.suggestions).toHaveLength(0);
  });

  it("runs injected Turnstile verification only when a secret is configured", async () => {
    let calls = 0;
    let verifierInput: Record<string, unknown> | undefined;
    const { request, communityRepository } = createHarness({
      turnstileSecret: "turnstile-secret",
      turnstileHostname: "cafe-weather.test",
      turnstileAction: "suggestion",
      verifyTurnstile: async (input) => {
        calls += 1;
        verifierInput = input;
        const { secret, token } = input;
        return secret === "turnstile-secret" && token === "valid-token";
      },
    });
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
        turnstileToken: "invalid-token",
        submissionId,
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("turnstile_failed");
    expect(calls).toBe(1);
    expect(verifierInput).toMatchObject({
      expectedHostname: "cafe-weather.test",
      expectedAction: "suggestion",
    });
    expect(communityRepository.suggestions).toHaveLength(0);
  });

  it("returns 503 when Turnstile transport is unavailable", async () => {
    const { request } = createHarness({
      turnstileSecret: "turnstile-secret",
      verifyTurnstile: async () => {
        const error = new Error("Turnstile transport unavailable");
        error.name = "TurnstileUnavailableError";
        throw error;
      },
    });
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
        turnstileToken: "valid-token",
        submissionId,
      }),
    });

    expect(response.status).toBe(503);
    expect((await response.json()).error.code).toBe("turnstile_unavailable");
  });
});
