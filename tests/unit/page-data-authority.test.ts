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
});
