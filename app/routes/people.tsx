import "../styles/people.css";
import { PeopleHero } from "../components/people/PeopleHero";

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
  return (
    <main className="people-page">
      <PeopleHero />
    </main>
  );
}
