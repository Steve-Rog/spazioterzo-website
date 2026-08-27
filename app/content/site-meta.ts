import type { SiteSettingsContent } from "../../shared/content-schema";

type PageMetaInput = { title: string; description: string; image?: string };

export function withSiteSuffix(title: string, site?: SiteSettingsContent) {
  const suffix = site?.seo.titleSuffix.trim() || site?.identity.organizationName.trim() || "Spazio Terzo";
  return suffix && title !== suffix ? `${title} — ${suffix}` : title;
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
