import { contentLimits, type ProjectContent } from "../../shared/content-schema";

export type ProjectFieldName = "title" | "slug" | "subtitle" | "cover" | "coverAlt" | "intro" | "dateRange" | "location" | "audience";

export type ProjectRequirement = {
  field: ProjectFieldName;
  /** Etichetta uguale a quella del campo, così il messaggio d'errore indica un punto riconoscibile. */
  label: string;
  /** Sezione della pagina pubblica in cui finisce: serve per portare l'editor nel posto giusto. */
  step: 0 | 1;
  message: string;
  filled: (project: ProjectContent) => boolean;
};

const filled = (value: string | undefined) => Boolean(value?.trim());
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Stesse condizioni di validateProject in shared/content-schema.ts: qui servono per avvisare prima del salvataggio. */
export const projectRequirements: ProjectRequirement[] = [
  { field: "title", label: "Titolo", step: 0, message: "Serve il titolo del progetto.", filled: (project) => filled(project.title) },
  { field: "slug", label: "Indirizzo della pagina", step: 0, message: "L’indirizzo può contenere solo minuscole, numeri e trattini.", filled: (project) => slugPattern.test(project.slug) },
  { field: "subtitle", label: "Sottotitolo", step: 0, message: "Serve una riga che spieghi il progetto sotto il titolo.", filled: (project) => filled(project.subtitle) },
  { field: "cover", label: "Immagine di copertina", step: 0, message: "Scegli l’immagine che apre la pagina.", filled: (project) => filled(project.cover) },
  { field: "coverAlt", label: "Descrizione della copertina", step: 0, message: "Descrivi la copertina per chi non può vederla.", filled: (project) => filled(project.coverAlt) },
  { field: "dateRange", label: "Periodo", step: 1, message: "Indica il periodo: compare nella scheda del progetto.", filled: (project) => filled(project.dateRange) },
  { field: "location", label: "Luogo", step: 1, message: "Indica il luogo: compare nella scheda del progetto.", filled: (project) => filled(project.location) },
  { field: "audience", label: "Per chi", step: 1, message: "Indica a chi si rivolge: compare nella scheda del progetto.", filled: (project) => filled(project.audience) },
];

export const missingProjectFields = (project: ProjectContent) => projectRequirements.filter((requirement) => !requirement.filled(project));

export const missingInStep = (project: ProjectContent, step: 0 | 1) => missingProjectFields(project).filter((requirement) => requirement.step === step);

/**
 * Blocchi immagine senza file: il server li rifiuta con un messaggio generico, qui si vede
 * quale blocco è rimasto a metà. Restituisce le posizioni (1, 2, 3…) come si leggono nell'editor.
 */
export const emptyImageBlocks = (project: ProjectContent) => project.blocks
  .map((block, index) => ({ block, position: index + 1 }))
  .filter(({ block }) => block.type === "image" && !filled(block.src))
  .map(({ position }) => position);

/** Il primo tema compare nell'intestazione della pagina accanto allo stato, gli altri solo nella riga «Area». */
export const mainTheme = (themes: string[]) => themes[0] ?? "";
export const otherThemes = (themes: string[]) => themes.slice(1);
export const composeThemes = (main: string, others: string[]) => [main.trim(), ...others].filter(Boolean);

/**
 * Ripulitura leggera mentre si scrive l'indirizzo: toglie accenti e caratteri non ammessi,
 * ma lascia stare i trattini ai bordi. Rimuovendoli a ogni battitura, «laboratorio-di-quartiere»
 * diventerebbe «laboratoriodiquartiere»: il trattino sparirebbe un istante dopo averlo digitato.
 * La normalizzazione completa (normaliseProjectSlug) va fatta quando il campo perde il fuoco.
 */
export const slugWhileTyping = (input: string) => input
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, "-")
  .slice(0, contentLimits.project.slug);

/** Un invito a metà: lo schema pretende sia il testo sia la destinazione, o niente del tutto. */
export const incompleteCta = (project: ProjectContent) => {
  const cta = project.cta;
  if (!cta) return null;
  if (!cta.label.trim() && !cta.href.trim()) return null;
  if (!cta.label.trim()) return "L’invito finale ha una destinazione ma non il testo: scrivilo o svuota anche il collegamento.";
  if (!cta.href.trim()) return "L’invito finale ha un testo ma non porta da nessuna parte: aggiungi l’indirizzo o svuota anche il testo.";
  return null;
};

