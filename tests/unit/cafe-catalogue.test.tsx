// @vitest-environment jsdom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it } from "vitest";

import { cafes } from "../../app/data/cafes";
import { CafeCatalogue } from "../../app/features/discovery/CafeCatalogue";

function LocationProbe() {
  const location = useLocation();
  return <div aria-label="Current URL">{location.pathname + location.search}</div>;
}

function renderCatalogue(initialEntry = "/cafes") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CafeCatalogue cafes={cafes} />
      <LocationProbe />
    </MemoryRouter>,
  );
}

describe("CafeCatalogue", () => {
  it("hydrates combined filters from the URL and reports the exact result count", () => {
    renderCatalogue(
      "/cafes?q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over",
    );

    expect(screen.getByRole("status")).toHaveTextContent("1 café");
    expect(screen.getByRole("heading", { name: "Misc Coffee" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The Brick Room" })).not.toBeInTheDocument();
  });

  it("synchronizes search and facet choices to a clean URL", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "Bloom");
    await user.click(screen.getByLabelText("Moods filters"));
    await user.click(screen.getByRole("checkbox", { name: "Study friendly" }));

    const url = screen.getByLabelText("Current URL");
    await waitFor(() => expect(url).toHaveTextContent("q=Bloom"));
    expect(url).toHaveTextContent("mood=study-friendly");
    expect(screen.getByRole("status")).toHaveTextContent("1 café");
  });

  it("does not drop characters during rapid URL-backed search updates", async () => {
    const user = userEvent.setup({ delay: null });
    renderCatalogue();

    await user.type(
      screen.getByRole("searchbox", { name: "Search cafés" }),
      "does-not-exist",
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?q=does-not-exist",
      ),
    );
    expect(screen.getByRole("searchbox", { name: "Search cafés" })).toHaveValue(
      "does-not-exist",
    );
  });

  it("applies OR within a facet and AND across facets", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.click(screen.getByLabelText("Neighbourhoods filters"));
    await user.click(screen.getByRole("checkbox", { name: "Ossington" }));
    await user.click(screen.getByRole("checkbox", { name: "Financial District" }));
    await user.click(screen.getByLabelText("Offerings filters"));
    await user.click(screen.getByRole("checkbox", { name: "Pour over" }));

    const results = screen.getByRole("list", { name: "Café results" });
    expect(within(results).getByRole("heading", { name: "Misc Coffee" })).toBeInTheDocument();
    expect(within(results).getByRole("heading", { name: "The Brick Room" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("2 cafés");
  });

  it("switches between list and map without losing active filters", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?mood=coffee-nerd");

    await user.click(screen.getByRole("radio", { name: "Map view" }));

    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "/cafes?mood=coffee-nerd&view=map",
    );
    expect(screen.getByRole("region", { name: "Toronto café map" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Toronto café map" })).getByRole("list", {
        name: "Cafés on this map",
      }),
    ).toBeInTheDocument();
  });

  it("resets every active filter and restores the full catalogue", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=does-not-exist&mood=late-night&view=map");

    await user.click(screen.getByRole("button", { name: "Reset all filters" }));

    expect(screen.getByLabelText("Current URL")).toHaveTextContent("/cafes");
    expect(screen.getByRole("status")).toHaveTextContent(`${cafes.length} cafés`);
    expect(screen.getByRole("searchbox", { name: "Search cafés" })).toHaveValue("");
    expect(screen.getByRole("radio", { name: "List view" })).toBeChecked();
  });

  it("offers a focused recovery action when no cafés match", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=does-not-exist");

    expect(screen.getByRole("heading", { name: "No cafés match those filters." })).toBeInTheDocument();
    expect(
      screen.getByText("Try a broader search, remove a filter, or return to the full Toronto list."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show all cafés" }));
    expect(screen.getByRole("status")).toHaveTextContent(`${cafes.length} cafés`);
  });
});
