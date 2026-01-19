-- 반출 유형별 승인 프로세스를 위한 필드 추가
-- checkout_type: 반출 유형 (internal_calibration, internal_repair, external_rental)
-- lender_team_id, lender_site_id: 외부 대여 시 빌려주는 측 정보

-- checkout_type 컬럼 추가 (기본값: internal_calibration)
ALTER TABLE IF EXISTS "checkouts"
  ADD COLUMN IF NOT EXISTS "checkout_type" VARCHAR(50) NOT NULL DEFAULT 'internal_calibration';

-- lender_team_id 컬럼 추가 (외부 대여 시 빌려주는 측 팀 ID)
ALTER TABLE IF EXISTS "checkouts"
  ADD COLUMN IF NOT EXISTS "lender_team_id" UUID;

-- lender_site_id 컬럼 추가 (외부 대여 시 빌려주는 측 사이트 ID)
ALTER TABLE IF EXISTS "checkouts"
  ADD COLUMN IF NOT EXISTS "lender_site_id" VARCHAR(50);
