-- Rollback: equipment.requested_by, approved_by — uuid + FK → varchar(36)
-- Date: 2026-03-20

-- 1. FK 제약 제거
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_requested_by_users_fk;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_approved_by_users_fk;

-- 2. uuid → varchar(36) 복원
ALTER TABLE equipment
  ALTER COLUMN requested_by TYPE varchar(36) USING requested_by::text;

ALTER TABLE equipment
  ALTER COLUMN approved_by TYPE varchar(36) USING approved_by::text;
