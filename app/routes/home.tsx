import "../styles/home.css";
import { HomePage } from "../components/home/HomePage";
import { getPublicSite } from "../content/public-api";
import { pageMeta, siteDescription, withSiteSuffix } from "../content/site-meta";
import { useLoaderData } from "react-router";

export async function loader() {
  return { site: await getPublicSite() };
}

export function meta({ loaderData }: { loaderData?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const site = loaderData?.site;
  return pageMeta({
    title: withSiteSuffix("Psicologia, psicoterapia, comunità", site),
    description: siteDescription(site, "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio."),
    image: site?.seo.shareImage,
  });
}

export default function Home() {
  const { site } = useLoaderData<typeof loader>();
  return <HomePage site={site} />;
}
