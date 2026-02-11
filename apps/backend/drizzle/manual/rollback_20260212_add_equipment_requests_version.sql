-- rollback_20260212_add_equipment_requests_version.sql
-- Rollback: equipment_requests version 컬럼 및 인덱스 제거

DROP INDEX IF EXISTS equipment_requests_id_version_idx;
ALTER TABLE equipment_requests DROP COLUMN IF EXISTS version;
