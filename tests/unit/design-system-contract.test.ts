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
  design_taste?: { variance: number; motion: number; density: number };
  enrichment?: string;
  macrostructure?: string;
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
    expect(css).toContain("Design Taste: variance=8 · motion=6 · density=4");
    expect(hallmarkLog[0]?.design_taste).toEqual({
      variance: 8,
      motion: 6,
      density: 4,
    });
  });

  it("describes the shipped discovery artifact and its real map enrichment", () => {
    expect(css.split("\n", 1)[0]).toContain("macrostructure: Ecosystem Index");
    expect(css.split("\n", 1)[0]).toContain("enrichment: code-native MapLibre");
    expect(hallmarkLog[0]).toMatchObject({
      macrostructure: "Ecosystem Index",
      enrichment: "code-native MapLibre map",
    });
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

    const reducedMotion = css.slice(
      css.lastIndexOf("@media (prefers-reduced-motion: reduce)"),
    );
    expect(reducedMotion).toContain('[data-motion="reveal"]');
    expect(reducedMotion).toContain("transform: none");
    expect(reducedMotion).toContain(
      "transition: opacity var(--dur-micro) linear",
    );
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
});
