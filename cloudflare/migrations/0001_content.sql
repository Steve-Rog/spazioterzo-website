PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_entities (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('project', 'team_member', 'site')),
  slug TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'archived')),
  draft_revision_id TEXT,
  published_revision_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_type, slug)
);

CREATE TABLE IF NOT EXISTS content_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  entity_id TEXT NOT NULL REFERENCES content_entities(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  payload TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(entity_id, revision_number)
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS content_entities_public_idx ON content_entities(entity_type, state, display_order);
CREATE INDEX IF NOT EXISTS content_revisions_entity_idx ON content_revisions(entity_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS audit_events_entity_idx ON audit_events(entity_id, created_at DESC);
