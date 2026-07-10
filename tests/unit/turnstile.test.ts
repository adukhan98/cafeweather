import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileRemote } from "../../app/.server/services/community";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Turnstile verification", () => {
  it("requires the expected hostname and action", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          success: true,
          hostname: "evil.example",
          action: "different-action",
        }),
      ),
    );

    await expect(
      verifyTurnstileRemote({
        secret: "secret",
        token: "token",
        remoteIp: "203.0.113.10",
        expectedHostname: "cafe-weather.example",
        expectedAction: "suggestion",
      }),
    ).resolves.toBe(false);
  });

  it("sends remote IP and accepts matching hostname and action", async () => {
    let submittedBody: FormData | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        submittedBody = init?.body as FormData;
        return Response.json({
          success: true,
          hostname: "cafe-weather.example",
          action: "suggestion",
        });
      }),
    );

    await expect(
      verifyTurnstileRemote({
        secret: "secret",
        token: "token",
        remoteIp: "203.0.113.10",
        expectedHostname: "cafe-weather.example",
        expectedAction: "suggestion",
      }),
    ).resolves.toBe(true);
    expect(submittedBody?.get("remoteip")).toBe("203.0.113.10");
  });

  it("classifies transport failures as Turnstile unavailability", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network failed");
      }),
    );

    await expect(
      verifyTurnstileRemote({
        secret: "secret",
        token: "token",
        expectedHostname: "cafe-weather.example",
        expectedAction: "suggestion",
      }),
    ).rejects.toMatchObject({ name: "TurnstileUnavailableError" });
  });
});
