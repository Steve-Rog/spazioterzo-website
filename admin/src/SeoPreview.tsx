import { Text } from "@mantine/core";
import type { SeoSnippet } from "./seo";

/** Mostra come il contenuto appare su Google e quando sta usando i ripieghi del sito. */
export function SeoPreview({ snippet, shareImage, shareAlt }: { snippet: SeoSnippet; shareImage?: string; shareAlt?: string }) {
  return <section className="seo-preview">
    <Text className="eyebrow">Come appare in ricerca</Text>
    <div className="seo-card">
      <span className="seo-url">{snippet.url}</span>
      <p className="seo-title">{snippet.title}</p>
      <p className="seo-description">{snippet.description}</p>
    </div>
    {(snippet.usesFallbackTitle || snippet.usesFallbackDescription) && <Text size="xs" c="dimmed">
      {snippet.usesFallbackTitle && snippet.usesFallbackDescription ? "Titolo e descrizione arrivano dai campi del contenuto: compila i campi SEO solo se vuoi testi diversi."
        : snippet.usesFallbackTitle ? "Il titolo arriva dal contenuto: compila «Titolo SEO» solo se vuoi un testo diverso."
        : "La descrizione arriva dal contenuto: compila «Descrizione SEO» solo se vuoi un testo diverso."}
    </Text>}
    {shareImage !== undefined && <div className="seo-share">
      <Text fw={700} size="sm">Immagine di condivisione</Text>
      {shareImage ? <img src={shareImage} alt={shareAlt ?? ""} /> : <div className="seo-share-empty">Nessuna immagine: social e messaggistica useranno la copertina del contenuto.</div>}
    </div>}
  </section>;
}
