-- Rollback Migration: Remove optimistic locking from calibrations table
-- Date: 2026-02-11
-- Phase: 2A - Calibrations Module

-- Drop index first
DROP INDEX IF EXISTS calibrations_version_idx;

-- Remove version column
ALTER TABLE calibrations DROP COLUMN IF EXISTS version;

-- Verify rollback
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calibrations'
      AND column_name = 'version'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE EXCEPTION 'Rollback failed: version column still exists';
  END IF;

  RAISE NOTICE 'Rollback successful: version column removed from calibrations table';
END $$;
