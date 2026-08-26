import "../styles/home.css";
import { Activities } from "../components/home/Activities";
import { AssociationIntro } from "../components/home/AssociationIntro";
import { Contact } from "../components/home/Contact";
import { Hero } from "../components/home/Hero";
import { ImageStatement } from "../components/home/ImageStatement";
import { OriginStory } from "../components/home/OriginStory";
import { Territory } from "../components/home/Territory";
import { getPublicSite } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  return { site: await getPublicSite() };
}

export function meta({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  return [
    { title: `${data?.site?.identity.organizationName ?? "Spazio Terzo"} — Psicologia, psicoterapia, comunità` },
    {
      name: "description",
      content:
        data?.site?.seo.defaultDescription ?? "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio.",
    },
  ];
}

export default function Home() {
  const { site } = useLoaderData<typeof loader>();
  return (
    <main>
      <Hero content={site} />
      <AssociationIntro content={site} />
      <ImageStatement content={site} />
      <OriginStory content={site} />
      <Activities content={site} />
      <Territory content={site} />
      <Contact content={site} />
    </main>
  );
}
