import type { DiscoveryState } from "../discovery/discovery-params";
import { serializeDiscoveryParams } from "../discovery/discovery-params";

function discoveryParams(state: DiscoveryState): URLSearchParams {
  return serializeDiscoveryParams({ ...state, view: "list" });
}

export function initialRouletteSeed(state: DiscoveryState): string {
  const serialized = discoveryParams(state).toString();
  return `meet-me-there:${serialized || "all"}`;
}

export function buildRouletteParams(
  state: DiscoveryState,
  seed: string,
  previousId?: string,
): URLSearchParams {
  const params = discoveryParams(state);
  params.set("seed", seed);
  if (previousId) params.set("previousId", previousId);
  return params;
}

export function buildCatalogueParams(state: DiscoveryState): URLSearchParams {
  return discoveryParams(state);
}
