-- Rollback: TOCTOU 방지 partial unique index 제거
DROP INDEX IF EXISTS non_conformances_equipment_nc_type_open_unique;
