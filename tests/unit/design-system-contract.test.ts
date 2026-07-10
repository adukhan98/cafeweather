import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const root = readFileSync(new URL("../../app/root.tsx", import.meta.url), "utf8");
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

describe("Café Weather design-system contract", () => {
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

  it("encodes stable mobile geometry and visible main focus behavior", () => {
    expect(declarationsFor(".masthead__toggle")).toMatchObject({ flex: "none" });
    expect(declarationsFor(".masthead__wordmark")).toMatchObject({
      "min-height": "var(--target-min)",
    });
    expect(declarationsFor(".app-shell__main:focus-visible")).toMatchObject({
      outline: "var(--rule-strong) solid var(--color-focus)",
    });
  });

  it("applies one purposeful press treatment to all shell links", () => {
    const activeRule = css.match(
      /\.masthead__wordmark:active,\s*\.masthead__desktop-nav a:active,\s*\.masthead__mobile-nav a:active,\s*\.site-footer__links a:active\s*\{([^}]*)\}/,
    );

    expect(activeRule?.[1]).toContain("color: var(--color-accent-hover)");
    expect(activeRule?.[1]).toContain("transform: translateY(var(--rule-hair))");
  });

  it("loads only the local Latin Fontsource declaration bundle", () => {
    expect(root).toContain('import "./fonts/latin-wght.css"');
    expect(root).not.toContain("@fontsource-variable/ibm-plex-sans/wght.css");
    expect(root).not.toContain("@fontsource-variable/newsreader/wght.css");
  });
});
