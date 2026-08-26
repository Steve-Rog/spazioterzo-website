import { createTheme } from "@mantine/core";

/** Stessi caratteri del sito pubblico; i colori vivono in styles.css come variabili condivise. */
export const adminTheme = createTheme({
  primaryColor: "orange",
  defaultRadius: "sm",
  fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
  fontFamilyMonospace: "'DM Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
  headings: { fontFamily: "'Playfair Display', Georgia, serif", fontWeight: "600" },
});
