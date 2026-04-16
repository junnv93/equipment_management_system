/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

describe('IntermediateCheck (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('/calibration/intermediate-checks (GET)', () => {
    it('should get upcoming intermediate checks', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('intermediateCheckDate');
        expect(response.body[0]).toHaveProperty('equipmentId');
      }
    });

    it('should filter by days parameter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks?days=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks')
        .expect(401);
    });
  });

  describe('/calibration/intermediate-checks/all (GET)', () => {
    it('should get all intermediate checks with metadata', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('overdueCount');
      expect(response.body.meta).toHaveProperty('pendingCount');
    });

    it('should filter by status=overdue', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=overdue')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      response.body.items.forEach((item: Record<string, unknown>) => {
        const checkDate = new Date(item.intermediateCheckDate as string);
        checkDate.setHours(0, 0, 0, 0);
        expect(checkDate.getTime()).toBeLessThan(today.getTime());
      });
    });

    it('should filter by status=pending', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      response.body.items.forEach((item: Record<string, unknown>) => {
        const checkDate = new Date(item.intermediateCheckDate as string);
        checkDate.setHours(0, 0, 0, 0);
        expect(checkDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
      });
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .expect(401);
    });
  });

  describe('/calibration/:uuid/intermediate-check/complete (POST)', () => {
    it('should complete intermediate check for calibration with intermediate check date', async () => {
      const checksResponse = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (checksResponse.body.items.length === 0) {
        return;
      }

      const calibrationWithCheck = checksResponse.body.items[0];

      const response = await request(ctx.app.getHttpServer())
        .post(`/calibration/${calibrationWithCheck.id}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
          notes: 'E2E 테스트 중간점검 완료',
        });

      expect([200, 201, 400]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('calibration');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('완료');
      }
    });

    it('should fail for calibration without intermediate check date', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(ctx.app.getHttpServer())
        .post(`/calibration/${nonExistentId}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
        });

      expect([400, 404]).toContain(response.status);
    });

    it('should require authentication', async () => {
      await request(ctx.app.getHttpServer())
        .post('/calibration/some-uuid/intermediate-check/complete')
        .send({
          completedBy: 'test-user-id',
        })
        .expect(401);
    });

    it('should accept optional notes', async () => {
      const checksResponse = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (checksResponse.body.items.length === 0) {
        return;
      }

      const calibrationWithCheck = checksResponse.body.items[0];

      const response = await request(ctx.app.getHttpServer())
        .post(`/calibration/${calibrationWithCheck.id}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
        });

      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Intermediate Check Workflow', () => {
    it('should complete full intermediate check workflow', async () => {
      const allChecksResponse = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allChecksResponse.body).toHaveProperty('items');
      expect(allChecksResponse.body).toHaveProperty('meta');

      await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks?days=7')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks?days=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const overdueResponse = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=overdue')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const pendingResponse = await request(ctx.app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allChecksResponse.body.meta.overdueCount).toBe(overdueResponse.body.items.length);
      expect(allChecksResponse.body.meta.pendingCount).toBe(pendingResponse.body.items.length);
    });
  });
});
