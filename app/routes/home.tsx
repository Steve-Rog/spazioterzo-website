import "../styles/home.css";
import { Activities } from "../components/home/Activities";
import { AssociationIntro } from "../components/home/AssociationIntro";
import { Contact } from "../components/home/Contact";
import { Hero } from "../components/home/Hero";
import { ImageStatement } from "../components/home/ImageStatement";
import { OriginStory } from "../components/home/OriginStory";
import { Territory } from "../components/home/Territory";

export function meta() {
  return [
    { title: "Spazio Terzo — Psicologia, psicoterapia, comunità" },
    {
      name: "description",
      content:
        "Spazio Terzo è un'associazione che mette in relazione psicologia, psicoterapia e territorio.",
    },
  ];
}

export default function Home() {
  return (
    <main>
      <Hero />
      <AssociationIntro />
      <ImageStatement />
      <OriginStory />
      <Activities />
      <Territory />
      <Contact />
    </main>
  );
}
