-- Migration: Add non-conformance and repair workflow integration
-- Date: 2026-01-26
-- Description: Adds ncType, resolutionType, repairHistoryId, and calibrationId to non_conformances table

-- Add new columns to non_conformances table (nullable first for existing data compatibility)
ALTER TABLE non_conformances
  ADD COLUMN IF NOT EXISTS nc_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS resolution_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS repair_history_id UUID,
  ADD COLUMN IF NOT EXISTS calibration_id UUID;

-- Add foreign key constraint for repair_history_id
ALTER TABLE non_conformances
  ADD CONSTRAINT fk_non_conformances_repair_history
  FOREIGN KEY (repair_history_id)
  REFERENCES repair_history(id)
  ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS non_conformances_nc_type_idx
  ON non_conformances(nc_type);

CREATE INDEX IF NOT EXISTS non_conformances_resolution_type_idx
  ON non_conformances(resolution_type);

CREATE INDEX IF NOT EXISTS non_conformances_repair_history_id_idx
  ON non_conformances(repair_history_id);

-- Update existing records with default value
UPDATE non_conformances
SET nc_type = 'other'
WHERE nc_type IS NULL;

-- Make nc_type NOT NULL after setting default values
ALTER TABLE non_conformances
  ALTER COLUMN nc_type SET NOT NULL;

-- Add manufacturer_contact column to equipment table (from schema changes)
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS manufacturer_contact VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN non_conformances.nc_type IS '부적합 유형: damage, malfunction, calibration_failure, measurement_error, other';
COMMENT ON COLUMN non_conformances.resolution_type IS '해결 방법: repair, recalibration, replacement, disposal, other';
COMMENT ON COLUMN non_conformances.repair_history_id IS '연결된 수리 기록 ID (1:1 관계)';
COMMENT ON COLUMN non_conformances.calibration_id IS '연결된 교정 기록 ID (향후 확장용)';
