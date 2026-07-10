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
): Promise<{ cafe: Cafe | null; source: CatalogueSource }> {
  return service.findBySlug(slug);
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
