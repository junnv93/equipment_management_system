/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { toTestPath } from './helpers/test-paths';

/**
 * /auth/login 엔드포인트 자체를 테스트하는 spec.
 * auth.service.ts 가 DEV_*_PASSWORD 환경변수로 검증하는 로컬 로그인 전용.
 * 다른 spec의 loginAs() 와 달리 실제 비밀번호 검증 흐름을 테스트함.
 *
 * 시드 DB의 canonical email 사용 → DB 조회로 site/location 포함 응답 검증
 */
const LOGIN_USERS = {
  admin: { email: 'lab.manager@example.com', password: process.env.DEV_ADMIN_PASSWORD ?? 'admin123' },
  manager: { email: 'tech.manager@example.com', password: process.env.DEV_MANAGER_PASSWORD ?? 'manager123' },
  user: { email: 'test.engineer@example.com', password: process.env.DEV_USER_PASSWORD ?? 'user123' },
} as const;

describe('AuthController (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('/auth/login (POST)', () => {
    it('should login admin with valid credentials', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.AUTH.BACKEND_LOGIN))
        .send({
          email: LOGIN_USERS.admin.email,
          password: LOGIN_USERS.admin.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(LOGIN_USERS.admin.email);
      expect(response.body.user.name).toBeDefined();
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('lab_manager');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login manager with valid credentials', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.AUTH.BACKEND_LOGIN))
        .send({
          email: LOGIN_USERS.manager.email,
          password: LOGIN_USERS.manager.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(LOGIN_USERS.manager.email);
      expect(response.body.user.name).toMatch(/기술책임자/);
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('technical_manager');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login user with valid credentials', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.AUTH.BACKEND_LOGIN))
        .send({
          email: LOGIN_USERS.user.email,
          password: LOGIN_USERS.user.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(LOGIN_USERS.user.email);
      expect(response.body.user.name).toMatch(/시험실무자/);
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('test_engineer');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid credentials', async () => {
      await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.AUTH.BACKEND_LOGIN))
        .send({
          email: LOGIN_USERS.admin.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.AUTH.BACKEND_LOGIN))
        .send({
          email: LOGIN_USERS.admin.email,
          password: LOGIN_USERS.admin.password,
        });

      accessToken = response.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.AUTH.PROFILE))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(LOGIN_USERS.admin.email);
      expect(response.body.roles).toContain('lab_manager');
    });

    it('should not get user profile without token', async () => {
      await request(ctx.app.getHttpServer()).get(toTestPath(API_ENDPOINTS.AUTH.PROFILE)).expect(401);
    });

    it('should not get user profile with invalid token', async () => {
      await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.AUTH.PROFILE))
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/test (GET)', () => {
    it('should return test message', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.AUTH.TEST))
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
