-- ================================================
-- Migration: Add version column for optimistic locking
-- Date: 2026-02-12
-- Purpose: Enable Compare-And-Swap (CAS) concurrency control
-- ================================================

-- Add version column (defaults to 1 for existing rows)
ALTER TABLE "checkouts"
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Create composite index for efficient CAS queries
-- WHERE id = ? AND version = ? will use this index
CREATE INDEX "idx_checkouts_id_version"
  ON "checkouts" ("id", "version");

-- Add column comment for documentation
COMMENT ON COLUMN "checkouts"."version" IS
  'Optimistic locking version. Auto-increments via sql`version + 1` expression in application code (no trigger).';

-- ================================================
-- Verification Queries
-- ================================================
-- Verify column exists:
--   SELECT version FROM checkouts LIMIT 5;
-- Expected: All rows have version=1
--
-- Verify index exists:
--   \di idx_checkouts_id_version
-- Expected: Index on (id, version) columns
-- ================================================
