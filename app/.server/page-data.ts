import type { CatalogueSource } from "./services/catalogue";
import { CatalogueService } from "./services/catalogue";
import { D1CatalogueRepository } from "./db/repositories";
import type { Cafe } from "../contracts/cafes";
import type { DiscoveryState } from "../features/discovery/discovery-params";
import {
  parseDiscoveryParams,
  stateToFilters,
} from "../features/discovery/discovery-params";
import { initialRouletteSeed } from "../features/roulette/roulette-params";

type PageEnv = Env & { DB?: D1Database };

export function catalogueServiceFromEnv(env: Env): CatalogueService {
  const pageEnv = env as PageEnv;
  return new CatalogueService(
    pageEnv.DB ? new D1CatalogueRepository(pageEnv.DB) : undefined,
  );
}

export async function prepareCafeDetailData(
  service: CatalogueService,
  slug: string,
): Promise<{
  cafe: Cafe | null;
  nearby: readonly Cafe[];
  source: CatalogueSource;
}> {
  const catalogue = await service.list();
  const cafe = catalogue.cafes.find((entry) => entry.slug === slug) ?? null;
  if (!cafe) return { cafe: null, nearby: [], source: catalogue.source };

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const distance = (candidate: Cafe) => {
    const latitude = toRadians(candidate.lat - cafe.lat);
    const longitude =
      toRadians(candidate.lng - cafe.lng) *
      Math.cos(toRadians((candidate.lat + cafe.lat) / 2));
    return latitude * latitude + longitude * longitude;
  };
  const nearby = catalogue.cafes
    .filter((entry) => entry.id !== cafe.id)
    .sort((left, right) => {
      const leftNeighborhood = left.neighborhood === cafe.neighborhood ? 0 : 1;
      const rightNeighborhood = right.neighborhood === cafe.neighborhood ? 0 : 1;
      if (leftNeighborhood !== rightNeighborhood) {
        return leftNeighborhood - rightNeighborhood;
      }
      const byDistance = distance(left) - distance(right);
      return byDistance || left.name.localeCompare(right.name, "en-CA");
    })
    .slice(0, 3);

  return { cafe, nearby, source: catalogue.source };
}

export function prepareCatalogueData(service: CatalogueService) {
  return service.list();
}

export async function prepareRouletteData(
  service: CatalogueService,
  url: URL,
): Promise<{
  cafe: Cafe | null;
  source: CatalogueSource;
  seed: string;
  state: DiscoveryState;
}> {
  const state = parseDiscoveryParams(url.searchParams);
  const seed = url.searchParams.get("seed") ?? initialRouletteSeed(state);
  const previousId = url.searchParams.get("previousId") ?? undefined;
  const result = await service.roulette(stateToFilters(state), seed, previousId);

  return { ...result, seed, state };
}
