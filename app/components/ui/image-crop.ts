import type { CSSProperties } from "react";
import { imageCropFocus, imageCropZoom, type ImageCrop } from "../../../shared/content-schema";

/** Stessa inquadratura salvata dal back office, riutilizzabile per qualunque immagine pubblica. */
export function imageCropStyle(crop?: ImageCrop): CSSProperties | undefined {
  if (!crop) return undefined;
  const focus = imageCropFocus(crop);
  const zoom = imageCropZoom(crop);
  return { objectPosition: `${focus.x}% ${focus.y}%`, transform: `scale(${zoom})`, transformOrigin: `${focus.x}% ${focus.y}%` };
}
