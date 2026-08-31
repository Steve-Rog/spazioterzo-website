import type { CSSProperties } from "react";
import type { ImageCrop } from "../../../shared/content-schema";

/** Stessa inquadratura salvata dal back office, riutilizzabile per qualunque immagine pubblica. */
export function imageCropStyle(crop?: ImageCrop): CSSProperties | undefined {
  if (!crop) return undefined;
  const focusX = crop.x + crop.width / 2;
  const focusY = crop.y + crop.height / 2;
  const zoom = Math.max(1, Math.min(3, 100 / Math.min(crop.width, crop.height)));
  return { objectPosition: `${focusX}% ${focusY}%`, transform: `scale(${zoom})`, transformOrigin: `${focusX}% ${focusY}%` };
}
