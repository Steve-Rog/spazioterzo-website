import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { SplitHeading } from "../ui/SplitHeading";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Contact({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="contact" id="contatti">
      <span className="contact-orbit" aria-hidden="true" />
      <div className="contact-heading">
        <Reveal><SectionLabel>04 — Contatti</SectionLabel></Reveal>
        <SplitHeading value={content.home.contact.heading} />
      </div>
      <Reveal className="contact-action" delay={0.1}>
        <p><RichText value={content.home.contact.body} /></p>
        <a className="contact-mail" href={`mailto:${content.identity.email}`}>
          <span>Scrivici</span>
          <strong>{content.identity.email}</strong>
          <Arrow />
        </a>
      </Reveal>
    </section>
  );
}
