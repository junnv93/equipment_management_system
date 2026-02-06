-- Migration: Add disposal_requests table for 2-stage disposal approval workflow
-- Created: 2026-01-30
-- Description: Implements disposal request table with review and approval stages

-- Create disposal_requests table
CREATE TABLE IF NOT EXISTS "disposal_requests" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- Equipment reference (cascade delete)
  "equipment_id" UUID NOT NULL REFERENCES "equipment"("id") ON DELETE CASCADE,

  -- Disposal reason
  "reason" VARCHAR(50) NOT NULL,
  "reason_detail" TEXT NOT NULL,

  -- Requester information
  "requested_by" UUID NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "requested_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- Review information (technical_manager, same team)
  "review_status" VARCHAR(20) DEFAULT 'pending' NOT NULL,
  "reviewed_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "reviewed_at" TIMESTAMP,
  "review_opinion" TEXT,

  -- Approval information (lab_manager)
  "approved_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "approved_at" TIMESTAMP,
  "approval_comment" TEXT,

  -- Rejection information
  "rejected_by" UUID REFERENCES "users"("id") ON DELETE RESTRICT,
  "rejected_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "rejection_step" VARCHAR(20), -- 'review' | 'approval'

  -- System fields
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "disposal_requests_equipment_id_idx" ON "disposal_requests"("equipment_id");
CREATE INDEX IF NOT EXISTS "disposal_requests_review_status_idx" ON "disposal_requests"("review_status");
CREATE INDEX IF NOT EXISTS "disposal_requests_requested_by_idx" ON "disposal_requests"("requested_by");
CREATE INDEX IF NOT EXISTS "disposal_requests_reviewed_by_idx" ON "disposal_requests"("reviewed_by");
CREATE INDEX IF NOT EXISTS "disposal_requests_approved_by_idx" ON "disposal_requests"("approved_by");
CREATE INDEX IF NOT EXISTS "disposal_requests_requested_at_idx" ON "disposal_requests"("requested_at");

-- Add comment to table
COMMENT ON TABLE "disposal_requests" IS '장비 폐기 요청 테이블 (2단계 승인 워크플로우)';
COMMENT ON COLUMN "disposal_requests"."review_status" IS 'pending | reviewed | approved | rejected';
COMMENT ON COLUMN "disposal_requests"."reason" IS 'obsolete | broken | inaccurate | other';
COMMENT ON COLUMN "disposal_requests"."rejection_step" IS 'review | approval (반려된 단계)';
