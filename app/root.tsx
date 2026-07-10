import type { ReactNode } from "react";
import "@fontsource-variable/ibm-plex-sans/wght.css";
import "@fontsource-variable/newsreader/wght.css";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import "./app.css";
import { AppShell } from "./components/AppShell";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
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
