import { describe, expect, it } from "vitest";

import { cafes } from "../../app/data/cafes";
import { buildHomeScenes } from "../../app/features/discovery/home-view-model";

describe("buildHomeScenes", () => {
  it("derives mood and neighbourhood counts from the catalogue", () => {
    const scenes = buildHomeScenes(cafes);

    expect(
      scenes.moods.find((mood) => mood.id === "serious-coffee")?.count,
    ).toBeGreaterThan(0);
    expect(
      scenes.neighborhoods.every((neighborhood) => neighborhood.count > 0),
    ).toBe(true);
    expect(
      scenes.neighborhoods.reduce(
        (total, neighborhood) => total + neighborhood.count,
        0,
      ),
    ).toBe(cafes.length);
  });

  it("fills the editorial trail from other verified catalogue entries", () => {
    const alternateCafes = cafes.filter((cafe) =>
      [
        "larrys-place-parkdale",
        "mallo-coffee-bar-bathurst",
        "edills-coffee-house-kennedy",
        "rooms-coffee-dupont",
        "cafe23-queen-west",
        "neo-coffee-bar-king-spadina",
        "the-company-we-keep-st-clair",
      ].includes(cafe.id),
    );

    const trail = buildHomeScenes(alternateCafes).cityTrail;

    expect(trail).toHaveLength(6);
    expect(new Set(trail.map((cafe) => cafe.id)).size).toBe(6);
    expect(trail.every((cafe) => alternateCafes.includes(cafe))).toBe(true);
  });

  it("uses the available cafés for a small catalogue and none for an empty one", () => {
    const smallCatalogue = cafes.slice(0, 2);

    expect(buildHomeScenes(smallCatalogue).cityTrail).toHaveLength(2);
    expect(
      new Set(buildHomeScenes(smallCatalogue).cityTrail.map((cafe) => cafe.id)),
    ).toEqual(new Set(smallCatalogue.map((cafe) => cafe.id)));
    expect(buildHomeScenes([]).cityTrail).toEqual([]);
  });
});
