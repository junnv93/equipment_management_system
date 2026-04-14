-- 자체점검 승인 워크플로우 전면 재구현 (UL-QP-18-05)
-- 기존: status(draft/completed/confirmed) + confirmed_by/at
-- 변경: approval_status(draft/submitted/approved/rejected) + 결재 단계별 컬럼
--
-- 워크플로우: draft → submitted(담당+검토=시험실무자) → approved(승인=기술책임자)
--             submitted → rejected(반려) → resubmit → draft

--> statement-breakpoint
-- 1. 새 컬럼 추가 (DEFAULT 포함으로 NOT NULL 제약 안전하게 추가)
ALTER TABLE "equipment_self_inspections"
  ADD COLUMN "approval_status" varchar(20) NOT NULL DEFAULT 'draft',
  ADD COLUMN "submitted_at" timestamp,
  ADD COLUMN "submitted_by" uuid,
  ADD COLUMN "approved_at" timestamp,
  ADD COLUMN "approved_by" uuid,
  ADD COLUMN "rejected_at" timestamp,
  ADD COLUMN "rejected_by" uuid,
  ADD COLUMN "rejection_reason" text,
  ADD COLUMN "created_by" uuid;
--> statement-breakpoint

-- 2. 기존 데이터 마이그레이션
UPDATE "equipment_self_inspections" SET "approval_status" = 'draft' WHERE "status" = 'draft';
--> statement-breakpoint
UPDATE "equipment_self_inspections" SET "approval_status" = 'submitted' WHERE "status" = 'completed';
--> statement-breakpoint
UPDATE "equipment_self_inspections"
  SET "approval_status" = 'approved',
      "approved_by" = "confirmed_by",
      "approved_at" = "confirmed_at"
  WHERE "status" = 'confirmed';
--> statement-breakpoint

-- 3. FK 제약 추가
ALTER TABLE "equipment_self_inspections"
  ADD CONSTRAINT "equipment_self_inspections_submitted_by_users_id_fk"
  FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "equipment_self_inspections"
  ADD CONSTRAINT "equipment_self_inspections_approved_by_users_id_fk"
  FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "equipment_self_inspections"
  ADD CONSTRAINT "equipment_self_inspections_rejected_by_users_id_fk"
  FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "equipment_self_inspections"
  ADD CONSTRAINT "equipment_self_inspections_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- 4. 이전 컬럼 제거
ALTER TABLE "equipment_self_inspections"
  DROP COLUMN IF EXISTS "status",
  DROP COLUMN IF EXISTS "confirmed_by",
  DROP COLUMN IF EXISTS "confirmed_at";
--> statement-breakpoint

-- 5. 인덱스 변경
DROP INDEX IF EXISTS "self_inspections_status_idx";
--> statement-breakpoint
DROP INDEX IF EXISTS "self_inspections_confirmed_by_idx";
--> statement-breakpoint
CREATE INDEX "self_inspections_approval_status_idx" ON "equipment_self_inspections" USING btree ("approval_status");
--> statement-breakpoint
CREATE INDEX "self_inspections_submitted_by_idx" ON "equipment_self_inspections" USING btree ("submitted_by");
--> statement-breakpoint
CREATE INDEX "self_inspections_approved_by_idx" ON "equipment_self_inspections" USING btree ("approved_by");
--> statement-breakpoint
CREATE INDEX "self_inspections_rejected_by_idx" ON "equipment_self_inspections" USING btree ("rejected_by");
