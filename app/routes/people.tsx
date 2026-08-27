import "../styles/people.css";
import { PeopleHero } from "../components/people/PeopleHero";
import { getPublicSite, getPublicTeam } from "../content/public-api";
import { pageMeta, siteDescription, withSiteSuffix } from "../content/site-meta";
import { useLoaderData } from "react-router";

export async function loader() {
  const [teamMembers, site] = await Promise.all([getPublicTeam(), getPublicSite()]);
  return { teamMembers, site };
}

export function meta({ loaderData }: { loaderData?: { site?: Awaited<ReturnType<typeof getPublicSite>> } }) {
  const name = loaderData?.site?.identity.organizationName ?? "Spazio Terzo";
  return pageMeta({ title: withSiteSuffix("Le persone", loaderData?.site), description: siteDescription(loaderData?.site, `Le persone di ${name}: percorsi, pratiche e sguardi che danno vita all'associazione.`), image: loaderData?.site?.seo.shareImage });
}

export default function People() {
  const { teamMembers, site } = useLoaderData<typeof loader>();
  return (
    <main className="people-page">
      <PeopleHero teamMembers={teamMembers} />
    </main>
  );
}
