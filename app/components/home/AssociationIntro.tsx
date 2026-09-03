import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { SplitHeading } from "../ui/SplitHeading";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function AssociationIntro({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="manifesto" id="chi-siamo">
      <Reveal><SectionLabel>01 — L&apos;associazione</SectionLabel></Reveal>
      <div className="manifesto-main">
        <SplitHeading value={content.home.association.heading} />
        <Reveal className="manifesto-aside" delay={0.18}>
          <p><RichText value={content.home.association.body} /></p>
          <a className="text-link" href={content.home.association.ctaHref}>{content.home.association.ctaLabel} <Arrow /></a>
        </Reveal>
      </div>
    </section>
  );
}
