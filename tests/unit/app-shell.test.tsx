// @vitest-environment jsdom

import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../app/components/AppShell";

function renderShell(pathname = "/roulette") {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppShell>
        <h1>Shell test content</h1>
      </AppShell>
    </MemoryRouter>,
  );
}

describe("AppShell", () => {
  it("publishes the warm guide identity and current destination", () => {
    renderShell();

    expect(
      screen.getAllByRole("link", { name: "Meet Me There home" })[0],
    ).toBeVisible();
    const primary = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primary).getByRole("link", { name: "Roulette" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByText("Toronto · 36 places")).toBeVisible();
  });

  it("moves focus to main content when the skip link is activated", async () => {
    const user = userEvent.setup();
    renderShell();

    const skipLink = screen.getByRole("link", { name: "Skip to content" });
    const main = screen.getByRole("main");
    expect(skipLink).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(main).toHaveAttribute("id", "main-content");

    await user.click(skipLink);
    expect(main).toHaveFocus();
  });

  it("renders every desktop destination in the primary navigation", () => {
    renderShell();

    const primary = screen.getByRole("navigation", { name: "Primary" });
    for (const destination of ["Browse", "Map", "Roulette", "Suggest"]) {
      expect(primary).toHaveTextContent(destination);
    }
  });

  it("distinguishes the browse index from its map view", () => {
    const { unmount } = renderShell("/cafes");
    let primary = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primary).getByRole("link", { name: "Browse" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(primary).getByRole("link", { name: "Map" })).not.toHaveAttribute(
      "aria-current",
    );

    unmount();
    renderShell("/cafes?view=map");
    primary = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primary).getByRole("link", { name: "Map" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(primary).getByRole("link", { name: "Browse" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("discloses the mobile menu and restores focus when it closes", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile" });
    expect(mobileNavigation).toBeVisible();
    expect(mobileNavigation).toHaveAttribute("data-state", "open");

    expect(within(mobileNavigation).getByRole("link", { name: "Browse" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("dismisses the mobile menu on an outside pointer press", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    await user.click(toggle);
    fireEvent.pointerDown(screen.getByRole("main"));

    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
    expect(toggle).toHaveFocus();
  });

  it("closes mobile navigation and moves focus to main after link activation", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    await user.click(toggle);
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile" });
    await user.click(within(mobileNavigation).getByRole("link", { name: "Browse" }));

    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "false"));
    expect(screen.getByRole("main")).toHaveFocus();
    expect(mobileNavigation).not.toBeVisible();
  });

  it("states the editorial source and verification date in the footer", () => {
    renderShell();

    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveTextContent("Source: Toronto café source thread");
    expect(footer).toHaveTextContent("Last verified July 2026");
  });

  it("renders safely on the server", () => {
    expect(() =>
      renderToString(
        <MemoryRouter>
          <AppShell>
            <p>Server content</p>
          </AppShell>
        </MemoryRouter>,
      ),
    ).not.toThrow();
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = renderShell();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
