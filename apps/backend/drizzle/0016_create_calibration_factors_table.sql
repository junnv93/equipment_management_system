-- 보정계수 이력 테이블 생성
-- 프롬프트 6-1: 보정계수 스키마 및 마이그레이션
-- 보정계수 변경 이력은 영구 보관 (deletedAt 소프트 삭제만 허용)

-- calibration_factors 테이블 생성
CREATE TABLE IF NOT EXISTS "calibration_factors" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- 장비 및 교정 관계
  "equipment_id" UUID NOT NULL,
  "calibration_id" UUID,

  -- 보정계수 정보
  "factor_type" VARCHAR(50) NOT NULL,
  "factor_name" VARCHAR(200) NOT NULL,
  "factor_value" DECIMAL(15, 6) NOT NULL,
  "unit" VARCHAR(20) NOT NULL,
  "parameters" JSONB,

  -- 유효 기간
  "effective_date" DATE NOT NULL,
  "expiry_date" DATE,

  -- 승인 프로세스
  "approval_status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "requested_by" UUID NOT NULL,
  "approved_by" UUID,
  "requested_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "approved_at" TIMESTAMP,
  "approver_comment" TEXT,

  -- 시스템 필드
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "deleted_at" TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "calibration_factors_equipment_id_idx"
  ON "calibration_factors" ("equipment_id");

CREATE INDEX IF NOT EXISTS "calibration_factors_approval_status_idx"
  ON "calibration_factors" ("approval_status");

CREATE INDEX IF NOT EXISTS "calibration_factors_calibration_id_idx"
  ON "calibration_factors" ("calibration_id");

CREATE INDEX IF NOT EXISTS "calibration_factors_equipment_approved_idx"
  ON "calibration_factors" ("equipment_id", "approval_status", "effective_date");

CREATE INDEX IF NOT EXISTS "calibration_factors_effective_date_idx"
  ON "calibration_factors" ("effective_date");

-- 코멘트 추가
COMMENT ON TABLE "calibration_factors" IS '보정계수 이력 테이블 - 장비별 보정계수 관리';
COMMENT ON COLUMN "calibration_factors"."factor_type" IS '보정계수 타입: antenna_gain, cable_loss, path_loss, amplifier_gain, other';
COMMENT ON COLUMN "calibration_factors"."factor_name" IS '사용자 정의 이름 (예: 3GHz 안테나 이득)';
COMMENT ON COLUMN "calibration_factors"."parameters" IS '다중 파라미터 JSON (주파수별 값 등)';
COMMENT ON COLUMN "calibration_factors"."approval_status" IS '승인 상태: pending, approved, rejected';
