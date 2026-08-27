import type { SiteSettingsContent } from "../../../shared/content-schema";
import { Activities } from "./Activities";
import { AssociationIntro } from "./AssociationIntro";
import { Contact } from "./Contact";
import { Hero } from "./Hero";
import { ImageStatement } from "./ImageStatement";
import { OriginStory } from "./OriginStory";
import { Territory } from "./Territory";

/**
 * Composizione della home, in un posto solo.
 * La usano sia la rotta pubblica sia l'anteprima del back office: aggiungere o spostare una sezione
 * qui la aggiorna in entrambe, senza doversene ricordare due volte.
 */
export function HomePage({ site }: { site: SiteSettingsContent }) {
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
