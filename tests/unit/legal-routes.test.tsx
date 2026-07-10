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
    expect(
      screen.getByText(/visitor identity is hashed using a secret held only on the server/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/reactions and café suggestions are stored/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/cloudflare turnstile/i)).toBeInTheDocument();
    expect(screen.getByText(/no user accounts or profiles/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Meet Me There on GitHub" }),
    ).toHaveAttribute("href", "https://github.com/adukhan98/cafeweather");
  });

  it("sets expectations for guide information", () => {
    render(<Terms />);

    expect(
      screen.getByRole("heading", { level: 1, name: "A guide, not a guarantee." }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/listings are editorial and verified branch by branch/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /cannot guarantee real-time hours, accessibility, pricing, menus, or availability/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/verify hours and accessibility directly with the venue/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/directions open in external services/i)).toBeInTheDocument();
    expect(
      screen.getByText(/community suggestions are moderated before they appear/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /use the guide respectfully.*abusive, misleading, or unlawful material.*disrupt the service/is,
      ),
    ).toBeInTheDocument();
  });

  it("offers useful recovery paths", () => {
    render(<NotFound />);

    expect(screen.getByText("We lost the note, not the whole city.")).toBeInTheDocument();
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
