import "../styles/projects.css";
import { useParams, useLoaderData } from "react-router";
import { ProjectDetail } from "../components/projects/ProjectDetail";
import { getRelatedProjects } from "../components/projects/content";
import { getPublicProject, getPublicProjects, getPublicSite } from "../content/public-api";

export async function loader({ params }: { params: { slug?: string } }) {
  // l'archivio serve a risolvere «Altri progetti» sui contenuti pubblicati, non sulle copie di esempio
  const [project, site, catalog] = await Promise.all([getPublicProject(params.slug), getPublicSite(), getPublicProjects()]);
  return { project, site, related: project ? getRelatedProjects(project, catalog) : [] };
}

export function meta({ data }: { data?: { project?: Awaited<ReturnType<typeof getPublicProject>>; site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const project = data?.project;
  const suffix = data?.site?.seo.titleSuffix ?? data?.site?.identity.organizationName ?? "Spazio Terzo";
  if (!project) return [{ title: `Progetto non trovato — ${suffix}` }];
  return [
    { title: `${project.seoTitle ?? project.title} — ${suffix}` },
    { name: "description", content: project.seoDescription ?? project.subtitle },
    { property: "og:title", content: `${project.title} — Spazio Terzo` },
    { property: "og:description", content: project.subtitle },
    { property: "og:image", content: data?.site?.seo.shareImage ?? project.cover },
  ];
}

export default function ProjectDetailRoute() {
  const { slug } = useParams();
  const { project, site, related } = useLoaderData<typeof loader>();

  if (!project) {
    return (
      <main className="project-not-found">
        <p className="section-label">404 — Progetti</p>
        <h1>Questo progetto non è qui.</h1>
        <a href="/progetti">Torna ai progetti ↗</a>
      </main>
    );
  }

  return <ProjectDetail project={project} site={site} related={related} />;
}
