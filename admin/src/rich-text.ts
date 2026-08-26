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

/** Documento tiptap -> RichText, scartando i marchi che il sito non sa rendere. */
export function toRichText(document: JSONContent): RichText {
  const nodes = document.content?.[0]?.content ?? [];
  const spans: RichText = [];
  for (const node of nodes) {
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
  return spans.length ? spans : [{ text: "" }];
}

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
