-- Migration: Add optimistic locking to calibrations table
-- Date: 2026-02-11
-- Phase: 2A - Calibrations Module
-- Purpose: Protect calibration approval workflow from concurrent modifications

-- Add version column with default value 1 (IF NOT EXISTS guard for idempotency)
ALTER TABLE calibrations
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create index for performance optimization
CREATE INDEX IF NOT EXISTS calibrations_version_idx ON calibrations(version);

-- Update existing rows to version 1
UPDATE calibrations SET version = 1 WHERE version IS NULL;

-- Verify migration
DO $$
DECLARE
  total_count INTEGER;
  versioned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM calibrations;
  SELECT COUNT(*) INTO versioned_count FROM calibrations WHERE version IS NOT NULL;

  IF total_count != versioned_count THEN
    RAISE EXCEPTION 'Migration verification failed: % rows total, % rows with version',
      total_count, versioned_count;
  END IF;

  RAISE NOTICE 'Migration successful: % calibration records now have version field', total_count;
END $$;
