import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("CI deployment contract", () => {
  it("dry-runs both canonical and legacy Cloudflare configurations", () => {
    const workflow = readFileSync(
      new URL("../../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    );

    expect(workflow).toContain("npx wrangler deploy --dry-run");
    expect(workflow).toContain(
      "npx wrangler deploy --config wrangler.legacy.jsonc --dry-run",
    );
  });
});
