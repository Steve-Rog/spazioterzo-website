import "@mantine/core/styles.css";
import "./styles/global.css";

import { MantineProvider } from "@mantine/core";
import { isRouteErrorResponse, useLoaderData, useLocation, useRouteError, useRouteLoaderData } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { defaultSiteSettings } from "../shared/default-site-settings";
import { getPublicSite } from "./content/public-api";
import { PublicPageShell } from "./components/layout/PublicPageShell";

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
        {/* se il JavaScript è disattivato le animazioni non partono: il contenuto deve restare visibile */}
        <noscript><style>{`[style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style></noscript>
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
      <PublicPageShell site={site} currentPage={currentPage}>
        <Outlet />
      </PublicPageShell>
    </MantineProvider>
  );
}

/**
 * Quando l'API dei contenuti non risponde, il loader radice fallisce e senza questo
 * il sito diventerebbe la schermata d'errore di React Router: nessun logo, nessun modo
 * di raggiungere l'associazione. Qui i recapiti sono quelli del repository, perché
 * proprio i contenuti sono ciò che manca.
 */
export function ErrorBoundary() {
  const errore = useRouteError();
  const nonTrovato = isRouteErrorResponse(errore) && errore.status === 404;
  const { organizationName, email } = defaultSiteSettings.identity;

  return (
    <main className="site-error">
      <img src="/assets/logo_spazioterzo.svg" alt={organizationName} />
      <p className="section-label">{nonTrovato ? "404" : "Sito non disponibile"}</p>
      <h1>{nonTrovato ? "Questa pagina non esiste." : "Il sito non è raggiungibile in questo momento."}</h1>
      <p>
        {nonTrovato
          ? "L’indirizzo potrebbe essere cambiato."
          : "Stiamo avendo un problema tecnico e i contenuti non si caricano. Riprova fra qualche minuto: nel frattempo puoi scriverci."}
      </p>
      <p className="site-error-actions">
        <a href="/">Torna alla home</a>
        <a href={`mailto:${email}`}>{email}</a>
      </p>
    </main>
  );
}
