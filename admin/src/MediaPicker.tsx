import { useEffect, useState } from "react";
import { AspectRatio, Button, Group, Image, Modal, SimpleGrid, Skeleton, Stack, Text, TextInput } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { IconPencil, IconPhotoPlus, IconTrash } from "@tabler/icons-react";
import { adminApi, type MediaAsset } from "./api";

type MediaValue = { url: string; alt: string; assetId?: string };

const fileSize = (bytes: number) => bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
const uploadDate = (value: string) => new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value.replace(" ", "T") + (value.endsWith("Z") ? "" : "Z")));

function MediaTile({ asset, onSelect, onRenamed, onDeleted }: { asset: MediaAsset; onSelect: () => void; onRenamed: (alt: string) => void; onDeleted: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [alt, setAlt] = useState(asset.alt);
  const [busy, setBusy] = useState(false);

  const rename = async () => {
    if (!alt.trim() || alt.trim() === asset.alt) { setRenaming(false); setAlt(asset.alt); return; }
    setBusy(true);
    try { const saved = await adminApi.updateAsset(asset.id, alt.trim()); onRenamed(saved.alt); setRenaming(false); notifications.show({ color: "teal", message: "Testo alternativo aggiornato." }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Modifica non riuscita" }); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!window.confirm("Eliminare questa immagine dall’archivio? L’operazione non si può annullare.")) return;
    setBusy(true);
    try { await adminApi.deleteAsset(asset.id); onDeleted(); notifications.show({ color: "orange", message: "Immagine eliminata." }); }
    catch (error) { notifications.show({ color: "red", message: error instanceof Error ? error.message : "Eliminazione non riuscita" }); }
    finally { setBusy(false); }
  };

  return <figure className="media-tile">
    <button type="button" className="media-tile-select" onClick={onSelect} disabled={busy}>
      <AspectRatio ratio={1}><Image src={asset.url} alt={asset.alt} fit="cover" /></AspectRatio>
      <span className="media-tile-alt">{asset.alt}</span>
    </button>
    <figcaption>
      <Text size="xs" c="dimmed">{fileSize(asset.byteSize)} · {uploadDate(asset.createdAt)}</Text>
      <Text size="xs" c="dimmed" lineClamp={1} title={asset.createdBy}>{asset.createdBy}</Text>
      {renaming
        ? <Group gap={6} wrap="nowrap"><TextInput aria-label={`Testo alternativo di ${asset.alt}`} size="xs" maxLength={180} value={alt} disabled={busy} onChange={(event) => setAlt(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") void rename(); if (event.key === "Escape") { setRenaming(false); setAlt(asset.alt); } }} /><Button size="xs" variant="default" loading={busy} onClick={() => void rename()}>Salva</Button></Group>
        : <Group gap={6}><Button size="xs" variant="subtle" color="dark" disabled={busy} leftSection={<IconPencil size={14} stroke={1.8} />} onClick={() => setRenaming(true)}>Rinomina</Button><Button size="xs" variant="subtle" color="red" loading={busy} leftSection={<IconTrash size={14} stroke={1.8} />} onClick={() => void remove()}>Elimina</Button></Group>}
    </figcaption>
  </figure>;
}

export function MediaPicker({ label, description, value, onChange, required = false, showPreview = true, altEditable = true, altHint, previewRatio = 16 / 8, previewFit = "cover", previewTone = "light" }: { label: string; description?: string; value: MediaValue; onChange: (next: MediaValue) => void; required?: boolean; showPreview?: boolean; altEditable?: boolean; altHint?: string; previewRatio?: number; previewFit?: "cover" | "contain"; previewTone?: "light" | "dark" }) {
  const [opened, setOpened] = useState(false);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async (append = false) => {
    setLoading(true);
    try {
      const page = await adminApi.assets(search, append ? nextCursor ?? undefined : undefined);
      setAssets((current) => append ? [...current, ...page.items] : page.items);
      setNextCursor(page.nextCursor);
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Archivio media non disponibile" });
    } finally { setLoading(false); }
  };
  useEffect(() => { if (opened) void load(); }, [opened]);

  const select = (asset: MediaAsset) => { onChange({ url: asset.url, alt: value.alt || asset.alt, assetId: asset.id }); setOpened(false); };
  const upload = async (files: File[]) => {
    const file = files[0]; if (!file) return;
    if (!value.alt.trim()) { notifications.show({ color: "orange", message: "Compila il testo alternativo qui sopra prima di caricare l’immagine." }); return; }
    setUploading(true);
    try {
      const asset = await adminApi.upload(file, value.alt);
      onChange({ url: asset.url, alt: asset.alt, assetId: asset.id });
      setOpened(false);
      notifications.show({ color: "teal", message: "Immagine caricata." });
    } catch (error) {
      notifications.show({ color: "red", message: error instanceof Error ? error.message : "Caricamento non riuscito" });
    } finally { setUploading(false); }
  };

  return <section className="media-field">
    <div className="field-intro"><div><Text fw={700} size="sm">{label}{required ? " *" : ""}</Text><Text c="dimmed" size="xs">{description ?? "Scegli dall’archivio o carica un file."}</Text></div><Button variant="default" size="xs" leftSection={<IconPhotoPlus size={15} stroke={1.7} />} onClick={() => setOpened(true)}>Scegli immagine</Button></div>
    {altEditable
      ? <TextInput label="Testo alternativo" maxLength={180} value={value.alt} required={required} onChange={(event) => onChange({ ...value, alt: event.currentTarget.value })} />
      : <div className="media-alt-readonly"><Text fw={600} size="sm">Testo alternativo</Text><Text size="sm">{value.alt}</Text><Text c="dimmed" size="xs">{altHint ?? "Generato automaticamente: non serve compilarlo."}</Text></div>}
    {showPreview && (value.url ? <AspectRatio ratio={previewRatio} className="media-current" data-tone={previewTone}><Image src={value.url} alt={value.alt} fit={previewFit} /></AspectRatio> : <div className="media-placeholder">Nessuna immagine selezionata</div>)}
    <Modal opened={opened} onClose={() => setOpened(false)} title="Archivio media" size="xl" centered>
      <Stack gap="md">
        <TextInput aria-label="Cerca nell’archivio media" placeholder="Cerca nel testo alternativo…" value={search} onChange={(event) => setSearch(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} rightSectionWidth={78} rightSection={<Button variant="subtle" size="xs" onClick={() => void load()}>Cerca</Button>} />
        {altEditable && <TextInput label="Testo alternativo" description="Descrivi l’immagine: serve prima di caricarne una nuova." maxLength={180} value={value.alt} onChange={(event) => onChange({ ...value, alt: event.currentTarget.value })} />}
        <Dropzone onDrop={upload} onReject={() => notifications.show({ color: "red", message: "Sono ammessi JPEG, PNG e WebP fino a 10 MB." })} accept={IMAGE_MIME_TYPE} maxSize={10 * 1024 * 1024} multiple={false} loading={uploading} className="media-dropzone">
          <Text ta="center" fw={600}>Trascina qui un’immagine oppure clicca per caricarla</Text><Text ta="center" c="dimmed" size="xs">JPEG, PNG o WebP · massimo 10 MB{altEditable ? " · compila prima il testo alternativo" : ""}</Text>
        </Dropzone>
        {loading ? <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} height={130} />)}</SimpleGrid> : assets.length ? <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">{assets.map((asset) => <MediaTile key={asset.id} asset={asset} onSelect={() => select(asset)} onRenamed={(alt) => setAssets((current) => current.map((item) => item.id === asset.id ? { ...item, alt } : item))} onDeleted={() => setAssets((current) => current.filter((item) => item.id !== asset.id))} />)}</SimpleGrid> : <div className="empty-media">Nessuna immagine trovata. Carica la prima.</div>}
        {nextCursor && <Group justify="center"><Button variant="default" size="xs" onClick={() => void load(true)} loading={loading}>Carica altre immagini</Button></Group>}
      </Stack>
    </Modal>
  </section>;
}
