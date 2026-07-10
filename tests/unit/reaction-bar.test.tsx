// @vitest-environment jsdom

import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ReactionMutation } from "../../app/contracts/community";
import { reactionKinds, reactionLabels } from "../../app/contracts/community";
import { ReactionBar } from "../../app/features/community/ReactionBar";
import {
  CommunityApiError,
  type CommunityApiClient,
} from "../../app/lib/community-api";

const loadedReactions = reactionKinds.map((kind, index) => ({
  kind,
  count: index + 1,
  active: kind === "great-coffee",
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, reject, resolve };
}

function api(overrides: Partial<CommunityApiClient> = {}): CommunityApiClient {
  return {
    getReactions: vi.fn().mockResolvedValue(loadedReactions),
    setReaction: vi.fn().mockResolvedValue({
      kind: "cozy",
      count: 2,
      active: true,
      changed: true,
    }),
    submitSuggestion: vi.fn(),
    ...overrides,
  };
}

describe("ReactionBar", () => {
  it("renders seven ordered coasters disabled until the initial state loads", async () => {
    const load = deferred<typeof loadedReactions>();
    render(
      <ReactionBar
        slug="larrys-place-parkdale"
        api={api({ getReactions: vi.fn(() => load.promise) })}
      />,
    );

    const region = screen.getByRole("group", { name: "Community reactions" });
    const initialButtons = within(region).getAllByRole("button");
    expect(initialButtons).toHaveLength(7);
    expect(initialButtons.every((button) => button.hasAttribute("disabled"))).toBe(true);
    expect(initialButtons.every((button) => button.classList.contains("reaction-coaster"))).toBe(true);
    expect(initialButtons.every((button) => button.dataset.state === "loading")).toBe(true);
    expect(initialButtons.map((button) => button.textContent)).toEqual(
      reactionKinds.map((kind) => `${reactionLabels[kind]}0`),
    );

    load.resolve([...loadedReactions].reverse());

    const cozy = await within(region).findByRole("button", { name: /Cozy, 1 reaction/i });
    expect(cozy).toBeEnabled();
    expect(cozy).toHaveAttribute("data-state", "idle");
    expect(
      within(region).getByRole("button", { name: /Great coffee, 6 reactions/i }),
    ).toHaveAttribute("data-state", "active");
    expect(within(region).getAllByRole("button").map((button) => button.textContent)).toEqual(
      reactionKinds.map((kind, index) => `${reactionLabels[kind]}${index + 1}`),
    );
  });

  it("optimistically toggles and reconciles an authoritative duplicate response", async () => {
    const mutation = deferred<ReactionMutation>();
    const client = api({ setReaction: vi.fn(() => mutation.promise) });
    const user = userEvent.setup();
    render(<ReactionBar slug="larrys-place-parkdale" api={client} />);

    const cozy = await screen.findByRole("button", { name: /Cozy, 1 reaction/i });
    await user.click(cozy);

    expect(cozy).toHaveAttribute("aria-pressed", "true");
    expect(cozy).toHaveTextContent("2");
    expect(cozy).toBeDisabled();
    expect(client.setReaction).toHaveBeenCalledWith(
      "larrys-place-parkdale",
      "cozy",
      true,
      expect.any(AbortSignal),
    );

    mutation.resolve({
      kind: "cozy",
      count: 1,
      active: true,
      changed: false,
    });

    expect(await screen.findByRole("button", { name: /Cozy, 1 reaction/i })).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("Cozy reaction saved.");
  });

  it("rolls back exactly on failure and retries the original intent", async () => {
    const first = deferred<ReactionMutation>();
    const second = deferred<ReactionMutation>();
    const setReaction = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const user = userEvent.setup();
    render(
      <ReactionBar
        slug="larrys-place-parkdale"
        api={api({ setReaction })}
      />,
    );

    const quiet = await screen.findByRole("button", { name: /Quiet, 2 reactions/i });
    await user.click(quiet);
    expect(quiet).toHaveTextContent("3");
    first.reject(new CommunityApiError("Offline", 503, "community_unavailable"));

    const retry = await screen.findByRole("button", { name: "Retry Quiet reaction" });
    expect(quiet).toHaveAttribute("aria-pressed", "false");
    expect(quiet).toHaveTextContent("2");

    await user.click(retry);
    expect(quiet).toHaveAttribute("aria-pressed", "true");
    second.resolve({ kind: "quiet", count: 3, active: true, changed: true });

    expect(await screen.findByRole("button", { name: /Quiet, 3 reactions/i })).toBeEnabled();
    expect(setReaction).toHaveBeenLastCalledWith(
      "larrys-place-parkdale",
      "quiet",
      true,
      expect.any(AbortSignal),
    );
  });

  it("gives specific timeout and rate-limit recovery copy", async () => {
    const setReaction = vi
      .fn()
      .mockRejectedValueOnce(
        new CommunityApiError(
          "The request took too long.",
          408,
          "request_timed_out",
          undefined,
          undefined,
          undefined,
          true,
        ),
      )
      .mockRejectedValueOnce(
        new CommunityApiError(
          "Too many requests.",
          429,
          "rate_limited",
          "request-1",
          undefined,
          42,
        ),
      );
    const user = userEvent.setup();
    render(<ReactionBar slug="larrys-place-parkdale" api={api({ setReaction })} />);

    await user.click(await screen.findByRole("button", { name: /Cozy, 1 reaction/i }));
    expect(await screen.findAllByText(/took too long/i)).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: /Quiet, 2 reactions/i }));
    expect(await screen.findAllByText(/try again in 42 seconds/i)).not.toHaveLength(0);
  });

  it("aborts its initial request on unmount without surfacing an error", () => {
    let capturedSignal: AbortSignal | undefined;
    const { unmount } = render(
      <ReactionBar
        slug="larrys-place-parkdale"
        api={api({
          getReactions: vi.fn((_slug, signal) => {
            capturedSignal = signal;
            return new Promise(() => undefined);
          }),
        })}
      />,
    );

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores a late initial response from the previous slug", async () => {
    const firstLoad = deferred<typeof loadedReactions>();
    const secondLoad = deferred<typeof loadedReactions>();
    const loadSignals: AbortSignal[] = [];
    const getReactions = vi
      .fn()
      .mockImplementationOnce((_slug, signal: AbortSignal) => {
        loadSignals.push(signal);
        return firstLoad.promise;
      })
      .mockImplementationOnce((_slug, signal: AbortSignal) => {
        loadSignals.push(signal);
        return secondLoad.promise;
      });
    const view = render(<ReactionBar slug="cafe-a" api={api({ getReactions })} />);

    view.rerender(<ReactionBar slug="cafe-b" api={api({ getReactions })} />);
    expect(loadSignals[0]?.aborted).toBe(true);
    expect(loadSignals[1]?.aborted).toBe(false);
    secondLoad.resolve(
      loadedReactions.map((reaction) =>
        reaction.kind === "cozy" ? { ...reaction, count: 22 } : reaction,
      ),
    );
    expect(await screen.findByRole("button", { name: /Cozy, 22 reactions/i })).toBeEnabled();

    await act(async () => {
      firstLoad.resolve(
        loadedReactions.map((reaction) =>
          reaction.kind === "cozy" ? { ...reaction, count: 99 } : reaction,
        ),
      );
      await firstLoad.promise;
    });

    expect(screen.getByRole("button", { name: /Cozy, 22 reactions/i })).toBeEnabled();
    expect(screen.queryByRole("button", { name: /Cozy, 99 reactions/i })).not.toBeInTheDocument();
  });

  it("keeps a new-slug mutation authoritative when an aborted old mutation settles late", async () => {
    const oldMutation = deferred<ReactionMutation>();
    const newMutation = deferred<ReactionMutation>();
    const mutationSignals: AbortSignal[] = [];
    const setReaction = vi
      .fn()
      .mockImplementationOnce((_slug, _kind, _desired, signal: AbortSignal) => {
        mutationSignals.push(signal);
        return oldMutation.promise;
      })
      .mockImplementationOnce((_slug, _kind, _desired, signal: AbortSignal) => {
        mutationSignals.push(signal);
        return newMutation.promise;
      });
    const getReactions = vi
      .fn()
      .mockResolvedValueOnce(loadedReactions)
      .mockResolvedValueOnce(
        loadedReactions.map((reaction) =>
          reaction.kind === "cozy" ? { ...reaction, count: 10 } : reaction,
        ),
      );
    const client = api({ getReactions, setReaction });
    const user = userEvent.setup();
    const view = render(<ReactionBar slug="cafe-a" api={client} />);

    await user.click(await screen.findByRole("button", { name: /Cozy, 1 reaction/i }));
    view.rerender(<ReactionBar slug="cafe-b" api={client} />);
    expect(mutationSignals[0]?.aborted).toBe(true);

    const newCozy = await screen.findByRole("button", { name: /Cozy, 10 reactions/i });
    expect(newCozy).toBeEnabled();
    await user.click(newCozy);
    expect(newCozy).toBeDisabled();
    expect(newCozy).toHaveTextContent("11");

    await act(async () => {
      oldMutation.resolve({ kind: "cozy", count: 91, active: true, changed: true });
      await oldMutation.promise;
    });

    expect(screen.getByRole("button", { name: /Cozy, 11 reactions/i })).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Cozy, 91 reactions/i })).not.toBeInTheDocument();

    newMutation.resolve({ kind: "cozy", count: 12, active: true, changed: true });
    expect(await screen.findByRole("button", { name: /Cozy, 12 reactions/i })).toBeEnabled();
  });
});
