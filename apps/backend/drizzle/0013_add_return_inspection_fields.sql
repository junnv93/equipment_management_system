-- 반입 검사 및 승인 프로세스를 위한 필드 추가
-- return_approved_by, return_approved_at: 반입 최종 승인 정보

-- return_approved_by 컬럼 추가 (반입 최종 승인자, 기술책임자)
ALTER TABLE IF EXISTS "checkouts"
  ADD COLUMN IF NOT EXISTS "return_approved_by" UUID REFERENCES "users"("id");

-- return_approved_at 컬럼 추가 (반입 최종 승인 시간)
ALTER TABLE IF EXISTS "checkouts"
  ADD COLUMN IF NOT EXISTS "return_approved_at" TIMESTAMP;

-- 참고: 검사 필드(calibration_checked, repair_checked, working_status_checked, inspection_notes)는
-- 이전 마이그레이션에서 이미 추가되어 있습니다.
