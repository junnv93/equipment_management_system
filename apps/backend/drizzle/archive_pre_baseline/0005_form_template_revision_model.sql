-- Migration: form_templates revision model
-- Stable identifier is formName; formNumber is a mutable, historically-unique revision marker.
-- Drops: version, is_active. Adds: form_name, is_current, superseded_at.
-- Backfill maps existing form_number → form_name using FORM_CATALOG canonical names.

-- 1. Add form_name (nullable first for backfill)
ALTER TABLE "form_templates" ADD COLUMN "form_name" varchar(200);--> statement-breakpoint

-- 2. Backfill form_name from form_number (FORM_CATALOG canonical names)
UPDATE "form_templates" SET "form_name" = CASE "form_number"
  WHEN 'UL-QP-18-01' THEN '시험설비 관리대장'
  WHEN 'UL-QP-18-02' THEN '시험설비 이력카드'
  WHEN 'UL-QP-18-03' THEN '중간 점검표'
  WHEN 'UL-QP-18-05' THEN '자체 점검표'
  WHEN 'UL-QP-18-06' THEN '장비 반·출입 확인서'
  WHEN 'UL-QP-18-07' THEN '시험용 소프트웨어 관리대장'
  WHEN 'UL-QP-18-08' THEN 'Cable and Path Loss 관리 대장'
  WHEN 'UL-QP-18-09' THEN '시험 소프트웨어의 유효성확인'
  WHEN 'UL-QP-18-10' THEN '공용 장비 사용/반납 확인서'
  WHEN 'UL-QP-18-11' THEN '보정인자 및 파라미터 관리대장'
  WHEN 'UL-QP-19-01' THEN '연간 교정계획서'
END;--> statement-breakpoint

-- 3. Drop old version ≥ 2 rows (file replacement history is not required per UL-QP-18).
--    Keep only the row with is_active = true per form_number. If none active, keep highest version.
DELETE FROM "form_templates" ft
WHERE EXISTS (
  SELECT 1 FROM "form_templates" ft2
  WHERE ft2."form_number" = ft."form_number"
    AND (ft2."is_active", ft2."version") > (ft."is_active", ft."version")
);--> statement-breakpoint

-- 4. Enforce not-null on form_name
ALTER TABLE "form_templates" ALTER COLUMN "form_name" SET NOT NULL;--> statement-breakpoint

-- 5. Add is_current + superseded_at
ALTER TABLE "form_templates" ADD COLUMN "is_current" boolean NOT NULL DEFAULT true;--> statement-breakpoint
ALTER TABLE "form_templates" ADD COLUMN "superseded_at" timestamp;--> statement-breakpoint

-- 6. Copy is_active → is_current (all remaining rows are active after dedup, but be explicit)
UPDATE "form_templates" SET "is_current" = "is_active";--> statement-breakpoint

-- 7. Drop old indexes + columns
DROP INDEX IF EXISTS "form_templates_active_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "form_templates_form_number_idx";--> statement-breakpoint
ALTER TABLE "form_templates" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "form_templates" DROP COLUMN "version";--> statement-breakpoint

-- 8. Widen form_number (accommodate future numbering like UL-QP-2026-01)
ALTER TABLE "form_templates" ALTER COLUMN "form_number" TYPE varchar(30);--> statement-breakpoint

-- 9. New indexes
CREATE INDEX "form_templates_form_name_idx" ON "form_templates" USING btree ("form_name");--> statement-breakpoint
CREATE UNIQUE INDEX "form_templates_current_idx" ON "form_templates" ("form_name") WHERE "is_current" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "form_templates_form_number_unique" ON "form_templates" ("form_number");
