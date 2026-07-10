// @vitest-environment jsdom

import { useEffect } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
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

describe("CafeMap fallback", () => {
  it("replaces the skeleton with an inline error and preserves the full index", async () => {
    render(<CafeMap cafes={cafes.slice(0, 3)} />);

    expect(screen.getByText("Loading the Toronto map…")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("Interactive map unavailable.")).toBeInTheDocument(),
    );

    const map = screen.getByRole("region", { name: "Toronto café map" });
    expect(within(map).getByText(/does not provide WebGL/)).toBeInTheDocument();
    expect(
      within(map).getByRole("list", { name: "Cafés on this map" }).children,
    ).toHaveLength(3);
  });
});
