-- Migration: 0048_add_software_validation_approval_comment
-- Purpose: ISO/IEC 17025 §6.2.2 audit trail — 기술책임자 승인 시 검토 의견 영속화.
--          사용자가 입력한 approvalComment가 silently 사라지던 production bug 진짜 fix.
--          이전 commit f981e0e9는 lint 통과 위해 underscore prefix(`_approvalComment`)만
--          적용한 임시방편이고, 본 migration이 도메인 영속화 진짜 fix.
-- Decision: column + audit_logs metadata 이중 안전망 (사용자 확정).
--   - 컬럼: 도메인 객체 조회/리스팅 시 즉시 접근 (UI 표시 SSOT).
--   - audit_logs: 변경 이력 시계열 추적 (audit.interceptor.ts:287-291 자동 기록 — 무변경).
-- Pattern: disposal_requests.approval_comment, calibration_plans.review_comment 동일 SSOT.
-- Affected table: software_validations
-- Backfill: 불필요 — 기존 행은 NULL 유지. 새 승인부터 컬럼에 기록.

ALTER TABLE "software_validations"
  ADD COLUMN IF NOT EXISTS "approval_comment" text;

--> statement-breakpoint
