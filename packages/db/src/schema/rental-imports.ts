import { pgTable, uuid, varchar, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';
import { teams } from './teams';
import { checkouts } from './checkouts';

/**
 * 외부 렌탈 장비 반입 요청 테이블
 *
 * 워크플로우:
 * pending → approved → received → return_requested → returned
 * pending → rejected / canceled
 * approved → canceled
 *
 * 핵심 로직:
 * - received 시: 장비 자동 생성 (TEMP-XXX, isShared=true, sharedSource='external')
 * - return_requested 시: checkout 자동 생성 (purpose='return_to_vendor')
 * - returned 시: 장비 status → 'inactive'
 *
 * @see packages/schemas/src/enums.ts - RentalImportStatusEnum
 */
export const rentalImports = pgTable(
  'rental_imports',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

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

    // 렌탈 업체 정보
    vendorName: varchar('vendor_name', { length: 100 }).notNull(),
    vendorContact: varchar('vendor_contact', { length: 100 }),
    externalIdentifier: varchar('external_identifier', { length: 100 }), // 업체 장비번호

    // 사용 기간
    usagePeriodStart: timestamp('usage_period_start').notNull(),
    usagePeriodEnd: timestamp('usage_period_end').notNull(),

    // 반입 사유
    reason: text('reason').notNull(),

    // 상태
    status: varchar('status', { length: 30 }).notNull().default('pending'),

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

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 상태별 필터링
      statusIdx: index('rental_imports_status_idx').on(table.status),
      // 신청자별 조회
      requesterIdIdx: index('rental_imports_requester_id_idx').on(table.requesterId),
      // 팀별 조회
      teamIdIdx: index('rental_imports_team_id_idx').on(table.teamId),
      // 사이트별 조회
      siteIdx: index('rental_imports_site_idx').on(table.site),
      // 날짜별 조회
      createdAtIdx: index('rental_imports_created_at_idx').on(table.createdAt),
    };
  }
);

// 타입 정의
export type RentalImport = typeof rentalImports.$inferSelect;
export type NewRentalImport = typeof rentalImports.$inferInsert;

// Relations 정의
export const rentalImportsRelations = relations(rentalImports, ({ one }) => ({
  requester: one(users, {
    fields: [rentalImports.requesterId],
    references: [users.id],
    relationName: 'rental_import_requester',
  }),
  team: one(teams, {
    fields: [rentalImports.teamId],
    references: [teams.id],
  }),
  approver: one(users, {
    fields: [rentalImports.approverId],
    references: [users.id],
    relationName: 'rental_import_approver',
  }),
  receiver: one(users, {
    fields: [rentalImports.receivedBy],
    references: [users.id],
    relationName: 'rental_import_receiver',
  }),
  equipment: one(equipment, {
    fields: [rentalImports.equipmentId],
    references: [equipment.id],
  }),
  returnCheckout: one(checkouts, {
    fields: [rentalImports.returnCheckoutId],
    references: [checkouts.id],
  }),
}));
