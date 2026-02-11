-- Migration: Add optimistic locking to equipment table
-- Date: 2026-02-11
-- Purpose: Implement CAS (Compare-And-Swap) pattern for concurrent modification protection
-- Related: Phase 1 of system-wide optimistic locking implementation

-- Add version column with default value 1
-- NOT NULL ensures all rows have a version
-- DEFAULT 1 applies to existing rows automatically
ALTER TABLE equipment
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Create index for performance optimization
-- Version checks (WHERE version = ?) will use this index
CREATE INDEX equipment_version_idx ON equipment(version);

-- Update existing rows to version 1 (redundant due to DEFAULT, but explicit for clarity)
-- This ensures a clean starting point for all equipment records
UPDATE equipment SET version = 1 WHERE version IS NULL;

-- Verify migration
-- Expected: All rows should have version = 1
DO $$
DECLARE
  total_count INTEGER;
  versioned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM equipment;
  SELECT COUNT(*) INTO versioned_count FROM equipment WHERE version IS NOT NULL;

  IF total_count != versioned_count THEN
    RAISE EXCEPTION 'Migration verification failed: % rows total, % rows with version',
      total_count, versioned_count;
  END IF;

  RAISE NOTICE 'Migration successful: % equipment records now have version field', total_count;
END $$;
