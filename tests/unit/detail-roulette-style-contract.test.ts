import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");

describe("detail and roulette interaction styling", () => {
  it("limits roulette reveal motion to transform and opacity", () => {
    const body = css.match(/\.roulette-reveal\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(body).toContain("transform:");
    expect(body).toContain("opacity:");
    expect(body).not.toMatch(/(?:top|left|width|height)\s*:/);
  });

  it("removes roulette spatial movement for reduced motion", () => {
    const reducedMotion = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotion).toMatch(/\.roulette-reveal[^{]*\{[^}]*transform:\s*none/s);
  });

  it("keeps roulette controls at the shared 44 pixel target", () => {
    const controls = css.match(/\.roulette-actions a,\s*\.roulette-actions button\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(controls).toContain("min-height: var(--target-min)");
  });
});
