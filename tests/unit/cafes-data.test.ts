import { describe, expect, it } from "vitest";
import { cafes } from "../../app/data/cafes";
import verifiedResearch from "../../research/cafes-verified.json";

describe("verified launch cafe catalogue", () => {
  it("contains exactly 36 cafes with unique stable ids and slugs", () => {
    expect(cafes).toHaveLength(36);
    expect(new Set(cafes.map(({ id }) => id)).size).toBe(36);
    expect(new Set(cafes.map(({ slug }) => slug)).size).toBe(36);
    expect(cafes.every(({ id, slug }) => id === slug)).toBe(true);
  });

  it("keeps every excluded research entry out of the launch catalogue", () => {
    const excludedNames = [
      "Phin La",
      "Dark Horse Espresso Bar",
      "Rooster Coffee House",
      "De Mello Coffee",
      "Nadège Patisserie",
      "Jimmy's Coffee",
      "Bomou",
    ];

    expect(cafes.filter(({ name }) => excludedNames.includes(name))).toEqual([]);
    expect(cafes.filter(({ name }) => name === "NEO Coffee Bar")).toHaveLength(1);
  });

  it("preserves verified coordinates, provenance, date, and editorial tags", () => {
    expect(cafes.find(({ id }) => id === "cong-caphe-elm-street")).toMatchObject({
      lat: 43.6577039,
      lng: -79.3819575,
      moods: ["theatrical", "lively", "social"],
      offerings: [
        "Vietnamese-coffee",
        "coconut-coffee",
        "smoothies",
        "tea",
      ],
      attributes: [],
      sourceUrl: "https://congcaphe.ca/locations/",
      verifiedAt: "2026-07-09",
      verificationStatus: "verified",
    });
  });

  it("qualifies expanded and inferred branches as branch-unspecified", () => {
    const qualified = cafes.filter(
      ({ branchSpecificity }) => branchSpecificity !== "explicit",
    );
    const explicit = cafes.filter(
      ({ branchSpecificity }) => branchSpecificity === "explicit",
    );

    expect(qualified).toHaveLength(6);
    expect(
      qualified.every(
        ({ verificationStatus }) =>
          verificationStatus === "branch-unspecified",
      ),
    ).toBe(true);
    expect(
      explicit.every(
        ({ verificationStatus }) => verificationStatus === "verified",
      ),
    ).toBe(true);
  });

  it("preserves address and coordinate verification provenance for every cafe", () => {
    expect(
      cafes.map(
        ({ slug, addressVerified, coordinateConfidence }) => ({
          slug,
          addressVerified,
          coordinateConfidence,
        }),
      ),
    ).toEqual(
      verifiedResearch.records.map(
        ({ slug, addressVerified, coordinateConfidence }) => ({
          slug,
          addressVerified,
          coordinateConfidence,
        }),
      ),
    );
  });

  it("provides honest HTTPS directions searches without invented venue metadata", () => {
    expect(
      cafes.every(({ mapsUrl }) =>
        mapsUrl.startsWith("https://www.google.com/maps/search/?api=1&query="),
      ),
    ).toBe(true);
    expect(
      cafes.every(
        (cafe) =>
          !("rating" in cafe) && !("hours" in cafe) && !("photos" in cafe),
      ),
    ).toBe(true);
  });
});
