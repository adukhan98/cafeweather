import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// @ts-expect-error The geometry helper is deliberately reusable from plain JS runners.
import { assertAppShellGeometry } from "../browser/app-shell-geometry.mjs";

const widths = [320, 375, 414, 768, 1280, 1440] as const;
const routes = [
  "/",
  "/cafes",
  "/cafes?view=map",
  "/cafes/larrys-place-parkdale",
  "/roulette?mood=cozy",
  "/suggest",
] as const;

test("core pages have no serious accessibility violations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of routes) {
    await page.goto(route);
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      for (const animation of document.getAnimations()) animation.finish();
    });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(results.violations, `${route} accessibility violations`).toEqual([]);
  }
});

test("every launch viewport avoids overflow at normal and 200 percent zoom", async ({ page }) => {
  for (const route of routes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await assertAppShellGeometry(page, width);
    }
  }
});

test("clickable labels stay legible without flattening intentional coaster copy", async ({ page }) => {
  for (const route of routes) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route, { waitUntil: "domcontentloaded" });
      const failures = await page.evaluate(() => {
        const selectors =
          ".action-link, .text-link, .text-button, .reset-button, .masthead a, .site-footer a, .view-switch label, .suggestion-form button, summary";
        return Array.from(document.querySelectorAll<HTMLElement>(selectors))
          .filter((element) => {
            const style = getComputedStyle(element);
            if (style.display === "none" || style.visibility === "hidden") return false;
            const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
            const tops: number[] = [];
            while (walker.nextNode()) {
              if (!walker.currentNode.textContent?.trim()) continue;
              const range = document.createRange();
              range.selectNodeContents(walker.currentNode);
              for (const rect of range.getClientRects()) {
                if (
                  rect.width > 0 &&
                  !tops.some((top) => Math.abs(top - rect.top) < 4)
                ) {
                  tops.push(rect.top);
                }
              }
            }
            return tops.length > 1 && element.innerText.trim().length > 0;
          })
          .map((element) => element.innerText.trim().replace(/\s+/g, " "));
      });
      expect(failures, `${route} wrapped controls at ${width}px`).toEqual([]);
    }
  }
});

test("catalogue fieldsets and view radios use the custom control geometry", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 800 });
  await page.goto("/cafes", { waitUntil: "domcontentloaded" });

  const fieldset = page.locator(".facet-disclosure fieldset").first();
  const fieldsetStyle = await fieldset.evaluate((element) => {
    const style = getComputedStyle(element);
    return { border: style.borderTopWidth, margin: style.marginTop, paddingInline: style.paddingInline };
  });
  expect(fieldsetStyle).toEqual({ border: "0px", margin: "0px", paddingInline: "0px" });

  const radio = page.locator(".view-switch input").first();
  await expect(radio).toHaveCSS("opacity", "0");
  const labels = page.locator(".view-switch label");
  await expect(labels.first()).toHaveCSS("min-height", "44px");
  await radio.focus();
  await expect(labels.first()).toHaveCSS("outline-style", "solid");
});

test("mobile navigation is keyboard operable and reduced motion is honored", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeVisible();
  await expect(
    page
      .getByRole("navigation", { name: "Mobile" })
      .getByRole("link", { name: "Browse", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Mobile" })).toBeHidden();

  await page.goto("/roulette?mood=cozy");
  const reduced = await page.locator(".roulette-result").evaluate((reveal) => {
    const style = getComputedStyle(reveal);
    return { animationName: style.animationName, transform: style.transform };
  });
  expect(reduced).toEqual({ animationName: "none", transform: "none" });
});
