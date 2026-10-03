import type { RichText as RichTextValue } from "../../../shared/content-schema";

export type RichTextInput = RichTextValue | string;

export function RichText({ value }: { value: RichTextInput }) {
  const spans = typeof value === "string" ? [{ text: value }] : value;
  return <>{spans.map((span, index) => {
    let content: React.ReactNode = span.text.replace(/\r\n?/g, "\n").split("\n").flatMap((part, partIndex) => partIndex === 0 ? [part] : [<br key={`break-${index}-${partIndex}`} />, part]);
    if (span.marks?.includes("italic")) content = <em>{content}</em>;
    if (span.marks?.includes("highlight")) content = <mark>{content}</mark>;
    if (span.marks?.includes("link") && span.href) content = <a className="rich-text-link" href={span.href}>{content}</a>;
    return <span key={`${span.text}-${index}`}>{content}</span>;
  })}</>;
}
