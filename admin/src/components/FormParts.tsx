import { createContext, useContext } from "react";
import { Text } from "@mantine/core";

/**
 * Acceso quando le sezioni stanno già dentro schede con il proprio titolo: in quel caso
 * l'intestazione ripeterebbe il nome della scheda, e resta solo la riga di spiegazione.
 */
export const SectionTitleContext = createContext(false);

/** Titolo di sezione con la sagoma del punto di pagina in cui finisce quello che si scrive. */
export function SectionHeading({ title, hint, shape }: { title: string; hint: string; shape: "hero" | "overview" | "story" | "outcomes" | "notes" | "cta" }) {
  const compatta = useContext(SectionTitleContext);
  return <div className="section-heading section-heading-mapped"><div>{!compatta && <h2>{title}</h2>}<p>{hint}</p></div><span className={`page-shape page-shape-${shape}`} aria-hidden="true" /></div>;
}

/** Quanto è lungo il testo rispetto al massimo: diventa arancione prima di arrivare al limite. */
export function FieldCounter({ length, max }: { length: number; max: number }) {
  return <Text size="xs" ta="right" c={length > max * .9 ? "orange" : "dimmed"} aria-live="polite">{length}/{max}</Text>;
}
