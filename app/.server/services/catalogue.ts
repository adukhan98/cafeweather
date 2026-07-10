import type { Cafe } from "../../contracts/cafes";
import type { CafeFilters } from "../../contracts/filters";
import { cafes as seededCafes } from "../../data/cafes";
import { filterCafes } from "../../domain/filter-cafes";
import { selectRouletteCafe } from "../../domain/roulette";
import type { CatalogueRepository } from "../db/repositories";

export type CatalogueSource = "d1" | "seed";

export class CatalogueService {
  constructor(private readonly repository?: CatalogueRepository) {}

  private async all(): Promise<{
    cafes: readonly Cafe[];
    source: CatalogueSource;
  }> {
    if (this.repository) {
      try {
        const stored = await this.repository.list();
        if (stored.length >= seededCafes.length) {
          return { cafes: stored, source: "d1" };
        }
      } catch {
        // A catalogue read failure degrades to the complete checked-in seed.
      }
    }
    return { cafes: seededCafes, source: "seed" };
  }

  async list(filters: CafeFilters = {}) {
    const catalogue = await this.all();
    return {
      cafes: filterCafes(catalogue.cafes, filters),
      source: catalogue.source,
    };
  }

  async findBySlug(slug: string) {
    if (this.repository) {
      try {
        const cafe = await this.repository.findBySlug(slug);
        if (cafe) return { cafe, source: "d1" as const };
      } catch {
        // Fall through to the seed catalogue.
      }
    }
    return {
      cafe: seededCafes.find((cafe) => cafe.slug === slug) ?? null,
      source: "seed" as const,
    };
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
