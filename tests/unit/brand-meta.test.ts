import { describe, expect, it } from "vitest";

import { brand } from "../../app/config/brand";
import { meta as homeMeta } from "../../app/routes/home";

describe("public brand metadata", () => {
  it("publishes the canonical Meet Me There brand record", () => {
    expect(brand).toEqual({
      name: "Meet Me There",
      descriptor: "A Toronto café guide",
      positioning: "A better answer to “where?”",
      canonicalOrigin: "https://meet-me-there.adnaankhan0901.workers.dev",
      legacyOrigin: "https://cafe-weather.adnaankhan0901.workers.dev",
    });
    expect(Object.isFrozen(brand)).toBe(true);
  });

  it("uses the public brand on the homepage", () => {
    const metadata = homeMeta({} as Parameters<typeof homeMeta>[0]);

    expect(metadata).toContainEqual({
      title: "Meet Me There · A Toronto café guide",
    });
    expect(metadata).toContainEqual({
      name: "description",
      content:
        "A better answer to “where?” Find a Toronto café that fits the plan.",
    });
  });
});
