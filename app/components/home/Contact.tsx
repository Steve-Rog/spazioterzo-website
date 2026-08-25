import { Arrow } from "../ui/Arrow";
import { BrandLogo } from "../ui/BrandLogo";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

export function Contact() {
  return (
    <section className="contact" id="contatti">
      <Reveal><SectionLabel>04 — Contatti</SectionLabel></Reveal>
      <Reveal className="contact-content">
        <h2>Facciamo<br /><em>spazio?</em></h2>
        <div>
          <p>Raccontaci di cosa hai bisogno.<br />Ti risponderemo con cura.</p>
          <a className="contact-mail" href="mailto:info@spazioterzo.it">info@spazioterzo.it <Arrow /></a>
        </div>
      </Reveal>
      <footer>
        <BrandLogo className="footer-brand" />
        <p>Associazione di promozione sociale<br />Bologna, Italia</p>
        <p>© {new Date().getFullYear()} Spazio Terzo</p>
      </footer>
    </section>
  );
}
