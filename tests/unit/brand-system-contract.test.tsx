// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandLockup } from "../../app/features/brand/BrandLockup";
import {
  CupRing,
  LocationStamp,
  RouteLine,
} from "../../app/features/brand/GraphicMarks";
import { InvitationNote } from "../../app/features/brand/InvitationNote";
import { MotionReveal } from "../../app/features/brand/MotionReveal";
import { PlaceInvitation } from "../../app/features/brand/PlaceInvitation";
import { Scene } from "../../app/features/brand/Scene";
import type { Cafe } from "../../app/contracts/cafes";
import { readStyleSource } from "../helpers/style-source";

describe("Meet Me There brand primitives", () => {
  it("renders semantic brand materials without baking in route logic", () => {
    render(
      <Scene as="section" tone="terracotta" label="Invitation scene">
        <BrandLockup descriptor />
        <InvitationNote as="article" tilt="left">
          Church Street at five.
        </InvitationNote>
      </Scene>,
    );

    expect(screen.getByLabelText("Invitation scene")).toHaveAttribute(
      "data-tone",
      "terracotta",
    );
    expect(screen.getByRole("link", { name: "Meet Me There home" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.getByText("A Toronto café guide")).toBeVisible();
    expect(screen.getByRole("article")).toHaveAttribute("data-tilt", "left");
  });

  it("hides decorative marks and exposes informative stamps", () => {
    const { container } = render(
      <>
        <CupRing />
        <RouteLine />
        <LocationStamp label="Church–Wellesley" />
      </>,
    );

    expect(container.querySelector(".cup-ring")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(container.querySelector(".route-line")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText("Church–Wellesley")).toBeVisible();
  });

  it("keeps server-rendered reveal content visible by default", () => {
    render(<MotionReveal>Already here.</MotionReveal>);
    expect(screen.getByText("Already here.")).toBeVisible();
    expect(screen.getByText("Already here.")).toHaveAttribute(
      "data-motion",
      "reveal",
    );
  });

  it("turns a verified cafe into a useful invitation", () => {
    const cafe = {
      id: "library-specialty-coffee",
      slug: "library-specialty-coffee",
      name: "Library Specialty Coffee",
      branch: null,
      address: "Toronto, ON",
      addressVerified: true,
      neighborhood: "Trinity Bellwoods",
      lat: 43.647,
      lng: -79.413,
      coordinateConfidence: "poi",
      moods: ["quiet"],
      offerings: ["espresso"],
      attributes: ["laptop-friendly"],
      recommendation: "Order the espresso and stay for a chapter.",
      sourceUrl: "https://example.com/source",
      mapsUrl: "https://maps.google.com/?q=library+specialty+coffee",
      verifiedAt: "2026-07-10",
      branchSpecificity: "inferred-toronto-scope",
      verificationStatus: "branch-unspecified",
    } satisfies Cafe;

    render(<PlaceInvitation cafe={cafe} headingLevel={3} />);

    expect(screen.getByText("Toronto · Trinity Bellwoods")).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: cafe.name })).toBeVisible();
    expect(screen.getByRole("link", { name: "Meet me there" })).toHaveAttribute(
      "href",
      `/cafes/${cafe.slug}`,
    );
    const directions = screen.getByRole("link", {
      name: "Directions (opens in a new tab)",
    });
    expect(directions).toHaveTextContent("Directions");
    expect(directions).toHaveAttribute("rel", "noreferrer");
    expect(directions).toHaveAttribute("target", "_blank");
    expect(directions.querySelector(".visually-hidden")).toHaveTextContent(
      "opens in a new tab",
    );
  });

  it("uses tokens for the layered material and motion system", () => {
    const css = readStyleSource();
    expect(css).toContain(".invitation-note");
    expect(css).toContain(".place-invitation");
    expect(css).toContain('[data-motion="reveal"]');
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
