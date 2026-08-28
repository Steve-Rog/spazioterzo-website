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
    // l'effetto si accende dopo l'idratazione: altrimenti l'HTML esce con opacity 0
    expect(reveal).toContain("initial={anima ? { opacity: 0, y: 26 } : false}");
    expect(leggi("root.tsx")).toContain("<noscript>");
  });
});

describe("contenuti incompleti", () => {
  it("senza tema non resta un trattino appeso", () => {
    expect(leggi("components", "projects", "ProjectsArchive.tsx")).toContain("{project.themes[0] && <>");
    expect(leggi("components", "projects", "ProjectDetail.tsx")).toContain("{project.themes[0] && <>");
  });

  it("il collage delle persone regge più di tre ritratti", () => {
    const hero = leggi("components", "people", "PeopleHero.tsx");
    expect(hero).toContain("index % foregroundOffsets.length");
    expect(hero).toContain("index % portraitRotation.length");
    expect(hero).not.toContain("foregroundOffsets[index].x");
  });
});
