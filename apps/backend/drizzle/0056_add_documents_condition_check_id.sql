-- Migration: Add documents.condition_check_id FK for rental 4-step handover photo attachment.
-- Context: QR mobile workflow expansion — technicians can now attach photos during condition
-- checks (lender_checkout / borrower_receive / borrower_return / lender_return steps).
-- Photos are uploaded to /documents first (pre-upload pattern), then linked here via
-- conditionCheckId during the createConditionCheck mutation.
--
-- Behavior:
--   - Nullable column, FK to condition_checks(id) with ON DELETE CASCADE.
--     Rationale: condition_check is the owner; deleting a check cascades to its photos.
--     Mirrors calibration_id / non_conformance_id semantics.
--   - Index on condition_check_id for /checkouts/:id/condition-checks lookup.
--   - Composite index on (condition_check_id, document_type) for type-filtered queries.
-- Retention: UL-QP-18-06 장비 반·출입 확인서 — 5년 보존 (동일 도메인 문서와 동일 정책).
--
-- Rollback: DROP INDEX + ALTER TABLE DROP COLUMN (no data migration required).

ALTER TABLE "documents"
    ADD COLUMN IF NOT EXISTS "condition_check_id" uuid
    REFERENCES "condition_checks"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "documents_condition_check_id_idx"
    ON "documents" ("condition_check_id");

CREATE INDEX IF NOT EXISTS "documents_condition_check_type_idx"
    ON "documents" ("condition_check_id", "document_type");
