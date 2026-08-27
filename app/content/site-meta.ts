import type { SiteSettingsContent } from "../../shared/content-schema";

type PageMetaInput = { title: string; description: string; image?: string };

export function withSiteSuffix(title: string, site?: SiteSettingsContent) {
  const suffix = site?.seo.titleSuffix.trim() || site?.identity.organizationName.trim() || "Spazio Terzo";
  return suffix && title !== suffix ? `${title} — ${suffix}` : title;
}

/**
 * Titolo della home: il nome dell'associazione va davanti, non in coda.
 * Nella linguetta del browser si leggono poche lettere, e «Psicologia, psicotera…»
 * non dice a nessuno di chi è il sito.
 */
export function homeTitle(site?: SiteSettingsContent, claim = "psicologia, psicoterapia, comunità") {
  const nome = site?.seo.titleSuffix.trim() || site?.identity.organizationName.trim() || "Spazio Terzo";
  return `${nome} — ${claim}`;
}

export function siteDescription(site: SiteSettingsContent | undefined, fallback: string) {
  return site?.seo.defaultDescription.trim() || fallback;
}

/** Metadati identici per ricerca e condivisioni: cambiare il CMS aggiorna tutte le pagine. */
export function pageMeta({ title, description, image }: PageMetaInput) {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:locale", content: "it_IT" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    ...(image ? [{ property: "og:image", content: image }, { name: "twitter:card", content: "summary_large_image" }] : [{ name: "twitter:card", content: "summary" }]),
  ];
}
