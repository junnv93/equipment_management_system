/**
 * Jest E2E Global Setup
 *
 * 모든 E2E 테스트 실행 전 1회 실행됩니다.
 * 테스트에 필요한 최소 시드 데이터를 DB에 삽입하여
 * 실행 순서와 무관하게 결정적 테스트 결과를 보장합니다.
 *
 * ⚠️ globalSetup은 Jest Worker 밖에서 실행되므로
 * setupFilesAfterEnv(jest-setup.ts)의 env 설정을 사용할 수 없습니다.
 * 필요한 env를 직접 설정합니다.
 */
import postgres from 'postgres';
import {
  // Teams (6 production + 1 placeholder)
  TEAM_PLACEHOLDER_ID,
  TEAM_FCC_EMC_RF_SUWON_ID,
  TEAM_GENERAL_EMC_SUWON_ID,
  TEAM_SAR_SUWON_ID,
  TEAM_AUTOMOTIVE_EMC_SUWON_ID,
  TEAM_GENERAL_RF_UIWANG_ID,
  TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID,
  // Users (manager-role-constraint에 필요한 핵심 사용자)
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_LAB_MANAGER_SUWON_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
  USER_TEST_ENGINEER_UIWANG_ID,
} from '../src/database/utils/uuid-constants';
import { TEST_USER_DETAILS } from './helpers/test-auth';

/** 팀 시드 데이터 — uuid-constants + teams.seed.ts 구조 기반 */
const TEAMS_SEED = [
  { id: TEAM_PLACEHOLDER_ID, name: 'Test Team', classification: 'general_emc', classificationCode: 'R', site: 'suwon', description: 'Placeholder team for E2E test users' },
  { id: TEAM_FCC_EMC_RF_SUWON_ID, name: 'FCC EMC/RF', classification: 'fcc_emc_rf', classificationCode: 'E', site: 'suwon', description: 'FCC EMC/RF Team - Suwon' },
  { id: TEAM_GENERAL_EMC_SUWON_ID, name: 'General EMC', classification: 'general_emc', classificationCode: 'R', site: 'suwon', description: 'General EMC Team - Suwon' },
  { id: TEAM_SAR_SUWON_ID, name: 'SAR', classification: 'sar', classificationCode: 'S', site: 'suwon', description: 'SAR Team - Suwon' },
  { id: TEAM_AUTOMOTIVE_EMC_SUWON_ID, name: 'Automotive EMC', classification: 'automotive_emc', classificationCode: 'A', site: 'suwon', description: 'Automotive EMC Team - Suwon' },
  { id: TEAM_GENERAL_RF_UIWANG_ID, name: 'General RF', classification: 'general_rf', classificationCode: 'W', site: 'uiwang', description: 'General RF Team - Uiwang' },
  { id: TEAM_AUTOMOTIVE_EMC_PYEONGTAEK_ID, name: 'Automotive EMC', classification: 'automotive_emc', classificationCode: 'A', site: 'pyeongtaek', description: 'Automotive EMC Team - Pyeongtaek' },
];

/**
 * 프로덕션 핵심 사용자 — manager-role-constraint E2E 테스트에 필요.
 * uuid-constants + users.seed.ts 구조 기반.
 */
const PRODUCTION_USERS_SEED = [
  { id: USER_TEST_ENGINEER_SUWON_ID, email: 'test.engineer@example.com', name: '시험실무자 (수원)', role: 'test_engineer', teamId: TEAM_FCC_EMC_RF_SUWON_ID, site: 'suwon' },
  { id: USER_TECHNICAL_MANAGER_SUWON_ID, email: 'tech.manager@example.com', name: '기술책임자 (수원)', role: 'technical_manager', teamId: TEAM_FCC_EMC_RF_SUWON_ID, site: 'suwon' },
  { id: USER_LAB_MANAGER_SUWON_ID, email: 'lab.manager@example.com', name: '시험소장 (수원)', role: 'lab_manager', teamId: TEAM_FCC_EMC_RF_SUWON_ID, site: 'suwon' },
  { id: USER_TECHNICAL_MANAGER_UIWANG_ID, email: 'tech.manager.uiwang@example.com', name: '기술책임자 (의왕)', role: 'technical_manager', teamId: TEAM_GENERAL_RF_UIWANG_ID, site: 'uiwang' },
  { id: USER_TEST_ENGINEER_UIWANG_ID, email: 'test.engineer.uiwang@example.com', name: '시험실무자 (의왕)', role: 'test_engineer', teamId: TEAM_GENERAL_RF_UIWANG_ID, site: 'uiwang' },
];

export default async function globalSetup(): Promise<void> {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/equipment_management';

  const sql = postgres(databaseUrl);

  try {
    // 1. 팀 시딩 (7개: placeholder + production 6개)
    for (const team of TEAMS_SEED) {
      await sql`
        INSERT INTO teams (id, name, classification, site, classification_code, description, created_at, updated_at)
        VALUES (${team.id}, ${team.name}, ${team.classification}, ${team.site}, ${team.classificationCode}, ${team.description}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 2. E2E 테스트 사용자 시딩 (loginAs() 헬퍼용)
    for (const user of TEST_USER_DETAILS) {
      await sql`
        INSERT INTO users (id, email, name, role, team_id, site, location, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role}, ${user.teamId}, ${user.site}, ${user.location}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          team_id = EXCLUDED.team_id,
          site = EXCLUDED.site,
          location = EXCLUDED.location,
          updated_at = NOW()
      `;
    }

    // 3. 프로덕션 핵심 사용자 시딩 (manager-role-constraint 등에 필요)
    for (const user of PRODUCTION_USERS_SEED) {
      await sql`
        INSERT INTO users (id, email, name, role, team_id, site, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role}, ${user.teamId}, ${user.site}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }
  } finally {
    await sql.end();
  }
}
