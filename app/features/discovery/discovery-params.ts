import type { CafeFilters } from "../../contracts/filters";

export type DiscoveryView = "list" | "map";

export type DiscoveryState = Readonly<{
  search: string;
  moods: readonly string[];
  neighborhoods: readonly string[];
  offerings: readonly string[];
  attributes: readonly string[];
  view: DiscoveryView;
}>;

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "en-CA"),
  );
}

export function parseDiscoveryParams(params: URLSearchParams): DiscoveryState {
  return {
    search: params.get("q")?.trim() ?? "",
    moods: uniqueSorted(params.getAll("mood")),
    neighborhoods: uniqueSorted(params.getAll("neighborhood")),
    offerings: uniqueSorted(params.getAll("offering")),
    attributes: uniqueSorted(params.getAll("attribute")),
    view: params.get("view") === "map" ? "map" : "list",
  };
}

export function serializeDiscoveryParams(
  state: DiscoveryState,
): URLSearchParams {
  const params = new URLSearchParams();
  const search = state.search.trim();

  if (search) params.set("q", search);
  for (const mood of uniqueSorted(state.moods)) params.append("mood", mood);
  for (const neighborhood of uniqueSorted(state.neighborhoods)) {
    params.append("neighborhood", neighborhood);
  }
  for (const offering of uniqueSorted(state.offerings)) {
    params.append("offering", offering);
  }
  for (const attribute of uniqueSorted(state.attributes)) {
    params.append("attribute", attribute);
  }
  if (state.view === "map") params.set("view", "map");

  return params;
}

export function stateToFilters(state: DiscoveryState): CafeFilters {
  return {
    search: state.search,
    moods: state.moods,
    neighborhoods: state.neighborhoods,
    offerings: state.offerings,
    attributes: state.attributes,
  };
}
