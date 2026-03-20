-- Migration: equipment.requested_by, approved_by — varchar(36) → uuid + FK
-- Date: 2026-03-20
-- Purpose: 참조 무결성 확보 및 UUID 타입 통일
--
-- 변경 사항:
-- 1. equipment.requested_by — varchar(36) → uuid, FK → users(id) ON DELETE SET NULL
-- 2. equipment.approved_by  — varchar(36) → uuid, FK → users(id) ON DELETE SET NULL
--
-- ⚠️ 안전성:
-- - 잘못된 UUID 값이 있으면 NULL로 변환 (데이터 손실 방지)
-- - 존재하지 않는 user ID 참조는 NULL로 변환 (FK 위반 방지)
-- - 모든 ALTER는 IF NOT EXISTS 패턴으로 멱등성 보장

-- ============================================================================
-- 1. requested_by: varchar(36) → uuid
-- ============================================================================
DO $$
BEGIN
  -- 컬럼이 varchar 타입인 경우에만 변환 (이미 uuid면 스킵)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment'
      AND column_name = 'requested_by'
      AND data_type = 'character varying'
  ) THEN
    -- 1a. 잘못된 UUID 값 정리 (UUID 형식이 아닌 값 → NULL)
    UPDATE equipment
    SET requested_by = NULL
    WHERE requested_by IS NOT NULL
      AND requested_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    -- 1b. 존재하지 않는 user ID 참조 정리 (FK 위반 방지)
    UPDATE equipment
    SET requested_by = NULL
    WHERE requested_by IS NOT NULL
      AND requested_by::uuid NOT IN (SELECT id FROM users);

    -- 1c. varchar → uuid 타입 변환
    ALTER TABLE equipment
      ALTER COLUMN requested_by TYPE uuid USING requested_by::uuid;

    RAISE NOTICE 'equipment.requested_by: varchar → uuid 변환 완료';
  END IF;

  -- 1d. FK 추가 (존재하지 않는 경우에만)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'equipment_requested_by_users_fk'
      AND table_name = 'equipment'
  ) THEN
    ALTER TABLE equipment
      ADD CONSTRAINT equipment_requested_by_users_fk
      FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

    RAISE NOTICE 'equipment.requested_by: FK → users(id) 추가 완료';
  END IF;
END $$;

-- ============================================================================
-- 2. approved_by: varchar(36) → uuid
-- ============================================================================
DO $$
BEGIN
  -- 컬럼이 varchar 타입인 경우에만 변환
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'equipment'
      AND column_name = 'approved_by'
      AND data_type = 'character varying'
  ) THEN
    -- 2a. 잘못된 UUID 값 정리
    UPDATE equipment
    SET approved_by = NULL
    WHERE approved_by IS NOT NULL
      AND approved_by !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    -- 2b. 존재하지 않는 user ID 참조 정리
    UPDATE equipment
    SET approved_by = NULL
    WHERE approved_by IS NOT NULL
      AND approved_by::uuid NOT IN (SELECT id FROM users);

    -- 2c. varchar → uuid 타입 변환
    ALTER TABLE equipment
      ALTER COLUMN approved_by TYPE uuid USING approved_by::uuid;

    RAISE NOTICE 'equipment.approved_by: varchar → uuid 변환 완료';
  END IF;

  -- 2d. FK 추가
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'equipment_approved_by_users_fk'
      AND table_name = 'equipment'
  ) THEN
    ALTER TABLE equipment
      ADD CONSTRAINT equipment_approved_by_users_fk
      FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

    RAISE NOTICE 'equipment.approved_by: FK → users(id) 추가 완료';
  END IF;
END $$;
