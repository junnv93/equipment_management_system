-- 양식 템플릿 테이블: 스토리지 기반 양식 관리
CREATE TABLE IF NOT EXISTS "form_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "form_number" varchar(20) NOT NULL,
  "version" integer NOT NULL DEFAULT 1,
  "storage_key" varchar(500) NOT NULL,
  "original_filename" varchar(300) NOT NULL,
  "mime_type" varchar(100) NOT NULL,
  "file_size" integer NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "uploaded_by" uuid REFERENCES "public"."users"("id") ON DELETE restrict,
  "uploaded_at" timestamp DEFAULT NOW() NOT NULL,
  "created_at" timestamp DEFAULT NOW() NOT NULL,
  "updated_at" timestamp DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS "form_templates_form_number_idx" ON "form_templates" USING btree ("form_number");
CREATE UNIQUE INDEX IF NOT EXISTS "form_templates_active_idx" ON "form_templates" ("form_number") WHERE "is_active" = true;
