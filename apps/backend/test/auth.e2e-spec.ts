/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { TEST_USERS } from './helpers/test-auth';

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
        .post('/auth/login')
        .send({
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TEST_USERS.admin.email);
      expect(response.body.user.name).toBe('관리자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('lab_manager');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login manager with valid credentials', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_USERS.manager.email,
          password: TEST_USERS.manager.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TEST_USERS.manager.email);
      expect(response.body.user.name).toBe('기술책임자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('technical_manager');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login user with valid credentials', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_USERS.user.email,
          password: TEST_USERS.user.password,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(TEST_USERS.user.email);
      expect(response.body.user.name).toBe('시험실무자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('test_engineer');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid credentials', async () => {
      await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_USERS.admin.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      const response = await request(ctx.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: TEST_USERS.admin.email,
          password: TEST_USERS.admin.password,
        });

      accessToken = response.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(TEST_USERS.admin.email);
      expect(response.body.roles).toContain('lab_manager');
    });

    it('should not get user profile without token', async () => {
      await request(ctx.app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should not get user profile with invalid token', async () => {
      await request(ctx.app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/test (GET)', () => {
    it('should return test message', async () => {
      const response = await request(ctx.app.getHttpServer()).get('/auth/test').expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
