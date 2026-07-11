import { expect, test, type Locator, type Page } from "@playwright/test";
import { stubMapStyle } from "./map-test-support";

async function settle(page: Page, requireMap = false): Promise<Locator[]> {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mapRegion = page.getByRole("region", { name: "Toronto café map" });
  const masks: Locator[] = [];
  if (requireMap) await expect(mapRegion).toHaveCount(1);
  if ((await mapRegion.count()) > 0) {
    await expect(mapRegion).toBeVisible();
    const accessiblePlaces = mapRegion.getByRole("list", { name: "Cafés on this map" });
    await expect(accessiblePlaces).toBeVisible();
    await expect(accessiblePlaces.getByRole("listitem").first()).toBeVisible();
    await expect(mapRegion.locator(".cafe-map__canvas")).toBeAttached();
    await expect(mapRegion.locator(".cafe-map__skeleton")).toBeHidden({ timeout: 10_000 });
    const canvas = mapRegion.locator(".maplibregl-canvas");
    if ((await canvas.count()) > 0) masks.push(canvas);
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) animation.finish();
  });
  return masks;
}

const cases = [
  { name: "home", route: "/", hasMap: true },
  { name: "browse-coffee-nerd", route: "/cafes?mood=coffee-nerd", hasMap: true },
  { name: "detail-matcha-church", route: "/cafes/matcha-matcha-church-street", hasMap: false },
  { name: "roulette-cozy", route: "/roulette?mood=cozy&seed=visual", hasMap: false },
  { name: "suggest", route: "/suggest", hasMap: false },
] as const;

for (const visualCase of cases) {
  test(`${visualCase.name} visual contract`, async ({ page }) => {
    await stubMapStyle(page);
    await page.goto(visualCase.route);
    const masks = await settle(page, visualCase.hasMap);
    await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
      fullPage: true,
      animations: "disabled",
      mask: masks,
      maskColor: "#d8b88c",
    });
  });
}

test("map visual contract preserves accessible results while masking only MapLibre canvas", async ({ page }) => {
  await stubMapStyle(page);
  await page.goto("/cafes?view=map");
  const masks = await settle(page, true);
  await expect(page.getByRole("region", { name: "Toronto café map" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Café results" })).toBeVisible();
  await expect(page).toHaveScreenshot("browse-map.png", {
    fullPage: true,
    animations: "disabled",
    mask: masks,
    maskColor: "#d8b88c",
  });
});
