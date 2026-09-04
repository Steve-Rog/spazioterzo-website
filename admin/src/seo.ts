/** Ricalca ciò che il sito pubblica in app/routes/project-detail.tsx: titolo con suffisso, descrizione con ripiego sul sottotitolo. */
export type SeoSnippet = { title: string; description: string; url: string; usesFallbackTitle: boolean; usesFallbackDescription: boolean };

const GOOGLE_TITLE_CHARS = 60;
const GOOGLE_DESCRIPTION_CHARS = 155;

export const clampSnippet = (value: string, max: number) => value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

export function projectSnippet({ slug, title, subtitle, seoTitle, seoDescription, suffix, origin = "spazioterzo.it" }: {
  slug: string; title: string; subtitle: string; seoTitle?: string; seoDescription?: string; suffix: string; origin?: string;
}): SeoSnippet {
  const chosenTitle = seoTitle?.trim() || title.trim() || "Titolo progetto";
  const chosenDescription = seoDescription?.trim() || subtitle.trim() || "La descrizione arriva dal sottotitolo del progetto.";
  return {
    title: clampSnippet(suffix.trim() ? `${chosenTitle} — ${suffix.trim()}` : chosenTitle, GOOGLE_TITLE_CHARS),
    description: clampSnippet(chosenDescription, GOOGLE_DESCRIPTION_CHARS),
    url: `${origin}/progetti/${slug.trim() || "slug-del-progetto"}`,
    usesFallbackTitle: !seoTitle?.trim(),
    usesFallbackDescription: !seoDescription?.trim(),
  };
}

export function siteSnippet({ suffix, description, origin = "spazioterzo.it" }: { suffix: string; description: string; origin?: string }): SeoSnippet {
  const pageTitle = "Psicologia, psicoterapia, comunità";
  return {
    title: clampSnippet(suffix.trim() ? `${pageTitle} — ${suffix.trim()}` : pageTitle, GOOGLE_TITLE_CHARS),
    description: clampSnippet(description.trim() || "Aggiungi la descrizione predefinita del sito.", GOOGLE_DESCRIPTION_CHARS),
    url: origin,
    usesFallbackTitle: !suffix.trim(),
    usesFallbackDescription: !description.trim(),
  };
}
