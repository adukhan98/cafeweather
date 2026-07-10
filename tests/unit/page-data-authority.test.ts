import { describe, expect, it } from "vitest";

import { CatalogueService } from "../../app/.server/services/catalogue";
import {
  prepareCafeDetailData,
  prepareCatalogueData,
  prepareRouletteData,
} from "../../app/.server/page-data";
import type { CatalogueRepository } from "../../app/.server/db/repositories";
import { cafes } from "../../app/data/cafes";

describe("user-page catalogue authority", () => {
  it("uses the same partial D1 catalogue for browse, detail, and roulette", async () => {
    const onlyCafe = cafes.find((cafe) => cafe.slug === "larrys-place-parkdale")!;
    const repository: CatalogueRepository = {
      async list() {
        return [onlyCafe];
      },
      async findBySlug() {
        throw new Error("Page detail should derive from the authoritative list snapshot.");
      },
    };
    const service = new CatalogueService(repository);

    const catalogue = await prepareCatalogueData(service);
    const detail = await prepareCafeDetailData(service, onlyCafe.slug);
    const absentDetail = await prepareCafeDetailData(service, "rooms-coffee-ossington");
    const roulette = await prepareRouletteData(
      service,
      new URL("https://cafeweather.test/roulette?mood=cozy"),
    );

    expect(catalogue).toEqual({ cafes: [onlyCafe], source: "d1" });
    expect(detail).toMatchObject({ cafe: onlyCafe, nearby: [], source: "d1" });
    expect(absentDetail).toMatchObject({ cafe: null, nearby: [], source: "d1" });
    expect(roulette).toMatchObject({ cafe: onlyCafe, source: "d1" });
  });

  it("passes the verified MATCHA MATCHA record through without adding venue claims", async () => {
    const matcha = cafes.find((cafe) => cafe.slug === "matcha-matcha-church-street")!;
    const repository: CatalogueRepository = {
      async list() {
        return [matcha];
      },
      async findBySlug() {
        throw new Error("Detail must use the authoritative catalogue snapshot.");
      },
    };

    const detail = await prepareCafeDetailData(new CatalogueService(repository), matcha.slug);

    expect(detail.cafe).toBe(matcha);
    expect(detail.cafe).toMatchObject({
      address: "407 Church St, Toronto, ON",
      recommendation:
        "A dedicated matcha stop with a deeper tea-focused menu than general cafés.",
      moods: ["modern", "bright", "focused"],
      offerings: ["matcha", "hojicha", "soft-serve", "bakery"],
    });
    expect(detail.nearby).toEqual([]);
  });
});
