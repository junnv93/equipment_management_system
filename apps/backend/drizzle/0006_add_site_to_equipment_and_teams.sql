-- Add site field to equipment and teams tables
-- Migration: 0006_add_site_to_equipment_and_teams

-- 1. Add site column to equipment table
ALTER TABLE "equipment" 
  ADD COLUMN IF NOT EXISTS "site" VARCHAR(20);

-- 2. Add site column to teams table
ALTER TABLE "teams" 
  ADD COLUMN IF NOT EXISTS "site" VARCHAR(20);

-- 3. Create index on equipment.site for performance
CREATE INDEX IF NOT EXISTS "equipment_site_idx" ON "equipment" ("site");

-- 4. Migrate existing data: Set default site value to 'suwon' for existing records
UPDATE "equipment" 
SET "site" = 'suwon' 
WHERE "site" IS NULL;

UPDATE "teams" 
SET "site" = 'suwon' 
WHERE "site" IS NULL;

-- 5. Add comments for documentation
COMMENT ON COLUMN "equipment"."site" IS '사이트 정보: suwon(수원) 또는 uiwang(의왕)';
COMMENT ON COLUMN "teams"."site" IS '사이트 정보: suwon(수원) 또는 uiwang(의왕)';
