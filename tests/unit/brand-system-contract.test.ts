import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const tokens = readFileSync(new URL("../../tokens.css", import.meta.url), "utf8");
const fonts = readFileSync(
  new URL("../../app/fonts/latin-wght.css", import.meta.url),
  "utf8",
);

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
    for (const path of [
      "../../public/favicon.svg",
      "../../public/og-meet-me-there.svg",
      "../../public/textures/paper-grain.svg",
    ]) {
      expect(existsSync(new URL(path, import.meta.url))).toBe(true);
    }
  });
});
