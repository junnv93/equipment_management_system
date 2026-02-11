-- Rollback Migration: Remove optimistic locking from equipment table
-- Date: 2026-02-11
-- Purpose: Revert CAS pattern if issues arise in production

-- Drop index first (faster DROP COLUMN)
DROP INDEX IF EXISTS equipment_version_idx;

-- Remove version column
-- This will fail if other constraints depend on it (safety check)
ALTER TABLE equipment DROP COLUMN IF EXISTS version;

-- Verify rollback
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'equipment'
      AND column_name = 'version'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE EXCEPTION 'Rollback failed: version column still exists';
  END IF;

  RAISE NOTICE 'Rollback successful: version column removed from equipment table';
END $$;
