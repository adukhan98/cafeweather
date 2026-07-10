// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ReactionCoaster } from "../../app/features/community/ReactionCoaster";

describe("ReactionCoaster", () => {
  it("exposes its active loading state and pluralized count", () => {
    render(
      <ReactionCoaster
        kind="cozy"
        label="Cozy"
        count={8}
        active
        pending
        onToggle={vi.fn()}
      />,
    );

    const coaster = screen.getByRole("button", { name: "Cozy, 8 reactions" });
    expect(coaster).toHaveAttribute("aria-pressed", "true");
    expect(coaster).toHaveAttribute("data-state", "loading");
    expect(coaster).toBeDisabled();
  });

  it("uses singular copy and requests the opposite active state", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <ReactionCoaster
        kind="quiet"
        label="Quiet"
        count={1}
        active={false}
        pending={false}
        onToggle={onToggle}
      />,
    );

    const coaster = screen.getByRole("button", { name: "Quiet, 1 reaction" });
    expect(coaster).toHaveAttribute("data-state", "idle");
    await user.click(coaster);
    expect(onToggle).toHaveBeenCalledWith("quiet", true);
  });

  it("requests deactivation from an active coaster", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(
      <ReactionCoaster
        kind="great-coffee"
        label="Great coffee"
        count={3}
        active
        pending={false}
        onToggle={onToggle}
      />,
    );

    const coaster = screen.getByRole("button", { name: "Great coffee, 3 reactions" });
    expect(coaster).toHaveAttribute("data-state", "active");
    await user.click(coaster);
    expect(onToggle).toHaveBeenCalledWith("great-coffee", false);
  });
});
