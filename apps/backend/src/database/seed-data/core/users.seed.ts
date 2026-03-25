/**
 * Users seed data
 * 16 users across 3 sites with proper role hierarchy
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
  USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
  USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
  USER_TEST_ENGINEER_SUWON_SAR_ID,
  USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
  USER_TEST_ENGINEER_SUWON_AUTO_EMC_ID,
  USER_TECHNICAL_MANAGER_SUWON_AUTO_EMC_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
  USER_LAB_MANAGER_PYEONGTAEK_ID,
  USER_TEST_ENGINEER_PYEONGTAEK_ID,
  USER_TECHNICAL_MANAGER_PYEONGTAEK_ID,
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_SAR_SUWON_ID,
  TEAM_AUTOMOTIVE_EMC_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
  TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
} from '../../utils/uuid-constants';

export const USERS_SEED_DATA: (typeof users.$inferInsert)[] = [
  // =========================================================================
  // Suwon FCC EMC/RF Team (5 users)
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
    role: 'system_admin' as UserRole,
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
  // Suwon General EMC Team (2 users)
  // =========================================================================

  {
    id: USER_TEST_ENGINEER_SUWON_GENERAL_EMC_ID,
    email: 'test.engineer.suwon.general.emc@example.com',
    name: '시험실무자 (Suwon General EMC)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_GENERAL_EMC_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_SUWON_GENERAL_EMC_ID,
    email: 'tech.manager.suwon.general.emc@example.com',
    name: '기술책임자 (Suwon General EMC)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_GENERAL_EMC_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Suwon SAR Team (2 users)
  // =========================================================================

  {
    id: USER_TEST_ENGINEER_SUWON_SAR_ID,
    email: 'test.engineer.suwon.sar@example.com',
    name: '시험실무자 (Suwon SAR)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_SAR_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_SUWON_SAR_ID,
    email: 'tech.manager.suwon.sar@example.com',
    name: '기술책임자 (Suwon SAR)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_SAR_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Suwon Automotive EMC Team (2 users)
  // =========================================================================

  {
    id: USER_TEST_ENGINEER_SUWON_AUTO_EMC_ID,
    email: 'test.engineer.suwon.auto.emc@example.com',
    name: '시험실무자 (Suwon Auto EMC)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_SUWON_AUTO_EMC_ID,
    email: 'tech.manager.suwon.auto.emc@example.com',
    name: '기술책임자 (Suwon Auto EMC)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_AUTOMOTIVE_EMC_SUWON_ID,
    site: 'suwon',
    location: '수원랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // =========================================================================
  // Pyeongtaek Site Users (3 users)
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

  {
    id: USER_TEST_ENGINEER_PYEONGTAEK_ID,
    email: 'test.engineer.pyeongtaek@example.com',
    name: '시험실무자 (Pyeongtaek Auto EMC)',
    role: 'test_engineer' as UserRole,
    teamId: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    site: 'pyeongtaek',
    location: '평택랩',
    position: 'Test Engineer',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  {
    id: USER_TECHNICAL_MANAGER_PYEONGTAEK_ID,
    email: 'tech.manager.pyeongtaek@example.com',
    name: '기술책임자 (Pyeongtaek Auto EMC)',
    role: 'technical_manager' as UserRole,
    teamId: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
    site: 'pyeongtaek',
    location: '평택랩',
    position: 'Technical Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
