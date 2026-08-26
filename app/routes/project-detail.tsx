import "../styles/projects.css";
import { useParams, useLoaderData } from "react-router";
import { ProjectDetail } from "../components/projects/ProjectDetail";
import { getPublicProject } from "../content/public-api";

export async function loader({ params }: { params: { slug?: string } }) {
  return { project: await getPublicProject(params.slug) };
}

export function meta({ data }: { data?: { project?: Awaited<ReturnType<typeof getPublicProject>> } }) {
  const project = data?.project;
  if (!project) return [{ title: "Progetto non trovato — Spazio Terzo" }];
  return [
    { title: `${project.title} — Spazio Terzo` },
    { name: "description", content: project.subtitle },
    { property: "og:title", content: `${project.title} — Spazio Terzo` },
    { property: "og:description", content: project.subtitle },
    { property: "og:image", content: project.cover },
  ];
}

export default function ProjectDetailRoute() {
  const { slug } = useParams();
  const { project } = useLoaderData<typeof loader>();

  if (!project) {
    return (
      <main className="project-not-found">
        <p className="section-label">404 — Progetti</p>
        <h1>Questo progetto non è qui.</h1>
        <a href="/progetti">Torna ai progetti ↗</a>
      </main>
    );
  }

  return <ProjectDetail project={project} />;
}
