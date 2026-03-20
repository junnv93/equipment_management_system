-- Migration: 컬럼 타입 안전성 강화
-- Date: 2026-03-20
-- Purpose: varchar → CHECK constraint, text → jsonb 전환
--
-- 변경 사항:
-- 1. equipment.spec_match — CHECK constraint 추가 ('match' | 'mismatch')
-- 2. equipment.calibration_required — CHECK constraint 추가 ('required' | 'not_required')
-- 3. equipment_requests.request_data — text → jsonb 전환

-- ============================================================================
-- 1. equipment.spec_match CHECK constraint
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'equipment_spec_match_check'
  ) THEN
    -- 잘못된 기존 데이터 정리 (대소문자 불일치 등)
    UPDATE equipment
    SET spec_match = LOWER(spec_match)
    WHERE spec_match IS NOT NULL AND spec_match NOT IN ('match', 'mismatch');

    ALTER TABLE equipment
      ADD CONSTRAINT equipment_spec_match_check
      CHECK (spec_match IS NULL OR spec_match IN ('match', 'mismatch'));
  END IF;
END $$;

-- ============================================================================
-- 2. equipment.calibration_required CHECK constraint
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'equipment_calibration_required_check'
  ) THEN
    -- 잘못된 기존 데이터 정리
    UPDATE equipment
    SET calibration_required = LOWER(calibration_required)
    WHERE calibration_required IS NOT NULL AND calibration_required NOT IN ('required', 'not_required');

    ALTER TABLE equipment
      ADD CONSTRAINT equipment_calibration_required_check
      CHECK (calibration_required IS NULL OR calibration_required IN ('required', 'not_required'));
  END IF;
END $$;

-- ============================================================================
-- 3. equipment_requests.request_data: text → jsonb
-- ============================================================================

-- 기존 text 데이터가 유효한 JSON인지 확인 후 변환
-- 유효하지 않은 JSON은 null로 변환
UPDATE equipment_requests
SET request_data = NULL
WHERE request_data IS NOT NULL
  AND request_data != ''
  AND request_data::jsonb IS NULL;

-- text → jsonb 타입 변환
ALTER TABLE equipment_requests
  ALTER COLUMN request_data TYPE jsonb USING request_data::jsonb;
