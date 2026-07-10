import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { useLocation } from "react-router";

import { BrandLockup } from "../brand/BrandLockup";

const destinations = [
  { label: "Browse", href: "/cafes", activePath: "/cafes" },
  { label: "Map", href: "/cafes?view=map", activePath: "/cafes" },
  { label: "Roulette", href: "/roulette", activePath: "/roulette" },
  { label: "Suggest", href: "/suggest", activePath: "/suggest" },
] as const;

export function Masthead() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const mastheadRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  const closeMenu = useCallback((focusDestination: "main" | "toggle") => {
    setMenuOpen(false);
    queueMicrotask(() => {
      const target =
        focusDestination === "toggle"
          ? toggleRef.current
          : document.getElementById("main-content");
      target?.focus();
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    firstMobileLinkRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeMenu("toggle");
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (mastheadRef.current?.contains(event.target as Node)) return;
      closeMenu("toggle");
    };

    window.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
    };
  }, [closeMenu, menuOpen]);

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu("toggle");
      return;
    }
    setMenuOpen(true);
  };

  const isCurrent = (destination: (typeof destinations)[number]) => {
    if (location.pathname !== destination.activePath) return false;
    const isMapView = new URLSearchParams(location.search).get("view") === "map";
    if (destination.label === "Map") return isMapView;
    if (destination.label === "Browse") return !isMapView;
    return true;
  };

  return (
    <header ref={mastheadRef} className="masthead">
      <div className="masthead__receipt">
        <div className="masthead__top-row">
          <BrandLockup descriptor />

          <nav className="masthead__desktop-nav" aria-label="Primary">
            <ul>
              {destinations.map((destination) => (
                <li key={destination.label}>
                  <a
                    href={destination.href}
                    aria-current={isCurrent(destination) ? "page" : undefined}
                  >
                    {destination.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <button
            ref={toggleRef}
            className="site-nav__toggle"
            type="button"
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={toggleMenu}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <p className="masthead__edition">Toronto · 36 places</p>
      </div>

      <nav
        id="mobile-navigation"
        className="masthead__mobile-nav"
        aria-label="Mobile"
        hidden={!menuOpen}
        data-state={menuOpen ? "open" : "closed"}
      >
        <ul>
          {destinations.map((destination, index) => (
            <li key={destination.label}>
              <a
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={destination.href}
                aria-current={isCurrent(destination) ? "page" : undefined}
                onClick={() => closeMenu("main")}
              >
                {destination.label}
                <ArrowRight size={18} weight="regular" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
