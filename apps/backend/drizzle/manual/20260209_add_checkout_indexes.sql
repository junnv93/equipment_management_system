-- Migration: Add indexes for checkout performance optimization
-- Date: 2026-02-09
-- Purpose: Enable efficient JOINs and fix N+1 query patterns
-- Expected Impact: 5-10x faster queries (410ms → 40-80ms)

-- CRITICAL INDEXES: Enable efficient JOINs for checkout list queries
-- These are required before implementing the N+1 query fix

-- Index for checkout_items JOIN on checkout_id
CREATE INDEX IF NOT EXISTS idx_checkout_items_checkout_id
ON checkout_items(checkout_id);

-- Index for equipment JOIN via checkout_items
CREATE INDEX IF NOT EXISTS idx_checkout_items_equipment_id
ON checkout_items(equipment_id);

-- Index for condition_checks JOIN on checkout_id
-- Note: This table may not exist yet - skip if missing
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'condition_checks'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_condition_checks_checkout_id
    ON condition_checks(checkout_id);
  END IF;
END $$;

-- HIGH PRIORITY INDEXES: Improve filtered queries and sorting

-- Composite index for status-based queries with sorting by creation date
-- Covers: WHERE status = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_checkouts_status_created
ON checkouts(status, created_at DESC);

-- Composite index for user-specific queries filtered by status
-- Covers: WHERE requester_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_checkouts_requester_status
ON checkouts(requester_id, status);

-- Index for filtering by checkout purpose
-- Covers: WHERE purpose = ?
CREATE INDEX IF NOT EXISTS idx_checkouts_purpose
ON checkouts(purpose);

-- Composite index for team-based queries filtered by status
-- Covers: WHERE lender_team_id = ? AND status = ?
CREATE INDEX IF NOT EXISTS idx_checkouts_lender_team_status
ON checkouts(lender_team_id, status);

-- VERIFICATION QUERIES:
-- Run these after applying migration to confirm index usage

-- EXPLAIN ANALYZE
-- SELECT c.*, u.name as requester_name
-- FROM checkouts c
-- LEFT JOIN users u ON c.requester_id = u.id
-- WHERE c.status = 'pending'
-- ORDER BY c.created_at DESC
-- LIMIT 20;

-- EXPLAIN ANALYZE
-- SELECT ci.*, e.management_number, e.name
-- FROM checkout_items ci
-- LEFT JOIN equipment e ON ci.equipment_id = e.id
-- WHERE ci.checkout_id = 'c000000000000000000000000001';

-- Expected Results After Migration:
-- - Query time: 410ms → 40-80ms
-- - Seq Scan → Index Scan in EXPLAIN output
-- - Rows examined: 1000+ → <100
