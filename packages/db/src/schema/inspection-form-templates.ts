import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  index,
  integer,
  jsonb,
  unique,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import {
  INSPECTION_TYPE_VALUES,
  type InspectionType,
  type ExtractedInspectionStructure,
} from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

/**
 * Inspection Form Templates — UL-QP-18-03 / UL-QP-18-05 Build-Once Workflow
 *
 * 점검 양식 구조의 *snapshot DB* — 산업 표준 LIMS(LabWare/Veeva Vault/Beamex CMX) 패턴.
 *
 * 핵심 보장:
 * - prefill 안정성: 직전 *반려된* 점검에 의존하지 않음 (template entity가 source-of-truth)
 * - 버전 체이닝: version + supersededBy로 양식 통제 audit trail (UL-QP-18 §7.5)
 * - Soft Fork: 표 구조 변경 시 사용자가 "이번만 / 다음부터도" 선택 (forkChoice DTO)
 *
 * 라이프사이클:
 * - create: 첫 inspection 승인 시 system 자동 생성 (auto-create hook)
 * - version_up: 사용자 forkChoice='apply_forward' 선택 시 version+1 + supersededBy 체이닝
 * - update: admin only (Permission.MANAGE_INSPECTION_TEMPLATE)
 * - soft delete: deletedAt set (history 보존)
 *
 * SSOT:
 * - structure 컬럼은 ExtractedInspectionStructureSchema (zod) 검증
 * - inspection_type 값은 INSPECTION_TYPE_VALUES from @equipment-management/schemas
 */
export const inspectionFormTemplates = pgTable(
  'inspection_form_templates',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 대상 장비
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),

    // 점검 유형 — 'intermediate' | 'self' (SSOT: INSPECTION_TYPE_VALUES)
    inspectionType: varchar('inspection_type', { length: 20 }).$type<InspectionType>().notNull(),

    /**
     * 1부터 시작 — 각 (equipment_id, inspection_type) 별 monotonic.
     * 동시 수정 시 unique constraint(uniq_equipment_type_version) 위반 → 409 ConflictException.
     */
    version: integer('version').notNull(),

    /**
     * 양식 구조 (value-stripped) — extractStructureFromInspection 결과.
     * Zod 검증: ExtractedInspectionStructureSchema (jsonb 무결성).
     */
    structure: jsonb('structure').$type<ExtractedInspectionStructure>().notNull(),

    /**
     * 첫 승인 시 trigger한 inspection — audit trail.
     * Polymorphic: inspectionType이 'intermediate'면 intermediate_inspections.id,
     *              'self'면 equipment_self_inspections.id.
     * FK 없음 — application layer에서 무결성 보장.
     */
    sourceInspectionId: uuid('source_inspection_id'),

    /**
     * 다음 version으로 superseded — version chain.
     * NULL이면 *현재* template (latest, current).
     * Self-FK with onDelete: 'set null' (history 보존).
     */
    supersededBy: uuid('superseded_by').references((): AnyPgColumn => inspectionFormTemplates.id, {
      onDelete: 'set null',
    }),

    /**
     * 첫 생성: NULL (시스템 auto-create on first approve).
     * 이후 수정: admin user uuid.
     */
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),

    createdAt: timestamp('created_at').defaultNow().notNull(),

    /** Soft delete — history 보존 (audit trail 측면). */
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    /** (equipment, type, version) 유일성 — CAS 충돌 시 409 보장. */
    uniqEquipmentTypeVersion: unique('inspection_form_templates_uniq_equipment_type_version').on(
      table.equipmentId,
      table.inspectionType,
      table.version
    ),

    /**
     * 각 (equipment, type) 별 *현재* template (supersededBy IS NULL AND deletedAt IS NULL).
     * latest 조회 시 sequential scan 회피.
     */
    idxCurrent: index('inspection_form_templates_current_idx')
      .on(table.equipmentId, table.inspectionType)
      .where(sql`superseded_by IS NULL AND deleted_at IS NULL`),

    /** Gallery 쿼리용 — inspection_type 별 active set. */
    idxTypeActive: index('inspection_form_templates_type_active_idx').on(
      table.inspectionType,
      table.deletedAt
    ),

    /** Source inspection 추적 — audit/디버깅용. */
    idxSourceInspection: index('inspection_form_templates_source_inspection_idx').on(
      table.sourceInspectionId
    ),
  })
);

export type InspectionFormTemplate = typeof inspectionFormTemplates.$inferSelect;
export type NewInspectionFormTemplate = typeof inspectionFormTemplates.$inferInsert;

/** @see packages/schemas/src/enums/inspection-result-section.ts (SSOT) */
export const inspectionTemplateTypeValues = INSPECTION_TYPE_VALUES;

// ============================================================================
// Relations
// ============================================================================

export const inspectionFormTemplatesRelations = relations(inspectionFormTemplates, ({ one }) => ({
  equipment: one(equipment, {
    fields: [inspectionFormTemplates.equipmentId],
    references: [equipment.id],
  }),
  creator: one(users, {
    fields: [inspectionFormTemplates.createdBy],
    references: [users.id],
    relationName: 'inspectionFormTemplateCreator',
  }),
  /** Self-relation: 다음 version (supersededBy 가리키는 대상). */
  supersedingTemplate: one(inspectionFormTemplates, {
    fields: [inspectionFormTemplates.supersededBy],
    references: [inspectionFormTemplates.id],
    relationName: 'inspectionFormTemplateSuperseding',
  }),
}));
