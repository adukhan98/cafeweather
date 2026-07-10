import { createElement, type ElementType, type ReactNode } from "react";

type InvitationNoteProps = {
  as?: ElementType;
  tilt?: "left" | "right" | "none";
  className?: string;
  "aria-label"?: string;
  children: ReactNode;
};

export function InvitationNote({
  as = "div",
  tilt = "none",
  className = "",
  "aria-label": ariaLabel,
  children,
}: InvitationNoteProps) {
  return createElement(
    as,
    {
      className: `invitation-note ${className}`.trim(),
      "data-tilt": tilt,
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
    },
    children,
  );
}
