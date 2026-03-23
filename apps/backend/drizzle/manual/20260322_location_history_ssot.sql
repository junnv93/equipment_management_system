-- 위치 변동 이력 SSOT 통합
-- 1. previousLocation 컬럼 추가 (이전 위치 추적)
-- 2. 기존 장비에 대해 "최초 설치" 이력 일괄 생성 (마이그레이션)

-- Step 1: previousLocation 컬럼 추가
ALTER TABLE equipment_location_history
  ADD COLUMN previous_location VARCHAR(100);

-- Step 2: 기존 장비 마이그레이션
-- location이 있고, 아직 이력이 없는 장비에 대해 "최초 설치" 이력 자동 생성
INSERT INTO equipment_location_history (
  equipment_id,
  changed_at,
  previous_location,
  new_location,
  notes,
  created_at
)
SELECT
  e.id,
  COALESCE(e.installation_date, e.created_at),
  NULL,
  e.location,
  '최초 설치 (자동 마이그레이션)',
  NOW()
FROM equipment e
WHERE e.location IS NOT NULL
  AND e.location != ''
  AND NOT EXISTS (
    SELECT 1 FROM equipment_location_history h
    WHERE h.equipment_id = e.id
  );
