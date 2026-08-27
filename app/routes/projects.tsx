import "../styles/projects.css";
import { ProjectsArchive } from "../components/projects/ProjectsArchive";
import { getPublicProjects, getPublicSite } from "../content/public-api";
import { pageMeta, siteDescription, withSiteSuffix } from "../content/site-meta";
import { useLoaderData } from "react-router";

export async function loader() {
  const [projects, site] = await Promise.all([getPublicProjects(), getPublicSite()]);
  return { projects, site };
}

export function meta({ loaderData }: { loaderData?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const name = loaderData?.site?.identity.organizationName ?? "Spazio Terzo";
  return pageMeta({ title: withSiteSuffix("Progetti", loaderData?.site), description: siteDescription(loaderData?.site, `Progetti, percorsi e pratiche di ${name}.`), image: loaderData?.site?.seo.shareImage });
}

export default function Projects() {
  const { projects, site } = useLoaderData<typeof loader>();
  return <ProjectsArchive projects={projects} />;
}
