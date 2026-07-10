// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "../../app/components/AppShell";

function renderShell() {
  return render(
    <AppShell>
      <h1>Shell test content</h1>
    </AppShell>,
  );
}

describe("AppShell", () => {
  it("orders the masthead as top row, rule, metadata, then mobile disclosure", () => {
    const { container } = renderShell();
    const masthead = container.querySelector(".masthead");
    const topRow = container.querySelector(".masthead__top-row");
    const rule = container.querySelector(".masthead__rule");
    const metadata = screen.getByLabelText("Guide location");
    const mobileNavigation = container.querySelector(".masthead__mobile-nav");

    expect(masthead).not.toBeNull();
    expect(topRow).not.toBeNull();
    expect(topRow).toContainElement(screen.getByRole("link", { name: "Café Weather home" }));
    expect(topRow).toContainElement(screen.getByRole("navigation", { name: "Primary" }));
    expect(Array.from(masthead!.children)).toEqual([
      topRow,
      rule,
      metadata,
      mobileNavigation,
    ]);
  });

  it("offers a skip link to the main content", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute(
      "href",
      "#main-content",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });

  it("renders every desktop destination in the primary navigation", () => {
    renderShell();

    const primary = screen.getByRole("navigation", { name: "Primary" });
    for (const destination of ["Browse", "Map", "Roulette", "Suggest"]) {
      expect(primary).toHaveTextContent(destination);
    }
  });

  it("discloses the mobile menu and restores focus when it closes", async () => {
    const user = userEvent.setup();
    renderShell();
    const toggle = screen.getByRole("button", { name: "Open menu" });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const mobileNavigation = screen.getByRole("navigation", { name: "Mobile" });
    expect(mobileNavigation).toBeVisible();

    expect(within(mobileNavigation).getByRole("link", { name: "Browse" })).toHaveFocus();
    await user.keyboard("{Escape}");

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
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
        <AppShell>
          <p>Server content</p>
        </AppShell>,
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
