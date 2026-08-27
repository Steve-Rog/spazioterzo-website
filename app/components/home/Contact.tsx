import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";
import { RichText } from "../ui/RichText";
import type { SiteSettingsContent } from "../../../shared/content-schema";

export function Contact({ content }: { content: SiteSettingsContent }) {
  return (
    <section className="contact" id="contatti">
      <Reveal><SectionLabel>04 — Contatti</SectionLabel></Reveal>
      <Reveal className="contact-content">
        <h2><RichText value={content.home.contact.heading} /></h2>
        <div>
          <p><RichText value={content.home.contact.body} /></p>
          <a className="contact-mail" href={`mailto:${content.identity.email}`}>{content.home.contact.emailLabel ?? content.identity.email} <Arrow /></a>
        </div>
      </Reveal>
    </section>
  );
}
