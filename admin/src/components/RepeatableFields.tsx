import { Button, Text, Textarea } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { asRichText, plainText, type RichText } from "../../../shared/content-schema";
import { RichTextField } from "../RichTextField";

export function RichTextList({ label, values, onChange, maxLength = 600 }: { label: string; values: RichText[]; onChange: (values: RichText[]) => void; maxLength?: number }) {
  return <section className="rich-list"><Text fw={700} size="sm">{label}</Text>{values.map((value, index) => <div className="paragraph-edit" key={index}><RichTextField label={`Paragrafo ${index + 1}`} maxLength={maxLength} value={value} onChange={(next) => onChange(values.map((paragraph, itemIndex) => itemIndex === index ? next : paragraph))} />{values.length > 1 && <Button variant="subtle" color="red" size="xs" leftSection={<IconTrash size={15} stroke={1.8} />} onClick={() => { if (plainText(value).trim() && !window.confirm(`Eliminare il paragrafo ${index + 1}? Il testo va perso.`)) return; onChange(values.filter((_, itemIndex) => itemIndex !== index)); }}>Rimuovi paragrafo</Button>}</div>)}<Button variant="subtle" color="dark" size="xs" leftSection={<IconPlus size={15} stroke={1.8} />} onClick={() => onChange([...values, asRichText("")])}>Aggiungi paragrafo</Button></section>;
}

export function LinesField({ label, description, values, onChange, maxLength, minRows = 4 }: { label: string; description?: string; values: string[]; onChange: (values: string[]) => void; maxLength?: number; minRows?: number }) {
  const [text, setText] = useState(() => values.join("\n"));
  useEffect(() => { setText((current) => current.split("\n").map((item) => item.trim()).filter(Boolean).join("\n") === values.join("\n") ? current : values.join("\n")); }, [values]);
  return <Textarea label={label} description={description} maxLength={maxLength} autosize minRows={minRows} value={text} onChange={(event) => { const next = event.currentTarget.value; setText(next); onChange(next.split("\n").map((item) => item.trim()).filter(Boolean)); }} />;
}
