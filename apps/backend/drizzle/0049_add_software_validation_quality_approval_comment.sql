-- Migration: 0049_add_software_validation_quality_approval_comment
-- Purpose: ISO/IEC 17025 §6.2.2 audit trail — 품질책임자 승인 시 검토 의견 영속화.
--          기술책임자 승인(approval_comment, 0048)과 별도 컬럼으로 책임/시점 분리.
--          qualityApprove() 시그니처에 코멘트 파라미터가 폐기되던 silent loss 진짜 fix.
-- Pattern: disposal_requests.approval_comment, calibration_plans.review_comment 동일 SSOT.
-- Affected table: software_validations
-- Backfill: 불필요 — 기존 행은 NULL 유지. 새 품질 승인부터 컬럼에 기록.

ALTER TABLE "software_validations"
  ADD COLUMN IF NOT EXISTS "quality_approval_comment" text;

--> statement-breakpoint
