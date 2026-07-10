import { describe, expect, it } from "vitest";
import type { Cafe } from "../../app/contracts/cafes";
import { cafes } from "../../app/data/cafes";
import {
  CatalogueRepositoryUnavailableError,
  type CatalogueRepository,
} from "../../app/.server/db/repositories";
import { CatalogueService } from "../../app/.server/services/catalogue";

function repository(overrides: Partial<CatalogueRepository>): CatalogueRepository {
  return {
    async list() {
      return [];
    },
    async findBySlug() {
      return null;
    },
    ...overrides,
  };
}

describe("CatalogueService D1 authority", () => {
  it("keeps a valid partial D1 catalogue partial", async () => {
    const stored: readonly Cafe[] = [cafes[0]];
    const service = new CatalogueService(
      repository({
        async list() {
          return stored;
        },
      }),
    );

    await expect(service.list()).resolves.toEqual({
      cafes: stored,
      source: "d1",
    });
  });

  it("keeps a valid empty D1 catalogue empty", async () => {
    const service = new CatalogueService(repository({}));

    await expect(service.list()).resolves.toEqual({
      cafes: [],
      source: "d1",
    });
  });

  it("keeps a legitimate null D1 detail null", async () => {
    const service = new CatalogueService(
      repository({
        async findBySlug() {
          return null;
        },
      }),
    );

    await expect(service.findBySlug(cafes[0].slug)).resolves.toEqual({
      cafe: null,
      source: "d1",
    });
  });

  it("falls back to seed reads when no repository binding is available", async () => {
    const service = new CatalogueService();

    const list = await service.list();
    const detail = await service.findBySlug(cafes[0].slug);

    expect(list).toEqual({ cafes, source: "seed" });
    expect(detail).toEqual({ cafe: cafes[0], source: "seed" });
  });

  it("falls back only when a repository explicitly reports unavailability", async () => {
    const unavailable = repository({
      async list() {
        throw new CatalogueRepositoryUnavailableError("D1 unavailable");
      },
      async findBySlug() {
        throw new CatalogueRepositoryUnavailableError("D1 unavailable");
      },
    });
    const service = new CatalogueService(unavailable);

    await expect(service.list()).resolves.toEqual({
      cafes,
      source: "seed",
    });
    await expect(service.findBySlug(cafes[0].slug)).resolves.toEqual({
      cafe: cafes[0],
      source: "seed",
    });
  });

  it("does not disguise arbitrary repository query or data errors as availability", async () => {
    const broken = repository({
      async list() {
        throw new Error("bad SQL");
      },
      async findBySlug() {
        throw new Error("invalid row data");
      },
    });
    const service = new CatalogueService(broken);

    await expect(service.list()).rejects.toThrow("bad SQL");
    await expect(service.findBySlug(cafes[0].slug)).rejects.toThrow(
      "invalid row data",
    );
  });
});
