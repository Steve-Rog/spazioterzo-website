import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Il sito deve reggere anche quando qualcosa non funziona: senza contenuti, senza JavaScript,
 * senza un tema. Sono letture del sorgente perché il comportamento vive nei componenti.
 */

const app = join(import.meta.dirname, "..", "app");
const leggi = (...parti: string[]) => readFileSync(join(app, ...parti), "utf8");

describe("quando i contenuti non arrivano", () => {
  it("mostra una pagina propria invece dell'errore di sistema", () => {
    const radice = leggi("root.tsx");
    expect(radice).toContain("export function ErrorBoundary");
    // i recapiti non possono venire dal CMS: è proprio il CMS a non rispondere
    expect(radice).toContain("defaultSiteSettings.identity");
    expect(radice).toContain("mailto:");
  });

  it("la pagina di un progetto sopravvive alla caduta dell'archivio", () => {
    // l'elenco serve solo alla fascia «Altri progetti»
    expect(leggi("routes", "project-detail.tsx")).toContain("getPublicProjects().catch(() => [])");
  });
});

describe("quando il JavaScript non arriva", () => {
  it("il contenuto non resta invisibile", () => {
    const reveal = leggi("components", "ui", "Reveal.tsx");
    // lo stato nascosto arriva dopo l'idratazione: altrimenti l'HTML esce con opacity 0
    expect(reveal).toContain("animate={anima ? (inVista ? { opacity: 1, y: 0 } : { opacity: 0, y: 26 }) : undefined}");
    expect(leggi("root.tsx")).toContain("<noscript>");
  });

  it("i titoli non restano sotto la loro maschera", () => {
    const titolo = leggi("components", "ui", "SplitHeading.tsx");
    // stessa regola del Reveal: senza `anima` nessuna parola viene spostata
    expect(titolo).toContain("animate={anima ? (inVista ? aperta : chiusa) : undefined}");
    expect(titolo).toContain("initial={anima ? chiusa : false}");
  });

  it("la fascia fotografica non resta ritagliata", () => {
    const fascia = leggi("components", "home", "ImageStatement.tsx");
    expect(fascia).toContain('animate={anima ? { clipPath: inVista ? "inset(0% 0% 0% 0%)" : "inset(16% 9% 16% 9%)" } : undefined}');
  });

  it("un initial che compare dopo l'idratazione porta con sé una key", () => {
    // framer-motion legge `initial` solo quando l'elemento compare: senza rimontaggio
    // l'entrata non parte mai. È il difetto che teneva ferme le animazioni.
    for (const parti of [["components", "home", "Hero.tsx"], ["components", "ui", "SplitHeading.tsx"]]) {
      const sorgente = leggi(...parti);
      expect(sorgente).toMatch(/initial=\{anima/);
      expect(sorgente).toMatch(/key=\{/);
    }
  });
});

describe("contenuti incompleti", () => {
  it("senza tema non resta un trattino appeso", () => {
    expect(leggi("components", "projects", "ProjectsArchive.tsx")).toContain("{Boolean(project.themes[0]) && <>");
    expect(leggi("components", "projects", "ProjectDetail.tsx")).toContain("{Boolean(project.themes[0]) && <>");
  });

  it("il collage delle persone regge più di tre ritratti", () => {
    const hero = leggi("components", "people", "PeopleHero.tsx");
    expect(hero).toContain("index % foregroundOffsets.length");
    expect(hero).toContain("index % portraitRotation.length");
    expect(hero).not.toContain("foregroundOffsets[index].x");
  });
});

describe("sezioni senza contenuto", () => {
  it("non restano in pagina con le etichette vuote", () => {
    const dettaglio = leggi("components", "projects", "ProjectDetail.tsx");
    // un array vuoto è comunque vero: senza la lunghezza restavano «Con .» e «Sostenuto da .»
    expect(dettaglio).toContain("project.partners?.length ?");
    expect(dettaglio).toContain("project.funders?.length ?");
    expect(dettaglio).toContain("{project.outcomes.length > 0 &&");
    expect(dettaglio).toContain("project.cta && project.cta.label.trim() && project.cta.href.trim() ?");
    expect(dettaglio).not.toContain("{project.partners && <p>Con");
  });
});

