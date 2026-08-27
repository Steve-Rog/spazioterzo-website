import "../styles/home.css";
import { HomePage } from "../components/home/HomePage";
import { getPublicSite } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  return { site: await getPublicSite() };
}

export function meta({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const site = data?.site;
  return [
    { title: `${site?.identity.organizationName ?? "Spazio Terzo"} — Psicologia, psicoterapia, comunità` },
    {
      name: "description",
      content:
        site?.seo.defaultDescription ?? "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio.",
    },
    ...(site?.seo.shareImage ? [{ property: "og:image", content: site.seo.shareImage }] : []),
  ];
}

export function links({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } } = {}) {
  return data?.site?.identity.favicon ? [{ rel: "icon", href: data.site.identity.favicon }] : [];
}

export default function Home() {
  const { site } = useLoaderData<typeof loader>();
  return <HomePage site={site} />;
}
