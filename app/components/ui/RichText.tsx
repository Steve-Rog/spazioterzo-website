import type { RichText as RichTextValue } from "../../../shared/content-schema";

export function RichText({ value }: { value: RichTextValue }) {
  return <>{value.map((span, index) => {
    let content: React.ReactNode = span.text;
    if (span.marks?.includes("italic")) content = <em>{content}</em>;
    if (span.marks?.includes("highlight")) content = <mark>{content}</mark>;
    if (span.marks?.includes("link") && span.href) content = <a href={span.href}>{content}</a>;
    return <span key={`${span.text}-${index}`}>{content}</span>;
  })}</>;
}
