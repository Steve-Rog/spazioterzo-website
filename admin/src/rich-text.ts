import type { JSONContent } from "@tiptap/react";
import type { RichText, RichTextMark } from "../../shared/content-schema";

/** Lo schema pubblico accetta solo /, #, http(s): e mailto:. Completiamo gli indirizzi scritti a mano. */
export function normaliseHref(value: string | undefined) {
  const href = (value ?? "").trim();
  if (!href) return "";
  if (href.startsWith("/") || href.startsWith("#") || /^(https?:|mailto:)/i.test(href)) return href;
  return href.includes("@") && !href.includes(" ") ? `mailto:${href}` : `https://${href}`;
}

/** RichText -> documento tiptap: un solo paragrafo, perché ogni campo è una riga di testo formattata. */
export function toDocument(value: RichText): JSONContent {
  const content = value
    .filter((span) => span.text.length > 0)
    .map((span) => ({
      type: "text",
      text: span.text,
      marks: (span.marks ?? []).map((mark) => mark === "link" ? { type: "link", attrs: { href: normaliseHref(span.href) } } : { type: mark }),
    }));
  return { type: "doc", content: [{ type: "paragraph", ...(content.length ? { content } : {}) }] };
}

/**
 * Documento tiptap -> RichText, scartando i marchi che il sito non sa rendere.
 *
 * Ogni campo è una riga sola, ma incollando un testo tiptap crea un paragrafo per riga:
 * leggendo solo il primo, tutto il resto sparirebbe al salvataggio senza che nessuno se
 * ne accorga. I paragrafi si uniscono con uno spazio.
 */
export function toRichText(document: JSONContent): RichText {
  const paragrafi = (document.content ?? []).filter((nodo) => nodo.type === "paragraph");
  const spans: RichText = [];
  for (const [indice, paragrafo] of paragrafi.entries()) {
    if (indice > 0 && spans.length) spans.push({ text: " " });
    for (const node of paragrafo.content ?? []) {
      if (node.type !== "text" || !node.text) continue;
      const marks: RichTextMark[] = [];
      let href: string | undefined;
      for (const mark of node.marks ?? []) {
        if (mark.type === "italic" || mark.type === "em") { if (!marks.includes("italic")) marks.push("italic"); }
        else if (mark.type === "highlight") { if (!marks.includes("highlight")) marks.push("highlight"); }
        else if (mark.type === "link") { if (!marks.includes("link")) marks.push("link"); href = normaliseHref(mark.attrs?.href as string | undefined); }
      }
      const span: RichText[number] = { text: node.text };
      if (marks.length) span.marks = marks;
      if (marks.includes("link")) span.href = href ?? "";
      spans.push(span);
    }
  }
  return spans.length ? spans : [{ text: "" }];
}

/** Più paragrafi in un campo che ne accetta uno: succede incollando, e va rimesso in riga. */
export const hasManyParagraphs = (document: JSONContent) => (document.content ?? []).filter((nodo) => nodo.type === "paragraph").length > 1;

export const sameContent = (a: RichText, b: RichText) => JSON.stringify(a) === JSON.stringify(b);

/** Ultima rete: testo entrato senza passare dalla tastiera (dettatura, incolla programmatico, estensioni). */
export function truncate(value: RichText, maxLength: number): RichText {
  let used = 0;
  const spans: RichText = [];
  for (const span of value) {
    const room = maxLength - used;
    if (room <= 0) break;
    const text = span.text.length <= room ? span.text : span.text.slice(0, room);
    spans.push({ ...span, text });
    used += text.length;
  }
  return spans.length ? spans : [{ text: "" }];
}
