import { describe, expect, it } from "vitest";
import { readStyleSource } from "../helpers/style-source";
import { readFileSync } from "node:fs";

const css = readStyleSource();

describe("detail and roulette interaction styling", () => {
  it("keeps migrated roulette presentation out of the legacy stylesheet", () => {
    const legacyCss = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
    expect(legacyCss).not.toMatch(/\.roulette-(?:page|filters|reveal|actions|empty)/);
  });
  it("limits roulette deck motion to transform and opacity", () => {
    const body = css.match(/\.roulette-result\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(body).toContain("transform:");
    expect(body).toContain("opacity:");
    expect(body).not.toMatch(/(?:top|left|width|height)\s*:/);
  });

  it("removes roulette spatial movement for reduced motion", () => {
    const reducedMotion = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reducedMotion).toMatch(/\.roulette-result[^{]*\{[^}]*transform:\s*none/s);
    expect(reducedMotion).toMatch(/\.roulette-result[^{]*\{[^}]*animation:\s*none/s);
  });

  it("keeps roulette controls at the shared 44 pixel target", () => {
    const controls = css.match(/\.roulette-deck__actions a,\s*\.roulette-deck__actions button\s*\{([^}]*)\}/s)?.[1] ?? "";
    expect(controls).toContain("min-height: var(--target-min)");
  });
});
