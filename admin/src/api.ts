import type { ContentEntity, EntityType, ProjectContent, SiteSettingsContent, TeamMemberContent } from "../../shared/content-schema";

export type AdminResource = "projects" | "team" | "site";
export type RevisionSummary = { id: string; revisionNumber: number; createdBy: string; createdAt: string; isDraft: boolean; isPublished: boolean };
export type AdminUser = { email: string; role: "admin" | "editor"; active: boolean; createdAt: string };
export type MediaAsset = { id: string; url: string; alt: string; contentType: string; byteSize: number; createdBy: string; createdAt: string };
export type MediaAssetPage = { items: MediaAsset[]; nextCursor: string | null };

const baseUrl = (import.meta.env.VITE_ADMIN_API_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");

function headers(extra: HeadersInit = {}) {
  const localEmail = window.localStorage.getItem("spazioterzo-dev-email");
  return { ...extra, ...(localEmail ? { "x-spazioterzo-dev-email": localEmail } : {}) };
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers: headers(init.headers) });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.error ?? "Operazione non riuscita");
  return response.json() as Promise<T>;
}

export const adminApi = {
  me: () => request<{ email: string; role: "admin" | "editor" }>("/v1/admin/me"),
  list: <T>(resource: AdminResource) => request<ContentEntity<T>[]>(`/v1/admin/${resource}`),
  save: <T>(resource: AdminResource, id: string | undefined, payload: T, displayOrder?: number) => request<ContentEntity<T>>(`/v1/admin/${resource}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload, ...(displayOrder === undefined ? {} : { displayOrder }) }) }),
  publish: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/publish`, { method: "POST" }),
  archive: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/archive`, { method: "POST" }),
  unarchive: <T>(resource: AdminResource, id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/unarchive`, { method: "POST" }),
  order: <T>(resource: AdminResource, id: string, displayOrder: number) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/order`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayOrder }) }),
  revisions: (resource: AdminResource, id: string) => request<RevisionSummary[]>(`/v1/admin/${resource}/${id}/revisions`),
  restoreRevision: <T>(resource: AdminResource, id: string, revisionId: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/revisions/${revisionId}/restore`, { method: "POST" }),
  users: () => request<AdminUser[]>("/v1/admin/users"),
  saveUser: (email: string, role: "admin" | "editor", active: boolean) => request<AdminUser[]>(`/v1/admin/users/${encodeURIComponent(email)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, active }) }),
  assets: (search = "", cursor?: string) => request<MediaAssetPage>(`/v1/admin/assets?${new URLSearchParams({ ...(search ? { q: search } : {}), ...(cursor ? { cursor } : {}) })}`),
  upload: async (file: File, alt: string) => {
    const data = new FormData(); data.set("file", file); data.set("alt", alt);
    return request<{ id: string; url: string; alt: string }>("/v1/admin/assets", { method: "POST", body: data });
  },
};

export type { ProjectContent, TeamMemberContent, SiteSettingsContent, ContentEntity, EntityType };
