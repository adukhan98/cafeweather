import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const detailCss = readFileSync(
  new URL("../../app/styles/detail.css", import.meta.url),
  "utf8",
);
const communityCss = readFileSync(
  new URL("../../app/styles/community.css", import.meta.url),
  "utf8",
);
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");

function tokenHex(name: string) {
  const value = tokens.match(new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`Missing concrete color token: ${name}`);
  return value;
}

function contrast(first: string, second: string) {
  const luminance = (hex: string) => {
    const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  };
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe("community UI style contract", () => {
  it("keeps circular reaction coasters touch-safe and lets long labels wrap", () => {
    const reaction = detailCss.match(/\.reaction-coaster\s*\{([^}]*)\}/s)?.[1] ?? "";
    const label = detailCss.match(/\.reaction-coaster__label\s*\{([^}]*)\}/s)?.[1] ?? "";
    const submit = communityCss.match(/\.suggestion-form__submit-row \.action-button\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(reaction).toContain("min-height: var(--target-min)");
    expect(reaction).toContain("min-width: var(--target-min)");
    expect(reaction).toContain("border-radius: 50%");
    expect(submit).toContain("min-height: var(--target-min)");
    expect(label).toContain("-webkit-line-clamp: 2");
    expect(label).toContain("white-space: normal");
  });

  it("gives every dark detail-reaction state a high-contrast token", () => {
    const espresso = tokenHex("espresso");
    for (const foreground of ["cream", "honey", "clay"]) {
      expect(contrast(tokenHex(foreground), espresso)).toBeGreaterThanOrEqual(4.5);
    }

    expect(detailCss).toMatch(
      /\.cafe-detail__community \.reaction-bar__intro,[\s\S]*\.cafe-detail__community \.reaction-bar__live\s*\{[^}]*color: var\(--color-cream\)/,
    );
    expect(detailCss).toMatch(
      /\.cafe-detail__community \.reaction-bar__error\s*\{[^}]*color: var\(--color-honey\)/,
    );
    expect(detailCss).toMatch(
      /\.cafe-detail__community \.text-button\s*\{[^}]*color: var\(--color-cream\);[^}]*text-decoration-color: var\(--color-honey\)/,
    );
    expect(detailCss).toMatch(
      /\.cafe-detail__community :focus-visible\s*\{[^}]*outline-color: var\(--color-honey\)/,
    );
    expect(detailCss).toMatch(
      /\.cafe-detail__community \.reaction-coaster:disabled,[\s\S]*\.cafe-detail__community \.text-button:disabled\s*\{[^}]*opacity: 0\.72/,
    );
    expect(detailCss).toMatch(
      /\.reaction-coaster\[aria-pressed="true"\]\s*\{[^}]*background: var\(--color-honey\);[^}]*color: var\(--color-espresso\)/s,
    );
    expect(detailCss).toMatch(/\.reaction-coaster\[data-state="loading"\]::before/);
    expect(detailCss).not.toMatch(/gradient\(/i);
  });

  it("keeps field geometry stable across default, focus, and error states", () => {
    const controls = communityCss.match(
      /\.suggestion-field input,\s*\.suggestion-field textarea\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const focus = communityCss.match(
      /\.suggestion-field input:focus-visible,\s*\.suggestion-field textarea:focus-visible\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const error = communityCss.match(
      /\.suggestion-field\[data-state="error"\] input,\s*\.suggestion-field\[data-state="error"\] textarea\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const disabled = communityCss.match(
      /\.suggestion-field input:disabled,\s*\.suggestion-field textarea:disabled\s*\{([^}]*)\}/s,
    )?.[1] ?? "";

    expect(controls).toContain("border: var(--rule-hair) solid var(--color-rule-strong)");
    expect(controls).toContain("outline: var(--rule-strong) solid var(--color-paper)");
    expect(focus).toContain("outline: var(--rule-strong) solid var(--color-focus)");
    expect(error).toContain("border-color: var(--color-burgundy)");
    expect(error).not.toContain("var(--color-error)");
    expect(error).not.toMatch(/border-width|padding|height\s*:/);
    expect(disabled).toContain("cursor: not-allowed");
    expect(disabled).toContain("opacity: 0.5");
    expect(disabled).toContain("color: var(--color-muted)");
    expect(tokens).toContain("--color-error:");
  });

  it("reserves helper space and hides the honeypot without affecting flow", () => {
    const helper = communityCss.match(/\.suggestion-field__help\s*\{([^}]*)\}/s)?.[1] ?? "";
    const honeypot = communityCss.match(/\.suggestion-form__honeypot\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(helper).toContain("min-height: 2lh");
    expect(honeypot).toContain("position: absolute");
    expect(honeypot).toContain("clip-path: inset(50%)");
  });

  it("starts as one column and only splits location fields at the existing tablet breakpoint", () => {
    const base = communityCss.match(/\.suggestion-form__location\s*\{([^}]*)\}/s)?.[1] ?? "";
    const tablet = communityCss.slice(communityCss.indexOf("@media (min-width: 48rem)"));

    expect(base).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(tablet).toMatch(
      /\.suggestion-form__location\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
    );
  });

  it("uses token-only invitation materials with explicit form states", () => {
    expect(contrast(tokenHex("burgundy"), tokenHex("cream"))).toBeGreaterThanOrEqual(4.5);
    expect(communityCss).toContain(".suggest-page[data-tone=\"burgundy\"]");
    expect(communityCss).toContain(".suggestion-form__verification-status");
    expect(communityCss).toContain(".suggestion-form__success-stamp");
    expect(
      contrast(tokenHex("espresso"), tokenHex("honey")),
    ).toBeGreaterThanOrEqual(4.5);
    expect(communityCss).toMatch(
      /\.suggestion-form__success-stamp\s*\{[^}]*color: var\(--color-espresso\)/s,
    );
    expect(communityCss).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(communityCss).not.toMatch(/#[0-9a-f]{3,8}|rgb\(|hsl\(|gradient\(|emoji/gi);
    expect(communityCss).toMatch(
      /\.suggestion-field__help\[data-error="true"\]\s*\{[^}]*color: var\(--color-burgundy\)/s,
    );
    expect(communityCss).toMatch(
      /\.suggestion-form__form-message\[data-state="error"\]\s*\{[^}]*color: var\(--color-burgundy\)/s,
    );
  });
});
