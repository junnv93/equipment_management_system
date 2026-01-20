import {
  integer,
  pgEnum,
  pgTable,
  serial,
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
import { teams } from './teams';

// 장비 상태 정의
// ⚠️ 중요: 이 값들은 packages/schemas/src/enums.ts의 EquipmentStatusEnum과 반드시 일치해야 함
// Single Source of Truth 원칙: schemas 패키지의 값이 우선
// 값 변경 시 마이그레이션 필수
// @see packages/schemas/src/enums.ts
export const equipmentStatusEnum = pgEnum('equipment_status', [
  'available', // 사용 가능
  'in_use', // 사용 중 (대여 중 포함)
  'checked_out', // 반출 중
  'calibration_scheduled', // 교정 예정
  'calibration_overdue', // 교정 기한 초과
  'under_maintenance', // 유지보수 중
  'retired', // 사용 중지
]);

// 교정 방법 정의
export const calibrationMethods = [
  'external_calibration', // 외부 교정
  'self_inspection', // 자체 점검
  'not_applicable', // 비대상
] as const;

// 장비 테이블 스키마
export const equipment = pgTable(
  'equipment',
  {
    id: serial('id').primaryKey(),
    uuid: varchar('uuid', { length: 36 }).notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    managementNumber: varchar('management_number', { length: 50 }).notNull().unique(),
    assetNumber: varchar('asset_number', { length: 50 }),
    modelName: varchar('model_name', { length: 100 }),
    manufacturer: varchar('manufacturer', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    description: text('description'),
    location: varchar('location', { length: 100 }),

    // 교정 정보
    calibrationCycle: integer('calibration_cycle'), // 개월 단위
    lastCalibrationDate: timestamp('last_calibration_date'),
    nextCalibrationDate: timestamp('next_calibration_date'),
    calibrationAgency: varchar('calibration_agency', { length: 100 }),
    needsIntermediateCheck: boolean('needs_intermediate_check').default(false),
    calibrationMethod: varchar('calibration_method', { length: 50 }),

    // 관리 정보
    teamId: uuid('team_id').references(() => teams.id, { onDelete: 'set null' }),
    managerId: varchar('manager_id', { length: 36 }),
    site: varchar('site', { length: 20 }).notNull(), // ✅ 사이트별 권한 관리: 필수 필드 'suwon' | 'uiwang'
    purchaseDate: timestamp('purchase_date'),
    price: integer('price'),

    // 추가 정보
    supplier: varchar('supplier', { length: 100 }),
    contactInfo: varchar('contact_info', { length: 100 }),
    softwareVersion: varchar('software_version', { length: 50 }),
    firmwareVersion: varchar('firmware_version', { length: 50 }),

    // 소프트웨어 정보 (프롬프트 9-1)
    // @see packages/schemas/src/enums.ts - SoftwareTypeEnum
    softwareName: varchar('software_name', { length: 200 }), // 소프트웨어명 (EMC32, UL EMC, DASY6 SAR 등)
    softwareType: varchar('software_type', { length: 50 }), // 'measurement' | 'analysis' | 'control' | 'other'
    manualLocation: text('manual_location'),
    accessories: text('accessories'),
    mainFeatures: text('main_features'),
    technicalManager: varchar('technical_manager', { length: 100 }),

    // 상태 정보
    status: varchar('status', { length: 50 }).notNull().default('available'),
    isActive: boolean('is_active').default(true),

    // 승인 프로세스 필드
    approvalStatus: varchar('approval_status', { length: 50 }).default('approved'), // 'pending_approval' | 'approved' | 'rejected'
    requestedBy: varchar('requested_by', { length: 36 }), // 요청자 ID
    approvedBy: varchar('approved_by', { length: 36 }), // 승인자 ID

    // 추가 필수 필드 (프롬프트 3 요구사항)
    equipmentType: varchar('equipment_type', { length: 50 }), // 장비 타입
    calibrationResult: text('calibration_result'), // 교정 결과
    correctionFactor: varchar('correction_factor', { length: 50 }), // 보정계수
    intermediateCheckSchedule: timestamp('intermediate_check_schedule'), // 중간점검일정
    repairHistory: text('repair_history'), // 장비 수리 내역

    // 공용장비 필드 (프롬프트 8-1)
    // @see packages/schemas/src/enums.ts - SharedSourceEnum
    isShared: boolean('is_shared').default(false).notNull(), // 공용장비 여부
    sharedSource: varchar('shared_source', { length: 50 }), // 공용장비 출처: 'safety_lab' | 'external' | null

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => {
    return {
      // 자주 조회되는 필드에 인덱스 추가
      statusIdx: index('equipment_status_idx').on(table.status),
      locationIdx: index('equipment_location_idx').on(table.location),
      manufacturerIdx: index('equipment_manufacturer_idx').on(table.manufacturer),
      teamIdIdx: index('equipment_team_id_idx').on(table.teamId),
      managerIdIdx: index('equipment_manager_id_idx').on(table.managerId),
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
      // 소프트웨어 검색 최적화
      softwareNameIdx: index('equipment_software_name_idx').on(table.softwareName),
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

// 관계 타입 (다른 스키마 파일과의 순환 참조 방지를 위해 타입만 정의)
import type { users } from './users';
import type { loans } from './loans';

export type EquipmentWithRelations = Equipment & {
  team?: typeof teams.$inferSelect;
  manager?: typeof users.$inferSelect;
  loans?: Array<typeof loans.$inferSelect>;
};

// ✅ Drizzle relations 설정 (타입 안전한 조인)
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
  // manager와 loans relations는 향후 필요시 추가
}));
