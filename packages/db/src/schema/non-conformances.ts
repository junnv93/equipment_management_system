import { pgTable, varchar, timestamp, text, uuid, date, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { users } from './users';

/**
 * 부적합 상태 정의
 * ⚠️ 중요: 이 값들은 packages/schemas/src/enums.ts의 NonConformanceStatusEnum과 반드시 일치해야 함
 * Single Source of Truth 원칙: schemas 패키지의 값이 우선
 * @see packages/schemas/src/enums.ts
 */
export const nonConformanceStatus = [
  'open', // 부적합 등록 (발견됨)
  'analyzing', // 원인 분석 중
  'corrected', // 조치 완료 (종료 승인 대기)
  'closed', // 종료됨 (기술책임자 승인)
] as const;

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
    equipmentId: uuid('equipment_id').notNull(),

    // 부적합 발견 정보
    discoveryDate: date('discovery_date').notNull(), // 발견일
    discoveredBy: uuid('discovered_by').notNull(), // 발견자 ID (시험실무자)
    cause: text('cause').notNull(), // 부적합 원인

    // 조치 계획 및 분석
    actionPlan: text('action_plan'), // 조치 계획
    analysisContent: text('analysis_content'), // 원인 분석 내용

    // 조치 완료 정보
    correctionContent: text('correction_content'), // 조치 내용
    correctionDate: date('correction_date'), // 조치 완료일
    correctedBy: uuid('corrected_by'), // 조치자 ID

    // 상태 관리
    status: varchar('status', { length: 20 }).notNull().default('open'), // 'open' | 'analyzing' | 'corrected' | 'closed'

    // 종료 정보 (기술책임자)
    closedBy: uuid('closed_by'), // 종료 승인자 ID (기술책임자)
    closedAt: timestamp('closed_at'), // 종료 시각
    closureNotes: text('closure_notes'), // 종료 메모

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
    };
  }
);

// 부적합 타입 정의
export type NonConformance = typeof nonConformances.$inferSelect;
export type NewNonConformance = typeof nonConformances.$inferInsert;

// 부적합 관계 정의
export const nonConformancesRelations = relations(nonConformances, ({ one }) => ({
  equipment: one(equipment, {
    fields: [nonConformances.equipmentId],
    references: [equipment.uuid],
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
}));
