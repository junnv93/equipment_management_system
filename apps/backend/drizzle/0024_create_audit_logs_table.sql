-- 감사 로그 테이블 생성
-- 로그는 수정/삭제 불가 (INSERT만 허용)
-- 5년 보관 정책

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "timestamp" TIMESTAMP DEFAULT NOW() NOT NULL,
  "user_id" UUID NOT NULL,
  "user_name" VARCHAR(100) NOT NULL,
  "user_role" VARCHAR(50) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID NOT NULL,
  "entity_name" VARCHAR(200),
  "details" JSONB,
  "ip_address" VARCHAR(50),
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 조회 성능을 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs" ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_idx" ON "audit_logs" ("entity_type");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_id_idx" ON "audit_logs" ("entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs" ("action");

-- 복합 인덱스 (자주 사용되는 필터 조합)
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_action_idx" ON "audit_logs" ("entity_type", "action");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_timestamp_idx" ON "audit_logs" ("user_id", "timestamp" DESC);

COMMENT ON TABLE "audit_logs" IS '감사 로그 테이블 - 5년 보관, INSERT 전용';
COMMENT ON COLUMN "audit_logs"."id" IS '고유 식별자';
COMMENT ON COLUMN "audit_logs"."timestamp" IS '로그 발생 시간';
COMMENT ON COLUMN "audit_logs"."user_id" IS '작업 수행 사용자 ID';
COMMENT ON COLUMN "audit_logs"."user_name" IS '작업 수행 사용자 이름';
COMMENT ON COLUMN "audit_logs"."user_role" IS '작업 수행 사용자 역할';
COMMENT ON COLUMN "audit_logs"."action" IS '수행된 액션 (create, update, delete, approve, reject 등)';
COMMENT ON COLUMN "audit_logs"."entity_type" IS '대상 엔티티 타입 (equipment, calibration, checkout 등)';
COMMENT ON COLUMN "audit_logs"."entity_id" IS '대상 엔티티 ID';
COMMENT ON COLUMN "audit_logs"."entity_name" IS '대상 엔티티 이름 (예: 장비명)';
COMMENT ON COLUMN "audit_logs"."details" IS '상세 정보 (변경 전/후 값, 요청 ID 등)';
COMMENT ON COLUMN "audit_logs"."ip_address" IS '요청 IP 주소';
