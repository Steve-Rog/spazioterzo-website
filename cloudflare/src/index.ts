import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_BYTES, MAX_TEAM_MEMBERS, type ContentEntity, type ContentState, type EntityType, type ProjectContent, type SiteSettingsContent, type TeamMemberContent, validateContent } from "../../shared/content-schema";
import { authenticateAdmin, requireAdmin, type AdminIdentity } from "./auth";
import { seedDevelopmentDatabase } from "./seed";

type EntityRow = {
  id: string;
  entity_type: EntityType;
  slug: string;
  display_order: number;
  state: ContentState;
  draft_revision_id: string | null;
  published_revision_id: string | null;
  updated_at: string;
};

type RevisionRow = { id: string; payload: string };

const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, init);
const publicHeaders = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600", "Access-Control-Allow-Origin": "*" };
const uuid = () => crypto.randomUUID();

function withCors(response: Response, request: Request, env: Env, isAdmin = false) {
  const headers = new Headers(response.headers);
  if (isAdmin) {
    const origin = request.headers.get("Origin");
    if (origin && (origin === env.ADMIN_ORIGIN || env.ENVIRONMENT === "development")) headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  } else headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Cf-Access-Jwt-Assertion, x-spazioterzo-dev-email");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function revision(env: Env, id: string | null) {
  if (!id) return null;
  const row = await env.DB.prepare("SELECT id, payload FROM content_revisions WHERE id = ?").bind(id).first<RevisionRow>();
  if (!row) return null;
  return JSON.parse(row.payload);
}

async function hydrateEntity<T>(env: Env, row: EntityRow): Promise<ContentEntity<T>> {
  return {
    id: row.id,
    type: row.entity_type,
    slug: row.slug,
    displayOrder: row.display_order,
    state: row.state,
    draft: await revision(env, row.draft_revision_id) as T | null,
    published: await revision(env, row.published_revision_id) as T | null,
    updatedAt: row.updated_at,
  };
}

async function listEntities<T>(env: Env, type: EntityType, publicOnly = false) {
  const where = publicOnly ? "AND state = 'published' AND published_revision_id IS NOT NULL" : "";
  const { results } = await env.DB.prepare(`SELECT * FROM content_entities WHERE entity_type = ? ${where} ORDER BY display_order, updated_at DESC`).bind(type).all<EntityRow>();
  return Promise.all(results.map((row) => hydrateEntity<T>(env, row)));
}

async function findEntity<T>(env: Env, type: EntityType, idOrSlug: string, publicOnly = false) {
  const where = publicOnly ? "AND state = 'published' AND published_revision_id IS NOT NULL" : "";
  const row = await env.DB.prepare(`SELECT * FROM content_entities WHERE entity_type = ? AND (id = ? OR slug = ?) ${where}`).bind(type, idOrSlug, idOrSlug).first<EntityRow>();
  return row ? hydrateEntity<T>(env, row) : null;
}

async function audit(env: Env, actor: string, action: string, entityId?: string, metadata?: unknown) {
  await env.DB.prepare("INSERT INTO audit_events (id, actor_email, action, entity_id, metadata) VALUES (?, ?, ?, ?, ?)")
    .bind(uuid(), actor, action, entityId ?? null, metadata ? JSON.stringify(metadata) : null).run();
}

async function saveDraft(env: Env, actor: AdminIdentity, type: EntityType, id: string | undefined, payload: unknown, displayOrder = 0) {
  if (!validateContent(type, payload)) return json({ error: "Contenuto non valido" }, { status: 422 });
  const typedPayload = payload as ProjectContent | TeamMemberContent | SiteSettingsContent;
  const slug = type === "project" ? (typedPayload as ProjectContent).slug : type === "site" ? "site" : slugify((typedPayload as TeamMemberContent).name);
  let entity = id ? await findEntity(env, type, id) : null;

  if (!entity) {
    if (type === "team_member") {
      const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM content_entities WHERE entity_type = 'team_member' AND state != 'archived'").first<{ total: number }>();
      if ((count?.total ?? 0) >= MAX_TEAM_MEMBERS) return json({ error: `Il team può avere al massimo ${MAX_TEAM_MEMBERS} persone.` }, { status: 422 });
    }
    const entityId = id ?? uuid();
    await env.DB.prepare("INSERT INTO content_entities (id, entity_type, slug, display_order) VALUES (?, ?, ?, ?)").bind(entityId, type, slug, displayOrder).run();
    entity = await findEntity(env, type, entityId);
  }
  if (!entity) return json({ error: "Impossibile salvare il contenuto" }, { status: 500 });

  const previous = await env.DB.prepare("SELECT MAX(revision_number) AS revision FROM content_revisions WHERE entity_id = ?").bind(entity.id).first<{ revision: number | null }>();
  const revisionId = uuid();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO content_revisions (id, entity_id, revision_number, payload, created_by) VALUES (?, ?, ?, ?, ?)")
      .bind(revisionId, entity.id, (previous?.revision ?? 0) + 1, JSON.stringify(payload), actor.email),
    env.DB.prepare("UPDATE content_entities SET slug = ?, display_order = ?, draft_revision_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(slug, displayOrder, revisionId, entity.id),
  ]);
  await audit(env, actor.email, "draft_saved", entity.id, { type });
  return json(await findEntity(env, type, entity.id));
}

