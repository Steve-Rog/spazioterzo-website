import { useEffect, useRef } from "react";
import { Group, Text } from "@mantine/core";
import { RichTextEditor, Link } from "@mantine/tiptap";
import { useEditor, type JSONContent } from "@tiptap/react";
import type { EditorState } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import Highlight from "@tiptap/extension-highlight";
import { plainText, type RichText } from "../../shared/content-schema";
import { sameContent, toDocument, toRichText, truncate } from "./rich-text";

export function RichTextField({ label, value, onChange, maxLength = 600 }: { label: string; value: RichText; onChange: (value: RichText) => void; maxLength?: number }) {
  const total = plainText(value).length;
  const emitted = useRef<RichText>(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, bulletList: false, orderedList: false, listItem: false, blockquote: false, codeBlock: false, code: false, horizontalRule: false, bold: false, strike: false, hardBreak: false, link: false }),
      Link.configure({ openOnClick: false }),
      Highlight,
    ],
    content: toDocument(value),
    editorProps: {
      attributes: { "aria-label": label, class: "rich-input" },
      // Un campo = un paragrafo: l'a capo creerebbe nodi che lo schema non sa rappresentare.
      handleKeyDown: (view, event) => {
        if (event.key === "Enter") { event.preventDefault(); return true; }
        const typing = event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey;
        return Boolean(typing && atLimit(view.state, maxLength));
      },
      handlePaste: (view, event) => {
        const pasted = event.clipboardData?.getData("text/plain");
        if (!pasted) return false;
        const room = maxLength - view.state.doc.textContent.length + (view.state.selection.to - view.state.selection.from);
        if (pasted.length <= room) return false;
        event.preventDefault();
        if (room > 0) view.dispatch(view.state.tr.insertText(pasted.slice(0, room)));
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      let next = toRichText(instance.getJSON());
      if (plainText(next).length > maxLength) {
        next = truncate(next, maxLength);
        instance.commands.setContent(toDocument(next), { emitUpdate: false });
      }
      emitted.current = next;
      onChange(next);
    },
  });

  // Aggiornamenti che arrivano da fuori (reset del form, ripristino revisione, cambio entità).
  useEffect(() => {
    if (!editor || sameContent(value, emitted.current)) return;
    emitted.current = value;
    editor.commands.setContent(toDocument(value), { emitUpdate: false });
  }, [editor, value]);

  return <section className="rich-field">
    <Group justify="space-between">
      <Text fw={700} size="sm">{label}</Text>
      <Text size="xs" c={total > maxLength * .9 ? "orange" : "dimmed"} aria-live="polite">{total}/{maxLength}</Text>
    </Group>
    <RichTextEditor editor={editor} className="rich-editor">
      <RichTextEditor.Toolbar>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Italic title="Corsivo" aria-label={`Corsivo in ${label}`} />
          <RichTextEditor.Highlight title="Evidenziato" aria-label={`Evidenzia in ${label}`} />
          <RichTextEditor.Link title="Inserisci link" aria-label={`Inserisci un link in ${label}`} />
          <RichTextEditor.Unlink title="Togli il link" aria-label={`Togli il link in ${label}`} />
        </RichTextEditor.ControlsGroup>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.ClearFormatting title="Togli la formattazione" aria-label={`Togli la formattazione in ${label}`} />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>
      <RichTextEditor.Content />
    </RichTextEditor>
  </section>;
}

function atLimit(state: EditorState, maxLength: number) {
  const selected = state.selection.to - state.selection.from;
  return state.doc.textContent.length - selected >= maxLength;
}
