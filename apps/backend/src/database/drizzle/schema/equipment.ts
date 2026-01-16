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
} from 'drizzle-orm/pg-core';

// 장비 상태 정의
export const equipmentStatusEnum = pgEnum('equipment_status', [
  'available',
  'in_use',
  'under_maintenance',
  'calibrating',
  'retired',
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
    teamId: integer('team_id'),
    managerId: varchar('manager_id', { length: 36 }),
    purchaseDate: timestamp('purchase_date'),
    price: integer('price'),

    // 추가 정보
    supplier: varchar('supplier', { length: 100 }),
    contactInfo: varchar('contact_info', { length: 100 }),
    softwareVersion: varchar('software_version', { length: 50 }),
    firmwareVersion: varchar('firmware_version', { length: 50 }),
    manualLocation: text('manual_location'),
    accessories: text('accessories'),
    mainFeatures: text('main_features'),
    technicalManager: varchar('technical_manager', { length: 100 }),

    // 상태 정보
    status: varchar('status', { length: 50 }).notNull().default('available'),
    isActive: boolean('is_active').default(true),

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
import type { teams } from './teams';
import type { users } from './users';
import type { loans } from './loans';

export type EquipmentWithRelations = Equipment & {
  team?: typeof teams.$inferSelect;
  manager?: typeof users.$inferSelect;
  loans?: Array<typeof loans.$inferSelect>;
};

export const equipmentRelations = {
  loans: [],
  team: null,
  manager: null,
} as const;
