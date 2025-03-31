import { pgTable, uuid, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { z } from 'zod';

// 히스토리 이벤트 타입 enum
export const HistoryEventType = {
  ACQUISITION: 'acquisition', // 장비 취득
  STATUS_CHANGE: 'status_change', // 상태 변경
  CHECKOUT: 'checkout', // 대여
  RETURN: 'return', // 반납
  CALIBRATION: 'calibration', // 교정
  MAINTENANCE: 'maintenance', // 유지보수
  REPAIR: 'repair', // 수리
  DISPOSAL: 'disposal', // 폐기
  TRANSFER: 'transfer', // 부서 이동
  OTHER: 'other', // 기타
} as const;

// 히스토리 테이블 스키마
export const history = pgTable('history', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  equipmentId: uuid('equipment_id').notNull().references(() => equipment.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventDate: timestamp('event_date').notNull().defaultNow(),
  performedBy: uuid('performed_by').references(() => users.id),
  description: text('description').notNull(),
  changes: jsonb('changes'), // 이전 값과 새 값을 JSON으로 저장
  relatedEntityId: uuid('related_entity_id'), // 관련 엔티티 ID (checkout, calibration 등)
  relatedEntityType: varchar('related_entity_type', { length: 50 }), // 관련 엔티티 타입
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 히스토리 타입 정의
export type History = typeof history.$inferSelect;
export type NewHistory = typeof history.$inferInsert;

// Zod 스키마 직접 정의
export const insertHistorySchema = z.object({
  equipmentId: z.string().uuid(),
  eventType: z.enum([
    HistoryEventType.ACQUISITION,
    HistoryEventType.STATUS_CHANGE,
    HistoryEventType.CHECKOUT,
    HistoryEventType.RETURN,
    HistoryEventType.CALIBRATION,
    HistoryEventType.MAINTENANCE,
    HistoryEventType.REPAIR,
    HistoryEventType.DISPOSAL,
    HistoryEventType.TRANSFER,
    HistoryEventType.OTHER,
  ]),
  eventDate: z.date().optional(),
  performedBy: z.string().uuid().optional(),
  description: z.string(),
  changes: z.record(z.unknown()).optional(),
  relatedEntityId: z.string().uuid().optional(),
  relatedEntityType: z.string().optional(),
  notes: z.string().optional(),
});

export const selectHistorySchema = z.object({
  id: z.string().uuid(),
  equipmentId: z.string().uuid(),
  eventType: z.string(),
  eventDate: z.date(),
  performedBy: z.string().uuid().nullable().optional(),
  description: z.string(),
  changes: z.record(z.unknown()).nullable().optional(),
  relatedEntityId: z.string().uuid().nullable().optional(),
  relatedEntityType: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { Equipment } from './equipment';
import type { User } from './users';
import type { Checkout } from './checkouts';
import type { Calibration } from './calibrations';
import { equipment } from './equipment';
import { users } from './users';

export type HistoryWithRelations = History & {
  equipment?: Equipment;
  performer?: User;
  relatedCheckout?: Checkout;
  relatedCalibration?: Calibration;
};

export const historyRelations = {
  equipment: null,
  performer: null,
  relatedCheckout: null,
  relatedCalibration: null,
} as const; 