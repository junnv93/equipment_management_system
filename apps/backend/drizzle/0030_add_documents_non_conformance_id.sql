-- Migration: Add documents.non_conformance_id FK for NC attachment module completion.
-- Context: QR Phase 2-D rollback removed the description='NCR-{uuid}' workaround that let users
-- attach photos via equipment_id + description prefix. Without this column, on-site users cannot
-- attach evidence photos to non-conformance reports at all (desktop or mobile QR path).
--
-- Behavior:
--   - Nullable column, FK to non_conformances(id) with ON DELETE CASCADE.
--     Rationale: an NC is the owner entity for its evidence attachments; deleting the NC
--     should cascade to its attachments (same semantics as calibration_id, request_id).
--   - Index on non_conformance_id (single-column) for /non-conformances/:id/documents lookup.
--   - Composite index on (non_conformance_id, document_type) mirrors the equipment_type /
--     calibration_type / software_validation_type pattern used by the NCDetailClient Documents tab.
--
-- Rollback: drop column + indexes (reverse order). No data migration required — no rows reference it yet.

ALTER TABLE "documents"
    ADD COLUMN IF NOT EXISTS "non_conformance_id" uuid
    REFERENCES "non_conformances"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "documents_non_conformance_id_idx"
    ON "documents" ("non_conformance_id");

CREATE INDEX IF NOT EXISTS "documents_non_conformance_type_idx"
    ON "documents" ("non_conformance_id", "document_type");
