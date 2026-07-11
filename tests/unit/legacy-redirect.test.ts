import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import { handleLegacyRequest } from "../../workers/legacy-redirect";

describe("legacy Café Weather worker", () => {
  it("permanently redirects pages while preserving path and query", async () => {
    const response = await handleLegacyRequest(
      new Request("https://cafe-weather.example/cafes/neo?from=legacy"),
    );

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe(
      "https://meet-me-there.adnaankhan0901.workers.dev/cafes/neo?from=legacy",
    );
  });

  it("proxies API method, headers, and body only to the canonical origin", async () => {
    const upstream = vi.fn(async (request: Request) => {
      expect(request.url).toBe(
        "https://meet-me-there.adnaankhan0901.workers.dev/api/v1/reactions?cafe=neo",
      );
      expect(request.method).toBe("POST");
      expect(request.headers.get("x-request-id")).toBe("request-1");
      expect(request.headers.get("origin")).toBe(
        "https://meet-me-there.adnaankhan0901.workers.dev",
      );
      expect(await request.text()).toBe('{"reaction":"great-coffee"}');
      expect(request.redirect).toBe("manual");
      return new Response("ok", { status: 201 });
    });

    const response = await handleLegacyRequest(
      new Request("https://cafe-weather.example/api/v1/reactions?cafe=neo", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://cafe-weather.example",
          "x-request-id": "request-1",
        },
        body: '{"reaction":"great-coffee"}',
      }),
      upstream,
    );

    expect(upstream).toHaveBeenCalledOnce();
    expect(response.status).toBe(201);
  });

  it.each(["GET", "HEAD"])("does not attach a body to %s API requests", async (method) => {
    const upstream = vi.fn(async (request: Request) => {
      expect(request.body).toBeNull();
      return new Response(null, { status: 204 });
    });
    await handleLegacyRequest(
      new Request("https://cafe-weather.example/api/health", { method }),
      upstream,
    );
    expect(upstream).toHaveBeenCalledOnce();
  });

  it("keeps the legacy worker isolated from bindings and secrets", async () => {
    const config = JSON.parse(
      await readFile(new URL("../../wrangler.legacy.jsonc", import.meta.url), "utf8"),
    ) as Record<string, unknown>;

    expect(config).toMatchObject({
      name: "cafe-weather",
      main: "./workers/legacy-redirect.ts",
      compatibility_date: "2026-07-10",
      compatibility_flags: ["nodejs_compat"],
      workers_dev: true,
      preview_urls: false,
    });
    expect(config).not.toHaveProperty("vars");
    expect(config).not.toHaveProperty("d1_databases");
    expect(JSON.stringify(config)).not.toMatch(/SECRET|binding/iu);
  });
});
