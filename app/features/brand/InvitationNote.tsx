import { createElement, type ElementType, type ReactNode } from "react";

type InvitationNoteProps = {
  as?: ElementType;
  tilt?: "left" | "right" | "none";
  className?: string;
  children: ReactNode;
};

export function InvitationNote({
  as = "div",
  tilt = "none",
  className = "",
  children,
}: InvitationNoteProps) {
  return createElement(
    as,
    {
      className: `invitation-note ${className}`.trim(),
      "data-tilt": tilt,
    },
    children,
  );
}
