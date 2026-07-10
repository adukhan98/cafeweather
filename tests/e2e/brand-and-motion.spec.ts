import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/cafes",
  "/cafes/larrys-place-parkdale",
  "/roulette",
  "/suggest",
  "/privacy",
  "/terms",
] as const;

test("every public page carries the Meet Me There identity", async ({ page }) => {
  for (const route of routes) {
    await page.goto(route);
    await expect(page).toHaveTitle(/Meet Me There/);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Meet Me There home" }),
    ).toBeVisible();
  }
});

test("reduced motion keeps every motion surface visible and spatially still", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const route of routes) {
    await page.goto(route);
    const motionSurfaces = page.locator("[data-motion]");
    const count = await motionSurfaces.count();
    for (let index = 0; index < count; index += 1) {
      const style = await motionSurfaces.nth(index).evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          opacity: computed.opacity,
          transform: computed.transform,
          animationName: computed.animationName,
        };
      });
      expect(style, `${route} motion surface ${index}`).toEqual({
        opacity: "1",
        transform: "none",
        animationName: "none",
      });
    }
  }
});
