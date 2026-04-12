import {
  pgTable,
  varchar,
  timestamp,
  text,
  uuid,
  date,
  index,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import {
  NON_CONFORMANCE_STATUS_VALUES,
  NON_CONFORMANCE_TYPE_VALUES,
  RESOLUTION_TYPE_VALUES,
} from '@equipment-management/schemas';
import type { NonConformanceStatus, NonConformanceType } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';
import { repairHistory } from './repair-history';

/** @see packages/schemas/src/enums.ts - NonConformanceStatusEnum (SSOT) */
export const nonConformanceStatus = NON_CONFORMANCE_STATUS_VALUES;

/** @see packages/schemas/src/enums.ts - NonConformanceTypeEnum (SSOT) */
export const nonConformanceType = NON_CONFORMANCE_TYPE_VALUES;

/** @see packages/schemas/src/enums.ts - ResolutionTypeEnum (SSOT) */
export const resolutionType = RESOLUTION_TYPE_VALUES;

/**
 * 부적합 기록 테이블 스키마
 *
 * 장비의 부적합 사항을 관리하며, 발견부터 종료까지 이력을 추적
 * 부적합 이력은 영구 보관
 *
 * @see docs/development/PROMPTS_FOR_IMPLEMENTATION_v2.md 프롬프트 7-1
 */
export const nonConformances = pgTable(
  'non_conformances',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 장비 관계
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'restrict' }),

    // 부적합 발견 정보
    discoveryDate: date('discovery_date').notNull(), // 발견일
    discoveredBy: uuid('discovered_by').references(() => users.id, {
      onDelete: 'set null',
    }), // 발견자 ID (시험실무자 또는 null for 시스템 자동 생성)
    cause: text('cause').notNull(), // 부적합 원인

    // 부적합 유형 및 해결 방법
    ncType: varchar('nc_type', { length: 50 }).$type<NonConformanceType>().notNull(), // 부적합 유형 (damage | malfunction | calibration_failure | measurement_error | other)
    resolutionType: varchar('resolution_type', { length: 50 }), // 해결 방법 (repair | recalibration | replacement | disposal | other)

    // 연결된 조치 기록
    repairHistoryId: uuid('repair_history_id'), // 수리 기록 ID (1:1 관계)
    calibrationId: uuid('calibration_id'), // 교정 기록 ID (향후 확장용)

    // 조치 계획
    actionPlan: text('action_plan'), // 조치 계획

    // 조치 완료 정보
    correctionContent: text('correction_content'), // 조치 내용
    correctionDate: date('correction_date'), // 조치 완료일
    correctedBy: uuid('corrected_by').references(() => users.id, {
      onDelete: 'restrict',
    }), // 조치자 ID — 감사 추적 영구 보존

    // 상태 관리
    status: varchar('status', { length: 20 })
      .$type<NonConformanceStatus>()
      .notNull()
      .default('open'), // 'open' | 'corrected' | 'closed'

    // 종료 정보 (기술책임자)
    closedBy: uuid('closed_by').references(() => users.id, {
      onDelete: 'restrict',
    }), // 종료 승인자 ID (기술책임자) — 감사 추적 영구 보존
    closedAt: timestamp('closed_at'), // 종료 시각
    closureNotes: text('closure_notes'), // 종료 메모

    // 반려 정보 (기술책임자 — 조치 불충분 시)
    rejectedBy: uuid('rejected_by').references(() => users.id, {
      onDelete: 'restrict',
    }), // 반려자 ID (기술책임자) — 감사 추적 영구 보존
    rejectedAt: timestamp('rejected_at'), // 반려 시각
    rejectionReason: text('rejection_reason'), // 반려 사유

    // Optimistic locking version
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'), // 소프트 삭제 (영구 보관 원칙)
  },
  (table) => {
    return {
      // 장비별 부적합 조회 최적화
      equipmentIdIdx: index('non_conformances_equipment_id_idx').on(table.equipmentId),
      // 상태별 조회 최적화
      statusIdx: index('non_conformances_status_idx').on(table.status),
      // 발견일 조회 최적화
      discoveryDateIdx: index('non_conformances_discovery_date_idx').on(table.discoveryDate),
      // 복합 인덱스: 장비별 열린 부적합 조회
      equipmentStatusIdx: index('non_conformances_equipment_status_idx').on(
        table.equipmentId,
        table.status
      ),
      // 부적합 유형별 조회 최적화
      ncTypeIdx: index('non_conformances_nc_type_idx').on(table.ncType),
      // 해결 방법별 조회 최적화
      resolutionTypeIdx: index('non_conformances_resolution_type_idx').on(table.resolutionType),
      // 수리 기록 연결 조회 최적화
      repairHistoryIdIdx: index('non_conformances_repair_history_id_idx').on(table.repairHistoryId),
      // 소프트 삭제 필터링 최적화
      deletedAtIdx: index('non_conformances_deleted_at_idx').on(table.deletedAt),
      // 목록 정렬 최적화 (ORDER BY created_at DESC)
      createdAtIdx: index('non_conformances_created_at_idx').on(table.createdAt),
      // FK 인덱스: 사용자별 조회 최적화
      discoveredByIdx: index('non_conformances_discovered_by_idx').on(table.discoveredBy),
      correctedByIdx: index('non_conformances_corrected_by_idx').on(table.correctedBy),
      closedByIdx: index('non_conformances_closed_by_idx').on(table.closedBy),
      rejectedByIdx: index('non_conformances_rejected_by_idx').on(table.rejectedBy),
      // TOCTOU 방지: 동일 장비 + 동일 NC 타입에 open 상태 중복 차단
      equipmentNcTypeOpenUnique: uniqueIndex('non_conformances_equipment_nc_type_open_unique')
        .on(table.equipmentId, table.ncType)
        .where(sql`status = 'open' AND deleted_at IS NULL`),
    };
  }
);

// 부적합 타입 정의
export type NonConformance = typeof nonConformances.$inferSelect;
export type NewNonConformance = typeof nonConformances.$inferInsert;

// 부적합 관계 정의
// ✅ UUID 통일: equipment.uuid → equipment.id 참조로 변경
export const nonConformancesRelations = relations(nonConformances, ({ one }) => ({
  equipment: one(equipment, {
    fields: [nonConformances.equipmentId],
    references: [equipment.id],
  }),
  repairHistory: one(repairHistory, {
    fields: [nonConformances.repairHistoryId],
    references: [repairHistory.id],
    relationName: 'nonConformanceRepair',
  }),
  discoverer: one(users, {
    fields: [nonConformances.discoveredBy],
    references: [users.id],
    relationName: 'nonConformanceDiscoverer',
  }),
  corrector: one(users, {
    fields: [nonConformances.correctedBy],
    references: [users.id],
    relationName: 'nonConformanceCorrector',
  }),
  closer: one(users, {
    fields: [nonConformances.closedBy],
    references: [users.id],
    relationName: 'nonConformanceCloser',
  }),
  rejector: one(users, {
    fields: [nonConformances.rejectedBy],
    references: [users.id],
    relationName: 'nonConformanceRejector',
  }),
}));
