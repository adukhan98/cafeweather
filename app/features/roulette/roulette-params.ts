import type { DiscoveryState } from "../discovery/discovery-params";
import { serializeDiscoveryParams } from "../discovery/discovery-params";

function discoveryParams(state: DiscoveryState): URLSearchParams {
  return serializeDiscoveryParams({ ...state, view: "list" });
}

export function initialRouletteSeed(state: DiscoveryState): string {
  const serialized = discoveryParams(state).toString();
  return `meet-me-there:${serialized || "all"}`;
}

export function displayMatchNumber(seed: string): string {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return String((hash >>> 0) % 99 + 1).padStart(2, "0");
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
