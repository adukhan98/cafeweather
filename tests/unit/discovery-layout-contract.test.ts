import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
const homeCss = readFileSync(new URL("../../app/styles/home.css", import.meta.url), "utf8");

describe("discovery intermediate-width layout", () => {
  it("keeps café rows shrinkable through 640, 700, and 767 pixels", () => {
    const tablet = css.slice(
      css.indexOf("@media (min-width: 40rem)"),
      css.indexOf("@media (min-width: 60rem)"),
    );
    const desktop = css.slice(css.indexOf("@media (min-width: 60rem)"));

    expect(tablet).not.toMatch(/\.cafe-row\s*\{[^}]*grid-template-columns:/s);
    expect(desktop).toMatch(
      /\.cafe-row\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1\.3fr\)/s,
    );
  });

  it("keeps homepage overflow intentional and full-height scenes selective", () => {
    expect(homeCss).toMatch(/\.city-trail__scroller\s*\{[^}]*overflow-x:\s*auto/s);
    expect(homeCss.match(/min-height:\s*100dvh/g)).toHaveLength(2);
    expect(homeCss).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
