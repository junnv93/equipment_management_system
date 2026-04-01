import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  index,
  uuid,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { ApprovalStatusEnum, RequestTypeEnum } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { users } from './users';

// SSOT: schemas 패키지에서 값 참조 (하드코딩 방지)
export const approvalStatusEnum = pgEnum(
  'approval_status',
  ApprovalStatusEnum.options as unknown as [string, ...string[]]
);

export const requestTypeEnum = pgEnum(
  'request_type',
  RequestTypeEnum.options as unknown as [string, ...string[]]
);

// 장비 요청 테이블 (승인 프로세스용)
// ✅ UUID 통일: serial(integer) id를 uuid id로 변경
export const equipmentRequests = pgTable(
  'equipment_requests',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),

    // 요청 정보
    requestType: requestTypeEnum('request_type').notNull(),
    equipmentId: uuid('equipment_id').references(() => equipment.id, { onDelete: 'cascade' }), // 수정/삭제 시 기존 장비 ID
    requestedBy: uuid('requested_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    requestedAt: timestamp('requested_at').defaultNow().notNull(),

    // 승인 정보
    approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending_approval'),
    approvedBy: uuid('approved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    approvedAt: timestamp('approved_at'),
    rejectionReason: text('rejection_reason'), // 반려 사유

    // 요청 데이터 (JSON 형태로 저장)
    requestData: jsonb('request_data'), // 장비 데이터 (JSON 구조 — 유효성 검증 + 인덱스 활용 가능)

    // Optimistic locking version
    version: integer('version').notNull().default(1),

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      // 인덱스 추가 (uuid를 PK로 사용하므로 별도 uuid 인덱스 불필요)
      requestTypeIdx: index('equipment_requests_request_type_idx').on(table.requestType),
      approvalStatusIdx: index('equipment_requests_approval_status_idx').on(table.approvalStatus),
      requestedByIdx: index('equipment_requests_requested_by_idx').on(table.requestedBy),
      approvedByIdx: index('equipment_requests_approved_by_idx').on(table.approvedBy),
      equipmentIdIdx: index('equipment_requests_equipment_id_idx').on(table.equipmentId),
      // 복합 인덱스: 승인 대기 목록 조회 최적화
      statusTypeIdx: index('equipment_requests_status_type_idx').on(
        table.approvalStatus,
        table.requestType
      ),
      // CAS (Compare-And-Swap) 복합 인덱스: optimistic locking 지원
      idVersionIdx: index('equipment_requests_id_version_idx').on(table.id, table.version),
    };
  }
);

// 장비 요청 타입 정의
export type EquipmentRequest = typeof equipmentRequests.$inferSelect;
export type NewEquipmentRequest = typeof equipmentRequests.$inferInsert;

// 순환 참조 방지를 위해 파일 하단 배치 (documents → equipment-requests 역방향 의존성)
import { documents } from './documents';

// Drizzle relations 설정
// ⚠️ requester/approver 모두 users 테이블 참조 → relationName 필수 (Drizzle 다중 관계 규칙)
export const equipmentRequestsRelations = relations(equipmentRequests, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [equipmentRequests.equipmentId],
    references: [equipment.id],
  }),
  requester: one(users, {
    fields: [equipmentRequests.requestedBy],
    references: [users.id],
    relationName: 'equipmentRequestRequester',
  }),
  approver: one(users, {
    fields: [equipmentRequests.approvedBy],
    references: [users.id],
    relationName: 'equipmentRequestApprover',
  }),
  documents: many(documents),
}));
