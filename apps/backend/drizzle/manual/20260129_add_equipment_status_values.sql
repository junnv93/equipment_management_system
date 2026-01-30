-- Migration: Add new equipment status values
-- Date: 2026-01-29
-- Description: Add 4 new equipment statuses for disposal and temporary equipment workflows

-- Add new status values to equipment_status enum
-- Note: PostgreSQL enums are immutable, so we can only ADD values, not remove
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'pending_disposal';
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'disposed';
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'temporary';
ALTER TYPE equipment_status ADD VALUE IF NOT EXISTS 'inactive';

-- Optional: Migrate existing 'retired' status to 'disposed' (uncomment if needed)
-- UPDATE equipment SET status = 'disposed' WHERE status = 'retired';

-- Add comment for documentation
COMMENT ON TYPE equipment_status IS 'Equipment status enum: available, in_use, checked_out, calibration_scheduled, calibration_overdue, non_conforming, spare, retired (deprecated), pending_disposal, disposed, temporary, inactive';
