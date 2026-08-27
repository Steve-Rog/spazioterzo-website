import "@mantine/core/styles.css";
import "./styles/global.css";

import { MantineProvider } from "@mantine/core";
import { useLoaderData } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { getPublicSite } from "./content/public-api";
import { SiteFooter } from "./components/layout/SiteFooter";

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
  return (
    <MantineProvider defaultColorScheme="auto">
      <Outlet />
      <SiteFooter identity={site.identity} />
    </MantineProvider>
  );
}
