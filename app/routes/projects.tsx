import "../styles/projects.css";
import { ProjectsArchive } from "../components/projects/ProjectsArchive";
import { getPublicProjects, getPublicSite } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  const [projects, site] = await Promise.all([getPublicProjects(), getPublicSite()]);
  return { projects, site };
}

export function meta({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const name = data?.site?.identity.organizationName ?? "Spazio Terzo";
  return [
    { title: `Progetti — ${data?.site?.seo.titleSuffix ?? name}` },
    { name: "description", content: data?.site?.seo.defaultDescription ?? `Progetti, percorsi e pratiche di ${name}.` },
    { property: "og:title", content: `Progetti — ${name}` },
  ];
}

export default function Projects() {
  const { projects, site } = useLoaderData<typeof loader>();
  return <ProjectsArchive projects={projects} site={site} />;
}