/**
 * Righe ripetibili lasciate a metà.
 *
 * I pulsanti «Aggiungi» creano righe vuote, che lo schema rifiuta: senza questi controlli
 * il salvataggio fallisce con il messaggio generico di contenuto non valido, e chi scrive
 * non ha modo di sapere quale riga guardare. Le righe del tutto vuote si tolgono in silenzio
 * (nessuno vuole salvarle), quelle a metà vanno segnalate.
 */
export type PairRow = { label: string; href: string };
export const dropEmptyPairs = <T extends PairRow>(rows: T[]) => rows.filter((row) => row.label.trim() || row.href.trim());
export const dropEmptyLines = (rows: string[]) => rows.filter((row) => row.trim());

export function incompletePair(rows: PairRow[], singolare: string) {
  const posizione = rows.findIndex((row) => Boolean(row.label.trim()) !== Boolean(row.href.trim()));
  if (posizione < 0) return null;
  const riga = rows[posizione];
  return riga.label.trim()
    ? `${singolare} ${posizione + 1}: manca l’indirizzo. Aggiungilo oppure svuota anche il nome.`
    : `${singolare} ${posizione + 1}: manca il nome. Scrivilo oppure svuota anche l’indirizzo.`;
}

/** Righe più lunghe di quanto lo schema accetti: il server le rifiuta senza dire quale. */
export function longLine(rows: string[], max: number, singolare: string) {
  const posizione = rows.findIndex((row) => row.trim().length > max);
  return posizione < 0 ? null : `${singolare} ${posizione + 1}: ${rows[posizione].trim().length} caratteri, il massimo è ${max}. Accorcialo o dividilo in due.`;
}

/** Dove sta il problema, per portare l'editor nel punto giusto: scheda (progetto esistente) o passo (creazione). */
export type ProjectProblem = {
  message: string;
  tab: "opening" | "overview" | "story" | "extra";
  step: 0 | 1 | 2;
  /** Campi da segnare in rosso, con il messaggio accanto a ognuno. */
  fields?: ProjectRequirement[];
  /** Blocchi del racconto da aprire e portare in vista (posizioni 1, 2, 3… come nell'editor). */
  blocks?: number[];
};

const problem = (message: string, tab: ProjectProblem["tab"], step: ProjectProblem["step"], extra: Partial<ProjectProblem> = {}): ProjectProblem => ({ message, tab, step, ...extra });

/**
 * Il primo problema che impedisce il salvataggio, e dove sistemarlo.
 *
 * Il server rifiuta tutte queste condizioni con un unico messaggio generico di contenuto non
 * valido: chi scrive resterebbe senza sapere quale campo guardare. I controlli sono in un posto
 * solo — invece che in fila dentro save() — e nell'ordine in cui si legge la pagina, così ogni
 * salvataggio riporta al punto più in alto rimasto indietro.
 */
export function firstProjectProblem(project: ProjectContent): ProjectProblem | null {
  const mancanti = missingProjectFields(project);
  if (mancanti.length) {
    const elenco = mancanti.map((requirement) => requirement.label.toLowerCase()).join(", ");
    return problem(`Manca ancora: ${elenco}.`, mancanti[0].step === 0 ? "opening" : "overview", mancanti[0].step, { fields: mancanti });
  }

  const senzaFoto = emptyImageBlocks(project);
  if (senzaFoto.length) {
    const messaggio = senzaFoto.length === 1
      ? `Il blocco ${senzaFoto[0]} del racconto è un’immagine senza foto: scegline una o elimina il blocco.`
      : `Blocchi ${senzaFoto.join(", ")} del racconto: sono immagini senza foto.`;
    return problem(messaggio, "story", 2, { blocks: senzaFoto });
  }

  for (const [indice, blocco] of project.blocks.entries()) {
    if (blocco.type !== "list") continue;
    const voceLunga = longLine(blocco.items, contentLimits.project.listItem, `Blocco ${indice + 1}, voce`);
    if (voceLunga) return problem(voceLunga, "story", 2, { blocks: [indice + 1] });
  }

  const risultatoLungo = longLine(project.outcomes, contentLimits.project.outcome, "Risultato");
  if (risultatoLungo) return problem(risultatoLungo, "story", 2);

  // le righe del tutto vuote le toglie il salvataggio: qui contano solo quelle a metà,
  // numerate come si vedono nell'editor (comprese le vuote in mezzo)
  const linkAMetà = incompletePair(project.links, "Link del progetto");
  if (linkAMetà) return problem(linkAMetà, "extra", 2);

  const invito = incompleteCta(project);
  if (invito) return problem(invito, "extra", 2);

  return null;
}
