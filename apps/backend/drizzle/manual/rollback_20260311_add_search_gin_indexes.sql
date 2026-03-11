-- Rollback: pg_trgm GIN 인덱스 제거

DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_management_number_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_serial_number_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_description_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_users_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_position_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_department_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_teams_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_teams_description_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_title_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_notifications_content_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_checkouts_destination_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_checkouts_reason_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_checkouts_address_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_calibrations_agency_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_calibrations_certificate_number_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_calibrations_notes_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_calibration_factors_factor_name_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_software_history_software_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_software_history_verification_record_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_non_conformances_cause_gin;

DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_imports_equipment_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_imports_vendor_name_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_equipment_imports_owner_department_gin;

-- 확장은 다른 곳에서도 사용할 수 있으므로 주석 처리
-- DROP EXTENSION IF EXISTS pg_trgm;
