import "../styles/projects.css";
import { ProjectsArchive } from "../components/projects/ProjectsArchive";
import { getPublicProjects, getPublicSite } from "../content/public-api";
import { pageMeta, siteDescription, withSiteSuffix } from "../content/site-meta";
import { useLoaderData } from "react-router";

export async function loader() {
  const [projects, site] = await Promise.all([getPublicProjects(), getPublicSite()]);
  return { projects, site };
}

export function meta({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const name = data?.site?.identity.organizationName ?? "Spazio Terzo";
  return pageMeta({ title: withSiteSuffix("Progetti", data?.site), description: siteDescription(data?.site, `Progetti, percorsi e pratiche di ${name}.`), image: data?.site?.seo.shareImage });
}

export default function Projects() {
  const { projects, site } = useLoaderData<typeof loader>();
  return <ProjectsArchive projects={projects} />;
}
