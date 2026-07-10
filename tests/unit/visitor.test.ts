import { describe, expect, it } from "vitest";
import {
  constantTimeEqual,
  getVisitorIdentity,
} from "../../app/.server/visitor";

const secret = "test-secret-at-least-32-characters-long";

function cookieValue(setCookie: string): string {
  return setCookie.split(";", 1)[0];
}

describe("anonymous visitor identity", () => {
  it("compares signature bytes without early mismatch exits", () => {
    expect(constantTimeEqual("abc", "abc")).toBe(true);
    expect(constantTimeEqual("abc", "abd")).toBe(false);
    expect(constantTimeEqual("abc", "ab")).toBe(false);
  });

  it("accepts an intact signed cookie without rotating it", async () => {
    const first = await getVisitorIdentity(
      new Request("https://cafe-weather.test"),
      secret,
    );
    const second = await getVisitorIdentity(
      new Request("https://cafe-weather.test", {
        headers: { cookie: cookieValue(first.setCookie ?? "") },
      }),
      secret,
    );

    expect(second.visitorHash).toBe(first.visitorHash);
    expect(second.setCookie).toBeUndefined();
  });

  it("rejects and rotates a tampered signature", async () => {
    const first = await getVisitorIdentity(
      new Request("https://cafe-weather.test"),
      secret,
    );
    const original = cookieValue(first.setCookie ?? "");
    const tampered = `${original.slice(0, -1)}${original.endsWith("a") ? "b" : "a"}`;
    const next = await getVisitorIdentity(
      new Request("https://cafe-weather.test", {
        headers: { cookie: tampered },
      }),
      secret,
    );

    expect(next.visitorHash).not.toBe(first.visitorHash);
    expect(next.setCookie).toContain("cw_visitor=");
  });
});
