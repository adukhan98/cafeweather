import type { MouseEvent, ReactNode } from "react";

import { SiteFooter } from "../features/footer/SiteFooter";
import { Masthead } from "../features/navigation/Masthead";

export function AppShell({ children }: { children: ReactNode }) {
  const focusMainContent = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById("main-content")?.focus();
  };

  return (
    <div className="app-shell" data-brand="meet-me-there">
      <a className="skip-link" href="#main-content" onClick={focusMainContent}>
        Skip to content
      </a>
      <Masthead />
      <main id="main-content" className="app-shell__main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
