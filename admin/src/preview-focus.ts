/**
 * Dove guarda l'anteprima mentre si compila una sezione.
 * I selettori sono quelli dei componenti pubblici: se cambiano lì, vanno aggiornati qui
 * (il test in anteprima.test.ts controlla che esistano davvero nel markup del sito).
 */

/** Schede dell'editor progetto → fascia della pagina pubblica. */
export const fuocoProgetto: Record<string, string | undefined> = {
  opening: ".project-detail-hero",
  overview: ".project-detail-overview",
  story: ".project-detail-story",
  extra: ".project-detail-notes",
  seo: undefined,
};

/** Sezioni della home nel back office → sezioni della home pubblica. */
export const fuocoHome: Record<string, string> = {
  apertura: ".hero",
  associazione: ".manifesto",
  "immagine-manifesto": ".image-statement",
  "perche-spazio-terzo": ".origin-story",
  attivita: ".services",
  territorio: ".territory",
  contatti: ".contact",
};

export const selettoreProgetto = (scheda: string | null) => (scheda ? fuocoProgetto[scheda] : undefined);
export const selettoreHome = (sezione: string | null) => (sezione ? fuocoHome[sezione] : undefined);
