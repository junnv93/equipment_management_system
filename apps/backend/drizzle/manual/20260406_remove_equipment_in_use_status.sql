-- Migration: Remove 'in_use' from equipment_status enum
-- Date: 2026-04-06
-- Reason: 'in_use' 상태는 비즈니스 로직에서 사용되지 않으며,
--         장비 예약/배정 기능이 필요할 때 재추가 예정

-- Step 1: 기존 in_use 장비를 available로 전환
UPDATE equipment
SET status = 'available', updated_at = NOW()
WHERE status = 'in_use';

-- Step 2: PostgreSQL enum에서 값 제거 (rename → recreate 전략)
-- PostgreSQL은 ALTER TYPE ... DROP VALUE를 지원하지 않으므로
-- 컬럼 타입을 text로 변경 후 enum 재생성

-- 2a. 컬럼을 text로 변경
ALTER TABLE equipment ALTER COLUMN status TYPE text;

-- 2b. 기존 enum 삭제
DROP TYPE IF EXISTS equipment_status;

-- 2c. in_use 없이 enum 재생성
CREATE TYPE equipment_status AS ENUM(
  'available',
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

-- 2d. 컬럼을 새 enum으로 복원
ALTER TABLE equipment ALTER COLUMN status TYPE equipment_status USING status::equipment_status;

-- 2e. 기본값 복원 (원래 스키마와 일치)
ALTER TABLE equipment ALTER COLUMN status SET DEFAULT 'available';
