import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import {
  createApiHandler,
  createApiHandlerFromEnv,
  type ApiDependencies,
} from "../../app/.server/api-handlers";

const origin = "https://cafe-weather.test";

class MemoryCommunityRepository {
  readonly reactions = new Set<string>();
  readonly suggestions: Array<Record<string, unknown>> = [];

  async addReaction(cafeId: string, visitorHash: string, kind: string) {
    const key = `${cafeId}:${visitorHash}:${kind}`;
    const changed = !this.reactions.has(key);
    this.reactions.add(key);
    return changed;
  }

  async removeReaction(cafeId: string, visitorHash: string, kind: string) {
    return this.reactions.delete(`${cafeId}:${visitorHash}:${kind}`);
  }

  async createSuggestion(suggestion: Record<string, unknown>) {
    this.suggestions.push(suggestion);
    return { id: `suggestion-${this.suggestions.length}`, status: "pending" as const };
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

  return { communityRepository, request };
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

  it("keeps the complete seed when D1 contains only a partial catalogue", async () => {
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

    expect(body.cafes).toHaveLength(36);
    expect(body.meta.source).toBe("seed");
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
      body: JSON.stringify({ name: "", address: "x", reason: "short" }),
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

    expect(await first.json()).toMatchObject({ reaction: { active: true, changed: true } });
    expect(await second.json()).toMatchObject({ reaction: { active: true, changed: false } });
    expect(await removed.json()).toMatchObject({ reaction: { active: false, changed: true } });
    expect(await removedAgain.json()).toMatchObject({ reaction: { active: false, changed: false } });
    expect(communityRepository.reactions).toHaveLength(0);
  });

  it("creates a pending suggestion with a 202 response", async () => {
    const { request, communityRepository } = createHarness();
    const response = await request("/api/v1/suggestions", {
      method: "POST",
      body: JSON.stringify({
        name: "A new cafe",
        address: "100 Queen Street West, Toronto",
        reason: "A thoughtful local recommendation.",
      }),
    });

    expect(response.status).toBe(202);
    expect(await response.json()).toEqual({
      suggestion: { id: "suggestion-1", status: "pending" },
    });
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

  it("runs injected Turnstile verification only when a secret is configured", async () => {
    let calls = 0;
    const { request, communityRepository } = createHarness({
      turnstileSecret: "turnstile-secret",
      verifyTurnstile: async ({ secret, token }) => {
        calls += 1;
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
      }),
    });

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("turnstile_failed");
    expect(calls).toBe(1);
    expect(communityRepository.suggestions).toHaveLength(0);
  });
});
