-- 이 SQL 스크립트는 필요한 테이블을 생성하고 인덱스를 추가합니다

-- 1. 반출(CHECKOUT) 테이블 생성
CREATE TABLE IF NOT EXISTS "checkouts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_id" UUID NOT NULL REFERENCES "equipment"("id"),
  "user_id" UUID NOT NULL REFERENCES "users"("id"),
  "approver_id" UUID REFERENCES "users"("id"),
  "location" VARCHAR(255) NOT NULL,
  "phone_number" VARCHAR(50),
  "address" TEXT,
  "reason" TEXT,
  "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
  "checkout_date" TIMESTAMP NOT NULL DEFAULT now(),
  "expected_return_date" TIMESTAMP,
  "actual_return_date" TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 2. 교정(CALIBRATION) 테이블 생성
CREATE TABLE IF NOT EXISTS "calibrations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_id" UUID NOT NULL REFERENCES "equipment"("id"),
  "calibration_date" TIMESTAMP NOT NULL,
  "next_calibration_date" TIMESTAMP NOT NULL,
  "method" VARCHAR(50) NOT NULL,
  "agency" VARCHAR(255),
  "performed_by" UUID REFERENCES "users"("id"),
  "result" VARCHAR(50) NOT NULL,
  "certificate_number" VARCHAR(100),
  "certificate_file" VARCHAR(255),
  "notes" TEXT,
  "is_verified" BOOLEAN DEFAULT false,
  "verified_by" UUID REFERENCES "users"("id"),
  "verification_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 3. 이력(HISTORY) 테이블 생성
CREATE TABLE IF NOT EXISTS "history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_id" UUID NOT NULL REFERENCES "equipment"("id"),
  "event_type" VARCHAR(50) NOT NULL,
  "event_date" TIMESTAMP NOT NULL DEFAULT now(),
  "performed_by" UUID REFERENCES "users"("id"),
  "description" TEXT NOT NULL,
  "changes" JSONB,
  "related_entity_id" UUID,
  "related_entity_type" VARCHAR(50),
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT now()
);

-- 4. 인덱스 추가 (성능 최적화)
-- 반출 테이블 인덱스
CREATE INDEX IF NOT EXISTS "checkout_equipment_id_idx" ON "checkouts" ("equipment_id");
CREATE INDEX IF NOT EXISTS "checkout_user_id_idx" ON "checkouts" ("user_id");
CREATE INDEX IF NOT EXISTS "checkout_approver_id_idx" ON "checkouts" ("approver_id");
CREATE INDEX IF NOT EXISTS "checkout_status_idx" ON "checkouts" ("status");
CREATE INDEX IF NOT EXISTS "checkout_date_idx" ON "checkouts" ("checkout_date");
CREATE INDEX IF NOT EXISTS "checkout_expected_return_date_idx" ON "checkouts" ("expected_return_date");

-- 교정 테이블 인덱스
CREATE INDEX IF NOT EXISTS "calibration_equipment_id_idx" ON "calibrations" ("equipment_id");
CREATE INDEX IF NOT EXISTS "calibration_date_idx" ON "calibrations" ("calibration_date");
CREATE INDEX IF NOT EXISTS "next_calibration_date_idx" ON "calibrations" ("next_calibration_date");
CREATE INDEX IF NOT EXISTS "calibration_method_idx" ON "calibrations" ("method");
CREATE INDEX IF NOT EXISTS "calibration_result_idx" ON "calibrations" ("result");
CREATE INDEX IF NOT EXISTS "calibration_performed_by_idx" ON "calibrations" ("performed_by");

-- 이력 테이블 인덱스
CREATE INDEX IF NOT EXISTS "history_equipment_id_idx" ON "history" ("equipment_id");
CREATE INDEX IF NOT EXISTS "history_event_type_idx" ON "history" ("event_type");
CREATE INDEX IF NOT EXISTS "history_event_date_idx" ON "history" ("event_date");
CREATE INDEX IF NOT EXISTS "history_performed_by_idx" ON "history" ("performed_by");
CREATE INDEX IF NOT EXISTS "history_related_entity_id_idx" ON "history" ("related_entity_id");
CREATE INDEX IF NOT EXISTS "history_related_entity_type_idx" ON "history" ("related_entity_type"); 