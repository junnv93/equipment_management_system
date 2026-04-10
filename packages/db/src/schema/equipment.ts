import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  boolean,
  varchar,
  index,
  uuid,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { MANAGEMENT_METHOD_VALUES } from '@equipment-management/schemas';
import type {
  EquipmentStatus,
  SpecMatch,
  CalibrationRequired,
} from '@equipment-management/schemas';
import { teams } from './teams';

/**
 * PostgreSQL enum 타입 선언 (DB 레벨)
 *
 * 테이블에서는 varchar.$type<EquipmentStatus>()를 사용하지만,
 * DB에 equipment_status enum 타입이 존재하므로 Drizzle 스키마에서 선언을 유지합니다.
 *
 * ⚠️ 하드코딩 이유: PostgreSQL enum은 값 제거가 불가.
 * 앱 SSOT(EquipmentStatusEnum)에서 제거된 레거시 값도 PG 호환을 위해 유지.
 * Zod 검증이 쓰기 경로에서 잘못된 값 유입을 차단합니다.
 */
export const equipmentStatusEnum = pgEnum('equipment_status', [
  // Active statuses (앱 SSOT와 일치)
  'available',
  'checked_out',
  'non_conforming',
  'spare',
  'pending_disposal',
  'disposed',
  'temporary',
  'inactive',
  // Legacy (앱에서 미사용, PG enum 호환성 유지)
  'calibration_scheduled',
  'calibration_overdue',
  'retired',
]);

/** @see packages/schemas/src/enums.ts - ManagementMethodEnum (SSOT) */
export const managementMethods = MANAGEMENT_METHOD_VALUES;

// 장비 테이블 스키마
// ✅ UUID 통일: serial(integer) id를 uuid id로 변경하여 전체 스키마 일관성 확보
export const equipment = pgTable(
  'equipment',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    managementNumber: varchar('management_number', { length: 50 }).notNull().unique(),

    // 관리번호 컴포넌트 (검색/분석 최적화용)
    // 관리번호 형식: XXX-XYYYY (시험소코드 3자리 - 분류코드 1자리 + 일련번호 4자리)
    // @example 'SUW-E0001' → siteCode='SUW', classificationCode='E', managementSerialNumber=1
    siteCode: varchar('site_code', { length: 3 }), // 시험소코드: SUW, UIW, PYT
    classificationCode: varchar('classification_code', { length: 1 }), // 분류코드: E, R, W, S, A, P
    managementSerialNumber: integer('management_serial_number'), // 일련번호: 1~9999

    assetNumber: varchar('asset_number', { length: 50 }),
    modelName: varchar('model_name', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 100 }),
    manufacturerContact: varchar('manufacturer_contact', { length: 100 }), // 제조사 연락처
    serialNumber: varchar('serial_number', { length: 100 }), // 일련번호
    description: text('description'), // 장비사양
    location: varchar('location', { length: 100 }),

    // 시방일치 여부 및 교정필요 여부
    specMatch: varchar('spec_match', { length: 20 }).$type<SpecMatch>(), // SSOT: SpecMatchEnum
    calibrationRequired: varchar('calibration_required', {
      length: 20,
    }).$type<CalibrationRequired>(), // SSOT: CalibrationRequiredEnum

    // 위치 및 설치 정보
    initialLocation: varchar('initial_location', { length: 100 }), // 최초 설치 위치
    installationDate: timestamp('installation_date'), // 설치 일시

    // 교정 정보
    calibrationCycle: integer('calibration_cycle'), // 개월 단위
    lastCalibrationDate: timestamp('last_calibration_date'),
    nextCalibrationDate: timestamp('next_calibration_date'),
    calibrationAgency: varchar('calibration_agency', { length: 100 }),
    needsIntermediateCheck: boolean('needs_intermediate_check').default(false),
    managementMethod: varchar('management_method', { length: 50 }), // 관리 방법

    // 중간점검 정보 (3개 필드로 분리)
    lastIntermediateCheckDate: timestamp('last_intermediate_check_date'), // 최종 중간 점검일
    intermediateCheckCycle: integer('intermediate_check_cycle'), // 중간점검 주기 (개월)
    nextIntermediateCheckDate: timestamp('next_intermediate_check_date'), // 차기 중간 점검일

    // 관리 정보
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    managerId: uuid('manager_id').references(() => users.id, { onDelete: 'set null' }),
    deputyManagerId: uuid('deputy_manager_id').references(() => users.id, { onDelete: 'set null' }), // 운영 책임자 (부) — QP-18-02
    site: varchar('site', { length: 20 }).notNull(), // ✅ 사이트별 권한 관리: 필수 필드 'suwon' | 'uiwang'
    purchaseYear: integer('purchase_year'), // 구입년도 (연도 정수, 예: 2026)
    price: integer('price'),

    // 추가 정보
    supplier: varchar('supplier', { length: 100 }),
    contactInfo: varchar('contact_info', { length: 100 }),
    firmwareVersion: varchar('firmware_version', { length: 50 }),
    manualLocation: text('manual_location'),
    accessories: text('accessories'),
    technicalManager: varchar('technical_manager', { length: 100 }),

    // 상태 정보
    status: varchar('status', { length: 50 })
      .$type<EquipmentStatus>()
      .notNull()
      .default('available'),
    isActive: boolean('is_active').default(true),

    // 승인 프로세스 필드
    approvalStatus: varchar('approval_status', { length: 50 }).default('approved'), // 'pending_approval' | 'approved' | 'rejected'
    requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'set null' }), // 요청자 ID
    approvedBy: uuid('approved_by').references(() => users.id, { onDelete: 'set null' }), // 승인자 ID

    // 추가 필수 필드 (프롬프트 3 요구사항)
    equipmentType: varchar('equipment_type', { length: 50 }), // 장비 타입
    calibrationResult: text('calibration_result'), // 교정 결과
    correctionFactor: varchar('correction_factor', { length: 50 }), // 보정계수
    intermediateCheckSchedule: timestamp('intermediate_check_schedule'), // 중간점검일정
    repairHistory: text('repair_history'), // @deprecated — repair_history 테이블 사용. 마이그레이션 후 제거 예정

    // 공용장비 필드 (프롬프트 8-1)
    // @see packages/schemas/src/enums.ts - SharedSourceEnum
    isShared: boolean('is_shared').default(false).notNull(), // 공용장비 여부
    sharedSource: varchar('shared_source', { length: 50 }), // 공용장비 출처: 'safety_lab' | 'external' | null
    owner: varchar('owner', { length: 100 }), // 소유처 (공용장비: 팀명, 렌탈장비: 업체명)
    externalIdentifier: varchar('external_identifier', { length: 100 }), // 소유처 원본 식별번호 (예: SAF-EQ-1234)
    usagePeriodStart: timestamp('usage_period_start'), // 사용 시작일 (임시등록 전용)
    usagePeriodEnd: timestamp('usage_period_end'), // 사용 종료일 (임시등록 전용)

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),

    // Optimistic locking (Phase 1: Equipment Module - 2026-02-11)
    // ✅ CAS pattern: version 필드로 동시 수정 방지
    // ✅ 참고: checkouts.version 패턴과 동일
    version: integer('version').notNull().default(1),
  },
  (table) => {
    return {
      // 자주 조회되는 필드에 인덱스 추가
      statusIdx: index('equipment_status_idx').on(table.status),
      locationIdx: index('equipment_location_idx').on(table.location),
      manufacturerIdx: index('equipment_manufacturer_idx').on(table.manufacturer),
      teamIdIdx: index('equipment_team_id_idx').on(table.teamId),
      managerIdIdx: index('equipment_manager_id_idx').on(table.managerId),
      deputyManagerIdIdx: index('equipment_deputy_manager_id_idx').on(table.deputyManagerId),
      siteIdx: index('equipment_site_idx').on(table.site),
      nextCalibrationDateIdx: index('equipment_next_calibration_date_idx').on(
        table.nextCalibrationDate
      ),
      modelNameIdx: index('equipment_model_name_idx').on(table.modelName),
      isActiveIdx: index('equipment_is_active_idx').on(table.isActive),
      nameSearchIdx: index('equipment_name_search_idx').on(table.name),
      // 복합 인덱스: 팀별 장비 상태 검색 최적화
      teamStatusIdx: index('equipment_team_status_idx').on(table.teamId, table.status),
      // 복합 인덱스: 교정 예정 장비 검색 최적화
      calibrationDueIdx: index('equipment_calibration_due_idx').on(
        table.isActive,
        table.nextCalibrationDate
      ),
      // 공용장비 검색 최적화
      isSharedIdx: index('equipment_is_shared_idx').on(table.isShared),
      // 관리번호 컴포넌트 검색 최적화
      siteCodeIdx: index('equipment_site_code_idx').on(table.siteCode),
      classificationCodeIdx: index('equipment_classification_code_idx').on(
        table.classificationCode
      ),
      approvalStatusIdx: index('equipment_approval_status_idx').on(table.approvalStatus),
    };
  }
);

