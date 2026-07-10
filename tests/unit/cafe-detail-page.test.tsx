// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { cafes } from "../../app/data/cafes";
import {
  CafeDetailNotFound,
  CafeDetailPage,
} from "../../app/features/cafes/CafeDetailPage";

function cafe(slug: string) {
  const match = cafes.find((entry) => entry.slug === slug);
  if (!match) throw new Error(`Missing test café: ${slug}`);
  return match;
}

describe("CafeDetailPage", () => {
  it("renders the exact branch, address, recommendation, links, and verified date", () => {
    const larrys = cafe("larrys-place-parkdale");
    render(<CafeDetailPage cafe={larrys} />);

    expect(screen.getByRole("heading", { level: 1, name: "Larry's Place" })).toBeInTheDocument();
    expect(screen.getByText("Parkdale", { selector: ".cafe-detail__branch" })).toBeInTheDocument();
    expect(screen.getByText("1390 Queen St W, Toronto, ON")).toBeInTheDocument();
    expect(screen.getByText(larrys.recommendation)).toBeInTheDocument();
    expect(screen.getByText("July 9, 2026")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /directions to Larry's Place, Parkdale/i })).toHaveAttribute(
      "href",
      larrys.mapsUrl,
    );
    expect(screen.getByRole("link", { name: /view verification source/i })).toHaveAttribute(
      "href",
      larrys.sourceUrl,
    );
  });

  it("states that an explicitly sourced branch was verified as the exact branch", () => {
    render(<CafeDetailPage cafe={cafe("misc-coffee-ossington")} />);

    expect(
      screen.getByText(/the source and address support this exact branch/i),
    ).toBeInTheDocument();
  });

  it("does not overstate a branch-unspecified source", () => {
    render(<CafeDetailPage cafe={cafe("bloom-cafe-wellesley")} />);

    expect(
      screen.getByText(
        /the source supports Bloom Cafe in Toronto, but it did not name this exact Wellesley branch/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/supports this exact branch/i)).not.toBeInTheDocument();
  });

  it("shows moods and offerings without inventing unsupported venue claims", () => {
    render(<CafeDetailPage cafe={cafe("bloom-cafe-wellesley")} />);

    const moods = screen.getByRole("list", { name: "Café moods" });
    const offerings = screen.getByRole("list", { name: "Café offerings" });
    expect(within(moods).getByText("Study friendly")).toBeInTheDocument();
    expect(within(offerings).getByText("Japanese desserts")).toBeInTheDocument();
    expect(screen.queryByText(/open now|rating|wi-fi|price range/i)).not.toBeInTheDocument();
  });

  it("reserves a stable accessible boundary for community reactions", () => {
    const { container } = render(<CafeDetailPage cafe={cafe("larrys-place-parkdale")} />);
    const boundary = container.querySelector("[data-reaction-slot]");

    expect(boundary).toHaveAttribute("id", "community-reactions");
    expect(boundary).toHaveAttribute("aria-labelledby", "community-reactions-title");
  });
});

describe("CafeDetailNotFound", () => {
  it("renders a branded recovery path for an unknown café", () => {
    render(<CafeDetailNotFound />);

    expect(screen.getByRole("heading", { name: "That café isn’t in the guide." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse every café" })).toHaveAttribute("href", "/cafes");
    expect(screen.getByRole("link", { name: "Try café roulette" })).toHaveAttribute("href", "/roulette");
  });
});
