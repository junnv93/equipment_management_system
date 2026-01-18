-- Make equipment.site field required (NOT NULL)
-- Migration: 0009_make_equipment_site_required
-- 
-- This migration ensures that:
-- 1. All existing equipment records have a site value (default: 'suwon')
-- 2. The site field becomes NOT NULL to enforce data integrity
-- 3. Future equipment registrations must specify a site

-- 1. Set default value for any NULL site values (should not happen if 0006 ran correctly)
UPDATE "equipment" 
SET "site" = 'suwon' 
WHERE "site" IS NULL;

-- 2. Add NOT NULL constraint to equipment.site
ALTER TABLE "equipment" 
  ALTER COLUMN "site" SET NOT NULL;

-- 3. Add check constraint to ensure only valid site values
ALTER TABLE "equipment" 
  ADD CONSTRAINT "equipment_site_check" 
  CHECK ("site" IN ('suwon', 'uiwang'));

-- 4. Update comment
COMMENT ON COLUMN "equipment"."site" IS '사이트 정보 (필수): suwon(수원) 또는 uiwang(의왕)';
