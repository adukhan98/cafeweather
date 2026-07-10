import { describe, expect, it } from "vitest";
import type { Cafe } from "../../app/contracts/cafes";
import type { CafeFilters } from "../../app/contracts/filters";
import { filterCafes } from "../../app/domain/filter-cafes";

function cafe(overrides: Partial<Cafe> = {}): Cafe {
  return {
    id: "base-cafe",
    slug: "base-cafe",
    name: "Base Cafe",
    branch: null,
    address: "1 Queen St W, Toronto, ON",
    addressVerified: true,
    neighborhood: "Downtown",
    lat: 43.65,
    lng: -79.38,
    coordinateConfidence: "poi",
    branchSpecificity: "explicit",
    verificationStatus: "verified",
    moods: ["calm"],
    offerings: ["coffee"],
    attributes: [],
    recommendation: "A reliable coffee stop.",
    sourceUrl: "https://example.com/base-cafe",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=base-cafe",
    verifiedAt: "2026-07-09",
    ...overrides,
  };
}

const cafes = [
  cafe({
    id: "cong-caphe",
    slug: "cong-caphe",
    name: "Cộng Cà Phê",
    branch: "Élm Street",
    neighborhood: "Downtown Yonge",
    moods: ["lively", "social"],
    offerings: ["Vietnamese-coffee", "tea"],
    attributes: ["late-night"],
    recommendation: "Distinctive Vietnamese café drinks.",
  }),
  cafe({
    id: "mallo",
    slug: "mallo",
    name: "Mallo Coffee Bar",
    branch: "Bathurst",
    neighborhood: "Palmerston–Little Italy",
    moods: ["artsy", "lively"],
    offerings: ["coffee", "wine"],
    attributes: ["patio"],
    recommendation: "A quieter café that can turn into drinks.",
  }),
  cafe({
    id: "teamendous",
    slug: "teamendous",
    name: "Teamendous",
    branch: "Don Mills",
    neighborhood: "Don Mills",
    moods: ["serene", "experiential"],
    offerings: ["traditional-tea", "teaware"],
    attributes: ["reservations"],
    recommendation: "A deliberate traditional tea experience.",
  }),
] as const;

describe("filterCafes", () => {
  it("returns every cafe for empty filters without mutating the source", () => {
    const sourceSnapshot = structuredClone(cafes);

    expect(filterCafes(cafes, {})).toEqual(cafes);
    expect(cafes).toEqual(sourceSnapshot);
  });

  it("uses OR within each selected facet", () => {
    const filters: CafeFilters = {
      moods: ["social", "lively"],
      offerings: ["tea", "wine"],
    };

    expect(filterCafes(cafes, filters).map(({ id }) => id)).toEqual([
      "cong-caphe",
      "mallo",
    ]);
  });

  it("uses AND across neighborhood, mood, offering, and attribute facets", () => {
    const filters: CafeFilters = {
      neighborhoods: ["Palmerston–Little Italy", "Downtown Yonge"],
      moods: ["lively"],
      offerings: ["coffee", "wine"],
      attributes: ["patio"],
    };

    expect(filterCafes(cafes, filters).map(({ id }) => id)).toEqual(["mallo"]);
  });

  it.each([
    ["cong ca phe", "cong-caphe"],
    ["elm street", "cong-caphe"],
    ["little italy", "mallo"],
    ["CAFE DRINKS", "cong-caphe"],
  ])(
    "matches accent-insensitive, case-insensitive search for %s",
    (search, expectedId) => {
      expect(filterCafes(cafes, { search }).map(({ id }) => id)).toEqual([
        expectedId,
      ]);
    },
  );

  it("treats search as another AND constraint and leaves filter arrays unchanged", () => {
    const filters: CafeFilters = {
      search: "coffee",
      moods: ["lively"],
      offerings: ["wine"],
    };
    const filtersSnapshot = structuredClone(filters);

    expect(filterCafes(cafes, filters).map(({ id }) => id)).toEqual(["mallo"]);
    expect(filters).toEqual(filtersSnapshot);
  });
});
