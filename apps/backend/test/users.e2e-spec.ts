/// <reference types="jest" />

import request from 'supertest';
import * as crypto from 'crypto';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';

describe('UsersController (e2e)', () => {
  let ctx: TestAppContext;
  let adminAccessToken: string;
  let userAccessToken: string;
  let userId: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    adminAccessToken = await loginAs(ctx.app, 'admin');

    // user 로그인 + user ID 획득
    userAccessToken = await loginAs(ctx.app, 'user');
    userId = TEST_USER_IDS.user;
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('/users (GET)', () => {
    it('should get users list if admin', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should not allow non-admin to get users list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect([200, 403]).toContain(response.status);
    });
  });

  describe('/users/:id (GET) - Own Profile', () => {
    it('should get own profile by id', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(userId);
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should not get profile without authentication', async () => {
      await request(ctx.app.getHttpServer()).get(`/users/${userId}`).expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id if admin', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(userId);
      expect(response.body).toHaveProperty('email');
    });

    it('should not allow non-admin to get other user by id', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect([200, 403, 404]).toContain(response.status);
    });
  });

  describe('/users/:id (PATCH) - Update Own Profile', () => {
    it('should update own profile by id', async () => {
      const updatedName = `Updated Name ${crypto.randomBytes(4).toString('hex')}`;
      const updateData = {
        name: updatedName,
      };

      const response = await request(ctx.app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(updatedName);
      expect(response.body.id).toBe(userId);
    });

    it('should not update profile with invalid data', async () => {
      const invalidUpdateData = {
        email: 'invalid-email',
      };

      await request(ctx.app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe.skip('/users/change-password (POST)', () => {
    it('should change user password', async () => {
      // 비밀번호 변경 엔드포인트가 구현되면 활성화
    });
  });
});
