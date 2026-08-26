import { plainText, type RichText } from "../../shared/content-schema";

export type FieldChange = { field: string; label: string; before: string; after: string };

const labels: Record<string, string> = {
  slug: "Slug URL", title: "Titolo", subtitle: "Sottotitolo", statusLabel: "Stato", dateRange: "Periodo", location: "Luogo", audience: "Destinatari",
  themes: "Temi", cover: "Copertina", coverAlt: "Testo alternativo copertina", intro: "Introduzione", objective: "Intenzione", blocks: "Blocchi del racconto",
  outcomes: "Risultati", links: "Link", video: "Video", cta: "Invito all’azione", partners: "Partner", funders: "Finanziatori", visibilityNote: "Nota di visibilità",
  relatedSlugs: "Progetti correlati", seoTitle: "Titolo SEO", seoDescription: "Descrizione SEO",
  name: "Nome", role: "Ruolo", image: "Ritratto", imageCrop: "Ritaglio del ritratto", bio: "Bio", quote: "Citazione", quoteAuthor: "Autore citazione",
  identity: "Identità e footer", home: "Home", seo: "SEO e condivisione",
};

// La lista vuota non è testo formattato: senza il controllo sulla lunghezza ogni array vuoto finirebbe descritto come «vuoto».
const isRichText = (value: unknown): value is RichText =>
  Array.isArray(value) && value.length > 0 && value.every((span) => Boolean(span) && typeof span === "object" && typeof (span as { text?: unknown }).text === "string");

/** Riassunto leggibile: il diff serve a decidere se ripristinare, non a leggere il JSON. */
export function describe(value: unknown): string {
  if (value === undefined || value === null || value === "") return "vuoto";
  if (typeof value === "string") return value.length > 120 ? `${value.slice(0, 119)}…` : value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isRichText(value)) { const text = plainText(value); return text.trim() ? describe(text) : "vuoto"; }
  if (Array.isArray(value)) {
    if (!value.length) return "nessun elemento";
    if (value.every((item) => typeof item === "string")) return describe(value.join(", "));
    return `${value.length} ${value.length === 1 ? "elemento" : "elementi"}`;
  }
  return "contenuto aggiornato";
}

export const labelFor = (field: string) => labels[field] ?? field;

/** Confronta due versioni dello stesso contenuto, campo per campo, ignorando l'ordine delle chiavi. */
export function diffContent(before: Record<string, unknown> | undefined, after: Record<string, unknown> | undefined): FieldChange[] {
  const fields = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])];
  const changes: FieldChange[] = [];
  for (const field of fields) {
    const previous = before?.[field];
    const next = after?.[field];
    if (JSON.stringify(previous ?? null) === JSON.stringify(next ?? null)) continue;
    changes.push({ field, label: labelFor(field), before: describe(previous), after: describe(next) });
  }
  return changes.sort((a, b) => a.label.localeCompare(b.label, "it"));
}
