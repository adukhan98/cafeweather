import type { Cafe } from "../../contracts/cafes";
import type { CafeFilters } from "../../contracts/filters";
import { filterCafes } from "../../domain/filter-cafes";
import { getDiscoveryFacets } from "./facets";

export type OccasionOption = Readonly<{
  id: string;
  label: string;
  filters: CafeFilters;
  query: Readonly<Record<string, string>>;
}>;

const occasionOptions: readonly OccasionOption[] = [
  {
    id: "quiet-work",
    label: "Quiet work",
    filters: { moods: ["study-friendly"] },
    query: { mood: "study-friendly" },
  },
  {
    id: "first-date",
    label: "First date",
    filters: { moods: ["cozy"] },
    query: { mood: "cozy" },
  },
  {
    id: "catch-up",
    label: "Catch up",
    filters: { moods: ["community"] },
    query: { mood: "community" },
  },
  {
    id: "serious-coffee",
    label: "Serious coffee",
    filters: { moods: ["coffee-nerd"] },
    query: { mood: "coffee-nerd" },
  },
  {
    id: "matcha-pastries",
    label: "Matcha and pastries",
    filters: { offerings: ["matcha"] },
    query: { offering: "matcha" },
  },
  {
    id: "open-late",
    label: "Open late",
    filters: { moods: ["late-night"] },
    query: { mood: "late-night" },
  },
] as const;

const editorialIds = [
  "nabulu-coffee-st-joseph",
  "bloom-cafe-wellesley",
  "project-seoul-chinatown",
  "teamendous-don-mills",
  "balzacs-distillery-district",
  "le-beau-croissanterie-dundas-east",
] as const;

function byIds(cafes: readonly Cafe[], ids: readonly string[]): Cafe[] {
  const positions = new Map(ids.map((id, index) => [id, index]));
  return cafes
    .filter((cafe) => positions.has(cafe.id))
    .sort((a, b) => positions.get(a.id)! - positions.get(b.id)!);
}

function buildCityTrail(cafes: readonly Cafe[]): Cafe[] {
  const selected = byIds(cafes, editorialIds);
  const selectedIds = new Set(selected.map((cafe) => cafe.id));
  const candidates = [
    ...cafes.filter((cafe) => cafe.verificationStatus === "verified"),
    ...cafes,
  ];

  for (const cafe of candidates) {
    if (selected.length === editorialIds.length) break;
    if (selectedIds.has(cafe.id)) continue;
    selected.push(cafe);
    selectedIds.add(cafe.id);
  }

  return selected;
}

export function buildHomeScenes(cafes: readonly Cafe[]) {
  const facets = getDiscoveryFacets(cafes);
  return {
    moods: occasionOptions.map((option) => ({
      ...option,
      count: filterCafes(cafes, option.filters).length,
    })),
    mapCafes: cafes
      .filter((cafe) => cafe.verificationStatus === "verified")
      .slice(0, 10),
    cityTrail: buildCityTrail(cafes),
    neighborhoods: facets.neighborhoods
      .map((name) => ({
        name,
        count: cafes.filter((cafe) => cafe.neighborhood === name).length,
      }))
      .sort(
        (a, b) => b.count - a.count || a.name.localeCompare(b.name, "en-CA"),
      ),
  };
}
