-- Migration: Remove 'analyzing' status from non_conformances
-- Date: 2026-03-17
-- Reason: UL-QP-18 simplified workflow (open → corrected → closed)

-- 1. Migrate existing 'analyzing' records to 'open'
UPDATE non_conformances SET status = 'open' WHERE status = 'analyzing';

-- 2. Drop the analysis_content column (no longer needed)
ALTER TABLE non_conformances DROP COLUMN IF EXISTS analysis_content;
