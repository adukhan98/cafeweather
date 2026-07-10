// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { cafes } from "../../app/data/cafes";
import { CatalogueService } from "../../app/.server/services/catalogue";
import {
  buildRouletteParams,
  initialRouletteSeed,
  RoulettePage,
} from "../../app/features/roulette/RoulettePage";
import { prepareRouletteData } from "../../app/.server/page-data";
import { parseDiscoveryParams } from "../../app/features/discovery/discovery-params";
import { displayMatchNumber } from "../../app/features/roulette/RouletteDeck";

function renderPage(url: string, cafe = cafes[0]) {
  const search = new URL(url, "https://cafeweather.test").searchParams;
  const state = parseDiscoveryParams(search);
  return render(
    <MemoryRouter initialEntries={[url]}>
      <RoulettePage
        cafe={cafe}
        state={state}
        seed={search.get("seed") ?? initialRouletteSeed(state)}
      />
    </MemoryRouter>,
  );
}

describe("roulette page data", () => {
  const service = new CatalogueService();

  it.each([
    ["mood", "coffee-nerd", "moods"],
    ["neighborhood", "Ossington", "neighborhood"],
    ["offering", "matcha", "offerings"],
  ] as const)("respects the active %s filter", async (key, value, cafeField) => {
    const result = await prepareRouletteData(
      service,
      new URL(`https://cafeweather.test/roulette?${key}=${encodeURIComponent(value)}`),
    );

    expect(result.cafe).not.toBeNull();
    if (cafeField === "neighborhood") {
      expect(result.cafe?.neighborhood).toBe(value);
    } else {
      expect(result.cafe?.[cafeField]).toContain(value);
    }
  });

  it("respects combined search, mood, neighbourhood, and offering filters", async () => {
    const result = await prepareRouletteData(
      service,
      new URL(
        "https://cafeweather.test/roulette?q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over",
      ),
    );

    expect(result.cafe?.slug).toBe("misc-coffee-ossington");
  });

  it("honors a direct practical-attribute filter even when launch data has no matches", async () => {
    const result = await prepareRouletteData(
      service,
      new URL("https://cafeweather.test/roulette?attribute=patio"),
    );

    expect(result.cafe).toBeNull();
    expect(result.state.attributes).toEqual(["patio"]);
  });

  it("is deterministic for an initial SSR request without a random seed", async () => {
    const url = new URL("https://cafeweather.test/roulette?mood=cozy");
    const first = await prepareRouletteData(service, url);
    const second = await prepareRouletteData(service, url);

    expect(first.seed).toBe("meet-me-there:mood=cozy");
    expect(second.seed).toBe(first.seed);
    expect(second.cafe?.id).toBe(first.cafe?.id);
  });

  it("passes previousId so a reroll avoids the immediate repeat", async () => {
    const initial = await prepareRouletteData(
      service,
      new URL("https://cafeweather.test/roulette?mood=cozy&seed=first"),
    );
    const rerolled = await prepareRouletteData(
      service,
      new URL(
        `https://cafeweather.test/roulette?mood=cozy&seed=second&previousId=${initial.cafe?.id}`,
      ),
    );

    expect(rerolled.cafe).not.toBeNull();
    expect(rerolled.cafe?.id).not.toBe(initial.cafe?.id);
  });
});

