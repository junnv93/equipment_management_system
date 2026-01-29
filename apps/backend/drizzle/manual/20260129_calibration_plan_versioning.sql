-- 교정계획서 버전 관리 기능 추가
-- 승인된 계획서 수정 시 새 버전 생성, 버전 히스토리 조회 지원

-- 1. 버전 관리 필드 추가
ALTER TABLE calibration_plans ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE calibration_plans ADD COLUMN IF NOT EXISTS parent_plan_id UUID REFERENCES calibration_plans(id);
ALTER TABLE calibration_plans ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE NOT NULL;

-- 2. 기존 데이터에 대해 버전 정보 초기화 (이미 있는 계획서는 v1, 최신 버전)
-- (DEFAULT 값으로 자동 적용됨)

-- 3. 기존 unique 제약 삭제 (year + site_id)
-- 주의: 제약 이름이 다를 수 있으므로 조건부 실행
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'calibration_plans_year_site_unique'
    AND conrelid = 'calibration_plans'::regclass
  ) THEN
    ALTER TABLE calibration_plans DROP CONSTRAINT calibration_plans_year_site_unique;
  END IF;
END $$;

-- 4. 새 인덱스 추가 (버전 관리용)
CREATE INDEX IF NOT EXISTS calibration_plans_year_site_version_idx
  ON calibration_plans(year, site_id, is_latest_version);
CREATE INDEX IF NOT EXISTS calibration_plans_parent_plan_id_idx
  ON calibration_plans(parent_plan_id);
CREATE INDEX IF NOT EXISTS calibration_plans_is_latest_version_idx
  ON calibration_plans(is_latest_version);

-- 5. 최신 버전 유일성을 위한 partial unique index (PostgreSQL 지원)
-- 같은 연도+시험소에 대해 최신 버전은 하나만 존재
CREATE UNIQUE INDEX IF NOT EXISTS calibration_plans_year_site_latest_unique_idx
  ON calibration_plans(year, site_id)
  WHERE is_latest_version = TRUE;

-- 버전 관리 마이그레이션 완료
