import type { Cafe } from "../contracts/cafes";
import type { CafeFilters } from "../contracts/filters";

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("en-CA");
}

function matchesFacet(
  values: readonly string[],
  selected: readonly string[] | undefined,
): boolean {
  if (!selected?.length) {
    return true;
  }

  const normalizedValues = new Set(values.map(normalize));
  return selected.some((value) => normalizedValues.has(normalize(value)));
}

function matchesSearch(cafe: Cafe, search: string | undefined): boolean {
  const query = normalize(search?.trim() ?? "");
  if (!query) {
    return true;
  }

  return normalize(
    [cafe.name, cafe.branch, cafe.neighborhood, cafe.recommendation]
      .filter((value): value is string => value !== null)
      .join(" "),
  ).includes(query);
}

export function filterCafes(
  cafes: readonly Cafe[],
  filters: CafeFilters,
): Cafe[] {
  return cafes.filter(
    (cafe) =>
      matchesSearch(cafe, filters.search) &&
      matchesFacet([cafe.neighborhood], filters.neighborhoods) &&
      matchesFacet(cafe.moods, filters.moods) &&
      matchesFacet(cafe.offerings, filters.offerings) &&
      matchesFacet(cafe.attributes, filters.attributes),
  );
}
