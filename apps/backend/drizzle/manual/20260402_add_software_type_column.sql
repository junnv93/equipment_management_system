-- Add software_type column to software_history table
-- Nullable for backward compatibility with existing rows
ALTER TABLE software_history ADD COLUMN IF NOT EXISTS software_type VARCHAR(30);
