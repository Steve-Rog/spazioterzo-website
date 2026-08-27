export type Section = "projects" | "team" | "site";
export type SitePanel = "identity" | "home" | "seo";
export type Route = { section: Section; editingId: string | "new" | null; sitePanel: SitePanel; anchor?: string };

/** L'indirizzo è in italiano perché finisce nella barra del browser della redazione. */
const sectionSlugs: Record<Section, string> = { projects: "progetti", team: "persone", site: "sito" };
const panelSlugs: Record<SitePanel, string> = { identity: "identita", home: "home", seo: "seo" };
const sectionFromSlug = new Map(Object.entries(sectionSlugs).map(([section, slug]) => [slug, section as Section]));
const panelFromSlug = new Map(Object.entries(panelSlugs).map(([panel, slug]) => [slug, panel as SitePanel]));

export const homeRoute: Route = { section: "projects", editingId: null, sitePanel: "identity" };

export function parseRoute(hash: string): Route {
  const parti = hash.replace(/^#\/?/, "").split("/").map((part) => decodeURIComponent(part ?? "").trim());
  const [sectionSlug, detail, extra] = parti;
  const section = sectionFromSlug.get(sectionSlug ?? "");
  if (!section) return homeRoute;
  if (section === "site") {
    const sitePanel = panelFromSlug.get(detail ?? "") ?? "identity";
    // la home è una pagina sola che si scorre: il terzo segmento indica a quale sezione siamo arrivati
    return { section, editingId: "site", sitePanel, ...(sitePanel === "home" && extra ? { anchor: extra } : {}) };
  }
  if (!detail) return { ...homeRoute, section };
  return { section, editingId: detail === "nuovo" ? "new" : detail, sitePanel: "identity" };
}

export function formatRoute(route: Route): string {
  const slug = sectionSlugs[route.section];
  if (route.section === "site") return `#/${slug}/${panelSlugs[route.sitePanel]}${route.sitePanel === "home" && route.anchor ? `/${encodeURIComponent(route.anchor)}` : ""}`;
  if (!route.editingId) return `#/${slug}`;
  return `#/${slug}/${route.editingId === "new" ? "nuovo" : encodeURIComponent(route.editingId)}`;
}

/** Indirizzo senza l'ancora: scorrere dentro la home non è cambiare schermata. */
export const routeKey = (route: Route) => formatRoute({ ...route, anchor: undefined });
export const sameRoute = (a: Route, b: Route) => routeKey(a) === routeKey(b);
