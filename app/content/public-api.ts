import { plainText, type ProjectContent, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
import { defaultSiteSettings } from "../../shared/default-site-settings";
import { projects, type Project } from "../components/projects/content";
import { teamMembers, type TeamMember } from "../components/people/content";

const apiUrl = () => import.meta.env.VITE_CONTENT_API_URL?.replace(/\/$/, "");

export { defaultSiteSettings } from "../../shared/default-site-settings";

export function projectToLegacy(project: ProjectContent): Project {
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
    cta: project.cta, partners: project.partners, funders: project.funders, visibilityNote: project.visibilityNote, relatedSlugs: project.relatedSlugs, seoTitle: project.seoTitle, seoDescription: project.seoDescription,
  };
}

export function teamToLegacy(member: TeamMemberContent): TeamMember {
  return { name: member.name, role: member.role, image: member.image, imagePosition: member.imagePosition, imageCrop: member.imageCrop, bio: member.bio.map(plainText), quote: plainText(member.quote), quoteAuthor: member.quoteAuthor };
}

async function read<T>(path: string): Promise<T | null> {
  const base = apiUrl();
  if (!base) return null;
  const response = await fetch(`${base}${path}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`API contenuti non disponibile (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getPublicProjects() {
  const remote = await read<ProjectContent[]>("/v1/public/projects");
  if (remote) return remote.map(projectToLegacy);
  if (apiUrl()) throw new Error("L'archivio progetti non è disponibile nell'API contenuti");
  return projects;
}

export async function getPublicProject(slug: string | undefined) {
  if (!slug) return undefined;
  const remote = await read<ProjectContent>(`/v1/public/projects/${encodeURIComponent(slug)}`);
  if (remote) return projectToLegacy(remote);
  return apiUrl() ? undefined : projects.find((project) => project.slug === slug);
}

export async function getPublicTeam() {
  const remote = await read<TeamMemberContent[]>("/v1/public/team");
  if (remote) return remote.map(teamToLegacy);
  if (apiUrl()) throw new Error("Il team non è disponibile nell'API contenuti");
  return teamMembers;
}

export async function getPublicSite() {
  const remote = await read<SiteSettingsContent>("/v1/public/site");
  if (remote) return remote;
  if (apiUrl()) throw new Error("La configurazione pubblica non è disponibile nell'API contenuti");
  return defaultSiteSettings;
}
