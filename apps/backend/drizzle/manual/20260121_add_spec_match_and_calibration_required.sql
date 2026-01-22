-- Migration: Add specMatch and calibrationRequired columns to equipment table
-- Date: 2026-01-21
-- Description: 시방일치 여부(specMatch)와 교정필요 여부(calibrationRequired) 필드 추가

-- Add specMatch column (시방일치 여부: 'match' | 'mismatch')
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS spec_match VARCHAR(20);

-- Add calibrationRequired column (교정필요 여부: 'required' | 'not_required')
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS calibration_required VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN equipment.spec_match IS '시방일치 여부: match(일치), mismatch(불일치)';
COMMENT ON COLUMN equipment.calibration_required IS '교정필요 여부: required(필요), not_required(불필요)';
