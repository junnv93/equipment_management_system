-- Migration: Add documents.checkout_id FK for return-checkout photo attachment.
-- Context: QR mobile workflow — technicians can attach inspection photos during return
-- (calibration / repair purpose). Photos are pre-uploaded to /documents, then linked
-- here via checkoutId during the returnCheckout mutation.
--
-- Behavior:
--   - Nullable column, FK to checkouts(id) with ON DELETE CASCADE.
--     Rationale: checkout is the owner; deleting a checkout cascades to its photos.
--     Mirrors condition_check_id / non_conformance_id semantics.
--   - Index on checkout_id for /checkouts/:id/documents lookup.
-- Retention: UL-QP-18-06 장비 반·출입 확인서 — 5년 보존 (동일 도메인 문서와 동일 정책).
--
-- Rollback: DROP INDEX + ALTER TABLE DROP COLUMN (no data migration required).

ALTER TABLE "documents"
    ADD COLUMN IF NOT EXISTS "checkout_id" uuid
    REFERENCES "checkouts"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "documents_checkout_id_idx"
    ON "documents" ("checkout_id");
