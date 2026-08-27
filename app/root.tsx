import "@mantine/core/styles.css";
import "./styles/global.css";

import { MantineProvider } from "@mantine/core";
import { useLoaderData, useLocation } from "react-router";
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

export function links({ data }: { data?: Awaited<ReturnType<typeof loader>> } = {}) {
  return data?.site.identity.favicon ? [{ rel: "icon", href: data.site.identity.favicon }] : [];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
