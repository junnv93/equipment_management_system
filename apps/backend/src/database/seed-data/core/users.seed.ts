/**
 * Users seed data
 * 8 users across 3 sites with proper role hierarchy
 * ⚠️ CRITICAL: IDs must match NextAuth test-login UUIDs in auth.controller.ts
 */

import { users } from '@equipment-management/db/schema';
import { UserRole } from '@equipment-management/schemas';
import {
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_LAB_MANAGER_SUWON_ID,
  USER_SYSTEM_ADMIN_ID,
  USER_QUALITY_MANAGER_SUWON_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
  USER_LAB_MANAGER_PYEONGTAEK_ID,
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
  TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
} from '../../utils/uuid-constants';

export const USERS_SEED_DATA: (typeof users.$inferInsert)[] = [
  // =========================================================================
  // Suwon Site Users (5 users)
  // =========================================================================

  // Role hierarchy: test_engineer (1) < technical_manager (2) < quality_manager (3) < lab_manager (4)

  {
    id: USER_TEST_ENGINEER_SUWON_ID,
    email: 'test.engineer@example.com',
    name: '시험실무자 (Suwon)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_SUWON_ID,
    email: 'tech.manager@example.com',
    name: '기술책임자 (Suwon)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_QUALITY_MANAGER_SUWON_ID,
    email: 'quality.manager@example.com',
    name: '품질책임자 (Suwon)',
    role: 'quality_manager' as UserRole,
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Quality Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_LAB_MANAGER_SUWON_ID,
    email: 'lab.manager@example.com',
    name: '시험소장 (Suwon)',
    role: 'lab_manager' as UserRole,
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Lab Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_SYSTEM_ADMIN_ID,
    email: 'system.admin@example.com',
    name: '시스템 관리자',
    role: 'lab_manager' as UserRole, // system_admin inherits lab_manager permissions
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'System Administrator',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Uiwang Site Users (2 users)
  // =========================================================================

  {
    id: USER_TEST_ENGINEER_UIWANG_ID,
    email: 'user1@example.com',
    name: '시험실무자 (Uiwang)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    site: 'uiwang',
    location: '의왕랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_UIWANG_ID,
    email: 'manager2@example.com',
    name: '기술책임자 (Uiwang)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_GENERAL_RF_UIWANG_ID,
    site: 'uiwang',
    location: '의왕랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Pyeongtaek Site Users (1 user)
  // =========================================================================

  {
    id: USER_LAB_MANAGER_PYEONGTAEK_ID,
    email: 'admin2@example.com',
    name: '시험소장 (Pyeongtaek)',
    role: 'lab_manager' as UserRole,
    teamId: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    site: 'pyeongtaek',
    location: '평택랩',
    position: 'Lab Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
