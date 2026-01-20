-- Migration: 0020_extend_software_fields
-- Description: Add software name and software type fields to equipment table
-- Related: Prompt 9-1 (소프트웨어 관리대장)

-- Add software fields to equipment table
ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "software_name" varchar(200);
ALTER TABLE "equipment" ADD COLUMN IF NOT EXISTS "software_type" varchar(50);

-- Create index for software name search optimization
CREATE INDEX IF NOT EXISTS "equipment_software_name_idx" ON "equipment" ("software_name");
