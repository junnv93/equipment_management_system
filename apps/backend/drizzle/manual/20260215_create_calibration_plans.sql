-- 교정계획서 테이블 생성 마이그레이션
-- SSOT: packages/db/src/schema/calibration-plans.ts
--
-- 이 마이그레이션은 기존 ALTER TABLE 마이그레이션(20260128, 20260129, 20260215)의
-- 모든 컬럼을 포함하는 완전한 CREATE TABLE입니다.
-- IF NOT EXISTS를 사용하여 멱등성을 보장합니다.

-- 1. calibration_plans 테이블 생성
CREATE TABLE IF NOT EXISTS "calibration_plans" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- 기본 정보
  "year" INTEGER NOT NULL,
  "site_id" VARCHAR(20) NOT NULL,
  "team_id" UUID,

  -- 상태 관리
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- 작성자 정보 (기술책임자)
  "created_by" UUID NOT NULL,

  -- 검토 요청 단계 (기술책임자 → 품질책임자)
  "submitted_at" TIMESTAMP,

  -- 검토 단계 (품질책임자)
  "reviewed_by" UUID,
  "reviewed_at" TIMESTAMP,
  "review_comment" TEXT,

  -- 승인 단계 (시험소장)
  "approved_by" UUID,
  "approved_at" TIMESTAMP,

  -- 반려 정보 (품질책임자 또는 시험소장)
  "rejected_by" UUID,
  "rejected_at" TIMESTAMP,
  "rejection_reason" TEXT,
  "rejection_stage" VARCHAR(20),

  -- 버전 관리
  "version" INTEGER NOT NULL DEFAULT 1,
  "cas_version" INTEGER NOT NULL DEFAULT 1,
  "parent_plan_id" UUID REFERENCES "calibration_plans"("id"),
  "is_latest_version" BOOLEAN NOT NULL DEFAULT TRUE,

  -- 시스템 필드
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. calibration_plan_items 테이블 생성
CREATE TABLE IF NOT EXISTS "calibration_plan_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- 관계
  "plan_id" UUID NOT NULL REFERENCES "calibration_plans"("id") ON DELETE CASCADE,
  "equipment_id" UUID NOT NULL REFERENCES "equipment"("id") ON DELETE CASCADE,

  -- 순번
  "sequence_number" INTEGER NOT NULL,

  -- 현황 - 작성 시점 스냅샷
  "snapshot_validity_date" TIMESTAMP,
  "snapshot_calibration_cycle" INTEGER,
  "snapshot_calibration_agency" VARCHAR(100),

  -- 계획
  "planned_calibration_date" TIMESTAMP,
  "planned_calibration_agency" VARCHAR(100),

  -- 확인 (기술책임자)
  "confirmed_by" UUID,
  "confirmed_at" TIMESTAMP,

  -- 비고
  "actual_calibration_date" TIMESTAMP,
  "notes" TEXT,

  -- 시스템 필드
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. 인덱스 생성
-- calibration_plans 인덱스
CREATE INDEX IF NOT EXISTS "calibration_plans_year_site_version_idx"
  ON "calibration_plans" ("year", "site_id", "is_latest_version");
CREATE INDEX IF NOT EXISTS "calibration_plans_year_idx"
  ON "calibration_plans" ("year");
CREATE INDEX IF NOT EXISTS "calibration_plans_site_id_idx"
  ON "calibration_plans" ("site_id");
CREATE INDEX IF NOT EXISTS "calibration_plans_status_idx"
  ON "calibration_plans" ("status");
CREATE INDEX IF NOT EXISTS "calibration_plans_created_by_idx"
  ON "calibration_plans" ("created_by");
CREATE INDEX IF NOT EXISTS "calibration_plans_parent_plan_id_idx"
  ON "calibration_plans" ("parent_plan_id");
CREATE INDEX IF NOT EXISTS "calibration_plans_is_latest_version_idx"
  ON "calibration_plans" ("is_latest_version");

-- 최신 버전 유일성 partial unique index
CREATE UNIQUE INDEX IF NOT EXISTS "calibration_plans_year_site_latest_unique_idx"
  ON "calibration_plans" ("year", "site_id")
  WHERE "is_latest_version" = TRUE;

-- calibration_plan_items 인덱스
CREATE INDEX IF NOT EXISTS "calibration_plan_items_plan_id_idx"
  ON "calibration_plan_items" ("plan_id");
CREATE INDEX IF NOT EXISTS "calibration_plan_items_equipment_id_idx"
  ON "calibration_plan_items" ("equipment_id");
CREATE INDEX IF NOT EXISTS "calibration_plan_items_sequence_number_idx"
  ON "calibration_plan_items" ("sequence_number");
CREATE INDEX IF NOT EXISTS "calibration_plan_items_plan_equipment_idx"
  ON "calibration_plan_items" ("plan_id", "equipment_id");

-- 확인 쿼리
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'calibration_plan%';
