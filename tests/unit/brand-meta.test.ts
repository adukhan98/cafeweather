import { describe, expect, it } from "vitest";

import { brand } from "../../app/config/brand";
import { cafes } from "../../app/data/cafes";
import { meta as cafeDetailMeta } from "../../app/routes/cafe-detail";
import { meta as cafesMeta } from "../../app/routes/cafes";
import { meta as homeMeta } from "../../app/routes/home";
import { meta as notFoundMeta } from "../../app/routes/not-found";
import { meta as privacyMeta } from "../../app/routes/privacy";
import { meta as rouletteMeta } from "../../app/routes/roulette";
import { meta as suggestMeta } from "../../app/routes/suggest";
import { meta as termsMeta } from "../../app/routes/terms";

type Metadata = ReturnType<typeof homeMeta>;

function metadataValue(metadata: Metadata, key: "title" | "description") {
  const descriptor = metadata.find((entry) =>
    key === "title" ? "title" in entry : "name" in entry && entry.name === key,
  );
  return descriptor && ("title" in descriptor ? descriptor.title : descriptor.content);
}

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
    const metadata = homeMeta();

    expect(metadata).toContainEqual({
      title: "Meet Me There · A Toronto café guide",
    });
    expect(metadata).toContainEqual({
      name: "description",
      content:
        "A better answer to “where?” Find a Toronto café that fits the plan.",
    });
  });

  it.each([
    ["home", homeMeta()],
    ["cafes", cafesMeta()],
    ["roulette", rouletteMeta()],
    ["suggest", suggestMeta()],
    ["privacy", privacyMeta()],
    ["terms", termsMeta()],
    ["not found", notFoundMeta()],
  ])("uses Meet Me There metadata on the %s route", (_route, metadata) => {
    const title = metadataValue(metadata, "title");
    expect(
      title === `${brand.name} · ${brand.descriptor}` ||
        title?.endsWith(`· ${brand.name}`),
    ).toBe(true);
    expect(metadataValue(metadata, "description")).not.toContain("Café Weather");
  });

  it("brands found and missing café detail metadata", () => {
    type DetailMetaArgs = Parameters<typeof cafeDetailMeta>[0];
    type DetailLoaderData = NonNullable<DetailMetaArgs["loaderData"]>;
    const found: DetailLoaderData = {
      cafe: cafes[0],
      nearby: [],
      source: "seed",
    };
    const missing: DetailLoaderData = {
      cafe: null,
      nearby: [],
      source: "seed",
    };

    const foundMetadata = cafeDetailMeta({ loaderData: found });
    const missingMetadata = cafeDetailMeta({ loaderData: missing });

    expect(metadataValue(foundMetadata, "title")).toMatch(/· Meet Me There$/);
    expect(metadataValue(missingMetadata, "title")).toMatch(/· Meet Me There$/);
    expect(metadataValue(missingMetadata, "description")).toContain(brand.name);
  });
});
