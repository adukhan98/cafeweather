import { describe, expect, it } from "vitest";
import routes from "../../app/routes";
import * as cafeDetailResource from "../../app/routes/api.cafe-detail";
import * as cafesResource from "../../app/routes/api.cafes";
import * as facetsResource from "../../app/routes/api.facets";
import * as notFoundResource from "../../app/routes/api.not-found";
import * as reactionResource from "../../app/routes/api.reaction";
import * as rouletteResource from "../../app/routes/api.roulette";
import * as suggestionsResource from "../../app/routes/api.suggestions";

describe("API v1 resource route registration", () => {
  it("registers catalogue, roulette, suggestion, and reaction resources", () => {
    const paths = routes.map((route) => route.path).filter(Boolean);

    expect(paths).toEqual(
      expect.arrayContaining([
        "api/v1/facets",
        "api/v1/*",
        "*",
        "api/v1/cafes",
        "api/v1/cafes/:slug",
        "api/v1/roulette",
        "api/v1/suggestions",
        "api/v1/cafes/:cafeId/reactions/:kind",
      ]),
    );
  });

  it("registers the API splat after every known API v1 resource", () => {
    const paths = routes.map((route) => route.path).filter(Boolean);
    const apiSplatIndex = paths.indexOf("api/v1/*");
    const knownApiIndexes = paths
      .map((path, index) => ({ path, index }))
      .filter(({ path }) => path.startsWith("api/v1/") && path !== "api/v1/*")
      .map(({ index }) => index);

    expect(paths).toContain("api/v1/facets");
    expect(paths).toContain("*");
    expect(apiSplatIndex).toBeGreaterThan(Math.max(...knownApiIndexes));
  });

  it.each([
    ["loader", notFoundResource.loader],
    ["action", notFoundResource.action],
  ])("returns a structured JSON 404 from the API splat %s", async (_name, handler) => {
    const response = await handler();

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toMatch(/^application\/json\b/);
    expect(await response.json()).toEqual({
      error: { code: "not_found", message: "API route not found." },
    });
  });

  it("routes unsupported methods through the JSON API method guard", () => {
    for (const resource of [
      cafeDetailResource,
      cafesResource,
      facetsResource,
      reactionResource,
      rouletteResource,
      suggestionsResource,
    ]) {
      expect(resource.loader).toBeTypeOf("function");
      expect(resource.action).toBeTypeOf("function");
    }
  });

  it("provides a resource adapter for the aggregate reactions endpoint", async () => {
    const resource = await import("../../app/routes/api.reactions");

    expect(resource.loader).toBeTypeOf("function");
    expect(resource.action).toBeTypeOf("function");
  });
});
