-- Add rejection_reason column to loans table
ALTER TABLE "loans" ADD COLUMN IF NOT EXISTS "rejection_reason" text;
