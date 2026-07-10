import type { Cafe } from "../../contracts/cafes";

export type DiscoveryFacets = Readonly<{
  moods: readonly string[];
  neighborhoods: readonly string[];
  offerings: readonly string[];
}>;

function valuesFor(cafes: readonly Cafe[], select: (cafe: Cafe) => readonly string[]) {
  return [...new Set(cafes.flatMap(select))].sort((a, b) =>
    a.localeCompare(b, "en-CA"),
  );
}

export function getDiscoveryFacets(cafes: readonly Cafe[]): DiscoveryFacets {
  return {
    moods: valuesFor(cafes, (cafe) => cafe.moods),
    neighborhoods: valuesFor(cafes, (cafe) => [cafe.neighborhood]),
    offerings: valuesFor(cafes, (cafe) => cafe.offerings),
  };
}

export function formatFacet(value: string): string {
  const words = value.replaceAll("-", " ");
  return words.charAt(0).toLocaleUpperCase("en-CA") + words.slice(1);
}
