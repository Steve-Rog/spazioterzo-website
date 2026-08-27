import "@mantine/core/styles.css";
import "./styles/global.css";

import { MantineProvider } from "@mantine/core";
import { useLoaderData, useLocation, useRouteLoaderData } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { getPublicSite } from "./content/public-api";
import { SiteFooter } from "./components/layout/SiteFooter";
import { SiteHeader } from "./components/layout/SiteHeader";

export async function loader() {
  return { site: await getPublicSite() };
}

export function Layout({ children }: { children: React.ReactNode }) {
  // la favicon arriva dal back office: links() non riceve i dati del loader, quindi si legge qui
  const dati = useRouteLoaderData<typeof loader>("root");
  const favicon = dati?.site.identity.favicon;

  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {favicon && <link rel="icon" href={favicon} />}
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
  const { site } = useLoaderData<typeof loader>();
  const { pathname } = useLocation();
  const currentPage = pathname.startsWith("/progetti")
    ? "projects"
    : pathname.startsWith("/persone")
      ? "people"
      : "home";

  return (
    <MantineProvider defaultColorScheme="auto">
      <SiteHeader identity={site.identity} currentPage={currentPage} />
      <Outlet />
      <SiteFooter identity={site.identity} />
    </MantineProvider>
  );
}
