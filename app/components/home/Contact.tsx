import { Arrow } from "../ui/Arrow";
import { BrandLogo } from "../ui/BrandLogo";
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
      <footer>
        <BrandLogo className="footer-brand" />
        <p>{content.identity.legalForm}<br />{content.identity.city}, {content.identity.country}</p>
        <p>© {new Date().getFullYear()} {content.identity.organizationName}</p>
      </footer>
    </section>
  );
}
