import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TEAM_PLACEHOLDER_ID } from '../../src/database/utils/uuid-constants';

/** 테스트 사용자 역할 */
export type TestRole = 'admin' | 'manager' | 'user';

/** 역할별 테스트 사용자 정보 */
export const TEST_USERS: Record<TestRole, { email: string; password: string }> = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  manager: { email: 'manager@example.com', password: 'manager123' },
  user: { email: 'user@example.com', password: 'user123' },
};

/**
 * 테스트 전용 UUID — uuid-constants.ts 프로덕션 UUID와 충돌 없음.
 *
 * ⚠️ 이전 값은 프로덕션 시드와 충돌했음:
 * - admin 'f47ac10b-...-d479' = USER_TEST_ENGINEER_UIWANG_ID (역할 불일치)
 * - manager 'a1b2c3d4-...-6789' = TEAM_GENERAL_RF_UIWANG_ID (팀 UUID!)
 * 'e2e' 접두사 패턴으로 분리하여 SSOT 위반 해소.
 */
export const TEST_USER_IDS: Record<TestRole, string> = {
  admin: 'e2e00000-0000-4000-8000-000000000001',
  manager: 'e2e00000-0000-4000-8000-000000000002',
  user: 'e2e00000-0000-4000-8000-000000000003',
};

/**
 * 시드 사용자 상세 정보 (DB 시딩에 사용)
 *
 * ⚠️ teamId 필수: team-scoped 기능(calibration-plans, disposals, intermediate-checks 등)은
 * `CALIBRATION_PLAN_DATA_SCOPE: { type: 'team' }` + `failLoud: true`로 인해
 * user.teamId가 null이면 403 Forbidden을 반환한다. 모든 테스트 사용자는 TEAM_PLACEHOLDER_ID에 소속시킨다.
 */
export const TEST_USER_DETAILS = [
  {
    id: TEST_USER_IDS.admin,
    email: TEST_USERS.admin.email,
    name: '관리자',
    role: 'lab_manager',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_PLACEHOLDER_ID,
  },
  {
    id: TEST_USER_IDS.manager,
    email: TEST_USERS.manager.email,
    name: '기술책임자',
    role: 'technical_manager',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_PLACEHOLDER_ID,
  },
  {
    id: TEST_USER_IDS.user,
    email: TEST_USERS.user.email,
    name: '시험실무자',
    role: 'test_engineer',
    site: 'suwon',
    location: '수원랩',
    teamId: TEAM_PLACEHOLDER_ID,
  },
] as const;

/**
 * 지정된 역할로 로그인하여 액세스 토큰을 반환합니다.
 *
 * @param app - NestJS 앱 인스턴스
 * @param role - 로그인할 역할 (admin, manager, user)
 * @returns JWT 액세스 토큰
 * @throws 로그인 실패 시 에러
 */
export async function loginAs(app: INestApplication, role: TestRole): Promise<string> {
  const { email, password } = TEST_USERS[role];

  const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
    email,
    password,
  });

  if (loginResponse.status !== 200 && loginResponse.status !== 201) {
    throw new Error(`Login failed for ${role} (${email}): status ${loginResponse.status}`);
  }

  const token =
    loginResponse.body.data?.accessToken ||
    loginResponse.body.access_token ||
    loginResponse.body.accessToken;

  if (!token) {
    throw new Error(`No access token in response for ${role} (${email})`);
  }

  return token;
}

/**
 * 특정 이메일/비밀번호로 직접 로그인합니다.
 * TEST_USERS에 없는 사용자 (예: user1@example.com)에 사용합니다.
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
