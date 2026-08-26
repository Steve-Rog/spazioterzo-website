import "../styles/projects.css";
import { ProjectsArchive } from "../components/projects/ProjectsArchive";

export function meta() {
  return [
    { title: "Progetti — Spazio Terzo" },
    { name: "description", content: "Progetti, percorsi e pratiche di Spazio Terzo nel territorio di Catania." },
    { property: "og:title", content: "Progetti — Spazio Terzo" },
  ];
}

export default function Projects() {
  return <ProjectsArchive />;
}
