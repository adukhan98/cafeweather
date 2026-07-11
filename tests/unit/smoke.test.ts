import * as cafeContract from "../../app/contracts/cafes";
import { AppShell } from "../../app/components/AppShell";
import {
  applyDocumentSecurityHeaders,
  createRenderErrorHandler,
} from "../../app/entry.server";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { cafes } from "../../app/data/cafes";
import { DiscoveryHome } from "../../app/features/discovery/DiscoveryHome";
import { cloudflareContext, createWorkerFetch } from "../../workers/app";

describe("Meet Me There scaffold", () => {
  it("preserves the slug on a verified launch Cafe record", () => {
    const cafe = cafes[0] satisfies cafeContract.Cafe;

    expect(cafeContract).toBeDefined();
    expect(cafe.slug).toBe("larrys-place-parkdale");
  });

  it("renders the Meet Me There homepage on the server", () => {
    const markup = renderToStaticMarkup(
      createElement(
        MemoryRouter,
        null,
        createElement(AppShell, null, createElement(DiscoveryHome, { cafes })),
      ),
    );

    expect(markup).toContain("Meet Me There");
    expect(markup).toContain("A better answer to “where?”");
    expect(markup).toContain("Where are we meeting?");
  });

  it("marks the response as failed when server rendering errors", () => {
    let responseStatusCode = 200;
    const onError = createRenderErrorHandler(
      (status) => {
        responseStatusCode = status;
      },
      () => false,
    );

    onError(new Error("render failed"));

    expect(responseStatusCode).toBe(500);
  });

  it("applies a document-only security header baseline compatible with maps and Turnstile", () => {
    const headers = new Headers({ "x-route-header": "preserved" });

    applyDocumentSecurityHeaders(headers);

    expect(headers.get("content-security-policy")).toBe(
      "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: blob: https://tiles.openfreemap.org; connect-src 'self' https://tiles.openfreemap.org https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; worker-src 'self' blob:",
    );
    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(headers.get("permissions-policy")).toBe(
      "camera=(), microphone=(), geolocation=()",
    );
    expect(headers.get("x-route-header")).toBe("preserved");
  });

  it("forwards Cloudflare bindings and execution context to React Router", async () => {
    const env = {} as Env;
    const ctx = {} as ExecutionContext;
    let forwardedContext:
      | { cloudflare: { env: Env; ctx: ExecutionContext } }
      | undefined;
    const fetch = createWorkerFetch(async (_request, loadContext) => {
      forwardedContext = loadContext?.get(cloudflareContext);
      return new Response(null, { status: 204 });
    });

    const response = await fetch(new Request("https://cafe-weather.test"), env, ctx);

    expect(response.status).toBe(204);
    expect(forwardedContext).toEqual({ cloudflare: { env, ctx } });
  });
});
