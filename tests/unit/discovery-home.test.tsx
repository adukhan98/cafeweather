// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { MemoryRouter, useLocation } from "react-router";
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
      <LocationProbe />
    </MemoryRouter>,
  );
}

function LocationProbe() {
  const location = useLocation();
  return <div aria-label="Current URL">{location.pathname + location.search}</div>;
}

describe("DiscoveryHome", () => {
  it("renders the agreed editorial discovery surfaces", () => {
    const { container } = renderHome();

    expect(container.querySelectorAll(".discovery-home > .scene")).toHaveLength(7);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Where are we meeting?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "What does today need?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "What does today need?" })).toBeInTheDocument();
    for (const name of [
      "A few places we could go",
      "Leave it to chance.",
      "Places people keep mentioning",
      "Meet somewhere nearby.",
      "Know a place?",
    ]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
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

  it("models matcha as an offering and links to real matches", async () => {
    const user = userEvent.setup();
    renderHome();

    await user.click(screen.getByRole("radio", { name: "Matcha and pastries" }));

    const browse = screen.getByRole("link", { name: /browse .* matcha and pastries/i });
    const roulette = screen.getByRole("link", { name: /roulette .* matcha and pastries/i });
    expect(browse).toHaveAttribute("href", "/cafes?offering=matcha");
    expect(roulette).toHaveAttribute("href", "/roulette?offering=matcha");
    expect(browse).not.toHaveAccessibleName(/browse 0 cafés/i);
  });

  it("submits the compact search to the catalogue from the keyboard", async () => {
    const user = userEvent.setup();
    renderHome();

    const search = screen.getByRole("searchbox", { name: "What kind of place?" });
    await user.type(search, "Misc Coffee{Enter}");

    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "/cafes?q=Misc+Coffee",
    );
  });

  it("keeps a semantic café index available alongside the map", () => {
    renderHome();

    const map = screen.getByRole("region", { name: "Toronto café map" });
    const index = within(map).getByRole("list", { name: "Cafés on this map" });
    expect(within(index).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(index).getByRole("link", { name: "View Larry's Place" })).toHaveAttribute(
      "href",
      "/cafes/larrys-place-parkdale",
    );
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
