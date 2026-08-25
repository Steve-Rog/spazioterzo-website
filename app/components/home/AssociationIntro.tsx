import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

export function AssociationIntro() {
  return (
    <section className="manifesto" id="chi-siamo">
      <Reveal><SectionLabel>01 — L&apos;associazione</SectionLabel></Reveal>
      <Reveal className="manifesto-main">
        <h2>Facciamo spazio<br />alle persone, <em>per far crescere comunità.</em></h2>
        <div className="manifesto-aside">
          <p>
            Promuoviamo spazi di ascolto, sostegno e formazione in cui le persone
            possano ritrovare connessione, sviluppare risorse e affrontare insieme
            fragilità e sfide individuali e comunitarie.
          </p>
          <a className="text-link" href="#percorsi">Il nostro approccio <Arrow /></a>
        </div>
      </Reveal>
    </section>
  );
}
