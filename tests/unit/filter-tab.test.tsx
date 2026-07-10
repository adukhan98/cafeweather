// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { FilterTab } from "../../app/features/discovery/FilterTab";

it("announces and removes a selected filter", async () => {
  const onRemove = vi.fn();
  render(
    <FilterTab label="Quiet work" count={4} selected onRemove={onRemove} />,
  );

  const tab = screen.getByRole("button", {
    name: "Remove Quiet work filter, 4 places",
  });
  expect(tab).toHaveAttribute("data-state", "selected");
  expect(tab).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(tab);
  expect(onRemove).toHaveBeenCalledOnce();
});

it("adds an idle filter and uses singular place copy", async () => {
  const onSelect = vi.fn();
  render(<FilterTab label="Patio" count={1} selected={false} onSelect={onSelect} />);

  const tab = screen.getByRole("button", {
    name: "Add Patio filter, 1 place",
  });
  expect(tab).toHaveAttribute("data-state", "idle");
  await userEvent.click(tab);
  expect(onSelect).toHaveBeenCalledOnce();
});
