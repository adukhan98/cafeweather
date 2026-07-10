import { createElement, type ElementType, type ReactNode } from "react";

type SceneProps = {
  as?: ElementType;
  tone: "espresso" | "cream" | "terracotta" | "honey" | "clay" | "burgundy";
  label?: string;
  className?: string;
  children: ReactNode;
};

export function Scene({
  as = "section",
  tone,
  label,
  className = "",
  children,
}: SceneProps) {
  return createElement(
    as,
    {
      className: `scene ${className}`.trim(),
      "data-tone": tone,
      ...(label ? { "aria-label": label } : {}),
    },
    children,
  );
}
