-- Migration: 0045_add_borrower_approval
-- Purpose: Add borrower (차용 팀) 1차 승인 컬럼 — rental 2-step 승인 워크플로우 지원
-- Affected table: checkouts
-- Note: 컬럼 3개 모두 NULL 허용. cal/repair는 NULL 유지, rental만 사용.

ALTER TABLE "checkouts"
  ADD COLUMN IF NOT EXISTS "borrower_approver_id" uuid REFERENCES "users"("id") ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS "borrower_approved_at" timestamp,
  ADD COLUMN IF NOT EXISTS "borrower_rejection_reason" text;

CREATE INDEX IF NOT EXISTS "checkouts_borrower_approver_id_idx"
  ON "checkouts" ("borrower_approver_id");

-- Idempotent backfill: 기존 rental 레코드의 borrower_approved_at이 NULL인 경우에만 실행
-- borrower_approved_at = created_at (생성 시점에 이미 승인된 것으로 간주)
-- borrower_approver_id = requester_id (신청자를 1차 승인자로 간주)
UPDATE "checkouts"
SET
  "borrower_approved_at" = "created_at",
  "borrower_approver_id" = "requester_id"
WHERE
  "checkout_type" = 'rental'
  AND "borrower_approved_at" IS NULL;
