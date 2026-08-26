import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ActionIcon, Button, Group, Slider, Stack, Text, Tooltip } from "@mantine/core";
import type { ImageCrop } from "../../shared/content-schema";

const round = (value: number) => Math.round(value * 100) / 100;
const normalise = (area: Area): ImageCrop => ({ x: round(area.x), y: round(area.y), width: round(area.width), height: round(area.height) });
const zoomFor = (value?: ImageCrop) => value ? Math.max(1, Math.min(3, 100 / Math.min(value.width, value.height))) : 1;

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

/** A reusable, editor-friendly crop control. Persist the returned percentage crop with the image content. */
export function ImageCropper({ image, value, onChange, title = "Inquadratura", description = "Sposta la foto nell’area e regola lo zoom.", aspect = 1, cropShape = "rect", maxZoom = 3 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(zoomFor(value));
  const areaRef = useRef<ImageCrop | undefined>(value);
  const initialArea = useMemo(() => value, [image]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(zoomFor(value));
    areaRef.current = value;
  }, [image]);

  if (!image) return <div className="crop-empty">Scegli prima un’immagine: qui potrai decidere esattamente cosa sarà visibile sul sito.</div>;

  const reset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    areaRef.current = undefined;
    onChange(undefined);
  };
  const adjustZoom = (next: number) => {
    const bounded = Math.max(1, Math.min(maxZoom, Math.round(next * 100) / 100));
    setZoom(bounded);
  };

  return <section className="image-cropper">
    <div className="crop-heading">
      <div><Text fw={700} size="sm">{title}</Text><Text c="dimmed" size="xs">{description}</Text></div>
      {value && <Button variant="subtle" color="dark" size="compact-sm" onClick={reset}>Ripristina</Button>}
    </div>
    <div className="crop-stage" style={{ "--crop-aspect": String(aspect) } as CSSProperties}>
      <Cropper image={image} crop={crop} zoom={zoom} aspect={aspect} cropShape={cropShape} showGrid={false} initialCroppedAreaPercentages={initialArea} onCropChange={setCrop} onZoomChange={adjustZoom} onCropComplete={(percentages) => { areaRef.current = normalise(percentages); }} onInteractionEnd={() => onChange(areaRef.current)} />
      <div className="crop-stage-label">Area visibile sul sito</div>
    </div>
    <Stack gap={7} className="crop-controls">
      <div className="crop-steps"><span><b>1</b> Trascina per centrare</span><span><b>2</b> Regola lo zoom</span></div>
      <Group gap="sm" wrap="nowrap"><Tooltip label="Riduci zoom"><ActionIcon aria-label="Riduci zoom" variant="default" onClick={() => adjustZoom(zoom - .1)}>−</ActionIcon></Tooltip><Slider aria-label="Zoom dell’immagine" min={1} max={maxZoom} step={0.01} value={zoom} onChange={adjustZoom} onChangeEnd={() => onChange(areaRef.current)} style={{ flex: 1 }} /><Tooltip label="Aumenta zoom"><ActionIcon aria-label="Aumenta zoom" variant="default" onClick={() => adjustZoom(zoom + .1)}>+</ActionIcon></Tooltip></Group>
      <Text size="xs" c="dimmed">Le modifiche dell’inquadratura si salvano nella bozza.</Text>
    </Stack>
  </section>;
}
