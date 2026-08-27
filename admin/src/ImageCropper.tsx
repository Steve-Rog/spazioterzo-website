import { useEffect, useRef, useState, type CSSProperties } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { IconPencil, IconRefresh } from "@tabler/icons-react";
import { ActionIcon, Button, Group, Modal, Slider, Stack, Text, Tooltip } from "@mantine/core";
import type { ImageCrop } from "../../shared/content-schema";

const round = (value: number) => Math.round(value * 100) / 100;
const normalise = (area: Area): ImageCrop => ({ x: round(area.x), y: round(area.y), width: round(area.width), height: round(area.height) });
const zoomFor = (value?: ImageCrop) => value ? Math.max(1, Math.min(3, 100 / Math.min(value.width, value.height))) : 1;
const cropStyle = (value?: ImageCrop): CSSProperties | undefined => {
  if (!value) return undefined;
  const focusX = value.x + value.width / 2;
  const focusY = value.y + value.height / 2;
  return { objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoomFor(value)})`, transformOrigin: `${focusX}% ${focusY}%` };
};

type ImageCropperProps = {
  image: string;
  value?: ImageCrop;
  onChange: (value: ImageCrop | undefined) => void;
  title?: string;
  description?: string;
  aspect?: number;
  cropShape?: "rect" | "round";
  maxZoom?: number;
};

/** Reusable social-style image cropper. Changes are only committed when the editor is confirmed. */
export function ImageCropper({ image, value, onChange, title = "Ritaglio immagine", description = "Scegli la parte di foto che verrà mostrata sul sito.", aspect = 1, cropShape = "rect", maxZoom = 3 }: ImageCropperProps) {
  const [opened, setOpened] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(zoomFor(value));
  const [session, setSession] = useState(0);
  const areaRef = useRef<ImageCrop | undefined>(value);

  const resetDraft = (nextValue = value) => {
    setCrop({ x: 0, y: 0 });
    setZoom(zoomFor(nextValue));
    areaRef.current = nextValue;
    setSession((current) => current + 1);
  };

  useEffect(() => { resetDraft(value); }, [image]);

  if (!image) return <div className="crop-empty">Dopo aver scelto l’immagine, qui potrai sistemare l’inquadratura.</div>;

  const openEditor = () => { resetDraft(value); setOpened(true); };
  const cancel = () => { resetDraft(value); setOpened(false); };
  const confirm = () => { onChange(areaRef.current); setOpened(false); };
  const reset = () => { resetDraft(undefined); };

  return <section className="image-cropper">
    <div className="crop-heading"><div><Text fw={700} size="sm">{title}</Text><Text c="dimmed" size="xs">{description}</Text></div></div>
    <button type="button" className="crop-result" aria-label="Modifica il ritaglio dell’immagine" onClick={openEditor} style={{ "--crop-aspect": String(aspect) } as CSSProperties}>
      <img src={image} alt="Anteprima del ritaglio" style={cropStyle(value)} />
      <span><IconPencil size={15} stroke={1.9} /> Modifica ritaglio</span>
    </button>
    <Modal opened={opened} onClose={cancel} title={title} size="lg" centered classNames={{ content: "crop-modal" }}>
      <Stack gap="md">
        <Text size="sm" c="dimmed">Trascina la foto per posizionarla. Usa lo zoom solo se vuoi avvicinarti.</Text>
        <div className="crop-editor-stage" style={{ "--crop-aspect": String(aspect) } as CSSProperties}>
          <Cropper key={`${image}-${session}`} image={image} crop={crop} zoom={zoom} minZoom={1} maxZoom={maxZoom} aspect={aspect} cropShape={cropShape} showGrid={false} initialCroppedAreaPercentages={areaRef.current} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(percentages) => { areaRef.current = normalise(percentages); }} />
        </div>
        <Group gap="sm" wrap="nowrap" className="crop-zoom"><Text size="xs" c="dimmed">Zoom</Text><Slider aria-label="Zoom dell’immagine" min={1} max={maxZoom} step={0.01} value={zoom} onChange={setZoom} style={{ flex: 1 }} /></Group>
        <Group justify="space-between"><Tooltip label="Torna all’inquadratura iniziale"><ActionIcon type="button" aria-label="Ripristina ritaglio" variant="subtle" color="dark" onClick={reset}><IconRefresh size={18} stroke={1.8} /></ActionIcon></Tooltip><Group gap="xs"><Button type="button" variant="default" onClick={cancel}>Annulla</Button><Button type="button" color="orange" onClick={confirm}>Fatto</Button></Group></Group>
      </Stack>
    </Modal>
  </section>;
}
