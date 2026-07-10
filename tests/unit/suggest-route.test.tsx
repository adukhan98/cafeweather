// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { RouterContextProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../workers/app", async () => {
  const { createContext } = await import("react-router");
  return { cloudflareContext: createContext() };
});

import {
  SuggestPage,
  loader,
} from "../../app/routes/suggest";
import { cloudflareContext } from "../../workers/app";

type SuggestEnv = Env & {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_ACTION?: string;
  VISITOR_HMAC_SECRET?: string;
};

function context(env: Partial<SuggestEnv> = {}) {
  const provider = new RouterContextProvider();
  provider.set(cloudflareContext, {
    cloudflare: {
      env: env as Env,
      ctx: {} as ExecutionContext,
    },
  });
  return provider;
}

describe("suggest route", () => {
  it("keeps local Turnstile optional without serializing a secret", async () => {
    const result = await loader({
      request: new Request("http://localhost/suggest"),
      params: {},
      context: context({ VISITOR_HMAC_SECRET: "short-local-secret" }),
    });

    expect(result.data).toEqual({
      siteKey: null,
      action: "suggestion",
      turnstileRequired: false,
    });
    expect(JSON.stringify(result.data)).not.toContain("short-local-secret");
    expect(new Headers(result.init?.headers).get("set-cookie")).toBeNull();
  });

  it("returns only public Turnstile settings and sets a signed visitor cookie", async () => {
    const secret = "v".repeat(32);
    const result = await loader({
      request: new Request("https://cafeweather.ca/suggest"),
      params: {},
      context: context({
        TURNSTILE_SITE_KEY: "public-site-key",
        TURNSTILE_ACTION: "cafe-suggestion",
        VISITOR_HMAC_SECRET: secret,
      }),
    });

    expect(result.data).toEqual({
      siteKey: "public-site-key",
      action: "cafe-suggestion",
      turnstileRequired: true,
    });
    expect(JSON.stringify(result.data)).not.toContain(secret);
    expect(new Headers(result.init?.headers).get("set-cookie")).toMatch(
      /^cw_visitor=.*; Path=\/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax$/,
    );
  });

  it("does not replace an already-valid visitor cookie", async () => {
    const env = {
      TURNSTILE_SITE_KEY: "public-site-key",
      VISITOR_HMAC_SECRET: "s".repeat(32),
    };
    const first = await loader({
      request: new Request("https://cafeweather.ca/suggest"),
      params: {},
      context: context(env),
    });
    const cookie = new Headers(first.init?.headers).get("set-cookie")!;
    const second = await loader({
      request: new Request("https://cafeweather.ca/suggest", {
        headers: { cookie: cookie.split(";")[0]! },
      }),
      params: {},
      context: context(env),
    });

    expect(new Headers(second.init?.headers).get("set-cookie")).toBeNull();
  });

  it("renders the editorial suggestion page and every visible field", () => {
    render(
      <SuggestPage
        siteKey={null}
        action="suggestion"
        turnstileRequired={false}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Add a café to the weather map." })).toBeInTheDocument();
    expect(screen.getByLabelText("Café name")).toBeVisible();
    expect(screen.getByLabelText("Street address")).toBeVisible();
    expect(screen.getByLabelText("HTTPS map link")).toBeVisible();
    expect(screen.getByLabelText("Why should it be in the guide?")).toBeVisible();
    expect(screen.getByLabelText("What should someone order or notice?")).toBeVisible();
  });
});
