import { expect, test, type Page } from "@playwright/test";

async function settle(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const mapLoading = page.locator(".cafe-map__skeleton");
  if (await mapLoading.count()) {
    await mapLoading.waitFor({ state: "hidden", timeout: 10_000 });
  }
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const animation of document.getAnimations()) animation.finish();
  });
}

const cases = [
  { name: "home", route: "/" },
  { name: "browse-coffee-nerd", route: "/cafes?mood=coffee-nerd" },
  { name: "detail-matcha-church", route: "/cafes/matcha-matcha-church-street" },
  { name: "roulette-cozy", route: "/roulette?mood=cozy&seed=visual" },
  { name: "suggest", route: "/suggest" },
] as const;

for (const visualCase of cases) {
  test(`${visualCase.name} visual contract`, async ({ page }) => {
    await page.goto(visualCase.route);
    await settle(page);
    await expect(page).toHaveScreenshot(`${visualCase.name}.png`, {
      fullPage: true,
      animations: "disabled",
      mask: [page.locator(".maplibregl-canvas")],
      maskColor: "#d8b88c",
    });
  });
}

test("map visual contract preserves accessible results while masking only MapLibre canvas", async ({ page }) => {
  await page.goto("/cafes?view=map");
  await settle(page);
  await expect(page.getByRole("region", { name: "Toronto café map" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Café results" })).toBeVisible();
  await expect(page).toHaveScreenshot("browse-map.png", {
    fullPage: true,
    animations: "disabled",
    mask: [page.locator(".maplibregl-canvas")],
    maskColor: "#d8b88c",
  });
});
