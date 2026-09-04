import { useEffect, useRef, useState, type ReactNode } from "react";
import { ActionIcon, Badge, Button, Drawer, Group, Menu, Stack, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconArrowRight, IconDots } from "@tabler/icons-react";
import type { ContentEntity } from "../../../shared/content-schema";
import { adminApi, type AdminResource, type RevisionSummary } from "../api";
import { changedSincePublication, statusLabel } from "../content-status";
import { diffContent, type FieldChange } from "../diff";

export type EditorFrameProps = {
  title: string;
  eyebrow: string;
  entity?: ContentEntity;
  resource: AdminResource;
  isAdmin?: boolean;
  onBack?: () => void;
  onSave: () => void;
  saving: boolean;
  dirty?: boolean;
  preview: ReactNode;
  children: ReactNode;
  onRestored?: () => Promise<void>;
  onPublish?: (resource: AdminResource, id: string) => Promise<void>;
  onArchive?: (resource: AdminResource, id: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
};

export function EditorFrame({ title, eyebrow: _eyebrow, entity, resource, isAdmin = true, onBack, onSave, saving, dirty = false, preview, children, onPublish, onArchive, onDirtyChange, onRestored }: EditorFrameProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const notifyDirty = useRef(onDirtyChange);
  notifyDirty.current = onDirtyChange;
  useEffect(() => { notifyDirty.current?.(dirty); }, [dirty]);

  const salva = useRef(onSave);
  salva.current = onSave;
  useEffect(() => {
    const scorciatoia = (event: KeyboardEvent) => {
      if (event.key !== "s" || !(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      salva.current();
    };
    window.addEventListener("keydown", scorciatoia);
    return () => window.removeEventListener("keydown", scorciatoia);
  }, []);
  useEffect(() => () => notifyDirty.current?.(false), []);

  const readyToPublish = Boolean(entity && isAdmin && changedSincePublication(entity) && !dirty);
  const publicationMessage = !entity ? (dirty ? "Salva per creare la bozza" : "Bozza non ancora salvata") : dirty ? "Salva la bozza prima di pubblicare" : changedSincePublication(entity) ? entity.published ? "La bozza più recente non è ancora online" : "Questa bozza non è ancora online" : entity.published ? "Versione online aggiornata" : "Tutto salvato";

  return <section className="editor-view">
    <div className="editor-back"><Button variant="subtle" color="dark" size="xs" leftSection={<IconArrowLeft size={15} stroke={1.8} />} onClick={onBack}>Archivio</Button></div>
    <header className="editor-header">
      <div className="editor-identity">
        <h1>{title}</h1>
        <div className="editor-meta">
          <Badge className={`state state-${entity?.state ?? "draft"}`} variant="light">{entity?.published ? "Online" : entity ? statusLabel(entity.state) : "Nuova bozza"}</Badge>
          <Text size="xs" c={dirty || !entity || changedSincePublication(entity) ? "orange" : "teal"}>{publicationMessage}</Text>
          {entity && <Text size="xs" c="dimmed" className="editor-updated">salvato il {new Date(entity.updatedAt).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</Text>}
        </div>
      </div>
      <Group gap="xs" wrap="nowrap">
        <Button className="solo-schermi-stretti" variant="default" size="sm" onClick={() => setPreviewOpen(true)}>Anteprima</Button>
        <Button color="orange" variant={readyToPublish ? "default" : "filled"} size="sm" onClick={onSave} loading={saving} disabled={Boolean(entity) && !dirty}>{dirty ? "Salva bozza" : entity ? "Bozza salvata" : "Salva bozza"}</Button>
        {readyToPublish && <Button color="orange" size="sm" onClick={() => void onPublish?.(resource, entity!.id)}>Pubblica modifiche</Button>}
        {entity && isAdmin && <Menu position="bottom-end"><Menu.Target><ActionIcon aria-label="Altre azioni" variant="default" size="lg"><IconDots size={18} stroke={1.7} /></ActionIcon></Menu.Target><Menu.Dropdown><Menu.Item onClick={() => setRevisionsOpen(true)}>Cronologia revisioni</Menu.Item><Menu.Divider /><Menu.Item color="red" onClick={() => void onArchive?.(resource, entity.id)}>Archivia</Menu.Item></Menu.Dropdown></Menu>}
      </Group>
    </header>
    <div className="editor-surface"><div className="editor-main">{children}</div><aside className="editor-preview" aria-label="Anteprima della bozza"><div className="editor-preview-head"><Text size="xs" fw={600}>Anteprima della bozza</Text><Button variant="subtle" color="dark" size="xs" onClick={() => setPreviewOpen(true)}>Ingrandisci</Button></div><div className="editor-preview-frame"><div className="public-preview">{preview}</div></div></aside></div>
    <Drawer opened={previewOpen} onClose={() => setPreviewOpen(false)} title="Anteprima della bozza" position="right" size="100%"><div className="public-preview">{preview}</div></Drawer>
    {entity && <RevisionDrawer opened={revisionsOpen} onClose={() => setRevisionsOpen(false)} resource={resource} entity={entity} onRestored={onRestored} />}
  </section>;
}

function RevisionDrawer({ opened, onClose, resource, entity, onRestored }: { opened: boolean; onClose: () => void; resource: AdminResource; entity: ContentEntity; onRestored?: () => Promise<void> }) {
  const [revisions, setRevisions] = useState<RevisionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [openDiff, setOpenDiff] = useState<string | null>(null);
  const [changes, setChanges] = useState<FieldChange[] | null>(null);
  useEffect(() => { if (opened) void adminApi.revisions(resource, entity.id).then(setRevisions).catch((reason) => setError(reason instanceof Error ? reason.message : "Revisioni non disponibili")); }, [opened, resource, entity.id]);
  const current = (entity.draft ?? entity.published) as Record<string, unknown> | undefined;
  const compare = async (revisionId: string) => {
    if (openDiff === revisionId) { setOpenDiff(null); return; }
    setOpenDiff(revisionId); setChanges(null);
    try { setChanges(diffContent(await adminApi.revision<Record<string, unknown>>(resource, entity.id, revisionId), current)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Confronto non disponibile"); setOpenDiff(null); }
  };
  const restore = async (revisionId: string) => {
    if (!window.confirm("Ripristinare questa revisione come nuova bozza? La bozza attuale viene sostituita.")) return;
    try { await adminApi.restoreRevision(resource, entity.id, revisionId); onClose(); await onRestored?.(); notifications.show({ color: "teal", message: "Revisione ripristinata come nuova bozza." }); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Ripristino non riuscito"); }
  };
  return <Drawer opened={opened} onClose={onClose} title="Cronologia revisioni" position="right" size="md">
    {error && <Text c="red">{error}</Text>}
    {!revisions && !error && <Text c="dimmed">Caricamento…</Text>}
    <Stack gap="md">{revisions?.map((revision) => <div className="revision-entry" key={revision.id}><div className="revision-row"><div><Text fw={700}>Versione {revision.revisionNumber}</Text><Text size="xs" c="dimmed">{new Date(revision.createdAt).toLocaleString("it-IT")} · {revision.createdBy}</Text></div><Group gap="xs">{revision.isPublished && <Badge color="teal" variant="light">Pubblicata</Badge>}{revision.isDraft && <Badge color="gray" variant="light">Bozza</Badge>}<Button size="xs" variant="subtle" color="dark" onClick={() => void compare(revision.id)}>{openDiff === revision.id ? "Nascondi" : "Confronta"}</Button><Button size="xs" variant="default" disabled={revision.isDraft} onClick={() => void restore(revision.id)}>Ripristina</Button></Group></div>{openDiff === revision.id && <RevisionDiff changes={changes} />}</div>)}</Stack>
  </Drawer>;
}

function RevisionDiff({ changes }: { changes: FieldChange[] | null }) {
  if (!changes) return <Text size="xs" c="dimmed" className="revision-diff-empty">Carico il confronto…</Text>;
  if (!changes.length) return <Text size="xs" c="dimmed" className="revision-diff-empty">Nessuna differenza con la versione che stai modificando.</Text>;
  return <dl className="revision-diff">{changes.map((change) => <div key={change.field}><dt>{change.label}</dt><dd><span className="diff-before">{change.before}</span><IconArrowRight className="diff-arrow" size={14} stroke={1.7} aria-hidden="true" /><span className="diff-after">{change.after}</span></dd></div>)}</dl>;
}
