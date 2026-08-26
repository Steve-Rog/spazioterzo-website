import "../styles/people.css";
import { PeopleHero } from "../components/people/PeopleHero";
import { getPublicTeam } from "../content/public-api";
import { useLoaderData } from "react-router";

export async function loader() {
  return { teamMembers: await getPublicTeam() };
}

export function meta() {
  return [
    { title: "Le persone — Spazio Terzo" },
    {
      name: "description",
      content: "Le persone di Spazio Terzo: percorsi, pratiche e sguardi che danno vita all'associazione.",
    },
  ];
}

export default function People() {
  const { teamMembers } = useLoaderData<typeof loader>();
  return (
    <main className="people-page">
      <PeopleHero teamMembers={teamMembers} />
    </main>
  );
}