async function publish(env: Env, actor: AdminIdentity, type: EntityType, id: string) {
  const entity = await findEntity(env, type, id);
  if (!entity?.draft) return json({ error: "Bozza non trovata" }, { status: 404 });
  const row = await env.DB.prepare("SELECT draft_revision_id FROM content_entities WHERE id = ?").bind(entity.id).first<{ draft_revision_id: string }>();
  await env.DB.prepare("UPDATE content_entities SET state = 'published', published_revision_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(row?.draft_revision_id, entity.id).run();
  await audit(env, actor.email, "published", entity.id, { type });
  return json(await findEntity(env, type, entity.id));
}

function slugify(input: string) {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uuid();
}

async function handleAsset(request: Request, env: Env, actor: AdminIdentity) {
  const form = await request.formData();
  const file = form.get("file");
  const alt = form.get("alt");
  if (!(file instanceof File) || typeof alt !== "string" || !alt.trim()) return json({ error: "File e testo alternativo sono obbligatori" }, { status: 422 });
  if (!ACCEPTED_MEDIA_TYPES.includes(file.type as typeof ACCEPTED_MEDIA_TYPES[number])) return json({ error: "Formato non consentito" }, { status: 422 });
  if (file.size > MAX_MEDIA_BYTES) return json({ error: "Il file supera 10 MB" }, { status: 422 });
  const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const objectKey = `${new Date().toISOString().slice(0, 7)}/${uuid()}.${extension}`;
  await env.MEDIA.put(objectKey, file.stream(), { httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" } });
  const id = uuid();
  const publicUrl = `${env.PUBLIC_MEDIA_BASE_URL.replace(/\/$/, "")}/${objectKey}`;
  await env.DB.prepare("INSERT INTO assets (id, object_key, public_url, alt_text, content_type, byte_size, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id, objectKey, publicUrl, alt.trim(), file.type, file.size, actor.email).run();
  await audit(env, actor.email, "asset_uploaded", id, { objectKey });
  return json({ id, url: publicUrl, alt: alt.trim() }, { status: 201 });
}

async function serveLocalMedia(pathname: string, env: Env) {
  if (env.ENVIRONMENT !== "development") return null;
  const key = pathname.replace(/^\/media\//, "");
  const object = await env.MEDIA.get(key);
  if (!object) return json({ error: "Media non trovato" }, { status: 404 });
  const headers = new Headers({ "Cache-Control": "public, max-age=31536000, immutable" });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (pathname.startsWith("/media/")) return (await serveLocalMedia(pathname, env)) ?? json({ error: "Non trovato" }, { status: 404 });
  if (pathname === "/health") return json({ status: "ok", environment: env.ENVIRONMENT });
  if (pathname === "/v1/development/seed" && request.method === "POST") {
    if (env.ENVIRONMENT !== "development" || request.headers.get("x-spazioterzo-seed") !== "local-only") return json({ error: "Non trovato" }, { status: 404 });
    return json(await seedDevelopmentDatabase(env), { status: 201 });
  }

  if (pathname === "/v1/public/site" && request.method === "GET") {
    const entity = await findEntity<SiteSettingsContent>(env, "site", "site", true);
    return json(entity?.published ?? null, { headers: publicHeaders });
  }
  if (pathname === "/v1/public/projects" && request.method === "GET") {
    const projects = await listEntities<ProjectContent>(env, "project", true);
    return json(projects.map((project) => ({ ...project.published, id: project.id, slug: project.slug, displayOrder: project.displayOrder })), { headers: publicHeaders });
  }
  if (pathname.startsWith("/v1/public/projects/") && request.method === "GET") {
    const slug = decodeURIComponent(pathname.slice("/v1/public/projects/".length));
    const project = await findEntity<ProjectContent>(env, "project", slug, true);
    return project?.published ? json({ ...project.published, id: project.id, slug: project.slug, displayOrder: project.displayOrder }, { headers: publicHeaders }) : json({ error: "Non trovato" }, { status: 404 });
  }
  if (pathname === "/v1/public/team" && request.method === "GET") {
    const team = await listEntities<TeamMemberContent>(env, "team_member", true);
    return json(team.map((member) => ({ id: member.id, displayOrder: member.displayOrder, ...member.published })), { headers: publicHeaders });
  }

  if (!pathname.startsWith("/v1/admin/")) return json({ error: "Non trovato" }, { status: 404 });
  const identity = await authenticateAdmin(request, env);
  const unauthorized = requireAdmin(identity);
  if (unauthorized) return unauthorized;

  if (pathname === "/v1/admin/me" && request.method === "GET") return json(identity);
  if (pathname === "/v1/admin/assets" && request.method === "POST") return handleAsset(request, env, identity!);

  const match = pathname.match(/^\/v1\/admin\/(projects|team|site)(?:\/([^/]+))?(?:\/(publish))?$/);
  if (!match) return json({ error: "Non trovato" }, { status: 404 });
  const [, resource, id, action] = match;
  const type: EntityType = resource === "projects" ? "project" : resource === "team" ? "team_member" : "site";

  if (request.method === "GET" && !id) return json(await listEntities(env, type));
  if (request.method === "GET" && id) {
    const entity = await findEntity(env, type, id);
    return entity ? json(entity) : json({ error: "Non trovato" }, { status: 404 });
  }
  if (request.method === "POST" && action === "publish" && id) {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? publish(env, identity!, type, id);
  }
  if ((request.method === "POST" && !id) || (request.method === "PUT" && id)) {
    const body = await request.json<{ payload?: unknown; displayOrder?: number }>();
    return saveDraft(env, identity!, type, id, body.payload, body.displayOrder ?? 0);
  }
  return json({ error: "Metodo non consentito" }, { status: 405 });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const isAdmin = new URL(request.url).pathname.startsWith("/v1/admin/");
    try {
      return withCors(await router(request, env), request, env, isAdmin);
    } catch (error) {
      console.error(error);
      return withCors(json({ error: "Errore inatteso" }, { status: 500 }), request, env, isAdmin);
    }
  },
};
