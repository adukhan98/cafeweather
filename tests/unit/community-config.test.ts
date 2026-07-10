import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import * as apiHandlers from "../../app/.server/api-handlers";

describe("community environment configuration", () => {
  it("normalizes blank optional environment values", () => {
    const normalize = Reflect.get(apiHandlers, "normalizeOptionalEnvString");

    expect(normalize).toBeTypeOf("function");
    expect(normalize(undefined)).toBeUndefined();
    expect(normalize("   ")).toBeUndefined();
    expect(normalize("  configured-value  ")).toBe("configured-value");
  });

  it("exposes only the normalized public Turnstile site key", () => {
    const publicConfig = Reflect.get(apiHandlers, "communityPublicConfigFromEnv");

    expect(publicConfig).toBeTypeOf("function");
    expect(publicConfig({ TURNSTILE_SITE_KEY: "   " })).toEqual({});
    expect(publicConfig({ TURNSTILE_SITE_KEY: "  public-site-key  " })).toEqual({
      turnstileSiteKey: "public-site-key",
    });
  });

  it("declares safe public vars without committing the Turnstile secret", async () => {
    const config = JSON.parse(
      await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8"),
    ) as {
      vars?: Record<string, string>;
      observability?: {
        enabled?: boolean;
        logs?: { enabled?: boolean; head_sampling_rate?: number };
        traces?: { enabled?: boolean; head_sampling_rate?: number };
      };
    };

    expect(config.vars).toMatchObject({
      TURNSTILE_SITE_KEY: "",
      TURNSTILE_HOSTNAME: "",
      TURNSTILE_ACTION: "suggestion",
    });
    expect(JSON.stringify(config)).not.toContain("TURNSTILE_SECRET");
    expect(config.observability).toEqual({
      enabled: true,
      logs: { enabled: true, head_sampling_rate: 1 },
      traces: { enabled: true, head_sampling_rate: 0.05 },
    });
  });

  it("documents every local community variable with empty safe placeholders", async () => {
    const exampleUrl = new URL("../../.env.example", import.meta.url);
    expect(existsSync(exampleUrl)).toBe(true);
    const example = await readFile(exampleUrl, "utf8");

    for (const key of [
      "VISITOR_HMAC_SECRET",
      "TURNSTILE_SITE_KEY",
      "TURNSTILE_SECRET",
      "TURNSTILE_HOSTNAME",
      "TURNSTILE_ACTION",
    ]) {
      expect(example).toContain(`${key}=`);
    }
    expect(example).not.toMatch(/(?:VISITOR_HMAC_SECRET|TURNSTILE_SECRET)=\S+/u);
  });
});
