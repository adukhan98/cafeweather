/**
 * Reusable Playwright geometry assertion for the application shell.
 * Pass an active Playwright `page` from a future e2e runner.
 */
export async function assertAppShellGeometry(page, width, height = 800) {
  await page.setViewportSize({ width, height });

  const result = await page.evaluate(() => {
    const wordmark = document.querySelector(".brand-lockup__home");
    const toggle = document.querySelector(".site-nav__toggle");
    if (!(wordmark instanceof HTMLElement) || !(toggle instanceof HTMLElement)) {
      throw new Error("Masthead controls are missing");
    }

    const wordmarkRect = wordmark.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 47.999rem)").matches;
    const undersizedTargets = Array.from(
      document.querySelectorAll("a, button, input, summary"),
    ).flatMap((element) => {
      if (!(element instanceof HTMLElement)) return [];
      if (!element.closest(".masthead, .site-footer")) return [];
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const visible =
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        rect.width > 0 &&
        rect.height > 0;
      if (!visible || (rect.width >= 44 && rect.height >= 44)) return [];
      return [{
        label: element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      }];
    });

    return {
      mobile,
      noOverflow: document.documentElement.scrollWidth === window.innerWidth,
      toggleHeight: toggleRect.height,
      toggleVisible: toggleRect.width > 0 && toggleRect.height > 0,
      wordmarkHeight: wordmarkRect.height,
      wordmarkVisible: wordmarkRect.width > 0 && wordmarkRect.height > 0,
      controlsOverlap: mobile && wordmarkRect.right > toggleRect.left,
      undersizedTargets,
    };
  });

  if (!result.noOverflow) throw new Error(`Horizontal overflow at ${width}px`);
  if (!result.wordmarkVisible) throw new Error(`Wordmark hidden at ${width}px`);
  if (result.undersizedTargets.length > 0) {
    throw new Error(
      `Targets below 44px at ${width}px: ${result.undersizedTargets
        .map(({ label, width: targetWidth, height: targetHeight }) =>
          `${label} (${targetWidth}x${targetHeight})`)
        .join(", ")}`,
    );
  }
  if (result.wordmarkHeight < 44) {
    throw new Error(`Wordmark target below 44px at ${width}px`);
  }
  if (result.mobile) {
    if (!result.toggleVisible) throw new Error(`Menu toggle hidden at ${width}px`);
    if (result.toggleHeight < 44) throw new Error(`Menu target below 44px at ${width}px`);
    if (result.controlsOverlap) throw new Error(`Wordmark overlaps menu at ${width}px`);
  }

  return result;
}
