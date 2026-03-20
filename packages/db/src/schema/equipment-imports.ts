import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import type { EquipmentImportSource, EquipmentImportStatus } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';
import { teams } from './teams';
import { checkouts } from './checkouts';

/**
 * 장비 반입 요청 테이블 (통합: 렌탈 + 내부 공용)
 *
 * 워크플로우:
 * pending → approved → received → return_requested → returned
 * pending → rejected / canceled
 * approved → canceled
 *
 * 출처 타입 (source_type):
 * - rental: 외부 렌탈 업체 (vendor 정보 필수)
 * - internal_shared: 내부 공용장비 (ownerDepartment 정보 필수)
 *
 * 핵심 로직:
 * - received 시: 장비 자동 생성 (TEMP-XXX, isShared=true)
 *   - rental → sharedSource='external', owner=vendorName
 *   - internal_shared → sharedSource='internal_shared', owner=ownerDepartment
 * - return_requested 시: checkout 자동 생성 (purpose='return_to_vendor')
 * - returned 시: 장비 status → 'inactive'
 *
 * @see packages/schemas/src/enums.ts - EquipmentImportSourceEnum, EquipmentImportStatusEnum
 */
export const equipmentImports = pgTable(
  'equipment_imports',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 출처 타입 (discriminator)
    sourceType: varchar('source_type', { length: 30 })
      .$type<EquipmentImportSource>()
      .notNull()
      .default('rental'),

    // 신청자 정보
    requesterId: uuid('requester_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    site: varchar('site', { length: 20 }).notNull(), // 'suwon' | 'uiwang' | 'pyeongtaek'
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id, { onDelete: 'restrict' }),

    // 장비 정보 (반입 신청 시 입력)
    equipmentName: varchar('equipment_name', { length: 100 }).notNull(),
    modelName: varchar('model_name', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    description: text('description'),
    classification: varchar('classification', { length: 50 }).notNull(), // fcc_emc_rf, general_emc, etc.

    // 렌탈 업체 정보 (sourceType='rental'일 때 필수)
    vendorName: varchar('vendor_name', { length: 100 }), // nullable (internal_shared는 불필요)
    vendorContact: varchar('vendor_contact', { length: 100 }),
    externalIdentifier: varchar('external_identifier', { length: 100 }), // 업체 장비번호

    // 내부 공용장비 정보 (sourceType='internal_shared'일 때 필수)
    ownerDepartment: varchar('owner_department', { length: 100 }), // 소유 부서 (예: Safety Lab)
    internalContact: varchar('internal_contact', { length: 100 }), // 내부 담당자 연락처
    borrowingJustification: text('borrowing_justification'), // 상세 반입 사유

    // 사용 기간
    usagePeriodStart: timestamp('usage_period_start').notNull(),
    usagePeriodEnd: timestamp('usage_period_end').notNull(),

    // 반입 사유 (공통)
    reason: text('reason').notNull(),

    // 상태
    status: varchar('status', { length: 30 })
      .$type<EquipmentImportStatus>()
      .notNull()
      .default('pending'),

    // 승인 정보
    approverId: uuid('approver_id').references(() => users.id, { onDelete: 'restrict' }),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'),

    // 수령 정보
    receivedBy: uuid('received_by').references(() => users.id, { onDelete: 'restrict' }),
    receivedAt: timestamp('received_at'),
    receivingCondition: jsonb('receiving_condition'), // { appearance: 'normal'|'abnormal', operation: 'normal'|'abnormal', accessories: 'complete'|'incomplete', notes: string }

    // 연결된 장비 (수령 시 자동 생성)
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'set null' }),

    // 연결된 반납 checkout (반납 시작 시 자동 생성)
    returnCheckoutId: uuid('return_checkout_id').references(() => checkouts.id, {
      onDelete: 'set null',
    }),

    // Optimistic locking version
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 상태별 필터링
      statusIdx: index('equipment_imports_status_idx').on(table.status),
      // 신청자별 조회
      requesterIdIdx: index('equipment_imports_requester_id_idx').on(table.requesterId),
      // 팀별 조회
      teamIdIdx: index('equipment_imports_team_id_idx').on(table.teamId),
      // 사이트별 조회
      siteIdx: index('equipment_imports_site_idx').on(table.site),
      // 날짜별 조회
      createdAtIdx: index('equipment_imports_created_at_idx').on(table.createdAt),
      // 출처 타입별 조회
      sourceTypeIdx: index('equipment_imports_source_type_idx').on(table.sourceType),
      // 복합 인덱스 (상태+출처)
      statusSourceTypeIdx: index('equipment_imports_status_source_type_idx').on(
        table.status,
        table.sourceType
      ),
    };
  }
);

// 타입 정의
export type EquipmentImport = typeof equipmentImports.$inferSelect;
export type NewEquipmentImport = typeof equipmentImports.$inferInsert;

// Relations 정의
export const equipmentImportsRelations = relations(equipmentImports, ({ one }) => ({
  requester: one(users, {
    fields: [equipmentImports.requesterId],
    references: [users.id],
    relationName: 'equipment_import_requester',
  }),
  team: one(teams, {
    fields: [equipmentImports.teamId],
    references: [teams.id],
  }),
  approver: one(users, {
    fields: [equipmentImports.approverId],
    references: [users.id],
    relationName: 'equipment_import_approver',
  }),
  receiver: one(users, {
    fields: [equipmentImports.receivedBy],
    references: [users.id],
    relationName: 'equipment_import_receiver',
  }),
  equipment: one(equipment, {
    fields: [equipmentImports.equipmentId],
    references: [equipment.id],
  }),
  returnCheckout: one(checkouts, {
    fields: [equipmentImports.returnCheckoutId],
    references: [checkouts.id],
  }),
}));

// ============================================================================
// DEPRECATED: Legacy rental imports types (backward compatibility)
// ============================================================================

/**
 * @deprecated Use EquipmentImport instead
 */
export type RentalImport = EquipmentImport;

/**
 * @deprecated Use NewEquipmentImport instead
 */
export type NewRentalImport = NewEquipmentImport;

/**
 * @deprecated Use equipmentImports instead
 */
export const rentalImports = equipmentImports;

/**
 * @deprecated Use equipmentImportsRelations instead
 */
export const rentalImportsRelations = equipmentImportsRelations;
