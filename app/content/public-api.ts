import { asRichText, plainText, type ProjectContent, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { projects, type Project } from "../components/projects/content";
import { teamMembers, type TeamMember } from "../components/people/content";
import { activities } from "../components/home/content";

const apiUrl = () => import.meta.env.VITE_CONTENT_API_URL?.replace(/\/$/, "");

export const defaultSiteSettings: SiteSettingsContent = {
  identity: {
    organizationName: "Spazio Terzo",
    legalForm: "Associazione di promozione sociale",
    city: "Catania",
    country: "Italia",
    email: "info@spazioterzo.it",
    logoLight: "/assets/logo_spazioterzo_negative.svg",
    logoDark: "/assets/logo_spazioterzo.svg",
    socialLinks: [],
  },
  seo: { titleSuffix: "Spazio Terzo", defaultDescription: "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio." },
  home: {
    hero: { headline: [{ text: "Lo spazio condiviso diventa" }, { text: " cura.", marks: ["italic"] }], meta: "Catania · dal 2014", ctaLabel: "Scrivici" },
    association: { heading: [{ text: "Facciamo spazio alle persone, " }, { text: "per far crescere comunità.", marks: ["italic"] }], body: asRichText("Promuoviamo spazi di ascolto, sostegno e formazione in cui le persone possano ritrovare connessione, sviluppare risorse e affrontare insieme fragilità e sfide individuali e comunitarie."), ctaLabel: "Il nostro approccio", ctaHref: "#percorsi" },
    origin: {
      eyebrow: "Perché Spazio Terzo",
      prelude: [{ text: "Il nome " }, { text: "Spazio Terzo", marks: ["highlight"] }, { text: " nasce da un’idea semplice e profonda:" }],
      heading: [{ text: "il cambiamento autentico avviene nell’incontro.", marks: ["highlight"] }],
      statement: [{ text: "Non nello scontro, non nell’isolamento, ma in quello spazio nuovo che si crea quando due o più persone " }, { text: "si confrontano, portando con sé mondi diversi.", marks: ["highlight"] }, { text: " È un luogo dinamico, che non appartiene a nessuno dei partecipanti, ma emerge tra loro, come una scintilla che accende possibilità inedite." }],
      identity: [{ text: "Spazio Terzo APS", marks: ["highlight"] }, { text: " è un’associazione di promozione sociale senza scopo di lucro che opera a " }, { text: "Catania", marks: ["highlight"] }, { text: ", impegnata nella cura del benessere psicologico e relazionale attraverso il potere trasformativo del gruppo." }],
    },
    activities: { heading: [{ text: "Dove la cura diventa " }, { text: "azione.", marks: ["italic"] }], items: activities.map((activity, index) => ({ id: String(index + 1), title: activity.title, description: asRichText(activity.description) })) },
    territory: { heading: asRichText("La cura non è un lusso."), body: asRichText("È un diritto da costruire insieme, nei quartieri, nelle scuole, nelle famiglie. Per questo lavoriamo con le persone e con le realtà che ogni giorno fanno comunità."), ctaLabel: "Parliamone", ctaHref: "#contatti" },
    imageStatement: { caption: "Ogni incontro può aprire una possibilità.", verticalWord: "ASCOLTO" },
    contact: { heading: [{ text: "Facciamo " }, { text: "spazio?", marks: ["italic"] }], body: asRichText("Raccontaci di cosa hai bisogno. Ti risponderemo con cura."), emailLabel: "info@spazioterzo.it" },
  },
};

function projectToLegacy(project: ProjectContent): Project {
  return {
    slug: project.slug, title: project.title, subtitle: project.subtitle, status: project.statusLabel, dateRange: project.dateRange,
    location: project.location, audience: project.audience, themes: project.themes, cover: project.cover, coverAlt: project.coverAlt,
    intro: plainText(project.intro), objective: plainText(project.objective),
    blocks: project.blocks.map((block) => {
      if (block.type === "paragraph") return { type: "paragraph" as const, text: plainText(block.text) };
      if (block.type === "quote") return { type: "quote" as const, text: plainText(block.text), source: block.source };
      if (block.type === "list") return { type: "list" as const, title: block.title, items: block.items };
      if (block.type === "image") return { type: "image" as const, src: block.src ?? "", alt: block.alt, caption: block.caption };
      return { type: "stat" as const, value: block.value, label: block.label };
    }),
    outcomes: project.outcomes, links: project.links, video: project.video ? { ...project.video, thumbnail: project.video.thumbnail ?? "" } : undefined,
    cta: project.cta, partners: project.partners, funders: project.funders, visibilityNote: project.visibilityNote, relatedSlugs: project.relatedSlugs,
  };
}

function teamToLegacy(member: TeamMemberContent): TeamMember {
  return { name: member.name, role: member.role, image: member.image, imagePosition: member.imagePosition, bio: member.bio.map(plainText), quote: plainText(member.quote), quoteAuthor: member.quoteAuthor };
}

async function read<T>(path: string): Promise<T | null> {
  const base = apiUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}${path}`);
    return response.ok ? await response.json() as T : null;
  } catch {
    return null;
  }
}

export async function getPublicProjects() {
  const remote = await read<ProjectContent[]>("/v1/public/projects");
  return remote ? remote.map(projectToLegacy) : projects;
}

export async function getPublicProject(slug: string | undefined) {
  if (!slug) return undefined;
  const remote = await read<ProjectContent>(`/v1/public/projects/${encodeURIComponent(slug)}`);
  return remote ? projectToLegacy(remote) : projects.find((project) => project.slug === slug);
}

export async function getPublicTeam() {
  const remote = await read<TeamMemberContent[]>("/v1/public/team");
  return remote ? remote.map(teamToLegacy) : teamMembers;
}

export async function getPublicSite() {
  return (await read<SiteSettingsContent>("/v1/public/site")) ?? defaultSiteSettings;
}
