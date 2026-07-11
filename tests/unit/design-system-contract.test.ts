import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { readStyleSource } from "../helpers/style-source";

const css = readStyleSource();
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../../app/root.tsx", import.meta.url), "utf8");
const catalogueCss = readFileSync(
  new URL("../../app/styles/catalogue.css", import.meta.url),
  "utf8",
);
const hallmarkLog = JSON.parse(
  readFileSync(new URL("../../.hallmark/log.json", import.meta.url), "utf8"),
) as Array<{
  artifact?: string;
  date?: string;
  design_taste?: { variance: number; motion: number; density: number };
  enrichment?: string;
  macrostructure?: string;
  theme?: string;
}>;

function declarationsFor(selector: string) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`))?.[1];
  if (!body) return {};

  return Object.fromEntries(
    body
      .split(";")
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(":");
        return [
          declaration.slice(0, separator).trim(),
          declaration.slice(separator + 1).trim(),
        ];
      }),
  );
}

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)!.map((value) => {
    const channel = Number.parseInt(value, 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first: string, second: string) {
  const values = [relativeLuminance(first), relativeLuminance(second)].sort(
    (a, b) => b - a,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("Meet Me There design-system contract", () => {
  it("records the approved Design Taste dials in CSS and Hallmark memory", () => {
    expect(css).toContain("Hallmark · macrostructure: Invitation City · theme: custom");
    expect(css).toContain("Meet Me There · invitation system · variance 9 · motion 7 · density 4");
    expect(css).not.toContain("Café Weather · Garden");
    expect(css).not.toContain("Newsreader Variable");
    expect(hallmarkLog[0]?.design_taste).toEqual({
      variance: 9,
      motion: 7,
      density: 4,
    });
    expect(hallmarkLog[0]).toMatchObject({
      critique: "P5 H4 E4 S5 R4 V4",
      audit: "contrast pass / slop pass / nav pass / footer pass / mobile pass",
    });
  });

  it("describes the shipped discovery artifact and its real map enrichment", () => {
    expect(hallmarkLog[0]).toMatchObject({
      artifact: "Meet Me There full product redesign",
      macrostructure: "Invitation City",
      enrichment: "code-native illustration plus MapLibre",
    });
    expect(hallmarkLog[0]).toMatchObject({
      date: "2026-07-10",
      theme: "custom",
    });
    expect(hallmarkLog.length).toBeGreaterThan(1);
    expect(hallmarkLog.length).toBeLessThanOrEqual(20);
  });

  it("starts the spacing scale at four pixels", () => {
    expect(tokens).not.toContain("--space-3xs");
    expect(tokens).toContain("--space-2xs: 0.25rem");
  });

  it("encodes stable invitation geometry and visible focus behavior", () => {
    expect(declarationsFor(".brand-lockup__name")).toMatchObject({
      display: "flex",
      "font-family": "var(--font-display)",
    });
    expect(declarationsFor(".place-invitation__actions a")).toMatchObject({
      display: "inline-flex",
      "min-height": "var(--target-min)",
      "align-items": "center",
    });
    expect(declarationsFor(":focus-visible")).toMatchObject({
      outline: "var(--rule-strong) solid var(--color-focus)",
      "outline-offset": "var(--space-2xs)",
    });
    expect(tokens).toContain("--color-focus-light: var(--color-espresso)");
    expect(tokens).toContain("--color-focus-dark: var(--color-honey)");
    expect(css).toMatch(/\.scene\[data-tone="burgundy"\],[\s\S]*?--color-focus: var\(--color-focus-dark\)/);
    expect(css).toMatch(/\.scene\[data-tone="terracotta"\],[\s\S]*?--color-focus: var\(--color-focus-light\)/);
  });

  it("keeps standard controls on one line while preserving the approved coaster exception", () => {
    expect(css).toMatch(/\.filter-tab\s*\{[^}]*white-space:\s*nowrap/s);
    expect(css).toMatch(/\.cafe-map__index (?:button|a),[\s\S]*?white-space:\s*nowrap/);
    expect(css).toMatch(/\.action-link,[\s\S]*?white-space:\s*nowrap/);
    expect(css).toMatch(/\.reaction-coaster__label\s*\{[^}]*-webkit-line-clamp:\s*2[^}]*white-space:\s*normal/s);
  });

  it("gives every warm surface a focus role above the 3:1 non-text threshold", () => {
    const lightFocus = "#2a1712";
    const darkFocus = "#f3c95f";

    for (const surface of ["#f7ead2", "#e8694d", "#f3c95f", "#efb6a3"]) {
      expect(contrastRatio(lightFocus, surface)).toBeGreaterThanOrEqual(3);
    }
    for (const surface of ["#2a1712", "#8e2f2d"]) {
      expect(contrastRatio(darkFocus, surface)).toBeGreaterThanOrEqual(3);
    }
  });

  it("keeps eyebrow and heading wrappers single-column", () => {
    expect(css).toMatch(/\.cafe-detail__hero-title\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
    expect(css).toMatch(/\.suggest-page__heading\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
  });

  it("applies a purposeful tactile treatment to invitation actions", () => {
    const activeRule = css.match(
      /\.place-invitation__actions a:active,\s*\.brand-lockup__name:active\s*\{([^}]*)\}/,
    );

    expect(activeRule?.[1]).toContain("transform: translateY(var(--rule-strong))");
  });

  it("maps every scene tone to a token and removes spatial reduced motion", () => {
    for (const tone of [
      "espresso",
      "cream",
      "terracotta",
      "honey",
      "clay",
      "burgundy",
    ]) {
      expect(css).toContain(
        `.scene[data-tone="${tone}"] { background: var(--color-${tone}); }`,
      );
    }

    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\[data-motion="reveal"\][\s\S]*?transform:\s*none[\s\S]*?transition:\s*opacity var\(--dur-micro\) linear/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-duration:\s*0\.01ms/,
    );
    expect(css).not.toMatch(/body\s*\{[^}]*overflow-x:\s*(?:auto|scroll)/s);
  });

  it("loads only the local Latin Fontsource declaration bundle", () => {
    expect(root).toContain('import "./fonts/latin-wght.css"');
    expect(root).not.toContain("@fontsource-variable/ibm-plex-sans/wght.css");
    expect(root).not.toContain("@fontsource-variable/newsreader/wght.css");
  });

  it("makes the catalogue full bleed and composes list with a dominant desktop map", () => {
    expect(catalogueCss).toMatch(
      /\.catalogue-page\s*\{[^}]*width: 100vw;[^}]*margin-inline: calc\(50% - 50vw\);[^}]*overflow-x: clip;/s,
    );
    expect(catalogueCss).toContain(
      "grid-template-columns: minmax(20rem, 0.72fr) minmax(0, 1.28fr)",
    );
    expect(catalogueCss).toContain(
      ".catalogue-results[data-mode] .catalogue-results__list",
    );
    expect(catalogueCss).toContain(".view-switch { display: none; }");
    expect(catalogueCss).toContain(".catalogue-page .cafe-row");
  });

  it("resets catalogue fieldsets and replaces native radio presentation", () => {
    expect(catalogueCss).toMatch(
      /\.facet-disclosure fieldset,[\s\S]*?\.view-switch\s*\{[^}]*margin:\s*0;[^}]*padding:\s*0;[^}]*border:\s*0;/,
    );
    expect(catalogueCss).toMatch(/\.view-switch input\s*\{[^}]*opacity:\s*0;/s);
    expect(catalogueCss).toMatch(/\.view-switch label:has\(input:checked\)/);
    expect(catalogueCss).toMatch(/\.view-switch label:has\(input:focus-visible\)/);
    expect(catalogueCss).toMatch(/\.active-filters li > button\s*\{[^}]*min-width:\s*var\(--target-min\)/s);
  });

  it("keeps every live catalogue and recovery control selector styled", () => {
    for (const selector of [
      ".facet-disclosure fieldset",
      ".facet-disclosure legend",
      ".active-filters__head",
      ".active-filters__note",
      ".active-filters li > button",
      ".view-switch label",
      ".view-switch input",
      ".not-found-page__actions",
    ]) {
      expect(css, `missing live selector ${selector}`).toContain(selector);
    }
  });
});
