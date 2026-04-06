-- Rollback: Restore 'in_use' to equipment_status enum
-- Date: 2026-04-06

-- 1. 컬럼을 text로 변경
ALTER TABLE equipment ALTER COLUMN status TYPE text;

-- 2. 기존 enum 삭제
DROP TYPE IF EXISTS equipment_status;

-- 3. in_use 포함 enum 재생성
CREATE TYPE equipment_status AS ENUM(
  'available',
  'in_use',
  'checked_out',
  'calibration_scheduled',
  'calibration_overdue',
  'non_conforming',
  'spare',
  'retired',
  'pending_disposal',
  'disposed',
  'temporary',
  'inactive'
);

-- 4. 컬럼을 enum으로 복원
ALTER TABLE equipment ALTER COLUMN status TYPE equipment_status USING status::equipment_status;

-- 5. 기본값 복원
ALTER TABLE equipment ALTER COLUMN status SET DEFAULT 'available';
