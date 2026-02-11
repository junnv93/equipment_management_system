-- Rollback: Drop software_history table
-- Date: 2026-02-12
-- Purpose: Revert software_history table creation if issues occur

-- Drop indexes first
DROP INDEX IF EXISTS software_history_equipment_software_idx;
DROP INDEX IF EXISTS software_history_changed_at_idx;
DROP INDEX IF EXISTS software_history_approval_status_idx;
DROP INDEX IF EXISTS software_history_software_name_idx;
DROP INDEX IF EXISTS software_history_equipment_id_idx;
DROP INDEX IF EXISTS software_history_version_idx;

-- Drop table
DROP TABLE IF EXISTS software_history;

-- Verify rollback
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'software_history'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE EXCEPTION 'Rollback failed: software_history table still exists';
    ELSE
        RAISE NOTICE 'Rollback successful: software_history table dropped';
    END IF;
END $$;
