-- 부적합 기록 테이블 생성
-- 프롬프트 7-1: 부적합 장비 스키마 및 마이그레이션
-- 부적합 이력은 영구 보관 (deletedAt 소프트 삭제만 허용)

-- non_conformances 테이블 생성
CREATE TABLE IF NOT EXISTS "non_conformances" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,

  -- 장비 관계
  "equipment_id" UUID NOT NULL,

  -- 부적합 발견 정보
  "discovery_date" DATE NOT NULL,
  "discovered_by" UUID NOT NULL,
  "cause" TEXT NOT NULL,

  -- 조치 계획 및 분석
  "action_plan" TEXT,
  "analysis_content" TEXT,

  -- 조치 완료 정보
  "correction_content" TEXT,
  "correction_date" DATE,
  "corrected_by" UUID,

  -- 상태 관리
  "status" VARCHAR(20) NOT NULL DEFAULT 'open',

  -- 종료 정보 (기술책임자)
  "closed_by" UUID,
  "closed_at" TIMESTAMP,
  "closure_notes" TEXT,

  -- 시스템 필드
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "deleted_at" TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS "non_conformances_equipment_id_idx"
  ON "non_conformances" ("equipment_id");

CREATE INDEX IF NOT EXISTS "non_conformances_status_idx"
  ON "non_conformances" ("status");

CREATE INDEX IF NOT EXISTS "non_conformances_discovery_date_idx"
  ON "non_conformances" ("discovery_date");

CREATE INDEX IF NOT EXISTS "non_conformances_equipment_status_idx"
  ON "non_conformances" ("equipment_id", "status");

-- 코멘트 추가
COMMENT ON TABLE "non_conformances" IS '부적합 기록 테이블 - 장비 부적합 사항 관리 및 이력 추적';
COMMENT ON COLUMN "non_conformances"."status" IS '부적합 상태: open, analyzing, corrected, closed';
COMMENT ON COLUMN "non_conformances"."discovery_date" IS '부적합 발견일';
COMMENT ON COLUMN "non_conformances"."discovered_by" IS '발견자 ID (시험실무자)';
COMMENT ON COLUMN "non_conformances"."cause" IS '부적합 원인';
COMMENT ON COLUMN "non_conformances"."action_plan" IS '조치 계획';
COMMENT ON COLUMN "non_conformances"."analysis_content" IS '원인 분석 내용';
COMMENT ON COLUMN "non_conformances"."correction_content" IS '조치 내용';
COMMENT ON COLUMN "non_conformances"."correction_date" IS '조치 완료일';
COMMENT ON COLUMN "non_conformances"."corrected_by" IS '조치자 ID';
COMMENT ON COLUMN "non_conformances"."closed_by" IS '종료 승인자 ID (기술책임자)';
COMMENT ON COLUMN "non_conformances"."closed_at" IS '종료 시각';
COMMENT ON COLUMN "non_conformances"."closure_notes" IS '종료 메모';
