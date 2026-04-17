-- Migration: Remove unused calibrations.cost column
ALTER TABLE "calibrations" DROP COLUMN IF EXISTS "cost";
