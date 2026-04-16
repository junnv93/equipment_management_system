/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';

describe('CalibrationPlansController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdPlanIds: string[] = [];
  const tracker = new ResourceTracker();

  const TEST_YEAR = 2030 + (Math.floor(Date.now() / 1000000000) % 100);
  const TEST_SITE = 'suwon';

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');

    const equipmentId = await createTestEquipment(ctx.app, accessToken, {
      site: TEST_SITE,
      managementMethod: 'external_calibration',
      calibrationCycle: 12,
      lastCalibrationDate: new Date(`${TEST_YEAR - 1}-06-01`).toISOString(),
      nextCalibrationDate: new Date(`${TEST_YEAR}-06-01`).toISOString(),
      calibrationAgency: 'Test Agency',
    });
    tracker.track('equipment', equipmentId);
  });

  afterAll(async () => {
    for (const planUuid of createdPlanIds) {
      try {
        await request(ctx.app.getHttpServer())
          .delete(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      } catch {
        // 무시
      }
    }
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  describe('/calibration-plans (POST)', () => {
    it('should create a new calibration plan', async () => {
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('year', TEST_YEAR);
      expect(response.body).toHaveProperty('siteId', TEST_SITE);
      expect(response.body).toHaveProperty('status', 'draft');
      expect(response.body).toHaveProperty('items');

      createdPlanIds.push(response.body.id);
    });

    it('should not create duplicate plan for same year and site', async () => {
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData)
        .expect(409);
    });

    it('should not create plan without authentication', async () => {
      const planData = {
        year: TEST_YEAR + 1,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .send(planData)
        .expect(401);
    });
  });

  describe('/calibration-plans (GET)', () => {
    it('should get calibration plans list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
      expect(response.body.meta).toHaveProperty('itemsPerPage');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should get calibration plans with year filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans?year=${TEST_YEAR}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.year).toBe(TEST_YEAR);
      });
    });

    it('should get calibration plans with siteId filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans?siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.siteId).toBe(TEST_SITE);
      });
    });

    it('should get calibration plans with status filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration-plans?status=draft')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('draft');
      });
    });
  });

  describe('/calibration-plans/:uuid (GET)', () => {
    it('should get calibration plan by uuid with items', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', planUuid);
      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('siteId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/calibration-plans/:uuid/submit (POST)', () => {
    it('should submit plan for approval (draft -> pending_approval)', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .post(`/calibration-plans/${planUuid}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('status', 'pending_approval');
      } else {
        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('/calibration-plans/:uuid/approve (PATCH)', () => {
    it('should approve plan (pending_approval -> approved)', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status === 'pending_approval') {
        const response = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ approvedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'approved');
      }
    });
  });

  describe('/calibration-plans/:uuid/reject (PATCH)', () => {
    it('should require rejection reason', async () => {
      const newYear = TEST_YEAR + 10;
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        await request(ctx.app.getHttpServer())
          .post(`/calibration-plans/${planUuid}/submit`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ rejectedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

        expect(rejectResponse.status).toBe(400);
      }
    });

    it('should reject plan with reason', async () => {
      const newYear = TEST_YEAR + 11;
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        await request(ctx.app.getHttpServer())
          .post(`/calibration-plans/${planUuid}/submit`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            rejectedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            rejectionReason: '계획서 내용 수정 필요',
          });

        expect(rejectResponse.status).toBe(200);
        expect(rejectResponse.body).toHaveProperty('status', 'rejected');
        expect(rejectResponse.body).toHaveProperty('rejectionReason', '계획서 내용 수정 필요');
      }
    });
  });

  describe('/calibration-plans/:uuid (DELETE)', () => {
    it('should delete plan only in draft status', async () => {
      const newYear = TEST_YEAR + 20;
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('deleted', true);

        await request(ctx.app.getHttpServer())
          .get(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should not delete plan in non-draft status', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status !== 'draft') {
        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/equipment/external (GET)', () => {
    it('should get external calibration equipment list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/calibration-plans/equipment/external')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('managementNumber');
      }
    });

    it('should filter external equipment by year and siteId', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/equipment/external?year=${TEST_YEAR}&siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach((item: Record<string, unknown>) => {
        expect(item.site).toBe(TEST_SITE);
      });
    });

    it('should apply @SiteScoped and auto-inject siteId for test_engineer token', async () => {
      const loginResponse = await request(ctx.app.getHttpServer())
        .get('/auth/test-login?role=test_engineer')
        .expect(200);

      const teToken: string = loginResponse.body.access_token || loginResponse.body.accessToken;
      if (!teToken) {
        return;
      }

      const response = await request(ctx.app.getHttpServer())
        .get('/calibration-plans/equipment/external')
        .set('Authorization', `Bearer ${teToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach((item: Record<string, unknown>) => {
        expect(['suwon', 'uiwang', 'pyeongtaek']).toContain(item.site);
      });
    });
  });

  describe('/calibration-plans/:uuid/items/:itemUuid/confirm (PATCH)', () => {
    it('should confirm item only in approved plan', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status === 'approved' && planResponse.body.items?.length > 0) {
        const itemUuid = planResponse.body.items[0].id;

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
        expect(confirmResponse.body).toHaveProperty('confirmedAt');
      }
    });

    it('should not confirm item in non-approved plan', async () => {
      const newYear = TEST_YEAR + 30;
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201 && createResponse.body.items?.length > 0) {
        const planUuid = createResponse.body.id;
        const itemUuid = createResponse.body.items[0].id;
        createdPlanIds.push(planUuid);

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/:uuid/pdf (GET)', () => {
    it('should generate PDF (HTML) for plan', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should return 404 for non-existent plan PDF', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${nonExistentUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should complete full calibration plan workflow', async () => {
      const newYear = TEST_YEAR + 100;
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status !== 201) {
        return;
      }

      const planUuid = createResponse.body.id;
      createdPlanIds.push(planUuid);

      expect(createResponse.body.status).toBe('draft');

      const readResponse = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(planUuid);

      const submitResponse = await request(ctx.app.getHttpServer())
        .post(`/calibration-plans/${planUuid}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect([200, 201]).toContain(submitResponse.status);
      expect(submitResponse.body.status).toBe('pending_approval');

      const approveResponse = await request(ctx.app.getHttpServer())
        .patch(`/calibration-plans/${planUuid}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ approvedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.status).toBe('approved');

      if (approveResponse.body.items?.length > 0) {
        const itemUuid = approveResponse.body.items[0].id;

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
      }

      const pdfResponse = await request(ctx.app.getHttpServer())
        .get(`/calibration-plans/${planUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(pdfResponse.headers['content-type']).toContain('text/html');
    });
  });
});