describe("RoulettePage", () => {
  it("stages a cozy result as an actionable card deck", () => {
    const match = cafes.find((cafe) => cafe.slug === "nabulu-coffee-st-joseph")!;
    const { container } = renderPage("/roulette?mood=cozy&seed=warm-night", match);

    expect(container.querySelector(".roulette-stamp")).toHaveTextContent("COZY");
    expect(screen.getByRole("article", { name: "Roulette result" })).toHaveAttribute(
      "data-motion",
      "deck",
    );
    expect(screen.getByRole("button", { name: "Reroll" })).toBeEnabled();
    expect(screen.getByRole("link", { name: /directions/i })).toHaveAttribute(
      "href",
      match.mapsUrl,
    );
  });

  it("turns stable seeds into pinned, distinct two-digit match numbers", () => {
    expect(displayMatchNumber("warm-night")).toBe("76");
    expect(displayMatchNumber("meet-me-there:mood=cozy")).toBe("04");
    expect(displayMatchNumber("meet-me-there:all")).toBe("77");
    expect(displayMatchNumber("warm-night")).toBe(displayMatchNumber("warm-night"));
  });

  it("renders one deliberate result with reason, branch, detail, and directions", () => {
    const match = cafes.find((cafe) => cafe.slug === "misc-coffee-ossington")!;
    renderPage("/roulette?mood=coffee-nerd", match);

    expect(screen.getByRole("heading", { level: 1, name: "Your café is Misc Coffee." })).toBeInTheDocument();
    expect(screen.getByText("Ossington")).toBeInTheDocument();
    expect(screen.getByText(match.recommendation)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Meet me there" })).toHaveAttribute(
      "href",
      `/cafes/${match.slug}`,
    );
    expect(screen.getByRole("link", { name: /directions to Misc Coffee/i })).toHaveAttribute(
      "href",
      match.mapsUrl,
    );
  });

  it("stacks the result label with its heading instead of hanging it beside the heading", () => {
    const match = cafes.find((cafe) => cafe.slug === "misc-coffee-ossington")!;
    renderPage("/roulette?mood=coffee-nerd", match);

    expect(screen.getByText(/Tonight · match \d{2}/).parentElement).toBe(
      screen.getByRole("heading", { level: 2, name: match.name }).parentElement,
    );
  });

  it("stacks the roulette eyebrow with its page heading", () => {
    renderPage("/roulette?mood=coffee-nerd");

    const stack = screen.getByText(
      "Café roulette · one warm introduction",
    ).parentElement;
    expect(stack).toBe(screen.getByRole("heading", { level: 1 }).parentElement);
    expect(stack).toHaveClass("roulette-page__headline");
  });

  it("lists active filters and links to the shared catalogue semantics", () => {
    renderPage("/roulette?q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over");

    expect(screen.getByRole("region", { name: "Roulette filters" })).toHaveTextContent(
      "SEARCH: MISC",
    );
    expect(screen.getByRole("region", { name: "Roulette filters" })).toHaveTextContent(
      "COFFEE NERD",
    );
    expect(screen.getByRole("link", { name: "Change active filters" })).toHaveAttribute(
      "href",
      "/cafes?q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over",
    );
  });

  it("preserves every active filter when building a reroll URL", () => {
    const state = parseDiscoveryParams(
      new URLSearchParams(
        "q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over&attribute=patio",
      ),
    );

    expect(buildRouletteParams(state, "fresh-seed", "misc-coffee-ossington").toString()).toBe(
      "q=Misc&mood=coffee-nerd&neighborhood=Ossington&offering=pour-over&attribute=patio&seed=fresh-seed&previousId=misc-coffee-ossington",
    );
  });

  it("keeps the reroll control focused, announces the result, and blocks repeat clicks", async () => {
    const uuid = vi
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue("00000000-0000-4000-8000-000000000001");
    renderPage("/roulette?mood=cozy", cafes.find((cafe) => cafe.slug === "nabulu-coffee-st-joseph")!);

    const reroll = screen.getByRole("button", { name: "Reroll" });
    reroll.focus();
    fireEvent.click(reroll);
    fireEvent.click(reroll);

    expect(reroll).toHaveFocus();
    expect(reroll).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Choosing another café.");
    expect(uuid).toHaveBeenCalledTimes(1);
    uuid.mockRestore();
  });

  it("restarts only the visual reveal while preserving the reroll control node", () => {
    const state = parseDiscoveryParams(new URLSearchParams("mood=cozy"));
    const firstCafe = cafes.find((cafe) => cafe.slug === "nabulu-coffee-st-joseph")!;
    const secondCafe = cafes.find((cafe) => cafe.slug === "rooms-coffee-ossington")!;
    const { container, rerender } = render(
      <MemoryRouter>
        <RoulettePage cafe={firstCafe} state={state} seed="first" />
      </MemoryRouter>,
    );
    const control = screen.getByRole("button", { name: "Reroll" });
    control.focus();
    const firstReveal = container.querySelector(".roulette-result");

    rerender(
      <MemoryRouter>
        <RoulettePage cafe={secondCafe} state={state} seed="second" />
      </MemoryRouter>,
    );

    expect(container.querySelector(".roulette-result")).not.toBe(firstReveal);
    expect(screen.getByRole("button", { name: "Reroll" })).toBe(control);
    expect(control).toHaveFocus();
  });

  it("offers clear and browse recovery when no café matches", () => {
    renderPage("/roulette?q=does-not-exist", null);

    expect(screen.getByRole("heading", { name: "No café fits those filters yet." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear filters and try again" })).toHaveAttribute(
      "href",
      "/roulette",
    );
    expect(screen.getByRole("link", { name: "Browse with these filters" })).toHaveAttribute(
      "href",
      "/cafes?q=does-not-exist",
    );
  });

  it("discloses the verified snapshot fallback", () => {
    const search = new URL("https://cafeweather.test/roulette").searchParams;
    const state = parseDiscoveryParams(search);
    render(
      <MemoryRouter>
        <RoulettePage
          cafe={cafes[0]}
          state={state}
          seed={initialRouletteSeed(state)}
          source="seed"
        />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText("Catalogue status")).toHaveTextContent(
      "Verified snapshot in use.",
    );
  });
});
