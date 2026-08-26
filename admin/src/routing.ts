export type Section = "projects" | "team" | "site";
export type SitePanel = "identity" | "home" | "seo";
export type Route = { section: Section; editingId: string | "new" | null; sitePanel: SitePanel };

/** L'indirizzo è in italiano perché finisce nella barra del browser della redazione. */
const sectionSlugs: Record<Section, string> = { projects: "progetti", team: "persone", site: "sito" };
const panelSlugs: Record<SitePanel, string> = { identity: "identita", home: "home", seo: "seo" };
const sectionFromSlug = new Map(Object.entries(sectionSlugs).map(([section, slug]) => [slug, section as Section]));
const panelFromSlug = new Map(Object.entries(panelSlugs).map(([panel, slug]) => [slug, panel as SitePanel]));

export const homeRoute: Route = { section: "projects", editingId: null, sitePanel: "identity" };

export function parseRoute(hash: string): Route {
  const [sectionSlug, detail] = hash.replace(/^#\/?/, "").split("/").map((part) => decodeURIComponent(part ?? "").trim()).filter((part, index) => index < 2);
  const section = sectionFromSlug.get(sectionSlug ?? "");
  if (!section) return homeRoute;
  if (section === "site") return { section, editingId: "site", sitePanel: panelFromSlug.get(detail ?? "") ?? "identity" };
  if (!detail) return { ...homeRoute, section };
  return { section, editingId: detail === "nuovo" ? "new" : detail, sitePanel: "identity" };
}

export function formatRoute(route: Route): string {
  const slug = sectionSlugs[route.section];
  if (route.section === "site") return `#/${slug}/${panelSlugs[route.sitePanel]}`;
  if (!route.editingId) return `#/${slug}`;
  return `#/${slug}/${route.editingId === "new" ? "nuovo" : encodeURIComponent(route.editingId)}`;
}

export const sameRoute = (a: Route, b: Route) => formatRoute(a) === formatRoute(b);
