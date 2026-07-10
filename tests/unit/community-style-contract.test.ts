import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");

describe("community UI style contract", () => {
  it("keeps reaction and submit controls at the shared 44 pixel target", () => {
    const reaction = css.match(/\.reaction-choice\s*\{([^}]*)\}/s)?.[1] ?? "";
    const submit = css.match(/\.suggestion-form__submit-row \.action-button\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(reaction).toContain("min-height: var(--target-min)");
    expect(submit).toContain("min-height: var(--target-min)");
    expect(reaction).toContain("white-space: nowrap");
  });

  it("keeps field geometry stable across default, focus, and error states", () => {
    const controls = css.match(
      /\.suggestion-field input,\s*\.suggestion-field textarea\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const focus = css.match(
      /\.suggestion-field input:focus-visible,\s*\.suggestion-field textarea:focus-visible\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const error = css.match(
      /\.suggestion-field\[data-state="error"\] input,\s*\.suggestion-field\[data-state="error"\] textarea\s*\{([^}]*)\}/s,
    )?.[1] ?? "";
    const disabled = css.match(
      /\.suggestion-field input:disabled,\s*\.suggestion-field textarea:disabled\s*\{([^}]*)\}/s,
    )?.[1] ?? "";

    expect(controls).toContain("border: var(--rule-hair) solid var(--color-rule-strong)");
    expect(controls).toContain("outline: var(--rule-strong) solid var(--color-paper)");
    expect(focus).toContain("outline: var(--rule-strong) solid var(--color-focus)");
    expect(error).toContain("border-color: var(--color-error)");
    expect(error).not.toMatch(/border-width|padding|height\s*:/);
    expect(disabled).toContain("cursor: not-allowed");
    expect(disabled).toContain("opacity: 0.5");
    expect(disabled).toContain("color: var(--color-muted)");
    expect(tokens).toContain("--color-error:");
  });

  it("reserves helper space and hides the honeypot without affecting flow", () => {
    const helper = css.match(/\.suggestion-field__help\s*\{([^}]*)\}/s)?.[1] ?? "";
    const honeypot = css.match(/\.suggestion-form__honeypot\s*\{([^}]*)\}/s)?.[1] ?? "";

    expect(helper).toContain("min-height: 2lh");
    expect(honeypot).toContain("position: absolute");
    expect(honeypot).toContain("clip-path: inset(50%)");
  });

  it("starts as one column and only splits location fields at the existing tablet breakpoint", () => {
    const base = css.match(/\.suggestion-form__location\s*\{([^}]*)\}/s)?.[1] ?? "";
    const tablet = css.slice(css.indexOf("@media (min-width: 48rem)"));

    expect(base).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(tablet).toMatch(
      /\.suggestion-form__location\s*\{[^}]*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/s,
    );
  });
});
