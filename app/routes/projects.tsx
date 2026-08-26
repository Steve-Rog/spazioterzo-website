import "../styles/projects.css";
import { ProjectsArchive } from "../components/projects/ProjectsArchive";
import { getPublicProjects } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  return { projects: await getPublicProjects() };
}

export function meta() {
  return [
    { title: "Progetti — Spazio Terzo" },
    { name: "description", content: "Progetti, percorsi e pratiche di Spazio Terzo nel territorio di Catania." },
    { property: "og:title", content: "Progetti — Spazio Terzo" },
  ];
}

export default function Projects() {
  const { projects } = useLoaderData<typeof loader>();
  return <ProjectsArchive projects={projects} />;
}
