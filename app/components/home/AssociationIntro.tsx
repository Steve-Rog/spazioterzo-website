import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function AssociationIntro({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="manifesto" id="chi-siamo">
      <Reveal><SectionLabel>01 — L&apos;associazione</SectionLabel></Reveal>
      <Reveal className="manifesto-main">
        <h2><RichText value={content.home.association.heading} /></h2>
        <div className="manifesto-aside">
          <p><RichText value={content.home.association.body} /></p>
          <a className="text-link" href={content.home.association.ctaHref}>{content.home.association.ctaLabel} <Arrow /></a>
        </div>
      </Reveal>
    </section>
  );
}
