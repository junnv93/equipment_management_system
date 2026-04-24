-- Rollback: 0045_add_borrower_approval
-- Purpose: borrower 승인 컬럼 3개 제거 (기존 데이터는 보존됨)

DROP INDEX IF EXISTS "checkouts_borrower_approver_id_idx";

ALTER TABLE "checkouts"
  DROP COLUMN IF EXISTS "borrower_approver_id",
  DROP COLUMN IF EXISTS "borrower_approved_at",
  DROP COLUMN IF EXISTS "borrower_rejection_reason";
