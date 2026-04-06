-- Migration: Rename calibration_method → management_method
-- Date: 2026-04-06
-- Reason: Field represents "관리 방법" (management method), not "교정 방법" (calibration method)
-- Reversible: Yes (see rollback below)

ALTER TABLE equipment RENAME COLUMN calibration_method TO management_method;

-- Rollback:
-- ALTER TABLE equipment RENAME COLUMN management_method TO calibration_method;
