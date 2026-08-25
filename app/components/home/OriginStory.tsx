import { Reveal } from "../ui/Reveal";
import { SectionLabel } from "../ui/SectionLabel";

export function OriginStory() {
  return (
    <section className="origin-story" aria-labelledby="origin-title">
      <Reveal className="origin-intro">
        <div>
          <SectionLabel>Perché Spazio Terzo</SectionLabel>
          <p className="origin-prelude">
            Il nome <mark>Spazio Terzo</mark> nasce da un’idea semplice e profonda:
          </p>
        </div>
        <h2 id="origin-title"><mark>il cambiamento autentico<br />avviene nell’incontro.</mark></h2>
      </Reveal>
      <div className="origin-grid">
        <Reveal className="origin-statement">
          <p>
            Non nello scontro, non nell’isolamento, ma in quello spazio nuovo che si
            crea quando due o più persone <mark>si confrontano, portando con sé mondi
            diversi.</mark> È un luogo dinamico, che non appartiene a nessuno dei
            partecipanti, ma emerge tra loro, come <mark>una scintilla che accende
            possibilità inedite.</mark>
          </p>
        </Reveal>
        <Reveal className="origin-identity" delay={0.14} amount={0.25}>
          <p>
            <mark>Spazio Terzo APS</mark> è un’associazione di promozione sociale
            senza scopo di lucro che opera a <mark>Catania</mark>, impegnata nella
            cura del benessere psicologico e relazionale attraverso il potere
            trasformativo del gruppo. Crediamo che la condivisione, il confronto e
            l’azione collettiva siano strumenti fondamentali per generare
            <mark> inclusione, crescita personale e cambiamento sociale.</mark>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
