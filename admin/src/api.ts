import type { ContentEntity, EntityType, ProjectContent, SiteSettingsContent, TeamMemberContent } from "../../shared/content-schema";

export type AdminResource = "projects" | "team" | "site";
export type RevisionSummary = { id: string; revisionNumber: number; createdBy: string; createdAt: string; isDraft: boolean; isPublished: boolean };
export type AdminUser = { email: string; role: "admin" | "editor"; active: boolean; createdAt: string };
export type MediaAsset = { id: string; url: string; alt: string; contentType: string; byteSize: number; createdBy: string; createdAt: string };
export type MediaAssetPage = { items: MediaAsset[]; nextCursor: string | null };

// In produzione l'admin e le API condividono admin.spazioterzo.it: niente CORS o
// cookie tra sottodomini. Durante lo sviluppo Vite continua invece a usare il Worker locale.
const baseUrl = (import.meta.env.VITE_ADMIN_API_URL ?? (import.meta.env.DEV ? "http://127.0.0.1:8787" : window.location.origin)).replace(/\/$/, "");

function headers(extra: HeadersInit = {}) {
  const localEmail = window.localStorage.getItem("spazioterzo-dev-email");
  return { ...extra, ...(localEmail ? { "x-spazioterzo-dev-email": localEmail } : {}) };
}

/** Distingue «il server ha risposto male» da «il server non risponde»: le due cose si raccontano in modo diverso. */
export class ConnessioneAssente extends Error {
  constructor(message = "Non riesco a contattare il server dei contenuti.") { super(message); this.name = "ConnessioneAssente"; }
}

/** Il server ha risposto «non sei tu»: in produzione vuol dire che la sessione Access è scaduta. */
export class AccessoNegato extends Error {
  constructor(message = "La sessione è scaduta.") { super(message); this.name = "AccessoNegato"; }
}

const TIMEOUT_MS = 12_000;

async function request<T>(path: string, init: RequestInit = {}) {
  let response: Response;
  try {
    // senza scadenza una richiesta lasciata a metà tiene la schermata in caricamento per sempre
    response = await fetch(`${baseUrl}${path}`, { ...init, headers: headers(init.headers), signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ConnessioneAssente();
  }
  if (!response.ok) {
    const messaggio = (await response.json().catch(() => null))?.error;
    if (response.status === 401 || response.status === 403) throw new AccessoNegato(messaggio ?? undefined);
    throw new Error(messaggio ?? "Operazione non riuscita");
  }
  return response.json() as Promise<T>;
}

export const adminApi = {
  me: () => request<{ email: string; role: "admin" | "editor" }>("/v1/admin/me"),
  list: <T>(resource: AdminResource) => request<ContentEntity<T>[]>(`/v1/admin/${resource}`),
  save: <T>(resource: AdminResource, id: string | undefined, payload: T, displayOrder?: number, expectedUpdatedAt?: string) => request<ContentEntity<T>>(`/v1/admin/${resource}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload, ...(displayOrder === undefined ? {} : { displayOrder }), ...(expectedUpdatedAt ? { expectedUpdatedAt } : {}) }) }),
  publish: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/publish`, { method: "POST" }),
  archive: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/archive`, { method: "POST" }),
  unarchive: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/unarchive`, { method: "POST" }),
  order: <T>(resource: AdminResource, id: string, displayOrder: number) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayOrder }) }),
  swap: <T>(resource: AdminResource, id: string, otherId: string) => request<ContentEntity<T>[]>(`/v1/admin/${resource}/${id}/swap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ otherId }) }),
  revisions: (resource: AdminResource, id: string) => request<RevisionSummary[]>(`/v1/admin/${resource}/${id}/revisions`),
  revision: <T>(resource: AdminResource, id: string, revisionId: string) => request<T>(`/v1/admin/${resource}/${id}/revisions/${revisionId}`),
  restoreRevision: <T>(resource: AdminResource, id: string, revisionId: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/revisions/${revisionId}/restore`, { method: "POST" }),
  users: () => request<AdminUser[]>("/v1/admin/users"),
  saveUser: (email: string, role: "admin" | "editor", active: boolean) => request<AdminUser[]>(`/v1/admin/users/${encodeURIComponent(email)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, active }) }),
  assets: (search = "", cursor?: string) => request<MediaAssetPage>(`/v1/admin/assets?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(cursor ? { cursor } : {}) })}`),
  updateAsset: (id: string, alt: string) => request<{ id: string; alt: string }>(`/v1/admin/assets/${encodeURIComponent(id)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ alt }) }),
  deleteAsset: (id: string) => request<{ id: string }>(`/v1/admin/assets/${encodeURIComponent(id)}`, { method: "DELETE" }),
  upload: async (file: File, alt: string) => {
    const data = new FormData(); data.set("file", file); data.set("alt", alt);
    return request<{ id: string; url: string; alt: string }>("/v1/admin/assets", { method: "POST", body: data });
  },
};

export type { ProjectContent, TeamMemberContent, SiteSettingsContent, ContentEntity, EntityType };
