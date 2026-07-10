import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const helper = readFileSync(
  new URL("../browser/app-shell-geometry.mjs", import.meta.url),
  "utf8",
);

describe("application geometry helper contract", () => {
  it("checks strict geometry at normal and 200 percent zoom", () => {
    expect(helper).toContain('closest(\'[data-horizontal-rail="true"]\')');
    expect(helper).toContain('fontSize = "200%"');
    expect(helper).toContain("try {");
    expect(helper).toContain("finally {");
    expect(helper).toContain("assertGeometry(result");
    expect(helper).toContain("assertGeometry(zoomedResult");
    expect(helper).toContain("overflowingChildren.length > 0");
  });
});
