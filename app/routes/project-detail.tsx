import "../styles/projects.css";
import { useParams, useLoaderData } from "react-router";
import { ProjectDetail } from "../components/projects/ProjectDetail";
import { getRelatedProjects } from "../components/projects/content";
import { getPublicProject, getPublicProjects, getPublicSite } from "../content/public-api";
import { pageMeta, withSiteSuffix } from "../content/site-meta";

export async function loader({ params }: { params: { slug?: string } }) {
  // l'archivio serve a risolvere «Altri progetti» sui contenuti pubblicati, non sulle copie di esempio
  const [project, site, catalog] = await Promise.all([getPublicProject(params.slug), getPublicSite(), getPublicProjects()]);
  return { project, site, related: project ? getRelatedProjects(project, catalog) : [] };
}

export function meta({ loaderData }: { loaderData?: { project?: Awaited<ReturnType<typeof getPublicProject>>; site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const project = loaderData?.project;
  if (!project) return pageMeta({ title: withSiteSuffix("Progetto non trovato", loaderData?.site), description: "Il progetto richiesto non è disponibile." });
  return pageMeta({ title: withSiteSuffix(project.seoTitle ?? project.title, loaderData?.site), description: project.seoDescription ?? project.subtitle, image: loaderData?.site?.seo.shareImage ?? project.cover });
}

export default function ProjectDetailRoute() {
  const { slug } = useParams();
  const { project, site, related } = useLoaderData<typeof loader>();

  if (!project) {
    return (
      <main className="project-not-found" data-site-hero>
        <div className="site-header-slot" aria-hidden="true" />
        <p className="section-label">404 — Progetti</p>
        <h1>Questo progetto non è qui.</h1>
        <a href="/progetti">Torna ai progetti ↗</a>
      </main>
    );
  }

  return <ProjectDetail project={project} related={related} />;
}
