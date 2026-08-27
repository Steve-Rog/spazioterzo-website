import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Contact({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="contact" id="contatti">
      <span className="contact-orbit" aria-hidden="true" />
      <Reveal className="contact-heading">
        <SectionLabel>04 — Contatti</SectionLabel>
        <h2><RichText value={content.home.contact.heading} /></h2>
      </Reveal>
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
