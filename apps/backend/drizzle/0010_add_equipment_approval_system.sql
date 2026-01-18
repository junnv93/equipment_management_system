-- Add equipment approval system
-- Migration: 0010_add_equipment_approval_system
-- 
-- This migration adds:
-- 1. Approval-related fields to equipment table
-- 2. Additional required fields to equipment table
-- 3. equipment_requests table for request history
-- 4. equipment_attachments table for file attachments
-- 5. Enum types for approval status, request type, and attachment type

-- 1. Create enum types
DO $$ BEGIN
  CREATE TYPE "approval_status" AS ENUM ('pending_approval', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "request_type" AS ENUM ('create', 'update', 'delete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "attachment_type" AS ENUM ('inspection_report', 'history_card', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Add approval-related fields to equipment table
ALTER TABLE "equipment" 
  ADD COLUMN IF NOT EXISTS "approval_status" VARCHAR(50) DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS "requested_by" VARCHAR(36),
  ADD COLUMN IF NOT EXISTS "approved_by" VARCHAR(36);

-- 3. Add additional required fields to equipment table
ALTER TABLE "equipment"
  ADD COLUMN IF NOT EXISTS "equipment_type" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "calibration_result" TEXT,
  ADD COLUMN IF NOT EXISTS "correction_factor" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "intermediate_check_schedule" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "repair_history" TEXT;

-- 4. Add foreign key constraints for approval fields (IF NOT EXISTS는 PostgreSQL에서 지원하지 않으므로 조건부로 처리)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipment_requested_by_fk'
  ) THEN
    ALTER TABLE "equipment"
      ADD CONSTRAINT "equipment_requested_by_fk" 
        FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'equipment_approved_by_fk'
  ) THEN
    ALTER TABLE "equipment"
      ADD CONSTRAINT "equipment_approved_by_fk" 
        FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Create equipment_requests table
CREATE TABLE IF NOT EXISTS "equipment_requests" (
  "id" SERIAL PRIMARY KEY,
  "uuid" VARCHAR(36) NOT NULL UNIQUE,
  "request_type" "request_type" NOT NULL,
  "equipment_id" INTEGER REFERENCES "equipment"("id") ON DELETE CASCADE,
  "requested_by" VARCHAR(36) NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "requested_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "approval_status" "approval_status" NOT NULL DEFAULT 'pending_approval',
  "approved_by" VARCHAR(36) REFERENCES "users"("id") ON DELETE SET NULL,
  "approved_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "request_data" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. Create indexes for equipment_requests
CREATE INDEX IF NOT EXISTS "equipment_requests_uuid_idx" ON "equipment_requests"("uuid");
CREATE INDEX IF NOT EXISTS "equipment_requests_request_type_idx" ON "equipment_requests"("request_type");
CREATE INDEX IF NOT EXISTS "equipment_requests_approval_status_idx" ON "equipment_requests"("approval_status");
CREATE INDEX IF NOT EXISTS "equipment_requests_requested_by_idx" ON "equipment_requests"("requested_by");
CREATE INDEX IF NOT EXISTS "equipment_requests_approved_by_idx" ON "equipment_requests"("approved_by");
CREATE INDEX IF NOT EXISTS "equipment_requests_equipment_id_idx" ON "equipment_requests"("equipment_id");
CREATE INDEX IF NOT EXISTS "equipment_requests_status_type_idx" ON "equipment_requests"("approval_status", "request_type");

-- 7. Create equipment_attachments table
CREATE TABLE IF NOT EXISTS "equipment_attachments" (
  "id" SERIAL PRIMARY KEY,
  "uuid" VARCHAR(36) NOT NULL UNIQUE,
  "equipment_id" INTEGER REFERENCES "equipment"("id") ON DELETE CASCADE,
  "request_id" INTEGER REFERENCES "equipment_requests"("id") ON DELETE CASCADE,
  "attachment_type" "attachment_type" NOT NULL,
  "file_name" VARCHAR(255) NOT NULL,
  "original_file_name" VARCHAR(255) NOT NULL,
  "file_path" TEXT NOT NULL,
  "file_size" BIGINT NOT NULL,
  "mime_type" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "uploaded_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. Create indexes for equipment_attachments
CREATE INDEX IF NOT EXISTS "equipment_attachments_uuid_idx" ON "equipment_attachments"("uuid");
CREATE INDEX IF NOT EXISTS "equipment_attachments_equipment_id_idx" ON "equipment_attachments"("equipment_id");
CREATE INDEX IF NOT EXISTS "equipment_attachments_request_id_idx" ON "equipment_attachments"("request_id");
CREATE INDEX IF NOT EXISTS "equipment_attachments_attachment_type_idx" ON "equipment_attachments"("attachment_type");
CREATE INDEX IF NOT EXISTS "equipment_attachments_equipment_type_idx" ON "equipment_attachments"("equipment_id", "attachment_type");

-- 9. Add comments
COMMENT ON COLUMN "equipment"."approval_status" IS '승인 상태: pending_approval(승인 대기), approved(승인됨), rejected(반려됨)';
COMMENT ON COLUMN "equipment"."requested_by" IS '요청자 ID (users 테이블 참조)';
COMMENT ON COLUMN "equipment"."approved_by" IS '승인자 ID (users 테이블 참조)';
COMMENT ON COLUMN "equipment"."equipment_type" IS '장비 타입';
COMMENT ON COLUMN "equipment"."calibration_result" IS '교정 결과';
COMMENT ON COLUMN "equipment"."correction_factor" IS '보정계수';
COMMENT ON COLUMN "equipment"."intermediate_check_schedule" IS '중간점검일정';
COMMENT ON COLUMN "equipment"."repair_history" IS '장비 수리 내역';
COMMENT ON TABLE "equipment_requests" IS '장비 등록/수정/삭제 요청 이력';
COMMENT ON TABLE "equipment_attachments" IS '장비 관련 파일 첨부 (이력카드, 검수보고서 등)';
