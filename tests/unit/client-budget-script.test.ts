import { describe, expect, it } from "vitest";

import { isExcludedMapChunk } from "../../scripts/check-client-budget.mjs";

describe("client budget map exclusions", () => {
  it.each(["maplibre-gl-ABC.js", "CafeMap.client-ABC.js"])(
    "excludes the intentional %s map chunk",
    (name) => expect(isExcludedMapChunk(name)).toBe(true),
  );

  it.each(["MapLibre-gl.js", "cafe-map.js", "cafemap.js", "home-mapLibreless.js"])(
    "does not broadly exempt %s",
    (name) => expect(isExcludedMapChunk(name)).toBe(false),
  );
});
