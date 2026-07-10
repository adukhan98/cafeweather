// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../app/features/map/CafeMap.client", () => ({
  default: () => null,
}));

import { cafes } from "../../app/data/cafes";
import { DiscoveryHome } from "../../app/features/discovery/DiscoveryHome";

function renderHome() {
  return render(
    <MemoryRouter>
      <DiscoveryHome cafes={cafes} />
    </MemoryRouter>,
  );
}

describe("DiscoveryHome", () => {
  it("renders the agreed editorial discovery surfaces", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Toronto cafés for the mood you’re in.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "What kind of café fits today?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "For a quiet afternoon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Worth crossing the city for" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "By neighbourhood" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Toronto café map" })).toBeInTheDocument();
  });

  it("uses a mood choice to scope browse and roulette links", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("radio", { name: "Serious coffee" }));

    const browse = screen.getByRole("link", { name: /browse .* serious coffee/i });
    const roulette = screen.getByRole("link", { name: /roulette .* serious coffee/i });
    expect(browse).toHaveAttribute("href", "/cafes?mood=coffee-nerd");
    expect(roulette).toHaveAttribute("href", "/roulette?mood=coffee-nerd");
  });

  it("keeps a semantic café index available alongside the map", () => {
    renderHome();

    const map = screen.getByRole("region", { name: "Toronto café map" });
    const index = within(map).getByRole("list", { name: "Cafés on this map" });
    expect(within(index).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(index).getAllByRole("link", { name: /directions/i })[0]).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { container } = renderHome();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });

    expect(results.violations).toEqual([]);
  });
});
