-- Rollback: FK 참조 무결성 + 인덱스 추가 취소
-- Date: 2026-03-19

-- FK 제약조건 제거
ALTER TABLE calibrations DROP CONSTRAINT IF EXISTS calibrations_equipment_id_equipment_id_fk;
ALTER TABLE calibrations DROP CONSTRAINT IF EXISTS calibrations_technician_id_users_id_fk;
ALTER TABLE non_conformances DROP CONSTRAINT IF EXISTS non_conformances_equipment_id_equipment_id_fk;
ALTER TABLE software_history DROP CONSTRAINT IF EXISTS software_history_equipment_id_equipment_id_fk;
ALTER TABLE calibration_factors DROP CONSTRAINT IF EXISTS calibration_factors_equipment_id_equipment_id_fk;
ALTER TABLE calibration_factors DROP CONSTRAINT IF EXISTS calibration_factors_calibration_id_calibrations_id_fk;
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_leader_id_users_id_fk;
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS equipment_manager_id_users_id_fk;

-- equipment.manager_id uuid → varchar 복원
ALTER TABLE equipment
  ALTER COLUMN manager_id TYPE varchar(36) USING manager_id::text;

-- CAS 복합 인덱스 제거
DROP INDEX IF EXISTS disposal_requests_id_version_idx;

-- 조회 최적화 인덱스 제거
DROP INDEX IF EXISTS non_conformances_created_at_idx;
DROP INDEX IF EXISTS audit_logs_entity_type_entity_id_idx;

-- equipment_location_history 인덱스 제거
DROP INDEX IF EXISTS equipment_location_history_equipment_id_idx;
DROP INDEX IF EXISTS equipment_location_history_changed_at_idx;
DROP INDEX IF EXISTS equipment_location_history_equipment_changed_at_idx;
