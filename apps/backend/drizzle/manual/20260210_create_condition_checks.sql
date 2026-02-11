-- Migration: Create condition_checks table for rental 4-step verification
-- Date: 2026-02-10
-- Purpose: Enable 4-step condition tracking for rental checkouts

-- Create condition_checks table
CREATE TABLE IF NOT EXISTS "condition_checks" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "checkout_id" UUID NOT NULL,
  "step" VARCHAR(50) NOT NULL,
  "checked_by" UUID NOT NULL,
  "checked_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "appearance_status" VARCHAR(20) NOT NULL,
  "operation_status" VARCHAR(20) NOT NULL,
  "accessories_status" VARCHAR(20),
  "abnormal_details" TEXT,
  "comparison_with_previous" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Foreign keys
  CONSTRAINT "fk_condition_checks_checkout"
    FOREIGN KEY ("checkout_id")
    REFERENCES "checkouts" ("id")
    ON DELETE CASCADE,

  CONSTRAINT "fk_condition_checks_checker"
    FOREIGN KEY ("checked_by")
    REFERENCES "users" ("id")
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_condition_checks_checkout_id"
  ON "condition_checks" ("checkout_id");

CREATE INDEX IF NOT EXISTS "idx_condition_checks_checked_by"
  ON "condition_checks" ("checked_by");

CREATE INDEX IF NOT EXISTS "idx_condition_checks_step"
  ON "condition_checks" ("step");

-- Add comment
COMMENT ON TABLE "condition_checks" IS
  'Records 4-step condition checks for rental checkouts: lender_checkout, borrower_receive, borrower_return, lender_return';
