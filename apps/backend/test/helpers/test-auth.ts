import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** 테스트 사용자 역할 */
export type TestRole = 'admin' | 'manager' | 'user';

/** 역할별 테스트 사용자 정보 */
export const TEST_USERS: Record<TestRole, { email: string; password: string }> = {
  admin: { email: 'admin@example.com', password: 'admin123' },
  manager: { email: 'manager@example.com', password: 'manager123' },
  user: { email: 'user@example.com', password: 'user123' },
};

/** 시드된 테스트 사용자 UUID (AuthService/시드 데이터와 동일) */
export const TEST_USER_IDS: Record<TestRole, string> = {
  admin: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  manager: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789',
  user: '12345678-1234-4567-8901-234567890abc',
};

/** 시드 사용자 상세 정보 (DB 시딩에 사용) */
export const TEST_USER_DETAILS = [
  {
    id: TEST_USER_IDS.admin,
    email: TEST_USERS.admin.email,
    name: '관리자',
    role: 'lab_manager',
    site: 'suwon',
    location: '수원랩',
  },
  {
    id: TEST_USER_IDS.manager,
    email: TEST_USERS.manager.email,
    name: '기술책임자',
    role: 'technical_manager',
    site: 'suwon',
    location: '수원랩',
  },
  {
    id: TEST_USER_IDS.user,
    email: TEST_USERS.user.email,
    name: '시험실무자',
    role: 'test_engineer',
    site: 'suwon',
    location: '수원랩',
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
