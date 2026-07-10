import { describe, expect, it } from "vitest";
import routes from "../../app/routes";

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
});
