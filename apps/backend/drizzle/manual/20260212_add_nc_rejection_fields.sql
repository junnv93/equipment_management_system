-- Migration: Add rejection tracking fields to non_conformances table
-- Date: 2026-02-12
-- Purpose: Store rejection reason/metadata so test engineers can see why their correction was rejected

ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE non_conformances ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
