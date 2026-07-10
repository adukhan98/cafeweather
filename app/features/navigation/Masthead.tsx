import { useEffect, useRef, useState } from "react";

const destinations = [
  { label: "Browse", href: "/#browse" },
  { label: "Map", href: "/#map" },
  { label: "Roulette", href: "/#roulette" },
  { label: "Suggest", href: "/#suggest" },
] as const;

export function Masthead() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstMobileLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    firstMobileLinkRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      toggleRef.current?.focus();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  const toggleMenu = () => {
    setMenuOpen((open) => {
      if (open) queueMicrotask(() => toggleRef.current?.focus());
      return !open;
    });
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="masthead">
      <div className="masthead__location" aria-label="Guide location">
        <span>Toronto, Ontario</span>
        <span>Toronto cafés for the mood you’re in.</span>
      </div>

      <div className="masthead__title-row">
        <a className="masthead__wordmark" href="/" aria-label="Café Weather home">
          Café Weather
        </a>
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

      <nav className="masthead__desktop-nav" aria-label="Primary">
        <ul>
          {destinations.map((destination) => (
            <li key={destination.label}>
              <a href={destination.href}>{destination.label}</a>
            </li>
          ))}
        </ul>
      </nav>

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
                onClick={closeMenu}
              >
                {destination.label}
                <span aria-hidden="true">→</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="masthead__rule" aria-hidden="true" />
    </header>
  );
}
