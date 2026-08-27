import { ACCEPTED_MEDIA_TYPES, MAX_MEDIA_BYTES, MAX_TEAM_MEMBERS, contentValidationError, publicationReadinessError, type ContentEntity, type ContentState, type EntityType, type ProjectContent, type SiteSettingsContent, type TeamMemberContent } from "../../shared/content-schema";
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

type RevisionRow = { id: string; payload: string; revision_number?: number; created_by?: string; created_at?: string };
type RevisionSummary = { id: string; revisionNumber: number; createdBy: string; createdAt: string; isDraft: boolean; isPublished: boolean };
type AdminUserRow = { email: string; role: "admin" | "editor"; active: number; created_at: string };
type AssetRow = { id: string; public_url: string; alt_text: string; content_type: string; byte_size: number; created_by: string; created_at: string };

const json = (body: unknown, init: ResponseInit = {}) => Response.json(body, init);
const publicHeaders = { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600", "Access-Control-Allow-Origin": "*" };
const uuid = () => crypto.randomUUID();

function withCors(response: Response, request: Request, env: Env, isAdmin = false) {
  const headers = new Headers(response.headers);
  if (isAdmin) {
    const origin = request.headers.get("Origin");
    if (origin && (origin === env.ADMIN_ORIGIN || env.ENVIRONMENT === "local")) headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  } else headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Cf-Access-Jwt-Assertion, x-spazioterzo-dev-email");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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

async function nextDisplayOrder(env: Env, type: EntityType) {
  const row = await env.DB.prepare("SELECT MAX(display_order) AS value FROM content_entities WHERE entity_type = ?").bind(type).first<{ value: number | null }>();
  return (row?.value ?? -1) + 1;
}

async function saveDraft(env: Env, actor: AdminIdentity, type: EntityType, id: string | undefined, payload: unknown, requestedOrder?: number) {
  const validationError = contentValidationError(type, payload);
  if (validationError) return json({ error: validationError }, { status: 422 });
  const typedPayload = payload as ProjectContent | TeamMemberContent | SiteSettingsContent;
  const slug = type === "project" ? (typedPayload as ProjectContent).slug : type === "site" ? "site" : slugify((typedPayload as TeamMemberContent).name);
  let entity = id ? await findEntity(env, type, id) : type === "site" ? await findEntity(env, type, "site") : null;
  if (id && !entity) return json({ error: "Contenuto non trovato" }, { status: 404 });

  if (!entity) {
    if (type === "team_member") {
      const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM content_entities WHERE entity_type = 'team_member' AND state != 'archived'").first<{ total: number }>();
      if ((count?.total ?? 0) >= MAX_TEAM_MEMBERS) return json({ error: `Il team può avere al massimo ${MAX_TEAM_MEMBERS} persone.` }, { status: 422 });
    }
    const entityId = id ?? uuid();
    const displayOrder = typeof requestedOrder === "number" && actor.role === "admin" ? requestedOrder : await nextDisplayOrder(env, type);
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
      .bind(slug, actor.role === "admin" && typeof requestedOrder === "number" ? requestedOrder : entity.displayOrder, revisionId, entity.id),
  ]);
  await audit(env, actor.email, "draft_saved", entity.id, { type });
  return json(await findEntity(env, type, entity.id));
}

async function publish(env: Env, actor: AdminIdentity, type: EntityType, id: string) {
  const entity = await findEntity(env, type, id);
  if (!entity?.draft) return json({ error: "Bozza non trovata" }, { status: 404 });
  const readinessError = publicationReadinessError(type, entity.draft);
  if (readinessError) return json({ error: readinessError }, { status: 422 });
  const row = await env.DB.prepare("SELECT draft_revision_id FROM content_entities WHERE id = ?").bind(entity.id).first<{ draft_revision_id: string }>();
  await env.DB.prepare("UPDATE content_entities SET state = 'published', published_revision_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(row?.draft_revision_id, entity.id).run();
  await audit(env, actor.email, "published", entity.id, { type });
  const published = await findEntity(env, type, entity.id);
  if (published) await purgePublicContent(env, actor.email, type, published, entity.slug);
  return json(published);
}

async function listRevisions(env: Env, entity: ContentEntity<unknown>, row: EntityRow) {
  const { results } = await env.DB.prepare("SELECT id, revision_number, created_by, created_at FROM content_revisions WHERE entity_id = ? ORDER BY revision_number DESC").bind(entity.id).all<RevisionRow>();
  return results.map((revision): RevisionSummary => ({
    id: revision.id,
    revisionNumber: revision.revision_number ?? 0,
    createdBy: revision.created_by ?? "",
    createdAt: revision.created_at ?? "",
    isDraft: revision.id === row.draft_revision_id,
    isPublished: revision.id === row.published_revision_id,
  }));
}

async function entityRow(env: Env, id: string) {
  return env.DB.prepare("SELECT * FROM content_entities WHERE id = ?").bind(id).first<EntityRow>();
}

async function restoreRevision(env: Env, actor: AdminIdentity, type: EntityType, id: string, revisionId: string) {
  const row = await entityRow(env, id);
  if (!row || row.entity_type !== type) return json({ error: "Contenuto non trovato" }, { status: 404 });
  const source = await env.DB.prepare("SELECT id, payload FROM content_revisions WHERE id = ? AND entity_id = ?").bind(revisionId, id).first<RevisionRow>();
  if (!source) return json({ error: "Revisione non trovata" }, { status: 404 });
  const previous = await env.DB.prepare("SELECT MAX(revision_number) AS revision FROM content_revisions WHERE entity_id = ?").bind(id).first<{ revision: number | null }>();
  const newRevisionId = uuid();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO content_revisions (id, entity_id, revision_number, payload, created_by) VALUES (?, ?, ?, ?, ?)").bind(newRevisionId, id, (previous?.revision ?? 0) + 1, source.payload, actor.email),
    env.DB.prepare("UPDATE content_entities SET draft_revision_id = ?, state = CASE WHEN state = 'archived' THEN 'draft' ELSE state END, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(newRevisionId, id),
  ]);
  await audit(env, actor.email, "revision_restored", id, { type, sourceRevisionId: revisionId, newRevisionId });
  return json(await findEntity(env, type, id));
}

async function archiveEntity(env: Env, actor: AdminIdentity, type: EntityType, id: string) {
  const entity = await findEntity(env, type, id);
  if (!entity) return json({ error: "Contenuto non trovato" }, { status: 404 });
  await env.DB.prepare("UPDATE content_entities SET state = 'archived', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
  await audit(env, actor.email, "archived", id, { type });
  if (entity.published) await purgePublicContent(env, actor.email, type, entity, entity.slug);
  return json(await findEntity(env, type, id));
}

async function unarchiveEntity(env: Env, actor: AdminIdentity, type: EntityType, id: string) {
  const row = await entityRow(env, id);
  if (!row || row.entity_type !== type) return json({ error: "Contenuto non trovato" }, { status: 404 });
  if (row.state !== "archived") return json({ error: "Il contenuto non è archiviato" }, { status: 422 });
  if (type === "team_member") {
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM content_entities WHERE entity_type = 'team_member' AND state != 'archived'").first<{ total: number }>();
    if ((count?.total ?? 0) >= MAX_TEAM_MEMBERS) return json({ error: `Il team può avere al massimo ${MAX_TEAM_MEMBERS} persone. Archiviane una prima di ripristinare.` }, { status: 422 });
  }
  await env.DB.prepare("UPDATE content_entities SET state = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
  await audit(env, actor.email, "unarchived", id, { type });
  return json(await findEntity(env, type, id));
}

async function updateDisplayOrder(env: Env, actor: AdminIdentity, type: EntityType, id: string, displayOrder: unknown) {
  if (typeof displayOrder !== "number" || !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000) return json({ error: "Ordine non valido" }, { status: 422 });
  const entity = await findEntity(env, type, id);
  if (!entity) return json({ error: "Contenuto non trovato" }, { status: 404 });
  await env.DB.prepare("UPDATE content_entities SET display_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(displayOrder, id).run();
  await audit(env, actor.email, "display_order_updated", id, { type, displayOrder });
  if (entity.published) await purgePublicContent(env, actor.email, type, entity, entity.slug);
  return json(await findEntity(env, type, id));
}

async function purgePublicContent(env: Env, actor: string, type: EntityType, entity: ContentEntity<unknown>, previousSlug?: string) {
  if (env.ENVIRONMENT !== "production" || !env.CF_ZONE_ID || !env.CF_CACHE_PURGE_TOKEN || !env.PUBLIC_API_BASE_URL) return;
  const base = env.PUBLIC_API_BASE_URL.replace(/\/$/, "");
  const urls = new Set<string>();
  if (type === "site") urls.add(`${base}/v1/public/site`);
  if (type === "team_member") urls.add(`${base}/v1/public/team`);
  if (type === "project") {
    urls.add(`${base}/v1/public/projects`);
    [previousSlug, entity.slug, entity.draft && (entity.draft as ProjectContent).slug, entity.published && (entity.published as ProjectContent).slug]
      .filter((slug): slug is string => Boolean(slug)).forEach((slug) => urls.add(`${base}/v1/public/projects/${encodeURIComponent(slug)}`));
  }
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/purge_cache`, {
      method: "POST", headers: { Authorization: `Bearer ${env.CF_CACHE_PURGE_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ files: [...urls] }),
    });
    if (!response.ok) throw new Error(`Purge Cloudflare non riuscito (${response.status})`);
    await audit(env, actor, "public_cache_purged", entity.id, { type, urls: [...urls] });
  } catch (error) {
    await audit(env, actor, "public_cache_purge_failed", entity.id, { type, message: error instanceof Error ? error.message : "Errore sconosciuto" });
  }
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

async function updateAsset(request: Request, env: Env, actor: AdminIdentity, id: string) {
  const body = await request.json<{ alt?: unknown }>();
  const alt = typeof body.alt === "string" ? body.alt.trim() : "";
  if (!alt || alt.length > 180) return json({ error: "Il testo alternativo è obbligatorio (max 180 caratteri)" }, { status: 422 });
  const asset = await env.DB.prepare("SELECT id FROM assets WHERE id = ?").bind(id).first<{ id: string }>();
  if (!asset) return json({ error: "Immagine non trovata" }, { status: 404 });
  await env.DB.prepare("UPDATE assets SET alt_text = ? WHERE id = ?").bind(alt, id).run();
  await audit(env, actor.email, "asset_updated", id, { alt });
  return json({ id, alt });
}

/**
 * Un'immagine ancora citata da una bozza o da una versione online non va cancellata: sparirebbe dal sito.
 * Il confronto avviene qui e non con LIKE perché D1 rifiuta i pattern lunghi quanto un URL ("pattern too complex").
 */
async function assetUsage(env: Env, publicUrl: string) {
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT e.slug, r.payload FROM content_entities e
     JOIN content_revisions r ON r.id = e.draft_revision_id OR r.id = e.published_revision_id
     WHERE e.state != 'archived'`,
  ).all<{ slug: string; payload: string }>();
  return results.filter((row) => row.payload.includes(publicUrl)).map((row) => row.slug);
}

async function deleteAsset(env: Env, actor: AdminIdentity, id: string) {
  const asset = await env.DB.prepare("SELECT id, object_key, public_url FROM assets WHERE id = ?").bind(id).first<{ id: string; object_key: string; public_url: string }>();
  if (!asset) return json({ error: "Immagine non trovata" }, { status: 404 });
  const usage = await assetUsage(env, asset.public_url);
  if (usage.length) return json({ error: `Immagine ancora usata in: ${usage.slice(0, 5).join(", ")}. Sostituiscila lì prima di eliminarla.` }, { status: 409 });
  await env.MEDIA.delete(asset.object_key);
  await env.DB.prepare("DELETE FROM assets WHERE id = ?").bind(id).run();
  await audit(env, actor.email, "asset_deleted", id, { objectKey: asset.object_key });
  return json({ id });
}

async function listAssets(env: Env, search: string, cursor: string | null) {
  const offset = Math.max(0, Math.min(Number.parseInt(cursor ?? "0", 10) || 0, 10_000));
  const query = search.trim().toLowerCase().slice(0, 100);
  const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const limit = 24;
  const { results } = await env.DB.prepare(
    "SELECT id, public_url, alt_text, content_type, byte_size, created_by, created_at FROM assets WHERE lower(alt_text) LIKE ? ESCAPE '\\' ORDER BY created_at DESC LIMIT ? OFFSET ?",
  ).bind(like, limit + 1, offset).all<AssetRow>();
  const hasMore = results.length > limit;
  return {
    items: results.slice(0, limit).map((asset) => ({
      id: asset.id,
      url: asset.public_url,
      alt: asset.alt_text,
      contentType: asset.content_type,
      byteSize: asset.byte_size,
      createdBy: asset.created_by,
      createdAt: asset.created_at,
    })),
    nextCursor: hasMore ? String(offset + limit) : null,
  };
}

async function listAdminUsers(env: Env) {
  const { results } = await env.DB.prepare("SELECT email, role, active, created_at FROM admin_users ORDER BY role, email").all<AdminUserRow>();
  return results.map((user) => ({ email: user.email, role: user.role, active: Boolean(user.active), createdAt: user.created_at }));
}

async function saveAdminUser(request: Request, env: Env, actor: AdminIdentity, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const body = await request.json<{ role?: unknown; active?: unknown }>();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || (body.role !== "admin" && body.role !== "editor") || typeof body.active !== "boolean") return json({ error: "Utente o ruolo non validi" }, { status: 422 });
  const current = await env.DB.prepare("SELECT role, active FROM admin_users WHERE email = ?").bind(normalizedEmail).first<{ role: "admin" | "editor"; active: number }>();
  const isSelf = normalizedEmail === actor.email.trim().toLowerCase();
  if (isSelf && (body.role !== actor.role || !body.active)) return json({ error: "Non puoi modificare o disattivare il tuo accesso: chiedilo a un altro amministratore." }, { status: 422 });
  const removesAdmin = current?.role === "admin" && current.active === 1 && (body.role !== "admin" || !body.active);
  if (removesAdmin) {
    const count = await env.DB.prepare("SELECT COUNT(*) AS total FROM admin_users WHERE role = 'admin' AND active = 1").first<{ total: number }>();
    if ((count?.total ?? 0) <= 1) return json({ error: "Deve rimanere almeno un amministratore attivo" }, { status: 422 });
  }
  await env.DB.prepare("INSERT INTO admin_users (email, role, active) VALUES (?, ?, ?) ON CONFLICT(email) DO UPDATE SET role = excluded.role, active = excluded.active")
    .bind(normalizedEmail, body.role, body.active ? 1 : 0).run();
  await audit(env, actor.email, "admin_user_updated", undefined, { email: normalizedEmail, role: body.role, active: body.active });
  return json(await listAdminUsers(env));
}

async function serveMedia(pathname: string, env: Env) {
  const key = pathname.replace(/^\/media\//, "");
  const object = await env.MEDIA.get(key);
  if (!object) return json({ error: "Media non trovato" }, { status: 404 });
  const headers = new Headers({ "Cache-Control": "public, max-age=31536000, immutable" });
  object.writeHttpMetadata(headers);
  return new Response(object.body, { headers });
}

function isAdminHost(url: URL, env: Env) {
  if (env.ENVIRONMENT === "local") return true;
  if (!env.ADMIN_ORIGIN) return false;
  return url.host === new URL(env.ADMIN_ORIGIN).host;
}

async function router(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });
  if (pathname.startsWith("/media/")) return serveMedia(pathname, env);
  if (pathname === "/health") return json({ status: "ok", environment: env.ENVIRONMENT });
  if (pathname === "/v1/development/seed" && request.method === "POST") {
    if (env.ENVIRONMENT !== "local" || request.headers.get("x-spazioterzo-seed") !== "local-only") return json({ error: "Non trovato" }, { status: 404 });
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

  if (!pathname.startsWith("/v1/admin/")) {
    if (isAdminHost(url, env)) return env.ASSETS.fetch(request);
    return json({ error: "Non trovato" }, { status: 404 });
  }
  const identity = await authenticateAdmin(request, env);
  const unauthorized = requireAdmin(identity);
  if (unauthorized) return unauthorized;

  if (pathname === "/v1/admin/me" && request.method === "GET") return json(identity);
  if (pathname === "/v1/admin/assets" && request.method === "GET") return json(await listAssets(env, url.searchParams.get("q") ?? "", url.searchParams.get("cursor")));
  if (pathname === "/v1/admin/assets" && request.method === "POST") return handleAsset(request, env, identity!);
  const assetMatch = pathname.match(/^\/v1\/admin\/assets\/([^/]+)$/);
  if (assetMatch && request.method === "PUT") return updateAsset(request, env, identity!, decodeURIComponent(assetMatch[1]));
  if (assetMatch && request.method === "DELETE") {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? deleteAsset(env, identity!, decodeURIComponent(assetMatch[1]));
  }
  if (pathname === "/v1/admin/users" && request.method === "GET") {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? json(await listAdminUsers(env));
  }
  const userMatch = pathname.match(/^\/v1\/admin\/users\/([^/]+)$/);
  if (userMatch && request.method === "PUT") {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? saveAdminUser(request, env, identity!, decodeURIComponent(userMatch[1]));
  }

  const match = pathname.match(/^\/v1\/admin\/(projects|team|site)(?:\/([^/]+))?(?:\/(publish|archive|unarchive|order|revisions))?(?:\/([^/]+))?(?:\/(restore))?$/);
  if (!match) return json({ error: "Non trovato" }, { status: 404 });
  const [, resource, id, action, revisionId, restoreAction] = match;
  const type: EntityType = resource === "projects" ? "project" : resource === "team" ? "team_member" : "site";
  const projectOnly = identity!.role === "editor" && type !== "project";
  if (projectOnly) return json({ error: "Gli editor possono gestire solo le bozze dei progetti" }, { status: 403 });

  if (request.method === "GET" && !id) return json(await listEntities(env, type));
  if (request.method === "GET" && id) {
    if (action === "revisions") {
      const forbidden = requireAdmin(identity, "admin");
      if (forbidden) return forbidden;
      if (revisionId) {
        const source = await env.DB.prepare("SELECT payload FROM content_revisions WHERE id = ? AND entity_id = ?").bind(revisionId, id).first<{ payload: string }>();
        return source ? json(JSON.parse(source.payload)) : json({ error: "Revisione non trovata" }, { status: 404 });
      }
      const entity = await findEntity(env, type, id);
      const row = await entityRow(env, id);
      return entity && row ? json(await listRevisions(env, entity, row)) : json({ error: "Contenuto non trovato" }, { status: 404 });
    }
    const entity = await findEntity(env, type, id);
    return entity ? json(entity) : json({ error: "Non trovato" }, { status: 404 });
  }
  if (request.method === "POST" && action === "publish" && id) {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? publish(env, identity!, type, id);
  }
  if (request.method === "POST" && action === "archive" && id) {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? archiveEntity(env, identity!, type, id);
  }
  if (request.method === "POST" && action === "unarchive" && id) {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? unarchiveEntity(env, identity!, type, id);
  }
  if (request.method === "POST" && action === "order" && id) {
    const forbidden = requireAdmin(identity, "admin");
    if (forbidden) return forbidden;
    const body = await request.json<{ displayOrder?: unknown }>();
    return updateDisplayOrder(env, identity!, type, id, body.displayOrder);
  }
  if (request.method === "POST" && action === "revisions" && revisionId && restoreAction === "restore" && id) {
    const forbidden = requireAdmin(identity, "admin");
    return forbidden ?? restoreRevision(env, identity!, type, id, revisionId);
  }
  if ((request.method === "POST" && !id) || (request.method === "PUT" && id)) {
    const body = await request.json<{ payload?: unknown; displayOrder?: number }>();
    return saveDraft(env, identity!, type, id, body.payload, body.displayOrder);
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
