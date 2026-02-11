-- Migration: Add optimistic locking to calibration_factors table
-- Date: 2026-02-11
-- Phase: 2B - Calibration-Factors Module
-- Purpose: Protect calibration factor approval workflow from concurrent modifications

-- Add version column with default value 1
ALTER TABLE calibration_factors
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create index for performance optimization
CREATE INDEX calibration_factors_version_idx ON calibration_factors(version);

-- Update existing rows to version 1
UPDATE calibration_factors SET version = 1 WHERE version IS NULL;

-- Verify migration
DO $$
DECLARE
  total_count INTEGER;
  versioned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM calibration_factors;
  SELECT COUNT(*) INTO versioned_count FROM calibration_factors WHERE version IS NOT NULL;

  IF total_count != versioned_count THEN
    RAISE EXCEPTION 'Migration verification failed: % rows total, % rows with version',
      total_count, versioned_count;
  END IF;

  RAISE NOTICE 'Migration successful: % calibration factor records now have version field', total_count;
END $$;
