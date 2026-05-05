-- 0054_add_system_error_events
-- 시스템 에러 이벤트 (5xx / uncaught) SSOT 테이블.
-- audit_logs 의 비즈니스 거절(reject/cancel) proxy 를 진짜 시스템 에러 신호로 대체.
-- 캡처는 GlobalExceptionFilter 의 fire-and-forget INSERT — PII deny-list 강제.
CREATE TABLE IF NOT EXISTS "system_error_events" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "error_code" varchar(50) NOT NULL,
    "http_method" varchar(10) NOT NULL,
    "normalized_route" varchar(255) NOT NULL,
    "status_code" smallint NOT NULL,
    "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
    "stack_hash" varchar(64),
    "stack_preview" text
);

CREATE INDEX IF NOT EXISTS "system_error_events_created_at_idx"
    ON "system_error_events" ("created_at" DESC);

CREATE INDEX IF NOT EXISTS "system_error_events_code_created_at_idx"
    ON "system_error_events" ("error_code", "created_at" DESC);
