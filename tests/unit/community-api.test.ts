import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CommunityApiError,
  communityApi,
} from "../../app/lib/community-api";

const reactions = [
  { kind: "cozy", count: 2, active: true },
  { kind: "quiet", count: 1, active: false },
  { kind: "work-friendly", count: 3, active: false },
  { kind: "date-friendly", count: 0, active: false },
  { kind: "late-night", count: 4, active: false },
  { kind: "great-coffee", count: 8, active: true },
  { kind: "great-tea", count: 1, active: false },
] as const;

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("communityApi", () => {
  it("uses same-origin credentials and JSON for the ordered reaction request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      Response.json({ reactions }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      communityApi.getReactions("larrys-place-parkdale"),
    ).resolves.toEqual(reactions);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/cafes/larrys-place-parkdale/reactions",
      expect.objectContaining({
        credentials: "same-origin",
        headers: expect.objectContaining({ Accept: "application/json" }),
        method: "GET",
      }),
    );
  });

  it("surfaces the shared error envelope and parses Retry-After seconds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json(
          {
            error: {
              code: "rate_limited",
              message: "Too many requests.",
              requestId: "request-42",
            },
          },
          { status: 429, headers: { "Retry-After": "37" } },
        ),
      ),
    );

    const error = await communityApi
      .setReaction("larrys-place-parkdale", "cozy", true)
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(CommunityApiError);
    expect(error).toMatchObject({
      status: 429,
      code: "rate_limited",
      requestId: "request-42",
      retryAfterSeconds: 37,
    });
  });

  it("times reaction requests out after eight seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
      ),
    );

    const request = expect(
      communityApi.getReactions("larrys-place-parkdale"),
    ).rejects.toMatchObject({
      name: "CommunityApiError",
      code: "request_timed_out",
      timedOut: true,
    });
    await vi.advanceTimersByTimeAsync(8_000);
    await request;
  });

  it("allows ten seconds for suggestions and preserves an external abort", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        );
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    const request = expect(
      communityApi.submitSuggestion(
        {
          name: "Café Plenty",
          address: "Toronto, ON",
          reason: "The coffee deserves a closer look.",
          website: "",
          submissionId: "a1afaf08-7ef8-44cf-9594-e10f45326b8d",
        },
        controller.signal,
      ),
    ).rejects.toMatchObject({ name: "AbortError" });

    await vi.advanceTimersByTimeAsync(8_000);
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);

    controller.abort();
    await request;
  });

  it("rejects a malformed success payload as a typed API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ reactions: null })));

    await expect(
      communityApi.getReactions("larrys-place-parkdale"),
    ).rejects.toMatchObject({
      name: "CommunityApiError",
      status: 502,
      code: "invalid_response",
    });
  });

  it("wraps network failures while preserving aborts for unmount cleanup", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    await expect(
      communityApi.getReactions("larrys-place-parkdale"),
    ).rejects.toMatchObject({
      name: "CommunityApiError",
      status: 0,
      code: "network_error",
    });
  });

  it("times suggestions out at ten seconds rather than the reaction deadline", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        });
      }),
    );
    const result = expect(
      communityApi.submitSuggestion({
        name: "Café Plenty",
        address: "Toronto, ON",
        reason: "The coffee deserves a closer look.",
        website: "",
        submissionId: "a1afaf08-7ef8-44cf-9594-e10f45326b8d",
      }),
    ).rejects.toMatchObject({ code: "request_timed_out", timedOut: true });

    await vi.advanceTimersByTimeAsync(9_999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await result;
  });
});
