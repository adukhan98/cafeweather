import { describe, expect, it } from "vitest";

import { cafes } from "../../app/data/cafes";
import { buildHomeScenes } from "../../app/features/discovery/home-view-model";

describe("buildHomeScenes", () => {
  it("derives mood and neighbourhood counts from the catalogue", () => {
    const scenes = buildHomeScenes(cafes);

    expect(scenes.moods.find((mood) => mood.id === "serious-coffee")?.count).toBeGreaterThan(0);
    expect(scenes.neighborhoods.every((neighborhood) => neighborhood.count > 0)).toBe(true);
    expect(scenes.neighborhoods.reduce((total, neighborhood) => total + neighborhood.count, 0)).toBe(
      cafes.length,
    );
  });
});
