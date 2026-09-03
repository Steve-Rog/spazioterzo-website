import type { ContentEntity } from "../../shared/content-schema";

export function statusLabel(state: ContentEntity["state"]) {
  return state === "published" ? "Pubblicato" : state === "archived" ? "Archiviato" : "Bozza";
}

export function changedSincePublication(entity?: ContentEntity) {
  return Boolean(entity?.draft && (!entity.published || JSON.stringify(entity.draft) !== JSON.stringify(entity.published)));
}

export function archiveDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
