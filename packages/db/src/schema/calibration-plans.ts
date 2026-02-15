import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  text,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { equipment } from './equipment';

/**
 * 교정계획서 상태 정의 (3단계 승인 워크플로우)
 * @see packages/schemas/src/enums.ts - CalibrationPlanStatusEnum
 */
export const calibrationPlanStatus = [
  'draft', // 작성 중
  'pending_review', // 검토 대기 (품질책임자)
  'pending_approval', // 승인 대기 (시험소장)
  'approved', // 승인됨
  'rejected', // 반려됨
] as const;

/**
 * 반려 단계 정의
 */
export const rejectionStage = ['review', 'approval'] as const;

/**
 * 교정계획서 테이블
 *
 * 연초에 작성되는 교정계획서로, 해당 연도의 외부교정 대상 장비 목록을 관리합니다.
 * 기술책임자가 작성하고 시험소장(lab_manager)이 최종 승인합니다.
 * ✅ UUID 통일: serial(integer) id를 uuid id로 변경
 */
export const calibrationPlans = pgTable(
  'calibration_plans',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 기본 정보
    year: integer('year').notNull(), // 계획 연도
    siteId: varchar('site_id', { length: 20 }).notNull(), // 'suwon' | 'uiwang'
    teamId: uuid('team_id'), // 팀 ID (선택)

    // 상태 관리
    status: varchar('status', { length: 20 }).notNull().default('draft'),

    // 작성자 정보 (기술책임자)
    createdBy: uuid('created_by').notNull(), // 작성자 ID

    // 검토 요청 단계 (기술책임자 → 품질책임자)
    submittedAt: timestamp('submitted_at'), // 검토 요청 일시

    // 검토 단계 (품질책임자)
    reviewedBy: uuid('reviewed_by'), // 검토자 ID (품질책임자)
    reviewedAt: timestamp('reviewed_at'), // 검토 완료 일시
    reviewComment: text('review_comment'), // 검토 의견

    // 승인 단계 (시험소장)
    approvedBy: uuid('approved_by'), // 승인자 ID (시험소장)
    approvedAt: timestamp('approved_at'), // 승인 일시

    // 반려 정보 (품질책임자 또는 시험소장)
    rejectedBy: uuid('rejected_by'), // 반려자 ID
    rejectedAt: timestamp('rejected_at'), // 반려 일시
    rejectionReason: text('rejection_reason'), // 반려 사유
    rejectionStage: varchar('rejection_stage', { length: 20 }), // 'review' | 'approval'

    // 버전 관리
    version: integer('version').default(1).notNull(), // 버전 번호 (계획서 개정)
    casVersion: integer('cas_version').default(1).notNull(), // CAS 동시 수정 방지
    parentPlanId: uuid('parent_plan_id'), // 부모 계획서 (이전 버전) - self-reference
    isLatestVersion: boolean('is_latest_version').default(true).notNull(), // 최신 버전 여부

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 연도 + 시험소 + 최신버전 복합 unique 제약
      // 주의: PostgreSQL은 partial unique index를 지원하지만 Drizzle에서는 직접 지원하지 않음
      // 따라서 서비스 레이어에서 최신 버전 유일성을 검증
      yearSiteVersionIdx: index('calibration_plans_year_site_version_idx').on(
        table.year,
        table.siteId,
        table.isLatestVersion
      ),
      // 인덱스
      yearIdx: index('calibration_plans_year_idx').on(table.year),
      siteIdIdx: index('calibration_plans_site_id_idx').on(table.siteId),
      statusIdx: index('calibration_plans_status_idx').on(table.status),
      createdByIdx: index('calibration_plans_created_by_idx').on(table.createdBy),
      parentPlanIdIdx: index('calibration_plans_parent_plan_id_idx').on(table.parentPlanId),
      isLatestVersionIdx: index('calibration_plans_is_latest_version_idx').on(
        table.isLatestVersion
      ),
    };
  }
);

/**
 * 교정계획서 항목 테이블
 *
 * 교정계획서에 포함된 개별 장비 항목입니다.
 * 계획서 생성 시 장비 정보를 스냅샷으로 저장하며,
 * 실제 교정 완료 시 actualCalibrationDate가 자동으로 기록됩니다.
 * ✅ UUID 통일: serial(integer) id를 uuid id로 변경
 */
export const calibrationPlanItems = pgTable(
  'calibration_plan_items',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 관계
    planId: uuid('plan_id')
      .notNull()
      .references(() => calibrationPlans.id, { onDelete: 'cascade' }),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipment.id, { onDelete: 'cascade' }),

    // 순번
    sequenceNumber: integer('sequence_number').notNull(),

    // 현황 - 작성 시점 스냅샷
    snapshotValidityDate: timestamp('snapshot_validity_date'), // 유효일자 = 최종교정일 스냅샷
    snapshotCalibrationCycle: integer('snapshot_calibration_cycle'), // 교정주기 스냅샷 (개월)
    snapshotCalibrationAgency: varchar('snapshot_calibration_agency', { length: 100 }), // 현재 교정기관 스냅샷

    // 계획
    plannedCalibrationDate: timestamp('planned_calibration_date'), // 계획된 교정일자 = 차기교정일 스냅샷
    plannedCalibrationAgency: varchar('planned_calibration_agency', { length: 100 }), // 계획된 교정기관

    // 확인 (기술책임자)
    confirmedBy: uuid('confirmed_by'), // 확인자 ID (기술책임자)
    confirmedAt: timestamp('confirmed_at'), // 확인일시

    // 비고
    actualCalibrationDate: timestamp('actual_calibration_date'), // 실제 교정일 (자동 기록)
    notes: text('notes'), // 추가 비고

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => {
    return {
      // 인덱스
      planIdIdx: index('calibration_plan_items_plan_id_idx').on(table.planId),
      equipmentIdIdx: index('calibration_plan_items_equipment_id_idx').on(table.equipmentId),
      sequenceNumberIdx: index('calibration_plan_items_sequence_number_idx').on(
        table.sequenceNumber
      ),
      // 복합 인덱스: 계획서 내 장비 조회 최적화
      planEquipmentIdx: index('calibration_plan_items_plan_equipment_idx').on(
        table.planId,
        table.equipmentId
      ),
    };
  }
);

// 타입 정의
export type CalibrationPlan = typeof calibrationPlans.$inferSelect;
export type NewCalibrationPlan = typeof calibrationPlans.$inferInsert;

export type CalibrationPlanItem = typeof calibrationPlanItems.$inferSelect;
export type NewCalibrationPlanItem = typeof calibrationPlanItems.$inferInsert;

// Relations 정의
export const calibrationPlansRelations = relations(calibrationPlans, ({ one, many }) => ({
  items: many(calibrationPlanItems),
  // 버전 관리 관계
  parentPlan: one(calibrationPlans, {
    fields: [calibrationPlans.parentPlanId],
    references: [calibrationPlans.id],
    relationName: 'planVersions',
  }),
  childVersions: many(calibrationPlans, {
    relationName: 'planVersions',
  }),
}));

export const calibrationPlanItemsRelations = relations(calibrationPlanItems, ({ one }) => ({
  plan: one(calibrationPlans, {
    fields: [calibrationPlanItems.planId],
    references: [calibrationPlans.id],
  }),
  equipment: one(equipment, {
    fields: [calibrationPlanItems.equipmentId],
    references: [equipment.id],
  }),
}));
