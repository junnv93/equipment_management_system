-- Rollback: 컬럼 타입 안전성 강화 취소
-- Date: 2026-03-20

-- CHECK constraints 제거
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_spec_match_check;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_calibration_required_check;

-- jsonb → text 복원
ALTER TABLE equipment_requests
  ALTER COLUMN request_data TYPE text USING request_data::text;
