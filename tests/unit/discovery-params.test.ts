import { describe, expect, it } from "vitest";

import {
  parseDiscoveryParams,
  serializeDiscoveryParams,
} from "../../app/features/discovery/discovery-params";

describe("discovery URL parameters", () => {
  it("round-trips repeated facet values in canonical order", () => {
    const state = parseDiscoveryParams(
      new URLSearchParams(
        "offering=matcha&mood=cozy&neighborhood=Ossington&mood=late-night&q=rooms&attribute=patio&view=map",
      ),
    );

    expect(serializeDiscoveryParams(state).toString()).toBe(
      "q=rooms&mood=cozy&mood=late-night&neighborhood=Ossington&offering=matcha&attribute=patio&view=map",
    );
  });

  it("omits empty filters and the default list view", () => {
    expect(
      serializeDiscoveryParams({
        search: "  ",
        moods: [],
        neighborhoods: [],
        offerings: [],
        attributes: [],
        view: "list",
      }).toString(),
    ).toBe("");
  });
});
