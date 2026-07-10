import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const hallmarkLog = JSON.parse(
  readFileSync(new URL("../../.hallmark/log.json", import.meta.url), "utf8"),
) as Array<{ design_taste?: { variance: number; motion: number; density: number } }>;

describe("Café Weather design-system contract", () => {
  it("records the approved Design Taste dials in CSS and Hallmark memory", () => {
    expect(css).toContain("Design Taste: variance=8 · motion=6 · density=4");
    expect(hallmarkLog[0]?.design_taste).toEqual({
      variance: 8,
      motion: 6,
      density: 4,
    });
  });

  it("starts the spacing scale at four pixels", () => {
    expect(tokens).not.toContain("--space-3xs");
    expect(tokens).toContain("--space-2xs: 0.25rem");
  });

  it.each([
    ".masthead__wordmark:active",
    ".masthead__desktop-nav a:active",
    ".masthead__mobile-nav a:active",
    ".site-footer__links a:active",
  ])("defines purposeful active feedback for %s", (selector) => {
    expect(css).toContain(selector);
  });
});
