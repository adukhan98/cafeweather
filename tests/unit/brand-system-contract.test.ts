import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const fonts = readFileSync(
  new URL("../../app/fonts/latin-wght.css", import.meta.url),
  "utf8",
);

function readCssSources(directory: URL): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const source = new URL(entry.name + (entry.isDirectory() ? "/" : ""), directory);
    if (entry.isDirectory()) return readCssSources(source);
    return entry.name.endsWith(".css") ? [readFileSync(source, "utf8")] : [];
  });
}

describe("Meet Me There brand system", () => {
  it("declares the approved warm palette and typography", () => {
    for (const value of ["#2a1712", "#f7ead2", "#e8694d", "#f3c95f", "#efb6a3", "#8e2f2d"]) {
      expect(tokens.toLowerCase()).toContain(value);
    }
    expect(tokens).toContain('"Fraunces Variable"');
    expect(tokens).toContain('"IBM Plex Sans Variable"');
    expect(fonts).toContain("fraunces-latin-wght-normal.woff2");
    expect(fonts).toContain("fraunces-latin-wght-italic.woff2");
  });

  it("ships local brand artwork", () => {
    const favicon = readFileSync(new URL("../../public/favicon.svg", import.meta.url), "utf8");
    expect(favicon).toContain("<svg");
    expect(favicon).toContain('viewBox="0 0 64 64"');
    for (const color of ["#E8694D", "#F7EAD2", "#2A1712", "#8E2F2D"]) {
      expect(favicon).toContain(color);
    }

    const socialCard = readFileSync(
      new URL("../../public/og-meet-me-there.svg", import.meta.url),
      "utf8",
    );
    expect(socialCard).toContain("<svg");
    expect(socialCard).toContain('viewBox="0 0 1200 630"');
    expect(socialCard).toContain("Meet Me There");
    expect(socialCard).toContain("A TORONTO CAFÉ GUIDE");
    expect(socialCard.replace('xmlns="http://www.w3.org/2000/svg"', "")).not.toContain("http");

    const grain = readFileSync(
      new URL("../../public/textures/paper-grain.svg", import.meta.url),
      "utf8",
    );
    expect(grain).toContain("<svg");
    expect(grain).toContain('viewBox="0 0 180 180"');
    expect(grain).toContain("feTurbulence");
    expect(grain).toContain('baseFrequency=".72"');
    expect(grain).toContain('numOctaves="4"');
    expect(grain).toContain('opacity=".16"');
  });

  it("defines every design token referenced by application CSS", () => {
    const declarations = new Set(Array.from(tokens.matchAll(/^\s*(--[\w-]+)\s*:/gm), ([, name]) => name));
    const cssSources = [tokens, ...readCssSources(new URL("../../app/", import.meta.url))];
    const references = new Set(
      cssSources.flatMap((source) =>
        Array.from(source.matchAll(/var\(\s*(--[\w-]+)/g), ([, name]) => name),
      ),
    );
    const missing = [...references].filter((name) => !declarations.has(name)).sort();

    expect(missing, `Undefined design tokens: ${missing.join(", ")}`).toEqual([]);
  });
});
