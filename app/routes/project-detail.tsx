import "../styles/projects.css";
import { useParams } from "react-router";
import { ProjectDetail } from "../components/projects/ProjectDetail";
import { getProject } from "../components/projects/content";

export function meta({ params }: { params: { slug?: string } }) {
  const project = getProject(params.slug);
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
  const project = getProject(slug);

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
