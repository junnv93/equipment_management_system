-- Rollback: Software domain redesign (UL-QP-18-07/09)
-- Reverses: test_software, software_validations, equipment_test_software creation
--           equipment columns restoration, software_history restoration

-- 1. Drop new tables
DROP TABLE IF EXISTS equipment_test_software CASCADE;
DROP TABLE IF EXISTS software_validations CASCADE;
DROP TABLE IF EXISTS test_software CASCADE;

-- 2. Restore equipment columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_name VARCHAR(200);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_type VARCHAR(50);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS software_version VARCHAR(50);
CREATE INDEX IF NOT EXISTS equipment_software_name_idx ON equipment(software_name);

-- 3. Note: software_history table restoration requires separate migration
-- (table was already dropped, schema no longer exists in codebase)
