import { describe, expect, it } from "vitest";
import routes from "../../app/routes";
import * as cafeDetailResource from "../../app/routes/api.cafe-detail";
import * as cafesResource from "../../app/routes/api.cafes";
import * as facetsResource from "../../app/routes/api.facets";
import * as reactionResource from "../../app/routes/api.reaction";
import * as rouletteResource from "../../app/routes/api.roulette";
import * as suggestionsResource from "../../app/routes/api.suggestions";

describe("API v1 resource route registration", () => {
  it("registers catalogue, roulette, suggestion, and reaction resources", () => {
    const paths = routes.map((route) => route.path).filter(Boolean);

    expect(paths).toEqual(
      expect.arrayContaining([
        "api/v1/facets",
        "api/v1/cafes",
        "api/v1/cafes/:slug",
        "api/v1/roulette",
        "api/v1/suggestions",
        "api/v1/cafes/:cafeId/reactions/:kind",
      ]),
    );
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
});
