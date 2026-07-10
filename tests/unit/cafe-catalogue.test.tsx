// @vitest-environment jsdom

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation, useNavigate } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { cafes } from "../../app/data/cafes";
import { CafeCatalogue } from "../../app/features/discovery/CafeCatalogue";

function LocationProbe() {
  const location = useLocation();
  return <div aria-label="Current URL">{location.pathname + location.search}</div>;
}

function HistoryControls() {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>History back</button>
      <button type="button" onClick={() => navigate(1)}>History forward</button>
    </>
  );
}

function renderCatalogue(initialEntry = "/cafes") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <CafeCatalogue cafes={cafes} />
      <LocationProbe />
      <HistoryControls />
    </MemoryRouter>,
  );
}

describe("CafeCatalogue", () => {
  it("turns an empty result into a filter-by-filter invitation to recover", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=nowhere&mood=coffee-nerd");

    expect(
      screen.getByRole("heading", { name: "Nothing fits all of that." }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove Search: nowhere" }));
    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "/cafes?mood=coffee-nerd",
    );

    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "nowhere");
    expect(
      await screen.findByRole("button", { name: "Reset the whole plan" }),
    ).toBeInTheDocument();
  });
  it("opens with the invitation-led browse heading", () => {
    renderCatalogue();
    expect(
      screen.getByRole("heading", { level: 1, name: "Find somewhere that fits." }),
    ).toBeInTheDocument();
  });

  it("hydrates combined filters from the URL and reports the exact result count", () => {
    renderCatalogue(
      "/cafes?q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over",
    );

    expect(document.querySelector(".catalogue-count")).toHaveTextContent("1 café");
    expect(screen.getByRole("heading", { name: "Misc Coffee" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "The Brick Room" })).not.toBeInTheDocument();
  });

  it("reports facet availability in the context of other active filters", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=Misc&mood=coffee-nerd");

    await user.click(screen.getByLabelText("Moods filters"));
    expect(
      screen.getByRole("button", { name: "Remove Coffee nerd filter, 1 place" }),
    ).toBeInTheDocument();
  });

  it("renders one list and one map surface for responsive CSS composition", () => {
    renderCatalogue("/cafes?view=map");
    const results = screen.getByRole("list", { name: "Café results" });
    const map = screen.getByRole("region", { name: "Toronto café map" });
    expect(results.closest(".catalogue-results")).toHaveAttribute("data-mode", "map");
    expect(map.closest(".catalogue-results")).toBe(results.closest(".catalogue-results"));
  });

  it("synchronizes search and facet choices to a clean URL", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.type(screen.getByRole("searchbox", { name: "Search cafés" }), "Bloom");
    await user.click(screen.getByLabelText("Moods filters"));
    await user.click(screen.getByRole("button", { name: /Add Study friendly filter/ }));

    const url = screen.getByLabelText("Current URL");
    await waitFor(() => expect(url).toHaveTextContent("q=Bloom"));
    expect(url).toHaveTextContent("mood=study-friendly");
    expect(document.querySelector(".catalogue-count")).toHaveTextContent("1 café");
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

  it("preserves search when a facet commits before the search timer", () => {
    vi.useFakeTimers();
    try {
      renderCatalogue();
      fireEvent.change(screen.getByRole("searchbox", { name: "Search cafés" }), {
        target: { value: "Bloom" },
      });
      fireEvent.click(screen.getByLabelText("Moods filters"));
      fireEvent.click(screen.getByRole("button", { name: /Add Study friendly filter/ }));

      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?q=Bloom&mood=study-friendly",
      );
      act(() => vi.advanceTimersByTime(250));
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?q=Bloom&mood=study-friendly",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("preserves search when the search timer commits before a facet", () => {
    vi.useFakeTimers();
    try {
      renderCatalogue();
      fireEvent.change(screen.getByRole("searchbox", { name: "Search cafés" }), {
        target: { value: "Bloom" },
      });
      act(() => vi.advanceTimersByTime(250));
      expect(screen.getByLabelText("Current URL")).toHaveTextContent("/cafes?q=Bloom");

      fireEvent.click(screen.getByLabelText("Moods filters"));
      fireEvent.click(screen.getByRole("button", { name: /Add Study friendly filter/ }));
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?q=Bloom&mood=study-friendly",
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("applies OR within a facet and AND across facets", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.click(screen.getByLabelText("Neighbourhoods filters"));
    await user.click(screen.getByRole("button", { name: /Add Ossington filter/ }));
    await user.click(screen.getByRole("button", { name: /Add Financial District filter/ }));
    await user.click(screen.getByLabelText("Offerings filters"));
    await user.click(screen.getByRole("button", { name: /Add Pour over filter/ }));

    const results = screen.getByRole("list", { name: "Café results" });
    expect(within(results).getByRole("heading", { name: "Misc Coffee" })).toBeInTheDocument();
    expect(within(results).getByRole("heading", { name: "The Brick Room" })).toBeInTheDocument();
    expect(document.querySelector(".catalogue-count")).toHaveTextContent("2 cafés");
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

  it("pushes deliberate filter and view changes so history restores combinations", async () => {
    const user = userEvent.setup();
    renderCatalogue();

    await user.click(screen.getByLabelText("Moods filters"));
    await user.click(screen.getByRole("button", { name: /Add Coffee nerd filter/ }));
    await user.click(screen.getByRole("radio", { name: "Map view" }));
    expect(screen.getByLabelText("Current URL")).toHaveTextContent(
      "/cafes?mood=coffee-nerd&view=map",
    );

    await user.click(screen.getByRole("button", { name: "History back" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?mood=coffee-nerd",
      ),
    );
    expect(screen.getByRole("radio", { name: "List view" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "History back" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Current URL")).toHaveTextContent("/cafes"),
    );

    await user.click(screen.getByRole("button", { name: "History forward" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Current URL")).toHaveTextContent(
        "/cafes?mood=coffee-nerd",
      ),
    );
  });

  it("shows active filters and clears one without dropping the others", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=Misc&mood=coffee-nerd");

    const summary = screen.getByRole("region", { name: "Active filters" });
    expect(within(summary).getByText("Search: Misc")).toBeInTheDocument();
    expect(within(summary).getByText("Coffee nerd")).toBeInTheDocument();

    await user.click(
      within(summary).getByRole("button", { name: "Clear mood filter Coffee nerd" }),
    );
    expect(screen.getByLabelText("Current URL")).toHaveTextContent("/cafes?q=Misc");
    expect(within(summary).getByText("Search: Misc")).toBeInTheDocument();
  });

  it("explains why practical attribute filters are not shown", () => {
    renderCatalogue();
    expect(
      screen.getByText(
        "Practical filters aren’t shown yet because the verified records don’t contain them.",
      ),
    ).toBeInTheDocument();
  });

  it("resets every active filter and restores the full catalogue", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=does-not-exist&mood=late-night&view=map");

    await user.click(screen.getByRole("button", { name: "Reset the whole plan" }));

    expect(screen.getByLabelText("Current URL")).toHaveTextContent("/cafes");
    expect(document.querySelector(".catalogue-count")).toHaveTextContent(
      `${cafes.length} cafés`,
    );
    expect(screen.getByRole("searchbox", { name: "Search cafés" })).toHaveValue("");
    expect(screen.getByRole("radio", { name: "List view" })).toBeChecked();
  });

  it("offers a focused recovery action when no cafés match", async () => {
    const user = userEvent.setup();
    renderCatalogue("/cafes?q=does-not-exist");

    expect(screen.getByRole("heading", { name: "Nothing fits all of that." })).toBeInTheDocument();
    expect(
      screen.getByText("Pull one note off the plan, or start again with the whole city."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset the whole plan" }));
    expect(document.querySelector(".catalogue-count")).toHaveTextContent(
      `${cafes.length} cafés`,
    );
  });
});
