import { BrandLockup } from "../brand/BrandLockup";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__identity">
        <BrandLockup descriptor />
        <p className="site-footer__positioning">A better answer to “where?”</p>
      </div>

      <nav className="site-footer__links" aria-label="Footer">
        <a href="/cafes">Browse</a>
        <a href="/cafes?view=map">Map</a>
        <a href="/roulette">Roulette</a>
        <a href="/suggest">Suggest</a>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </nav>

      <p className="site-footer__provenance">
        <span>Source: Toronto café source thread</span>
        <span>Last verified July 2026.</span>
      </p>
    </footer>
  );
}
