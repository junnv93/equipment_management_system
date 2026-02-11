-- Rollback Migration: Remove optimistic locking from calibration_factors table
-- Date: 2026-02-11
-- Phase: 2B - Calibration-Factors Module

-- Drop index first
DROP INDEX IF EXISTS calibration_factors_version_idx;

-- Remove version column
ALTER TABLE calibration_factors DROP COLUMN IF EXISTS version;

-- Verify rollback
DO $$
DECLARE
  column_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'calibration_factors'
      AND column_name = 'version'
  ) INTO column_exists;

  IF column_exists THEN
    RAISE EXCEPTION 'Rollback failed: version column still exists';
  END IF;

  RAISE NOTICE 'Rollback successful: version column removed from calibration_factors table';
END $$;
