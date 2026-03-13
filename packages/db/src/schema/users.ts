import { pgTable, varchar, timestamp, uuid, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { USER_ROLE_VALUES, LOCATION_VALUES } from '@equipment-management/schemas';
import type { UserRole } from '@equipment-management/schemas';
import { equipment } from './equipment';
import { teams } from './teams';
import { checkouts } from './checkouts';
import { calibrations } from './calibrations';
import { calibrationFactors } from './calibration-factors';
import { conditionChecks } from './condition-checks';
import { disposalRequests } from './disposal-requests';
import { equipmentImports } from './equipment-imports';
import { equipmentRequests } from './equipment-requests';
import { nonConformances } from './non-conformances';
import { softwareHistory } from './software-history';

/** @see packages/schemas/src/enums.ts - UserRoleEnum (SSOT) */
export const userRoles = USER_ROLE_VALUES;

/** @see packages/schemas/src/enums.ts - LocationEnum (SSOT) */
export const locationTypes = LOCATION_VALUES;

// 사용자 테이블 스키마
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    role: varchar('role', { length: 50 }).$type<UserRole>().notNull().default('test_engineer'),
    teamId: uuid('team_id'),
    azureAdId: varchar('azure_ad_id', { length: 255 }),

    // 사이트 및 위치 정보
    site: varchar('site', { length: 20 }), // 'suwon' | 'uiwang' | 'pyeongtaek'
    location: varchar('location', { length: 50 }), // '수원랩' | '의왕랩' | '평택랩'
    position: varchar('position', { length: 100 }), // 직위 정보

    // Azure AD 프로필 필드 (매 로그인 시 동기화)
    department: varchar('department', { length: 100 }), // 부서
    phoneNumber: varchar('phone_number', { length: 20 }), // 회사 전화
    employeeId: varchar('employee_id', { length: 50 }), // 직원 ID
    managerName: varchar('manager_name', { length: 100 }), // 관리자 이름

    // 앱 소유 필드 (Azure AD로 덮어쓰지 않음)
    isActive: boolean('is_active').notNull().default(true), // 활성 상태

    // 시스템 필드
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // roleIdx 제거: roleSiteIdx(role, site) leading prefix로 커버됨
    siteIdx: index('users_site_idx').on(table.site),
    teamIdIdx: index('users_team_id_idx').on(table.teamId),
    isActiveIdx: index('users_is_active_idx').on(table.isActive),
    roleSiteIdx: index('users_role_site_idx').on(table.role, table.site),
  })
);

// 관계 정의
// NOTE: users↔teams 관계가 2개 (teamMembers, teamLeader)이므로 relationName으로 구분
// NOTE: 다중 FK 참조 테이블은 반드시 양쪽 모두 relationName 필요 (Drizzle ORM 규칙)
export const usersRelations = relations(users, ({ one, many }) => ({
  // teams
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
    relationName: 'teamMembers',
  }),
  leaderOfTeams: many(teams, { relationName: 'teamLeader' }),

  // equipment
  managedEquipments: many(equipment),

  // checkouts (5 FK → users)
  requestedCheckouts: many(checkouts, { relationName: 'checkout_requester' }),
  approvedCheckouts: many(checkouts, { relationName: 'checkout_approver' }),
  returnedCheckouts: many(checkouts, { relationName: 'checkout_returner' }),
  returnApprovedCheckouts: many(checkouts, { relationName: 'checkout_return_approver' }),
  lenderConfirmedCheckouts: many(checkouts, { relationName: 'checkout_lender_confirmer' }),

  // calibrations (2 FK → users)
  registeredCalibrations: many(calibrations, { relationName: 'calibration_registered_by' }),
  approvedCalibrations: many(calibrations, { relationName: 'calibration_approved_by' }),

  // calibration-factors (2 FK → users)
  requestedCalibrationFactors: many(calibrationFactors, {
    relationName: 'calibrationFactorRequester',
  }),
  approvedCalibrationFactors: many(calibrationFactors, {
    relationName: 'calibrationFactorApprover',
  }),

  // condition-checks (1 FK → users)
  performedConditionChecks: many(conditionChecks, { relationName: 'condition_check_checker' }),

  // disposal-requests (4 FK → users)
  requestedDisposals: many(disposalRequests, { relationName: 'requester' }),
  reviewedDisposals: many(disposalRequests, { relationName: 'reviewer' }),
  approvedDisposals: many(disposalRequests, { relationName: 'approver' }),
  rejectedDisposals: many(disposalRequests, { relationName: 'rejector' }),

  // equipment-imports (3 FK → users)
  requestedImports: many(equipmentImports, { relationName: 'equipment_import_requester' }),
  approvedImports: many(equipmentImports, { relationName: 'equipment_import_approver' }),
  receivedImports: many(equipmentImports, { relationName: 'equipment_import_receiver' }),

  // equipment-requests (2 FK → users)
  equipmentRequestsAsRequester: many(equipmentRequests, {
    relationName: 'equipmentRequestRequester',
  }),
  equipmentRequestsAsApprover: many(equipmentRequests, {
    relationName: 'equipmentRequestApprover',
  }),

  // non-conformances (4 FK → users)
  discoveredNonConformances: many(nonConformances, { relationName: 'nonConformanceDiscoverer' }),
  correctedNonConformances: many(nonConformances, { relationName: 'nonConformanceCorrector' }),
  closedNonConformances: many(nonConformances, { relationName: 'nonConformanceCloser' }),
  rejectedNonConformances: many(nonConformances, { relationName: 'nonConformanceRejector' }),

  // software-history (2 FK → users)
  changedSoftwareHistories: many(softwareHistory, { relationName: 'softwareHistoryChanger' }),
  approvedSoftwareHistories: many(softwareHistory, { relationName: 'softwareHistoryApprover' }),
}));
