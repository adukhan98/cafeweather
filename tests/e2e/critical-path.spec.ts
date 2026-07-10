import { expect, test, type Page } from "@playwright/test";

function watchBrowserHealth(page: Page) {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  return failures;
}

test("discovers a mood, opens a café, and reaches directions", async ({ page }) => {
  const browserFailures = watchBrowserHealth(page);
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Toronto cafés for the mood you’re in." }),
  ).toBeVisible();
  await page.getByLabel("Serious coffee").check();
  const browse = page.locator(".discovery-actions .action-link").first();
  await expect(browse).toHaveAttribute("href", "/cafes?mood=coffee-nerd");
  await browse.click();

  await expect(page).toHaveURL(/\/cafes\?mood=coffee-nerd/);
  await expect(page.getByRole("status")).toContainText(/\d+ cafés?/i);
  const firstCafe = page.getByRole("list", { name: "Café results" }).getByRole("link").first();
  await firstCafe.click();

  await expect(page.locator("h1")).toBeVisible();
  const directions = page.getByRole("link", { name: /Directions to/i }).first();
  await expect(directions).toHaveAttribute("href", /^https:\/\//);
  expect(browserFailures).toEqual([]);
});

test("search, empty recovery, list/map state, and roulette all work", async ({ page }) => {
  const browserFailures = watchBrowserHealth(page);
  await page.goto("/cafes");

  const search = page.getByLabel("Search cafés");
  await search.fill("does not exist anywhere");
  await expect(page).toHaveURL(/q=does\+not\+exist\+anywhere/);
  await expect(
    page.getByRole("heading", { name: "No cafés match those filters." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all cafés" }).click();
  await expect(page.getByRole("list", { name: "Café results" })).toBeVisible();

  await page.getByLabel("Map view").check();
  await expect(page).toHaveURL(/view=map/);
  await expect(page.getByRole("region", { name: "Toronto café map" })).toBeVisible();
  await page.getByLabel("List view").check();

  await page.goto("/roulette?mood=cozy&seed=e2e-first");
  const heading = page.locator("h1");
  const firstPick = await heading.textContent();
  const reroll = page.getByRole("button", { name: "Reroll" });
  await reroll.focus();
  await reroll.click();
  await expect(reroll).toBeFocused();
  await expect(heading).not.toHaveText(firstPick ?? "");
  await expect(page).toHaveURL(/previousId=/);
  expect(browserFailures).toEqual([]);
});

test("anonymous reactions persist and suggestions validate then submit", async ({ page }) => {
  const browserFailures = watchBrowserHealth(page);
  await page.goto("/cafes/larrys-place-parkdale");

  const cozy = page.getByRole("button", { name: /Cozy, \d+ reactions?/ });
  const initiallyPressed = await cozy.getAttribute("aria-pressed");
  await cozy.click();
  await expect(cozy).toHaveAttribute(
    "aria-pressed",
    initiallyPressed === "true" ? "false" : "true",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: /Cozy, \d+ reactions?/ })).toHaveAttribute(
    "aria-pressed",
    initiallyPressed === "true" ? "false" : "true",
  );
  await page.getByRole("button", { name: /Cozy, \d+ reactions?/ }).click();

  await page.goto("/suggest");
  await page.getByRole("button", { name: "Send for review" }).click();
  await expect(page.getByLabel("Café name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Why should it be in the guide?")).toHaveAttribute(
    "aria-invalid",
    "true",
  );

  const uniqueName = `Playwright Café ${Date.now()}`;
  await page.getByLabel("Café name").fill(uniqueName);
  await page.getByLabel("HTTPS map link").fill("https://maps.example.test/playwright-cafe");
  await page
    .getByLabel("Why should it be in the guide?")
    .fill("A careful independent café recommendation from the release test.");
  await page
    .getByLabel("What should someone order or notice?")
    .fill("Notice the calm room and ask what coffee is on bar.");
  const response = page.waitForResponse(
    (candidate) =>
      candidate.url().endsWith("/api/v1/suggestions") &&
      candidate.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send for review" }).click();
  expect((await response).status()).toBe(202);
  await expect(page.locator(".suggestion-form__success")).toContainText(
    "Thanks. Your suggestion is pending review.",
  );
  expect(browserFailures).toEqual([]);
});
