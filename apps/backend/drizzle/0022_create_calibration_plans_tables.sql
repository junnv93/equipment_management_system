-- 교정계획서 테이블 생성
-- 프롬프트 10-1: 교정계획서 스키마 및 마이그레이션
-- 연초에 작성되는 교정계획서로, 외부교정 대상 장비 목록을 관리합니다.

-- calibration_plans 테이블 생성
CREATE TABLE IF NOT EXISTS "calibration_plans" (
  "id" SERIAL PRIMARY KEY,
  "uuid" UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,

  -- 기본 정보
  "year" INTEGER NOT NULL,
  "site_id" VARCHAR(20) NOT NULL,
  "team_id" UUID,

  -- 상태 관리
  "status" VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- 작성자/승인자 정보
  "created_by" VARCHAR(36) NOT NULL,
  "approved_by" VARCHAR(36),
  "approved_at" TIMESTAMP,
  "rejection_reason" TEXT,

  -- 시스템 필드
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,

  -- 연도 + 시험소 복합 unique 제약
  CONSTRAINT "calibration_plans_year_site_unique" UNIQUE ("year", "site_id")
);

-- calibration_plan_items 테이블 생성
CREATE TABLE IF NOT EXISTS "calibration_plan_items" (
  "id" SERIAL PRIMARY KEY,
  "uuid" UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,

  -- 관계
  "plan_id" INTEGER NOT NULL REFERENCES "calibration_plans"("id") ON DELETE CASCADE,
  "equipment_id" INTEGER NOT NULL REFERENCES "equipment"("id") ON DELETE CASCADE,

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
  "confirmed_by" VARCHAR(36),
  "confirmed_at" TIMESTAMP,

  -- 비고
  "actual_calibration_date" TIMESTAMP,
  "notes" TEXT,

  -- 시스템 필드
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- calibration_plans 인덱스 생성
CREATE INDEX IF NOT EXISTS "calibration_plans_year_idx"
  ON "calibration_plans" ("year");

CREATE INDEX IF NOT EXISTS "calibration_plans_site_id_idx"
  ON "calibration_plans" ("site_id");

CREATE INDEX IF NOT EXISTS "calibration_plans_status_idx"
  ON "calibration_plans" ("status");

CREATE INDEX IF NOT EXISTS "calibration_plans_created_by_idx"
  ON "calibration_plans" ("created_by");

-- calibration_plan_items 인덱스 생성
CREATE INDEX IF NOT EXISTS "calibration_plan_items_plan_id_idx"
  ON "calibration_plan_items" ("plan_id");

CREATE INDEX IF NOT EXISTS "calibration_plan_items_equipment_id_idx"
  ON "calibration_plan_items" ("equipment_id");

CREATE INDEX IF NOT EXISTS "calibration_plan_items_sequence_number_idx"
  ON "calibration_plan_items" ("sequence_number");

CREATE INDEX IF NOT EXISTS "calibration_plan_items_plan_equipment_idx"
  ON "calibration_plan_items" ("plan_id", "equipment_id");

-- 코멘트 추가
COMMENT ON TABLE "calibration_plans" IS '교정계획서 테이블 - 연간 외부교정 대상 장비 계획 관리';
COMMENT ON COLUMN "calibration_plans"."year" IS '계획 연도';
COMMENT ON COLUMN "calibration_plans"."site_id" IS '시험소 ID: suwon | uiwang';
COMMENT ON COLUMN "calibration_plans"."team_id" IS '팀 ID (선택)';
COMMENT ON COLUMN "calibration_plans"."status" IS '상태: draft, pending_approval, approved, rejected';
COMMENT ON COLUMN "calibration_plans"."created_by" IS '작성자 ID (기술책임자)';
COMMENT ON COLUMN "calibration_plans"."approved_by" IS '승인자 ID (시험소장)';
COMMENT ON COLUMN "calibration_plans"."approved_at" IS '승인일시';
COMMENT ON COLUMN "calibration_plans"."rejection_reason" IS '반려 사유';

COMMENT ON TABLE "calibration_plan_items" IS '교정계획서 항목 테이블 - 개별 장비 교정 계획';
COMMENT ON COLUMN "calibration_plan_items"."plan_id" IS '계획서 ID (FK)';
COMMENT ON COLUMN "calibration_plan_items"."equipment_id" IS '장비 ID (FK)';
COMMENT ON COLUMN "calibration_plan_items"."sequence_number" IS '순번';
COMMENT ON COLUMN "calibration_plan_items"."snapshot_validity_date" IS '유효일자 스냅샷 (최종교정일)';
COMMENT ON COLUMN "calibration_plan_items"."snapshot_calibration_cycle" IS '교정주기 스냅샷 (개월)';
COMMENT ON COLUMN "calibration_plan_items"."snapshot_calibration_agency" IS '현재 교정기관 스냅샷';
COMMENT ON COLUMN "calibration_plan_items"."planned_calibration_date" IS '계획된 교정일자 (차기교정일)';
COMMENT ON COLUMN "calibration_plan_items"."planned_calibration_agency" IS '계획된 교정기관';
COMMENT ON COLUMN "calibration_plan_items"."confirmed_by" IS '확인자 ID (기술책임자)';
COMMENT ON COLUMN "calibration_plan_items"."confirmed_at" IS '확인일시';
COMMENT ON COLUMN "calibration_plan_items"."actual_calibration_date" IS '실제 교정일 (자동 기록)';
COMMENT ON COLUMN "calibration_plan_items"."notes" IS '추가 비고';
