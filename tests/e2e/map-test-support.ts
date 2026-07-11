import type { Page } from "@playwright/test";

export async function stubMapStyle(page: Page) {
  await page.route("https://tiles.openfreemap.org/styles/bright", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ version: 8, sources: {}, layers: [] }),
    });
  });
}
