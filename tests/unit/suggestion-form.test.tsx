// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SuggestionForm } from "../../app/features/community/SuggestionForm";
import {
  CommunityApiError,
  type CommunityApiClient,
} from "../../app/lib/community-api";

const suggestionId = "a1afaf08-7ef8-44cf-9594-e10f45326b8d";
const nextSuggestionId = "66493f37-fd4d-44fd-9550-1ef4dddc56b7";
const thirdSuggestionId = "b3c8f253-7b10-4d7a-9ab8-f92a358dc33e";

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "turnstile");
});

function api(overrides: Partial<CommunityApiClient> = {}): CommunityApiClient {
  return {
    getReactions: vi.fn(),
    setReaction: vi.fn(),
    submitSuggestion: vi.fn().mockResolvedValue({ id: "pending-1", status: "pending" }),
    ...overrides,
  };
}

async function fillCore(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Café name"), "Café Plenty");
  await user.type(
    screen.getByLabelText("Why should it be in the guide?"),
    "Its careful coffee and calm room deserve a closer look.",
  );
}

describe("SuggestionForm", () => {
  it("validates on blur with stable helper space and linked field errors", async () => {
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api()}
      />,
    );

    const name = screen.getByLabelText("Café name");
    const helper = document.querySelector("#suggestion-name-help");
    expect(name).toHaveAttribute("aria-describedby", "suggestion-name-help");
    expect(helper).toBeInTheDocument();

    await user.type(name, "A");
    await user.tab();

    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(helper).toHaveTextContent(/at least 2 characters/i);
  });

  it("requires an address or HTTPS map URL and accepts either alternative", async () => {
    const submitSuggestion = vi.fn().mockResolvedValue({ id: "pending-1", status: "pending" });
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);

    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(screen.getByLabelText("Street address")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("HTTPS map link")).toHaveAttribute("aria-invalid", "true");
    expect(submitSuggestion).not.toHaveBeenCalled();

    await user.type(
      screen.getByLabelText("HTTPS map link"),
      "https://maps.google.com/?q=Cafe+Plenty",
    );
    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(submitSuggestion).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Café Plenty",
        mapUrl: "https://maps.google.com/?q=Cafe+Plenty",
        website: "",
      }),
      expect.any(AbortSignal),
    );
    expect(submitSuggestion.mock.calls[0]?.[0]).not.toHaveProperty("address");
    expect(submitSuggestion.mock.calls[0]?.[0]).not.toHaveProperty("recommendation");
  });

  it("keeps values and one submission ID across server failure and retry", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(suggestionId)
      .mockReturnValueOnce(nextSuggestionId);
    const submitSuggestion = vi
      .fn()
      .mockRejectedValueOnce(
        new CommunityApiError(
          "Please correct the highlighted fields.",
          400,
          "validation_failed",
          "request-2",
          { reason: ["Please add a more specific reason."] },
        ),
      )
      .mockResolvedValueOnce({ id: "pending-1", status: "pending" });
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);
    await user.type(screen.getByLabelText("Street address"), "19 Brock Ave, Toronto, ON");

    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(await screen.findByText("Please add a more specific reason.")).toBeInTheDocument();
    expect(screen.getByLabelText("Café name")).toHaveValue("Café Plenty");
    expect(submitSuggestion.mock.calls[0]?.[0].submissionId).toBe(suggestionId);

    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(
      await screen.findByText("Thanks. Your suggestion is pending review."),
    ).toBeInTheDocument();
    expect(submitSuggestion.mock.calls[1]?.[0].submissionId).toBe(suggestionId);
    expect(globalThis.crypto.randomUUID).toHaveBeenCalledTimes(2);
  });

  it("rotates the submission ID after an attempted payload is edited", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValueOnce(suggestionId)
      .mockReturnValueOnce(nextSuggestionId)
      .mockReturnValueOnce(thirdSuggestionId);
    const submitSuggestion = vi
      .fn()
      .mockRejectedValueOnce(new Error("network failure"))
      .mockResolvedValueOnce({ id: "pending-2", status: "pending" });
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);
    await user.type(
      screen.getByLabelText("Street address"),
      "19 Brock Ave, Toronto, ON",
    );

    await user.click(screen.getByRole("button", { name: "Send for review" }));
    expect(
      await screen.findByText(/could not be sent/i),
    ).toBeInTheDocument();
    expect(submitSuggestion.mock.calls[0]?.[0].submissionId).toBe(suggestionId);

    await user.type(
      screen.getByLabelText("What should someone order or notice?"),
      "Try the cortado.",
    );
    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(submitSuggestion.mock.calls[1]?.[0].submissionId).toBe(
      nextSuggestionId,
    );
  });

  it("disables every editable field while a submission is in flight", async () => {
    const submitSuggestion = vi.fn(() => new Promise<never>(() => undefined));
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);
    await user.type(
      screen.getByLabelText("Street address"),
      "19 Brock Ave, Toronto, ON",
    );

    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(screen.getByLabelText("Café name")).toBeDisabled();
    expect(screen.getByLabelText("Street address")).toBeDisabled();
    expect(screen.getByLabelText("HTTPS map link")).toBeDisabled();
    expect(
      screen.getByLabelText("Why should it be in the guide?"),
    ).toBeDisabled();
    expect(
      screen.getByLabelText("What should someone order or notice?"),
    ).toBeDisabled();
  });

  it("shows rate-limit recovery, preserves inputs, and resets Turnstile after the attempt", async () => {
    let turnstileOptions: { callback: (token: string) => void } | undefined;
    const reset = vi.fn();
    const renderTurnstile = vi.fn((_element: HTMLElement, options: typeof turnstileOptions) => {
      turnstileOptions = options;
      return "widget-form";
    });
    Object.assign(window, {
      turnstile: {
        render: renderTurnstile,
        reset,
        remove: vi.fn(),
      },
    });
    const submitSuggestion = vi.fn().mockRejectedValue(
      new CommunityApiError(
        "Too many suggestions.",
        429,
        "rate_limited",
        "request-3",
        undefined,
        75,
      ),
    );
    const user = userEvent.setup();
    render(
      <SuggestionForm
        siteKey="site-key-public"
        turnstileAction="suggestion"
        turnstileRequired
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);
    await user.type(screen.getByLabelText("Street address"), "19 Brock Ave, Toronto, ON");
    await waitFor(() => expect(renderTurnstile).toHaveBeenCalledOnce());
    act(() => turnstileOptions?.callback("valid-token"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Send for review" })).toBeEnabled(),
    );

    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(await screen.findByText(/try again in 75 seconds/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Café name")).toHaveValue("Café Plenty");
    expect(reset).toHaveBeenCalledWith("widget-form");
  });

  it("disables production-like submission when the public site key is missing", () => {
    render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired
        api={api()}
      />,
    );

    expect(screen.getByRole("button", { name: "Send for review" })).toBeDisabled();
    expect(screen.getByText(/human verification is not configured/i)).toBeInTheDocument();
  });

  it("aborts an in-flight submission on unmount", async () => {
    let signal: AbortSignal | undefined;
    const submitSuggestion = vi.fn((_input, suppliedSignal?: AbortSignal) => {
      signal = suppliedSignal;
      return new Promise<never>(() => undefined);
    });
    const user = userEvent.setup();
    const view = render(
      <SuggestionForm
        siteKey={null}
        turnstileAction="suggestion"
        turnstileRequired={false}
        api={api({ submitSuggestion })}
      />,
    );
    await fillCore(user);
    await user.type(screen.getByLabelText("Street address"), "19 Brock Ave, Toronto, ON");
    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(signal?.aborted).toBe(false);
    view.unmount();
    expect(signal?.aborted).toBe(true);
  });
});
