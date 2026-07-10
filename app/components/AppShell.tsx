import type { ReactNode } from "react";

import { SiteFooter } from "../features/footer/SiteFooter";
import { Masthead } from "../features/navigation/Masthead";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
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
