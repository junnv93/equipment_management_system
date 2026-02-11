-- ================================================
-- Rollback: Remove version column for optimistic locking
-- Date: 2026-02-12
-- ================================================

-- Drop index first (foreign key dependencies)
DROP INDEX IF EXISTS "idx_checkouts_id_version";

-- Drop column
ALTER TABLE "checkouts"
  DROP COLUMN IF EXISTS "version";

-- ================================================
-- Verification Query
-- ================================================
-- Verify column removed:
--   \d checkouts
-- Expected: No 'version' column in schema
-- ================================================
