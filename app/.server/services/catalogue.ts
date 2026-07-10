import type { Cafe } from "../../contracts/cafes";
import type { CafeFilters } from "../../contracts/filters";
import { cafes as seededCafes } from "../../data/cafes";
import { filterCafes } from "../../domain/filter-cafes";
import { selectRouletteCafe } from "../../domain/roulette";
import {
  CatalogueRepositoryUnavailableError,
  type CatalogueRepository,
} from "../db/repositories";

export type CatalogueSource = "d1" | "seed";

export class CatalogueService {
  constructor(private readonly repository?: CatalogueRepository) {}

  private async all(): Promise<{
    cafes: readonly Cafe[];
    source: CatalogueSource;
  }> {
    if (!this.repository) {
      return { cafes: seededCafes, source: "seed" };
    }

    try {
      return { cafes: await this.repository.list(), source: "d1" };
    } catch (error) {
      if (error instanceof CatalogueRepositoryUnavailableError) {
        return { cafes: seededCafes, source: "seed" };
      }
      throw error;
    }
  }

  async list(filters: CafeFilters = {}) {
    const catalogue = await this.all();
    return {
      cafes: filterCafes(catalogue.cafes, filters),
      source: catalogue.source,
    };
  }

  async findBySlug(slug: string) {
    if (!this.repository) {
      return {
        cafe: seededCafes.find((cafe) => cafe.slug === slug) ?? null,
        source: "seed" as const,
      };
    }

    try {
      return {
        cafe: await this.repository.findBySlug(slug),
        source: "d1" as const,
      };
    } catch (error) {
      if (error instanceof CatalogueRepositoryUnavailableError) {
        return {
          cafe: seededCafes.find((cafe) => cafe.slug === slug) ?? null,
          source: "seed" as const,
        };
      }
      throw error;
    }
  }

  async facets() {
    const catalogue = await this.all();
    const sortedUnique = (values: readonly string[]) =>
      [...new Set(values)].sort();
    return {
      facets: {
        neighborhoods: sortedUnique(
          catalogue.cafes.map(({ neighborhood }) => neighborhood),
        ),
        moods: sortedUnique(catalogue.cafes.flatMap(({ moods }) => moods)),
        offerings: sortedUnique(
          catalogue.cafes.flatMap(({ offerings }) => offerings),
        ),
        attributes: sortedUnique(
          catalogue.cafes.flatMap(({ attributes }) => attributes),
        ),
      },
      source: catalogue.source,
    };
  }

  async roulette(
    filters: CafeFilters,
    seed: string,
    previousId?: string,
  ) {
    const catalogue = await this.all();
    return {
      cafe: await selectRouletteCafe(
        catalogue.cafes,
        filters,
        seed,
        previousId,
      ),
      source: catalogue.source,
    };
  }
}
