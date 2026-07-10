import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../app/app.css", import.meta.url), "utf8");
const homeCss = readFileSync(
  new URL("../../app/styles/home.css", import.meta.url),
  "utf8",
);
const tokens = readFileSync(
  new URL("../../tokens.css", import.meta.url),
  "utf8",
);

function tokenHex(name: string): string {
  const value = tokens.match(
    new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"),
  )?.[1];
  if (!value) throw new Error(`Missing hexadecimal token ${name}`);
  return value;
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

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
    expect(homeCss).toMatch(
      /\.city-trail__scroller\s*\{[^}]*overflow-x:\s*auto/s,
    );
    expect(homeCss.match(/min-height:\s*100dvh/g)).toHaveLength(2);
    expect(homeCss).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("contains mobile mood offsets and keeps selected counts high contrast", () => {
    const mobile = homeCss.slice(
      0,
      homeCss.indexOf("@media (min-width: 44rem)"),
    );
    const selectedMood = homeCss.match(
      /\.mood-choice:has\(input:checked\)[\s\S]*?\}/,
    )?.[0];

    expect(mobile).not.toMatch(/\.mood-choice[^}]*translateX/s);
    expect(mobile).toMatch(/\.mood-choice:nth-child\(even\)[^}]*translateY/s);
    expect(selectedMood).toContain("background: var(--color-honey)");
    expect(homeCss).toMatch(
      /\.mood-choice:has\(input:checked\) small\s*\{[^}]*color:\s*(?:inherit|var\(--color-espresso\))/s,
    );
    expect(
      contrastRatio(tokenHex("--color-espresso"), tokenHex("--color-honey")),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
