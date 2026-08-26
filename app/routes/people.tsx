import "../styles/people.css";
import { PeopleHero } from "../components/people/PeopleHero";
import { getPublicSite, getPublicTeam } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  const [teamMembers, site] = await Promise.all([getPublicTeam(), getPublicSite()]);
  return { teamMembers, site };
}

export function meta({ data }: { data?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const name = data?.site?.identity.organizationName ?? "Spazio Terzo";
  return [
    { title: `Le persone — ${data?.site?.seo.titleSuffix ?? name}` },
    {
      name: "description",
      content: data?.site?.seo.defaultDescription ?? `Le persone di ${name}: percorsi, pratiche e sguardi che danno vita all'associazione.`,
    },
  ];
}

export default function People() {
  const { teamMembers, site } = useLoaderData<typeof loader>();
  return (
    <main className="people-page">
      <PeopleHero teamMembers={teamMembers} site={site} />
    </main>
  );
}
