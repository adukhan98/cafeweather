import { RouterContextProvider } from "react-router";
import { describe, expect, it } from "vitest";

import routes from "../../app/routes";
import { loader as cafeDetailLoader } from "../../app/routes/cafe-detail";
import { loader as rouletteLoader } from "../../app/routes/roulette";
import { cloudflareContext } from "../../workers/app";

function context() {
  const provider = new RouterContextProvider();
  provider.set(cloudflareContext, {
    cloudflare: {
      env: {} as Env,
      ctx: {} as ExecutionContext,
    },
  });
  return provider;
}

describe("detail and roulette routes", () => {
  it("registers both user-facing routes", () => {
    const paths = routes.map((route) => route.path).filter(Boolean);
    expect(paths).toEqual(expect.arrayContaining(["cafes/:slug", "roulette"]));
  });

  it("loads a valid café through the SSR catalogue service", async () => {
    const result = await cafeDetailLoader({
      request: new Request("https://cafeweather.test/cafes/larrys-place-parkdale"),
      params: { slug: "larrys-place-parkdale" },
      context: context(),
    });

    expect(result.data.cafe.slug).toBe("larrys-place-parkdale");
    expect(result.data.source).toBe("seed");
  });

  it("returns a real 404 response for an unknown slug", async () => {
    const result = await cafeDetailLoader({
      request: new Request("https://cafeweather.test/cafes/not-a-cafe"),
      params: { slug: "not-a-cafe" },
      context: context(),
    });

    expect(result.init?.status).toBe(404);
    expect(result.data.cafe).toBeNull();
  });

  it("loads a filtered roulette result through SSR without internal HTTP", async () => {
    const result = await rouletteLoader({
      request: new Request("https://cafeweather.test/roulette?offering=Yemeni-coffee"),
      params: {},
      context: context(),
    });

    expect(result.cafe?.slug).toBe("qishr-coffee-house-dundas-square");
    expect(result.source).toBe("seed");
  });
});
