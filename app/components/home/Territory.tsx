import { Arrow } from "../ui/Arrow";
import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

export function Territory() {
  return (
    <section className="territory" id="territorio">
      <div className="territory-orbit" aria-hidden="true">
        <span>cura</span><span>rete</span><span>presenza</span><span>futuro</span>
      </div>
      <Reveal className="territory-copy">
        <SectionLabel>03 — Sul territorio</SectionLabel>
        <h2>La cura non è<br />un lusso.</h2>
        <p>
          È un diritto da costruire insieme, nei quartieri, nelle scuole, nelle
          famiglie. Per questo lavoriamo con le persone e con le realtà che ogni
          giorno fanno comunità.
        </p>
        <a className="button-dark" href="#contatti">Parliamone <Arrow /></a>
      </Reveal>
    </section>
  );
}
