-- 롤백: 위치 변동 이력 SSOT 통합

-- Step 1: 마이그레이션으로 자동 생성된 이력 제거
DELETE FROM equipment_location_history
WHERE notes = '최초 설치 (자동 마이그레이션)';

-- Step 2: previousLocation 컬럼 제거
ALTER TABLE equipment_location_history
  DROP COLUMN IF EXISTS previous_location;
