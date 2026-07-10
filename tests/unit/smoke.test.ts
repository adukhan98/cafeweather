import * as cafeContract from "../../app/contracts/cafes";
import { AppShell } from "../../app/components/AppShell";
import { createRenderErrorHandler } from "../../app/entry.server";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Home from "../../app/routes/home";
import { cafes } from "../../app/data/cafes";
import { cloudflareContext, createWorkerFetch } from "../../workers/app";

describe("Cafe Weather scaffold", () => {
  it("preserves the slug on a verified launch Cafe record", () => {
    const cafe = cafes[0] satisfies cafeContract.Cafe;

    expect(cafeContract).toBeDefined();
    expect(cafe.slug).toBe("larrys-place-parkdale");
  });

  it("renders the Cafe Weather homepage on the server", () => {
    const markup = renderToStaticMarkup(
      createElement(AppShell, null, createElement(Home)),
    );

    expect(markup).toContain("Café Weather");
    expect(markup).toContain("shell-placeholder");
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
