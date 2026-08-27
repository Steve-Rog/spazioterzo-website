import type { ProjectContent } from "../../shared/content-schema";

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
