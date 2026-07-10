import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "@phosphor-icons/react";

const destinations = [
  { label: "Browse", href: "/cafes" },
  { label: "Map", href: "/cafes?view=map" },
  { label: "Roulette", href: "/roulette" },
  { label: "Suggest", href: "/suggest" },
] as const;

export function Masthead() {
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

  return (
    <header ref={mastheadRef} className="masthead">
      <div className="masthead__top-row">
        <a className="masthead__wordmark" href="/" aria-label="Café Weather home">
          Café Weather
        </a>

        <nav className="masthead__desktop-nav" aria-label="Primary">
          <ul>
            {destinations.map((destination) => (
              <li key={destination.label}>
                <a href={destination.href}>{destination.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <button
          ref={toggleRef}
          className="masthead__toggle"
          type="button"
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={toggleMenu}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div className="masthead__rule" aria-hidden="true" />

      <div className="masthead__location" aria-label="Guide location">
        <span>Toronto, Ontario</span>
        <span>Toronto cafés for the mood you’re in.</span>
      </div>

      <nav
        id="mobile-navigation"
        className="masthead__mobile-nav"
        aria-label="Mobile"
        hidden={!menuOpen}
      >
        <ul>
          {destinations.map((destination, index) => (
            <li key={destination.label}>
              <a
                ref={index === 0 ? firstMobileLinkRef : undefined}
                href={destination.href}
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
