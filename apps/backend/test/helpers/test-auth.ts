import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DEFAULT_ROLE_EMAILS } from '@equipment-management/shared-constants';
import {
  USER_LAB_MANAGER_SUWON_ID,
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  TEAM_FCC_EMC_RF_SUWON_ID,
} from '../../src/database/utils/uuid-constants';

/** 테스트 사용자 역할 */
export type TestRole = 'admin' | 'manager' | 'user';

/** TestRole → canonical UserRole 매핑 (shared-constants DEFAULT_ROLE_EMAILS 키) */
const CANONICAL_ROLE: Record<TestRole, string> = {
  admin: 'lab_manager',
  manager: 'technical_manager',
  user: 'test_engineer',
};

/** 역할별 테스트 사용자 이메일 — DEFAULT_ROLE_EMAILS SSOT에서 파생 */
export const TEST_USERS: Record<TestRole, { email: string }> = {
  admin: { email: DEFAULT_ROLE_EMAILS['lab_manager'] },
  manager: { email: DEFAULT_ROLE_EMAILS['technical_manager'] },
  user: { email: DEFAULT_ROLE_EMAILS['test_engineer'] },
};

/**
 * 테스트 전용 UUID — 프로덕션 시드 UUID와 일치.
 *
 * generateTestTokenByEmail 은 DB 조회 후 프로덕션 UUID 기반 JWT를 발급하므로
 * TEST_USER_IDS 도 프로덕션 UUID여야 /users/{uuid} 등 API 호출이 정합성 유지.
 */
export const TEST_USER_IDS: Record<TestRole, string> = {
  admin: USER_LAB_MANAGER_SUWON_ID,
  manager: USER_TECHNICAL_MANAGER_SUWON_ID,
  user: USER_TEST_ENGINEER_SUWON_ID,
};

/**
 * 시드 사용자 상세 정보 (DB 시딩에 사용)
 *
 * ⚠️ teamId 필수: team-scoped 기능(calibration-plans 등)은
 * user.teamId가 null이면 403을 반환한다.
 * TEAM_FCC_EMC_RF_SUWON_ID (수원 FCC EMC/RF 팀) 사용.
 */
export const TEST_USER_DETAILS = [
  {
    id: TEST_USER_IDS.admin,
    email: TEST_USERS.admin.email,
    name: '관리자',
    role: 'lab_manager',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
  },
  {
    id: TEST_USER_IDS.manager,
    email: TEST_USERS.manager.email,
    name: '기술책임자',
    role: 'technical_manager',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
  },
  {
    id: TEST_USER_IDS.user,
    email: TEST_USERS.user.email,
    name: '시험실무자',
    role: 'test_engineer',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_FCC_EMC_RF_SUWON_ID,
  },
] as const;

/**
 * 지정된 역할로 로그인하여 액세스 토큰을 반환합니다.
 * /auth/test-login?role=<canonicalRole> 패스워드리스 엔드포인트 경유.
 */
export async function loginAs(app: INestApplication, role: TestRole): Promise<string> {
  const canonicalRole = CANONICAL_ROLE[role];

  const response = await request(app.getHttpServer()).get(
    `/auth/test-login?role=${canonicalRole}`,
  );

  if (response.status !== 200 && response.status !== 201) {
    throw new Error(
      `test-login failed for ${role} (role=${canonicalRole}): status ${response.status} — ${JSON.stringify(response.body)}`,
    );
  }

  const token =
    response.body.data?.accessToken ||
    response.body.access_token ||
    response.body.accessToken;

  if (!token) {
    throw new Error(
      `No access token in test-login response for ${role} (role=${canonicalRole})`,
    );
  }

  return token;
}

/**
 * 특정 이메일/비밀번호로 직접 로그인합니다.
 * /auth/login 엔드포인트 테스트 시 사용.
 */
export async function loginWithCredentials(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ token: string; user: Record<string, unknown> }> {
  const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
    email,
    password,
  });

  if (loginResponse.status !== 200 && loginResponse.status !== 201) {
    throw new Error(`Login failed for ${email}: status ${loginResponse.status}`);
  }

  const token =
    loginResponse.body.data?.accessToken ||
    loginResponse.body.access_token ||
    loginResponse.body.accessToken;

  if (!token) {
    throw new Error(`No access token in response for ${email}`);
  }

  return { token, user: loginResponse.body.user || {} };
}
