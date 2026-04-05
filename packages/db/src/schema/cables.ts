import {
  pgTable,
  varchar,
  timestamp,
  text,
  uuid,
  index,
  integer,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { CABLE_CONNECTOR_TYPE_VALUES, CABLE_STATUS_VALUES } from '@equipment-management/schemas';
import type { CableConnectorType, CableStatus, Site } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 케이블 레지스트리 (UL-QP-18-08)
 *
 * RF 시험용 케이블 및 경로 손실(Path Loss) 관리
 * 관리번호 형식: ELLLX-NNN (e.g. E020K-325)
 */
export const cables = pgTable(
  'cables',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 케이블 식별 정보
    managementNumber: varchar('management_number', { length: 20 }).notNull(),
    length: varchar('length', { length: 20 }), // 미터 단위 (e.g. "0.20")
    connectorType: varchar('connector_type', { length: 20 }).$type<CableConnectorType>(),
    frequencyRangeMin: integer('frequency_range_min'), // MHz
    frequencyRangeMax: integer('frequency_range_max'), // MHz
    serialNumber: varchar('serial_number', { length: 100 }),
    location: varchar('location', { length: 50 }),
    site: varchar('site', { length: 10 }).$type<Site>(),

    // 상태
    status: varchar('status', { length: 20 }).$type<CableStatus>().notNull().default('active'),

    // 최근 측정 정보
    lastMeasurementDate: timestamp('last_measurement_date'),
    measuredBy: uuid('measured_by').references(() => users.id, { onDelete: 'restrict' }),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Optimistic locking
    version: integer('version').notNull().default(1),
  },
  (table) => ({
    managementNumberIdx: index('cables_management_number_idx').on(table.managementNumber),
    statusIdx: index('cables_status_idx').on(table.status),
    siteIdx: index('cables_site_idx').on(table.site),
  })
);

export type Cable = typeof cables.$inferSelect;
export type NewCable = typeof cables.$inferInsert;

/** @see packages/schemas/src/enums/cable.ts (SSOT) */
export const cableConnectorTypeValues = CABLE_CONNECTOR_TYPE_VALUES;
export const cableStatusValues = CABLE_STATUS_VALUES;

/**
 * 케이블 손실 측정 세션 (UL-QP-18-08)
 *
 * 개별 측정 세션 기록 — 하나의 케이블에 대해 여러 번 측정 가능
 */
export const cableLossMeasurements = pgTable(
  'cable_loss_measurements',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    cableId: uuid('cable_id')
      .notNull()
      .references(() => cables.id, { onDelete: 'cascade' }),
    measurementDate: timestamp('measurement_date').notNull(),
    measuredBy: uuid('measured_by').references(() => users.id, { onDelete: 'restrict' }),
    measurementEquipmentId: uuid('measurement_equipment_id').references(() => equipment.id, {
      onDelete: 'restrict',
    }),
    notes: text('notes'),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    cableIdIdx: index('cable_loss_measurements_cable_id_idx').on(table.cableId),
    measurementDateIdx: index('cable_loss_measurements_measurement_date_idx').on(
      table.measurementDate
    ),
  })
);

export type CableLossMeasurement = typeof cableLossMeasurements.$inferSelect;
export type NewCableLossMeasurement = typeof cableLossMeasurements.$inferInsert;

/**
 * 케이블 손실 데이터 포인트 (UL-QP-18-08)
 *
 * 주파수별 손실값 — 하나의 측정 세션에 여러 주파수 포인트
 */
export const cableLossDataPoints = pgTable(
  'cable_loss_data_points',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    measurementId: uuid('measurement_id')
      .notNull()
      .references(() => cableLossMeasurements.id, { onDelete: 'cascade' }),
    frequencyMhz: integer('frequency_mhz').notNull(),
    lossDb: varchar('loss_db', { length: 20 }).notNull(), // decimal as string for precision
  },
  (table) => ({
    measurementIdIdx: index('cable_loss_data_points_measurement_id_idx').on(table.measurementId),
    uniqueFrequencyPerMeasurement: unique('cable_loss_data_points_measurement_freq_unique').on(
      table.measurementId,
      table.frequencyMhz
    ),
  })
);

export type CableLossDataPoint = typeof cableLossDataPoints.$inferSelect;
export type NewCableLossDataPoint = typeof cableLossDataPoints.$inferInsert;

// ============================================================================
// Relations
// ============================================================================

export const cablesRelations = relations(cables, ({ one, many }) => ({
  measuredByUser: one(users, {
    fields: [cables.measuredBy],
    references: [users.id],
    relationName: 'cableMeasuredBy',
  }),
  measurements: many(cableLossMeasurements),
}));

export const cableLossMeasurementsRelations = relations(cableLossMeasurements, ({ one, many }) => ({
  cable: one(cables, {
    fields: [cableLossMeasurements.cableId],
    references: [cables.id],
  }),
  measuredByUser: one(users, {
    fields: [cableLossMeasurements.measuredBy],
    references: [users.id],
    relationName: 'cableLossMeasurementMeasuredBy',
  }),
  measurementEquipment: one(equipment, {
    fields: [cableLossMeasurements.measurementEquipmentId],
    references: [equipment.id],
  }),
  dataPoints: many(cableLossDataPoints),
}));

export const cableLossDataPointsRelations = relations(cableLossDataPoints, ({ one }) => ({
  measurement: one(cableLossMeasurements, {
    fields: [cableLossDataPoints.measurementId],
    references: [cableLossMeasurements.id],
  }),
}));
