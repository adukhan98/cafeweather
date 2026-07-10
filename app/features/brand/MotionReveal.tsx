import { type ElementType, type ReactNode, createElement } from "react";

export function MotionReveal({
  as = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return createElement(
    as,
    { className: `motion-reveal ${className}`.trim(), "data-motion": "reveal" },
    children,
  );
}
