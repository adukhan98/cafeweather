// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { useEffect } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { cafes } from "../../app/data/cafes";

vi.mock("../../app/features/map/CafeMap.client", () => ({
  default: ({ onError }: { onError: (message: string) => void }) => {
    useEffect(() => {
      onError("This browser does not provide WebGL.");
    }, [onError]);
    return null;
  },
}));

import { CafeMap } from "../../app/features/map/CafeMap";

const mapCss = readFileSync(
  resolve(process.cwd(), "app/styles/map.css"),
  "utf8",
);

describe("CafeMap fallback", () => {
  it("replaces the skeleton with an inline error and preserves the full index", async () => {
    render(<CafeMap cafes={cafes.slice(0, 3)} />);

    expect(screen.getByText("Loading the Toronto map…").parentElement).toHaveClass(
      "cafe-map__skeleton",
    );
    await waitFor(() =>
      expect(screen.getByText("The map missed the meeting.")).toBeInTheDocument(),
    );

    const map = screen.getByRole("region", { name: "Toronto café map" });
    expect(within(map).getByText("The map missed the meeting.").closest(".cafe-map__error")).toHaveClass(
      "cafe-map__error",
    );
    expect(within(map).getByText(/does not provide WebGL/)).toBeInTheDocument();
    expect(
      within(map).getByRole("list", { name: "Cafés on this map" }).children,
    ).toHaveLength(3);
    expect(within(map).getByRole("link", { name: "OpenFreeMap" })).toBeVisible();
    expect(within(map).getByRole("link", { name: "OpenMapTiles" })).toBeVisible();
    expect(
      within(map).getByRole("link", { name: "OpenStreetMap contributors" }),
    ).toBeVisible();
  });

  it("exposes and updates the selected state of semantic index buttons", async () => {
    const user = userEvent.setup();
    render(<CafeMap cafes={cafes.slice(0, 3)} />);

    const index = screen.getByRole("list", { name: "Cafés on this map" });
    const buttons = within(index).getAllByRole("button");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "false");

    await user.click(buttons[1]);

    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("turns index selection into a visible invitation", async () => {
    const user = userEvent.setup();
    render(<CafeMap cafes={cafes.slice(0, 3)} />);

    const map = screen.getByRole("region", { name: "Toronto café map" });
    const index = within(map).getByRole("list", { name: "Cafés on this map" });

    await user.click(
      within(index).getByRole("button", { name: /show .*Larry's Place/i }),
    );

    expect(
      within(map).getByRole("article", { name: "Selected place" }),
    ).toHaveTextContent("Larry's Place");
    expect(index).toBeVisible();
  });

  it("connects each selector to a polite, atomic selected-place result", () => {
    render(<CafeMap cafes={cafes.slice(0, 3)} />);

    const result = screen.getByRole("article", { name: "Selected place" });
    expect(result).toHaveAttribute("id", "selected-cafe-on-map");
    expect(result).toHaveAttribute("aria-live", "polite");
    expect(result).toHaveAttribute("aria-atomic", "true");
    expect(
      within(result).getByRole("heading", {
        level: 3,
        name: "Selected place: Larry's Place",
      }),
    ).toBeVisible();

    const buttons = within(
      screen.getByRole("list", { name: "Cafés on this map" }),
    ).getAllByRole("button");
    for (const button of buttons) {
      expect(button).toHaveAttribute("aria-controls", "selected-cafe-on-map");
    }
  });

  it("keeps loading and error layers above the interactive canvas", () => {
    expect(mapCss).toMatch(
      /\.cafe-map__canvas\s*\{[^}]*z-index:\s*var\(--z-raised\)/s,
    );
    expect(mapCss).toMatch(
      /\.cafe-map__skeleton,\s*\.cafe-map__error\s*\{[^}]*z-index:\s*var\(--z-dropdown\)/s,
    );
    expect(mapCss).toMatch(
      /\.cafe-map__skeleton\s*\{[^}]*pointer-events:\s*none/s,
    );
    expect(mapCss).toMatch(
      /\.cafe-map__error\s*\{[^}]*pointer-events:\s*auto/s,
    );
  });
});
