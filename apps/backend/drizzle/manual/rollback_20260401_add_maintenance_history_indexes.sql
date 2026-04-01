-- Rollback: equipment_maintenance_history 인덱스 제거
DROP INDEX IF EXISTS maintenance_history_equipment_performed_at_idx;
DROP INDEX IF EXISTS maintenance_history_performed_at_idx;
