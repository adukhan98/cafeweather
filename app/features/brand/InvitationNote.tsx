import { createElement, type ElementType, type ReactNode } from "react";

type InvitationNoteProps = {
  as?: ElementType;
  tilt?: "left" | "right" | "none";
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-live"?: "off" | "polite" | "assertive";
  "aria-atomic"?: boolean;
  children: ReactNode;
};

export function InvitationNote({
  as = "div",
  tilt = "none",
  className = "",
  id,
  "aria-label": ariaLabel,
  "aria-live": ariaLive,
  "aria-atomic": ariaAtomic,
  children,
}: InvitationNoteProps) {
  return createElement(
    as,
    {
      className: `invitation-note ${className}`.trim(),
      "data-tilt": tilt,
      ...(id ? { id } : {}),
      ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
      ...(ariaLive ? { "aria-live": ariaLive } : {}),
      ...(ariaAtomic === undefined ? {} : { "aria-atomic": ariaAtomic }),
    },
    children,
  );
}
