-- Migration: 0046_add_terminated_from_status
-- Purpose: terminal 상태(rejected/canceled) 도달 직전 상태 기록
--          reachedStepIndex 정확한 계산을 위한 FSM 의미론 개선
-- Affected table: checkouts
-- Note: NULL 허용. 기존 rows는 NULL 유지 (legacy fallback = step 1).
--       reject/borrowerReject/cancel 전환 시 service에서 직전 status 기록.

ALTER TABLE "checkouts"
  ADD COLUMN IF NOT EXISTS "terminated_from_status" varchar(50);

--> statement-breakpoint
