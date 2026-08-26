import { useEffect, useState } from "react";
import { AspectRatio, Button, Group, Image, Modal, SimpleGrid, Skeleton, Stack, Text, TextInput } from "@mantine/core";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { adminApi, type MediaAsset } from "./api";

type MediaValue = { url: string; alt: string; assetId?: string };

export function MediaPicker({ label, value, onChange, required = false, showPreview = true }: { label: string; value: MediaValue; onChange: (next: MediaValue) => void; required?: boolean; showPreview?: boolean }) {
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
    if (!value.alt.trim()) { notifications.show({ color: "orange", message: "Inserisci prima il testo alternativo dell’immagine." }); return; }
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
    <div className="field-intro"><div><Text fw={700} size="sm">{label}{required ? " *" : ""}</Text><Text c="dimmed" size="xs">Scegli dall’archivio o carica un file.</Text></div><Button variant="default" size="xs" onClick={() => setOpened(true)}>Scegli immagine</Button></div>
    <TextInput label="Testo alternativo" maxLength={180} value={value.alt} required={required} onChange={(event) => onChange({ ...value, alt: event.currentTarget.value })} />
    {showPreview && (value.url ? <AspectRatio ratio={16 / 8} className="media-current"><Image src={value.url} alt={value.alt} fit="cover" /></AspectRatio> : <div className="media-placeholder">Nessuna immagine selezionata</div>)}
    <Modal opened={opened} onClose={() => setOpened(false)} title="Archivio media" size="xl" centered>
      <Stack gap="md">
        <TextInput placeholder="Cerca nel testo alternativo…" value={search} onChange={(event) => setSearch(event.currentTarget.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} rightSection={<Button variant="subtle" size="compact-xs" onClick={() => void load()}>Cerca</Button>} />
        <Dropzone onDrop={upload} onReject={() => notifications.show({ color: "red", message: "Sono ammessi JPEG, PNG e WebP fino a 10 MB." })} accept={IMAGE_MIME_TYPE} maxSize={10 * 1024 * 1024} multiple={false} loading={uploading} className="media-dropzone">
          <Text ta="center" fw={600}>Trascina qui un’immagine oppure clicca per caricarla</Text><Text ta="center" c="dimmed" size="xs">JPEG, PNG o WebP · massimo 10 MB · usa il testo alternativo qui sopra</Text>
        </Dropzone>
        {loading ? <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">{Array.from({ length: 8 }, (_, index) => <Skeleton key={index} height={130} />)}</SimpleGrid> : assets.length ? <SimpleGrid cols={{ base: 2, sm: 3, md: 4 }} spacing="sm">{assets.map((asset) => <button className="media-tile" type="button" key={asset.id} onClick={() => select(asset)}><AspectRatio ratio={1}><Image src={asset.url} alt={asset.alt} fit="cover" /></AspectRatio><span>{asset.alt}</span></button>)}</SimpleGrid> : <div className="empty-media">Nessuna immagine trovata. Carica la prima.</div>}
        {nextCursor && <Group justify="center"><Button variant="default" size="xs" onClick={() => void load(true)} loading={loading}>Carica altre immagini</Button></Group>}
      </Stack>
    </Modal>
  </section>;
}
