-- Rollback: Remove version column from software_history table
-- Date: 2026-02-12
-- Purpose: Revert optimistic locking migration if issues occur

-- Step 1: Remove index
DROP INDEX IF EXISTS software_history_version_idx;

-- Step 2: Remove version column
ALTER TABLE software_history DROP COLUMN IF EXISTS version;

-- Step 3: Optionally remove migrated records (if you want to revert to in-memory state)
-- DELETE FROM software_history WHERE id IN ('sw-001-uuid', 'sw-002-uuid');

-- Step 4: Verify rollback
DO $$
DECLARE
    column_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'software_history'
        AND column_name = 'version'
    ) INTO column_exists;

    IF column_exists THEN
        RAISE EXCEPTION 'Rollback failed: version column still exists';
    ELSE
        RAISE NOTICE 'Rollback successful: version column removed';
    END IF;
END $$;
