/**
 * Reusable Playwright geometry assertion for the application shell.
 * Pass an active Playwright `page` from a future e2e runner.
 */
export async function assertAppShellGeometry(page, width, height = 800) {
  await page.setViewportSize({ width, height });

  const result = await page.evaluate(() => {
    const wordmark = document.querySelector(".masthead__wordmark");
    const toggle = document.querySelector(".masthead__toggle");
    if (!(wordmark instanceof HTMLElement) || !(toggle instanceof HTMLElement)) {
      throw new Error("Masthead controls are missing");
    }

    const wordmarkRect = wordmark.getBoundingClientRect();
    const toggleRect = toggle.getBoundingClientRect();
    const mobile = window.matchMedia("(max-width: 39.999rem)").matches;

    return {
      mobile,
      noOverflow: document.documentElement.scrollWidth === window.innerWidth,
      toggleHeight: toggleRect.height,
      toggleVisible: toggleRect.width > 0 && toggleRect.height > 0,
      wordmarkHeight: wordmarkRect.height,
      wordmarkVisible: wordmarkRect.width > 0 && wordmarkRect.height > 0,
      controlsOverlap: mobile && wordmarkRect.right > toggleRect.left,
    };
  });

  if (!result.noOverflow) throw new Error(`Horizontal overflow at ${width}px`);
  if (!result.wordmarkVisible) throw new Error(`Wordmark hidden at ${width}px`);
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
