export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__identity">
        <p className="site-footer__wordmark">Café Weather</p>
        <p className="site-footer__tagline">Toronto cafés for the mood you’re in.</p>
      </div>

      <nav className="site-footer__links" aria-label="Footer">
        <a href="/cafes">Browse</a>
        <a href="/suggest">Suggest</a>
      </nav>

      <p className="site-footer__provenance">
        <span>Source: Toronto café source thread</span>
        <span>Last verified July 2026</span>
      </p>
    </footer>
  );
}
