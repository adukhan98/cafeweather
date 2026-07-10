// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import NotFound from "../../app/routes/not-found";
import Privacy from "../../app/routes/privacy";
import Terms from "../../app/routes/terms";

describe("legal and recovery routes", () => {
  it("explains privacy in plain language", () => {
    render(<Privacy />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Privacy, in plain language." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/signed anonymous visitor cookie/i)).toBeInTheDocument();
  });

  it("sets expectations for guide information", () => {
    render(<Terms />);

    expect(
      screen.getByRole("heading", { level: 1, name: "A guide, not a guarantee." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/verify hours and accessibility directly/i),
    ).toBeInTheDocument();
  });

  it("offers useful recovery paths", () => {
    render(<NotFound />);

    expect(screen.getByRole("link", { name: "Browse every place" })).toHaveAttribute(
      "href",
      "/cafes",
    );
    expect(screen.getByRole("link", { name: "Open the map" })).toHaveAttribute(
      "href",
      "/cafes?view=map",
    );
    expect(screen.getByRole("link", { name: "Try roulette" })).toHaveAttribute(
      "href",
      "/roulette",
    );
  });
});
