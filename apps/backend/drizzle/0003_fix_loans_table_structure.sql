-- Fix loans table structure to match the schema
-- Drop and recreate the table with correct column names

-- First, drop the existing table (CASCADE to handle any foreign keys)
DROP TABLE IF EXISTS "loans" CASCADE;

-- Recreate the table with the correct structure matching packages/db/src/schema/loans.ts
CREATE TABLE IF NOT EXISTS "loans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"borrower_id" uuid NOT NULL,
	"approver_id" uuid,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"loan_date" timestamp,
	"expected_return_date" timestamp NOT NULL,
	"actual_return_date" timestamp,
	"notes" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
