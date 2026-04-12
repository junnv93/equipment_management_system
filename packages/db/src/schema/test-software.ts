import { pgTable, varchar, timestamp, uuid, index, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { TEST_FIELD_VALUES, SOFTWARE_AVAILABILITY_VALUES } from '@equipment-management/schemas';
import type { TestField, SoftwareAvailability } from '@equipment-management/schemas';
import { users } from './users';
import { softwareValidations } from './software-validations';
import { equipmentTestSoftware } from './equipment-test-software';

/**
 * 시험용 소프트웨어 관리대장 (UL-QP-18-07)
 *
 * 장비와 독립적인 시험용 소프트웨어 레지스트리.
 * 관리번호 PNNNN 형식 (분류코드 P=Software Program).
 */
export const testSoftware = pgTable(
  'test_software',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 관리번호 PNNNN (P0001, P0002, ...)
    managementNumber: varchar('management_number', { length: 20 }).notNull(),

    // 소프트웨어 정보
    name: varchar('name', { length: 200 }).notNull(),
    softwareVersion: varchar('software_version', { length: 100 }),
    testField: varchar('test_field', { length: 10 }).$type<TestField>().notNull(),
    manufacturer: varchar('manufacturer', { length: 200 }),
    location: varchar('location', { length: 50 }),

    // 담당자 (정/부)
    primaryManagerId: uuid('primary_manager_id').references(() => users.id, {
      onDelete: 'restrict',
    }),
    secondaryManagerId: uuid('secondary_manager_id').references(() => users.id, {
      onDelete: 'restrict',
    }),

    // 운영 정보
    installedAt: timestamp('installed_at'),
    availability: varchar('availability', { length: 20 })
      .$type<SoftwareAvailability>()
      .notNull()
      .default('available'),
    requiresValidation: boolean('requires_validation').notNull().default(true),

    // 사이트 스코프
    site: varchar('site', { length: 10 }),

    // 등록자
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Optimistic locking
    version: integer('version').notNull().default(1),
  },
  (table) => ({
    managementNumberIdx: index('test_software_management_number_idx').on(table.managementNumber),
    testFieldIdx: index('test_software_test_field_idx').on(table.testField),
    availabilityIdx: index('test_software_availability_idx').on(table.availability),
    siteIdx: index('test_software_site_idx').on(table.site),
    primaryManagerIdIdx: index('test_software_primary_manager_id_idx').on(table.primaryManagerId),
    secondaryManagerIdIdx: index('test_software_secondary_manager_id_idx').on(
      table.secondaryManagerId
    ),
    createdByIdx: index('test_software_created_by_idx').on(table.createdBy),
  })
);

export type TestSoftware = typeof testSoftware.$inferSelect;
export type NewTestSoftware = typeof testSoftware.$inferInsert;

/** @see packages/schemas/src/enums/software.ts - TestFieldEnum (SSOT) */
export const testFieldValues = TEST_FIELD_VALUES;
/** @see packages/schemas/src/enums/software.ts - SoftwareAvailabilityEnum (SSOT) */
export const softwareAvailabilityValues = SOFTWARE_AVAILABILITY_VALUES;

export const testSoftwareRelations = relations(testSoftware, ({ one, many }) => ({
  primaryManager: one(users, {
    fields: [testSoftware.primaryManagerId],
    references: [users.id],
    relationName: 'testSoftwarePrimaryManager',
  }),
  secondaryManager: one(users, {
    fields: [testSoftware.secondaryManagerId],
    references: [users.id],
    relationName: 'testSoftwareSecondaryManager',
  }),
  validations: many(softwareValidations),
  equipmentLinks: many(equipmentTestSoftware),
}));
