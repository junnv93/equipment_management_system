-- Migration: Create saved_views table for server-side Saved Views storage.
-- Context: Saved Views previously stored in client-side localStorage. Promoted to
-- server domain to enable cross-device sync and team sharing (scope tridyad:
-- PRIVATE/TEAM/GLOBAL).
--
-- Behavior:
--   - owner_id FK to users(id) with ON DELETE CASCADE — when a user is removed,
--     their saved views are cleaned up automatically.
--   - team_id FK to teams(id) with ON DELETE SET NULL — preserves view but downgrades
--     to PRIVATE-effective when team is removed (service layer may further migrate).
--   - version column for optimistic locking (CAS) — concurrent drag-reorder + add/delete
--     races are blocked atomically via UPDATE WHERE version = expected.
--   - module column reserved for cross-domain reuse (currently 'checkouts' only).
--
-- Indexes:
--   - owner_module_sort_idx : primary listing query (per-user per-module ordered)
--   - scope_team_module_idx : TEAM scope visibility + GLOBAL read secondary
--
-- Retention: tied to user lifecycle (cascade on user delete). Not a regulatory artifact.
--
-- Rollback: DROP INDEX × 2 + DROP TABLE saved_views.

CREATE TABLE IF NOT EXISTS "saved_views" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" varchar(80) NOT NULL,
    "params" text NOT NULL,
    "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "module" varchar(40) NOT NULL,
    "scope" varchar(16) NOT NULL,
    "team_id" uuid REFERENCES "teams"("id") ON DELETE SET NULL,
    "sort_order" integer NOT NULL DEFAULT 0,
    "version" integer NOT NULL DEFAULT 1,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "saved_views_owner_module_sort_idx"
    ON "saved_views" ("owner_id", "module", "sort_order");

CREATE INDEX IF NOT EXISTS "saved_views_scope_team_module_idx"
    ON "saved_views" ("scope", "team_id", "module");
