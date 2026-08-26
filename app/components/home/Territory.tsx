import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Territory({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="territory" id="territorio">
      <div className="territory-orbit" aria-hidden="true">
        <span>cura</span><span>rete</span><span>presenza</span><span>futuro</span>
      </div>
      <Reveal className="territory-copy">
        <SectionLabel>03 — Sul territorio</SectionLabel>
        <h2><RichText value={content.home.territory.heading} /></h2>
        <p><RichText value={content.home.territory.body} /></p>
        <a className="button-dark" href={content.home.territory.ctaHref}>{content.home.territory.ctaLabel} <Arrow /></a>
      </Reveal>
    </section>
  );
}
