// @vitest-environment jsdom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cafes } from "../../app/data/cafes";

const fitBounds = vi.fn();
let mapContainer: HTMLElement | null = null;

vi.mock("maplibre-gl", () => {
  class FakeMap {
    constructor({ container }: { container: HTMLElement }) {
      mapContainer = container;
    }
    addControl() {}
    once(event: string, callback: () => void) {
      if (event === "load") queueMicrotask(callback);
    }
    fitBounds = fitBounds;
    remove() {}
  }

  class FakeMarker {
    constructor(private options: { element: HTMLElement }) {}
    setLngLat() { return this; }
    addTo() {
      mapContainer?.append(this.options.element);
      return this;
    }
    remove() { this.options.element.remove(); }
  }

  class FakeBounds {
    extend() { return this; }
  }

  return {
    default: {
      Map: FakeMap,
      Marker: FakeMarker,
      LngLatBounds: FakeBounds,
      NavigationControl: class {},
      AttributionControl: class {},
    },
  };
});

import CafeMapCanvas from "../../app/features/map/CafeMap.client";

describe("CafeMapCanvas marker lifecycle", () => {
  beforeEach(() => {
    fitBounds.mockClear();
    mapContainer = null;
  });

  it("retains marker identity and focus when selection changes", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { rerender } = render(
      <CafeMapCanvas
        cafes={cafes.slice(0, 2)}
        selectedId={cafes[0].id}
        onSelect={onSelect}
        onReady={() => undefined}
        onError={() => undefined}
      />,
    );

    const first = await screen.findByRole("button", { name: /show Larry's Place/i });
    const second = screen.getByRole("button", { name: /show Teamendous/i });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");
    second.focus();

    rerender(
      <CafeMapCanvas
        cafes={cafes.slice(0, 2)}
        selectedId={cafes[1].id}
        onSelect={onSelect}
        onReady={() => undefined}
        onError={() => undefined}
      />,
    );

    await waitFor(() => expect(second).toHaveAttribute("aria-pressed", "true"));
    expect(second).toHaveAttribute("data-selected", "true");
    expect(first).toHaveAttribute("data-selected", "false");
    expect(screen.getByRole("button", { name: /show Teamendous/i })).toBe(second);
    expect(second).toHaveFocus();
    expect(fitBounds).toHaveBeenCalledTimes(1);

    await user.click(first);
    expect(onSelect).toHaveBeenCalledWith(cafes[0].id);
  });
});
