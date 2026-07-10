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
  const mobileNavRef = useRef<HTMLDivElement>(null);

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

    const priorBodyOverflow = document.body.style.overflow;
    const backgroundRegions = [
      document.getElementById("main-content"),
      document.querySelector<HTMLElement>(".site-footer"),
    ].filter((region): region is HTMLElement => region !== null);
    const priorInertStates = backgroundRegions.map((region) => ({
      region,
      inert: region.hasAttribute("inert"),
    }));

    document.body.style.overflow = "hidden";
    for (const region of backgroundRegions) region.setAttribute("inert", "");
    firstMobileLinkRef.current?.focus();

    const handleMenuKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu("toggle");
        return;
      }
      if (event.key !== "Tab") return;

      const controls = Array.from(
        mobileNavRef.current?.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>(
          "button, a[href]",
        ) ?? [],
      );
      const first = controls[0];
      const last = controls.at(-1);
      if (!controls.includes(document.activeElement as HTMLAnchorElement)) {
        event.preventDefault();
        first?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (mastheadRef.current?.contains(event.target as Node)) return;
      closeMenu("toggle");
    };

    window.addEventListener("keydown", handleMenuKeyboard);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => {
      window.removeEventListener("keydown", handleMenuKeyboard);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.body.style.overflow = priorBodyOverflow;
      for (const { region, inert } of priorInertStates) {
        if (inert) region.setAttribute("inert", "");
        else region.removeAttribute("inert");
      }
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
          <BrandLockup descriptor current={location.pathname === "/"} />

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
            aria-hidden={menuOpen ? "true" : undefined}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            tabIndex={menuOpen ? -1 : undefined}
            onClick={toggleMenu}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>

        <p className="masthead__edition">Toronto · 36 places</p>
      </div>

      <div
        ref={mobileNavRef}
        id="mobile-navigation"
        className="masthead__mobile-nav"
        role="dialog"
        aria-label="Mobile menu"
        aria-modal="true"
        hidden={!menuOpen}
        data-state={menuOpen ? "open" : "closed"}
      >
        <button
          className="masthead__mobile-close"
          type="button"
          aria-label="Close menu"
          onClick={() => closeMenu("toggle")}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
        <nav aria-label="Mobile" data-state={menuOpen ? "open" : "closed"}>
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
      </div>
    </header>
  );
}