// 장비 타입 정의
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;

// Zod v4 호환: drizzle-zod의 createInsertSchema는 타입 인스턴스화가 과도하게 깊어지는 문제가 있음
// 공유 스키마 패키지의 스키마를 사용하도록 변경 (Schema Source of Truth 원칙 준수)
// import { createEquipmentSchema } from '@equipment-management/schemas';
// export const insertEquipmentSchema = createEquipmentSchema;

// Zod 스키마는 공유 스키마 패키지에서 관리하므로 여기서는 제거
// 필요시 @equipment-management/schemas에서 직접 import하여 사용

// 관계 정의 및 타입을 위한 import
import { users } from './users';
import type { checkouts } from './checkouts';
import { documents } from './documents';
import { equipmentTestSoftware } from './equipment-test-software';

/**
 * 장비와 관련 엔티티를 포함한 확장 타입
 *
 * 참고: 대여(loans)는 제거되었으며, 반출(checkouts)이 교정/수리/시험소간 대여 모두 포함
 */
export type EquipmentWithRelations = Equipment & {
  team?: typeof teams.$inferSelect;
  manager?: typeof users.$inferSelect;
  deputyManager?: typeof users.$inferSelect;
  checkouts?: Array<typeof checkouts.$inferSelect>;
};

// ✅ Drizzle relations 설정 (타입 안전한 조인)
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
  manager: one(users, {
    fields: [equipment.managerId],
    references: [users.id],
    relationName: 'equipment_manager',
  }),
  deputyManager: one(users, {
    fields: [equipment.deputyManagerId],
    references: [users.id],
    relationName: 'equipment_deputy_manager',
  }),
  documents: many(documents),
  testSoftwareLinks: many(equipmentTestSoftware),
}));
