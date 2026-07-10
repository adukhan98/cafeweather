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

describe("Meet Me There design-system contract", () => {
  it("records the approved Design Taste dials in CSS and Hallmark memory", () => {
    expect(css).toContain("Meet Me There · invitation system");
    expect(css).not.toContain("Café Weather · Garden");
    expect(css).not.toContain("Newsreader Variable");
    expect(hallmarkLog[0]?.design_taste).toEqual({
      variance: 9,
      motion: 7,
      density: 4,
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
