-- Migration: 0050_add_inspection_form_templates
-- Purpose: 점검 양식 템플릿 (snapshot DB) 테이블 신설
--          UL-QP-18-03 (중간점검) / UL-QP-18-05 (자체점검) Build-Once Workflow.
-- Pattern: 산업 표준 LIMS (LabWare/Veeva Vault/Beamex CMX) Template Snapshot DB.
-- SSOT:    structure(jsonb)는 ExtractedInspectionStructureSchema (zod) 검증.
--          inspection_type 값은 INSPECTION_TYPE_VALUES from @equipment-management/schemas.
--
-- 라이프사이클:
--  - create:     첫 inspection 승인 시 system 자동 생성 (auto-create hook)
--  - version_up: 사용자 forkChoice='apply_forward' 선택 시 version+1 + supersededBy 체이닝
--  - update:     admin only (Permission.MANAGE_INSPECTION_TEMPLATE)
--  - soft delete: deleted_at set (history 보존, audit trail)

CREATE TABLE IF NOT EXISTS "inspection_form_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "equipment_id" uuid NOT NULL,
  "inspection_type" varchar(20) NOT NULL,
  "version" integer NOT NULL,
  "structure" jsonb NOT NULL,
  "source_inspection_id" uuid,
  "superseded_by" uuid,
  "created_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "deleted_at" timestamp
);

--> statement-breakpoint

-- FK: equipment cascade delete (장비 삭제 시 모든 점검 양식 템플릿 함께 삭제)
ALTER TABLE "inspection_form_templates"
  ADD CONSTRAINT "inspection_form_templates_equipment_id_equipment_id_fk"
  FOREIGN KEY ("equipment_id")
  REFERENCES "equipment"("id")
  ON DELETE CASCADE
  ON UPDATE NO ACTION;

--> statement-breakpoint

-- FK: superseded_by self-reference (다음 version 가리킴 — soft history chain)
ALTER TABLE "inspection_form_templates"
  ADD CONSTRAINT "inspection_form_templates_superseded_by_inspection_form_templates_id_fk"
  FOREIGN KEY ("superseded_by")
  REFERENCES "inspection_form_templates"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

--> statement-breakpoint

-- FK: created_by users (시스템 auto-create는 NULL, admin 명시 수정은 admin uuid)
ALTER TABLE "inspection_form_templates"
  ADD CONSTRAINT "inspection_form_templates_created_by_users_id_fk"
  FOREIGN KEY ("created_by")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE NO ACTION;

--> statement-breakpoint

-- Unique: (equipment, type, version) — 동시 수정 시 409 ConflictException 보장 (CAS)
CREATE UNIQUE INDEX IF NOT EXISTS "inspection_form_templates_uniq_equipment_type_version"
  ON "inspection_form_templates" ("equipment_id", "inspection_type", "version");

--> statement-breakpoint

-- Partial index: 각 (equipment, type) 별 *현재* template (latest, current)
-- supersededBy IS NULL AND deletedAt IS NULL인 row만 인덱싱 → useLatestTemplate 쿼리 최적화
CREATE INDEX IF NOT EXISTS "inspection_form_templates_current_idx"
  ON "inspection_form_templates" ("equipment_id", "inspection_type")
  WHERE "superseded_by" IS NULL AND "deleted_at" IS NULL;

--> statement-breakpoint

-- Index: gallery 쿼리용 — inspection_type 별 active set
CREATE INDEX IF NOT EXISTS "inspection_form_templates_type_active_idx"
  ON "inspection_form_templates" ("inspection_type", "deleted_at");

--> statement-breakpoint

-- Index: source inspection 추적 — audit / 디버깅용
CREATE INDEX IF NOT EXISTS "inspection_form_templates_source_inspection_idx"
  ON "inspection_form_templates" ("source_inspection_id");

--> statement-breakpoint
