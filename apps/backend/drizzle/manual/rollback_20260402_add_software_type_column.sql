-- Rollback: Remove software_type column from software_history table
ALTER TABLE software_history DROP COLUMN IF EXISTS software_type;
