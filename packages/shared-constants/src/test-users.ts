/**
 * Test User Constants — SSOT for all test/dev login user metadata
 *
 * Consumed by:
 * - Backend: test-auth.controller.ts (role→email 매핑)
 * - Frontend: DevLoginButtons.tsx (dev 로그인 UI)
 * - E2E: shared-test-data.ts (테스트 상수)
 *
 * DB seed 원본: apps/backend/src/database/seed-data/core/users.seed.ts
 * UUID 원본: apps/backend/src/database/utils/uuid-constants.ts
 */

import type { UserRole } from '@equipment-management/schemas';

/** SemanticColorKey와 호환되는 색상 키 유니온 (shared-constants는 design-token에 의존 불가) */
export type TestUserSemanticColor =
  | 'ok'
  | 'warning'
  | 'critical'
  | 'info'
  | 'neutral'
  | 'purple'
  | 'repair'
  | 'temporary';

export interface TestUserEntry {
  email: string;
  role: UserRole;
  label: string;
  semanticColor: TestUserSemanticColor;
}

export interface TestTeamEntry {
  label: string;
  users: TestUserEntry[];
}

/**
 * 팀별 테스트 사용자 — DevLoginButtons UI 및 E2E에서 공유
 *
 * 키: DevLoginButtons의 팀 선택 드롭다운 value
 * semanticColor: design-token의 SemanticColorKey에 매핑
 */
export const TEST_USERS_BY_TEAM: Record<string, TestTeamEntry> = {
  'suwon-fcc-emc-rf': {
    label: '수원 FCC EMC/RF',
    users: [
      {
        email: 'test.engineer@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'tech.manager@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
      {
        email: 'quality.manager@example.com',
        role: 'quality_manager',
        label: '품질책임자',
        semanticColor: 'warning',
      },
      {
        email: 'lab.manager@example.com',
        role: 'lab_manager',
        label: '시험소장',
        semanticColor: 'purple',
      },
      {
        email: 'system.admin@example.com',
        role: 'system_admin',
        label: '시스템 관리자',
        semanticColor: 'critical',
      },
    ],
  },
  'suwon-general-emc': {
    label: '수원 General EMC',
    users: [
      {
        email: 'test.engineer.suwon.general.emc@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'tech.manager.suwon.general.emc@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
    ],
  },
  'suwon-sar': {
    label: '수원 SAR',
    users: [
      {
        email: 'test.engineer.suwon.sar@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'tech.manager.suwon.sar@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
    ],
  },
  'suwon-auto-emc': {
    label: '수원 Automotive EMC',
    users: [
      {
        email: 'test.engineer.suwon.auto.emc@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'tech.manager.suwon.auto.emc@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
    ],
  },
  'uiwang-general-rf': {
    label: '의왕 General RF',
    users: [
      {
        email: 'user1@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'manager2@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
    ],
  },
  'pyeongtaek-auto-emc': {
    label: '평택 Automotive EMC',
    users: [
      {
        email: 'test.engineer.pyeongtaek@example.com',
        role: 'test_engineer',
        label: '시험실무자',
        semanticColor: 'info',
      },
      {
        email: 'tech.manager.pyeongtaek@example.com',
        role: 'technical_manager',
        label: '기술책임자',
        semanticColor: 'ok',
      },
      {
        email: 'admin2@example.com',
        role: 'lab_manager',
        label: '시험소장',
        semanticColor: 'purple',
      },
    ],
  },
};

/** DevLoginButtons 초기 선택 팀 키 */
export const DEFAULT_TEST_TEAM_KEY = 'suwon-fcc-emc-rf';

/**
 * 역할별 기본 이메일 (Suwon FCC 기준 — SSOT에서 파생)
 * test-auth.controller의 ?role= 파라미터 → 이메일 변환에 사용
 */
export const DEFAULT_ROLE_EMAILS: Record<string, string> = Object.fromEntries(
  TEST_USERS_BY_TEAM[DEFAULT_TEST_TEAM_KEY].users.map((u) => [u.role, u.email])
);

/**
 * 모든 테스트 사용자 이메일 (플랫 배열)
 */
export const ALL_TEST_EMAILS: string[] = Object.values(TEST_USERS_BY_TEAM).flatMap((team) =>
  team.users.map((u) => u.email)
);
