import type { ContentEntity, EntityType, ProjectContent, SiteSettingsContent, TeamMemberContent } from "../../shared/content-schema";

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
  list: <T>(resource: "projects" | "team" | "site") => request<ContentEntity<T>[]>(`/v1/admin/${resource}`),
  save: <T>(resource: "projects" | "team" | "site", id: string | undefined, payload: T, displayOrder = 0) => request<ContentEntity<T>>(`/v1/admin/${resource}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ payload, displayOrder }) }),
  publish: <T>(resource: "projects" | "team" | "site", id: string) => request<ContentEntity<T>>(`/v1/admin/${resource}/${id}/publish`, { method: "POST" }),
  upload: async (file: File, alt: string) => {
    const data = new FormData(); data.set("file", file); data.set("alt", alt);
    return request<{ id: string; url: string; alt: string }>("/v1/admin/assets", { method: "POST", body: data });
  },
};

export type { ProjectContent, TeamMemberContent, SiteSettingsContent, ContentEntity, EntityType };
