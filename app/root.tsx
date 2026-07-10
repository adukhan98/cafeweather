import type { ReactNode } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import "./app.css";
import "./styles/base.css";
import "./styles/materials.css";
import "./styles/motion.css";
import "./styles/shell.css";
import "./styles/home.css";
import "./styles/catalogue.css";
import "./styles/map.css";
import "./styles/detail.css";
import "./fonts/latin-wght.css";
import { AppShell } from "./components/AppShell";
import { brand } from "./config/brand";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta property="og:site_name" content={brand.name} />
        <meta
          property="og:image"
          content={`${brand.canonicalOrigin}/og-meet-me-there.svg`}
        />
        <meta name="twitter:card" content="summary_large_image" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
