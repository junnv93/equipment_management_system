-- Add version column to calibration_factors for CAS (Optimistic Locking)
ALTER TABLE calibration_factors ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
