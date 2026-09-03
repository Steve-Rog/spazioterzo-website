import { HomePage } from "../../../app/components/home/HomePage";
import { TeamProfileContent } from "../../../app/components/people/TeamProfileModal";
import { ProjectDetail } from "../../../app/components/projects/ProjectDetail";
import { getRelatedProjects } from "../../../app/components/projects/content";
import { PublicPageShell } from "../../../app/components/layout/PublicPageShell";
import { projectToLegacy, teamToLegacy } from "../../../app/content/public-api";
import type { ProjectContent, SiteSettingsContent, TeamMemberContent } from "../../../shared/content-schema";
import { PreviewFrame } from "../PreviewFrame";

/** Le anteprime usano gli stessi componenti pubblici: non sono copie da mantenere a mano. */
export function ProjectPreview({ project, site, catalogo, height, focus }: { project: ProjectContent; site: SiteSettingsContent; catalogo: ProjectContent[]; height?: number; focus?: string }) {
  const legacy = projectToLegacy(project);
  const correlati = getRelatedProjects(legacy, catalogo.map(projectToLegacy));
  return <PreviewFrame height={height} focus={focus}><PublicPageShell site={site} currentPage="projects"><ProjectDetail project={legacy} related={correlati} /></PublicPageShell></PreviewFrame>;
}

export function TeamPreview({ member, height, index, total }: { member: TeamMemberContent; height?: number; index: number; total: number }) {
  return <PreviewFrame height={height} className="preview-persona"><TeamProfileContent member={teamToLegacy(member)} index={index} total={total} /></PreviewFrame>;
}

export function SitePreview({ site, height, focus }: { site: SiteSettingsContent; height?: number; focus?: string }) {
  return <PreviewFrame height={height} focus={focus}><PublicPageShell site={site} currentPage="home"><HomePage site={site} /></PublicPageShell></PreviewFrame>;
}
