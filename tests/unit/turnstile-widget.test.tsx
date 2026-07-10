// @vitest-environment jsdom

import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TurnstileWidget } from "../../app/features/community/TurnstileWidget";

type RenderOptions = {
  sitekey: string;
  action: string;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
};

afterEach(() => {
  document.querySelectorAll("script[data-cafe-weather-turnstile]").forEach((node) => node.remove());
  Reflect.deleteProperty(window, "turnstile");
});

function installTurnstile() {
  let options: RenderOptions | undefined;
  const turnstile = {
    render: vi.fn((_element: HTMLElement, supplied: RenderOptions) => {
      options = supplied;
      return "widget-7";
    }),
    reset: vi.fn(),
    remove: vi.fn(),
  };
  Object.assign(window, { turnstile });
  return { options: () => options!, turnstile };
}

describe("TurnstileWidget", () => {
  it("renders explicitly and reports callback, expiry, and error state", async () => {
    const { options, turnstile } = installTurnstile();
    const onTokenChange = vi.fn();
    render(
      <TurnstileWidget
        siteKey="site-key-public"
        action="suggestion"
        resetNonce={0}
        onTokenChange={onTokenChange}
      />,
    );

    await waitFor(() => expect(turnstile.render).toHaveBeenCalledOnce());
    expect(options()).toMatchObject({
      sitekey: "site-key-public",
      action: "suggestion",
    });

    act(() => options().callback("turnstile-token"));
    expect(onTokenChange).toHaveBeenLastCalledWith("turnstile-token");

    act(() => options()["expired-callback"]());
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/verification expired/i)).toBeInTheDocument();

    act(() => options()["error-callback"]());
    expect(onTokenChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/verification is unavailable/i)).toBeInTheDocument();
  });

  it("resets after an attempted submit and removes the widget on unmount", async () => {
    const { turnstile } = installTurnstile();
    const view = render(
      <TurnstileWidget
        siteKey="site-key-public"
        action="suggestion"
        resetNonce={0}
        onTokenChange={vi.fn()}
      />,
    );
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledOnce());

    view.rerender(
      <TurnstileWidget
        siteKey="site-key-public"
        action="suggestion"
        resetNonce={1}
        onTokenChange={vi.fn()}
      />,
    );
    expect(turnstile.reset).toHaveBeenCalledWith("widget-7");

    view.unmount();
    expect(turnstile.remove).toHaveBeenCalledWith("widget-7");
  });

  it("stays absent when local configuration has no public site key", () => {
    const { turnstile } = installTurnstile();
    const { container } = render(
      <TurnstileWidget
        siteKey={null}
        action="suggestion"
        resetNonce={0}
        onTokenChange={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(turnstile.render).not.toHaveBeenCalled();
  });

  it("loads only the official explicit-render script when the API is absent", () => {
    render(
      <TurnstileWidget
        siteKey="site-key-public"
        action="suggestion"
        resetNonce={0}
        onTokenChange={vi.fn()}
      />,
    );

    const script = document.querySelector<HTMLScriptElement>(
      "script[data-cafe-weather-turnstile]",
    );
    expect(script?.src).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    );
    expect(script?.async).toBe(true);
    expect(script?.defer).toBe(true);
  });
});
