import { pgTable, varchar, timestamp, text, uuid, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  SOFTWARE_TYPE_VALUES,
  SOFTWARE_APPROVAL_STATUS_VALUES,
} from '@equipment-management/schemas';
import type { SoftwareApprovalStatus } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

/** @see packages/schemas/src/enums.ts - SoftwareTypeEnum (SSOT) */
export const softwareTypes = SOFTWARE_TYPE_VALUES;

/** @see packages/schemas/src/enums.ts - SoftwareApprovalStatusEnum (SSOT) */
export const softwareApprovalStatus = SOFTWARE_APPROVAL_STATUS_VALUES;

/**
 * 소프트웨어 변경 이력 테이블 스키마
 *
 * 장비별 소프트웨어 변경 이력을 영구 보관
 * 변경 시 검증 기록 필수, 기술책임자 승인 필요
 *
 * @see docs/development/PROMPTS_FOR_IMPLEMENTATION_v2.md 프롬프트 9-1
 */
export const softwareHistory = pgTable(
  'software_history',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 장비 관계
    equipmentId: uuid('equipment_id').notNull(),

    // 소프트웨어 정보
    softwareName: varchar('software_name', { length: 200 }).notNull(), // 소프트웨어명
    previousVersion: varchar('previous_version', { length: 50 }), // 이전 버전 (최초 등록 시 null)
    newVersion: varchar('new_version', { length: 50 }).notNull(), // 새 버전

    // 변경 정보
    changedAt: timestamp('changed_at').defaultNow().notNull(), // 변경 시각
    changedBy: uuid('changed_by').notNull(), // 변경자 ID

    // 검증 기록 (필수)
    verificationRecord: text('verification_record').notNull(), // 검증 기록 (변경 후 검증 내용)

    // 승인 프로세스
    approvalStatus: varchar('approval_status', { length: 20 })
      .$type<SoftwareApprovalStatus>()
      .notNull()
      .default('pending'), // 'pending' | 'approved' | 'rejected'
    approvedBy: uuid('approved_by'), // 승인자 ID (기술책임자)
    approvedAt: timestamp('approved_at'), // 승인 시각
    approverComment: text('approver_comment'), // 승인/반려 시 코멘트

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),

    // Optimistic locking
    version: integer('version').notNull().default(1),
  },
  (table) => {
    return {
      // 장비별 소프트웨어 이력 조회 최적화
      equipmentIdIdx: index('software_history_equipment_id_idx').on(table.equipmentId),
      // 소프트웨어명별 조회 최적화
      softwareNameIdx: index('software_history_software_name_idx').on(table.softwareName),
      // 승인 상태별 조회 최적화
      approvalStatusIdx: index('software_history_approval_status_idx').on(table.approvalStatus),
      // 변경 시각 조회 최적화
      changedAtIdx: index('software_history_changed_at_idx').on(table.changedAt),
      // 복합 인덱스: 장비별 소프트웨어 이력 조회
      equipmentSoftwareIdx: index('software_history_equipment_software_idx').on(
        table.equipmentId,
        table.softwareName,
        table.changedAt
      ),
      // Optimistic locking 조회 최적화
      versionIdx: index('software_history_version_idx').on(table.version),
    };
  }
);

// 소프트웨어 이력 타입 정의
export type SoftwareHistory = typeof softwareHistory.$inferSelect;
export type NewSoftwareHistory = typeof softwareHistory.$inferInsert;

// 소프트웨어 이력 관계 정의
// ✅ UUID 통일: equipment.uuid → equipment.id 참조로 변경
export const softwareHistoryRelations = relations(softwareHistory, ({ one }) => ({
  equipment: one(equipment, {
    fields: [softwareHistory.equipmentId],
    references: [equipment.id],
  }),
  changer: one(users, {
    fields: [softwareHistory.changedBy],
    references: [users.id],
    relationName: 'softwareHistoryChanger',
  }),
  approver: one(users, {
    fields: [softwareHistory.approvedBy],
    references: [users.id],
    relationName: 'softwareHistoryApprover',
  }),
}));
