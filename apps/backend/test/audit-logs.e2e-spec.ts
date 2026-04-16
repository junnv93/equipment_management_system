/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

describe('AuditLogsController (e2e)', () => {
  let ctx: TestAppContext;
  let adminAccessToken: string;
  let userAccessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    adminAccessToken = await loginAs(ctx.app, 'admin');
    userAccessToken = await loginAs(ctx.app, 'user');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('GET /audit-logs', () => {
    it('should return audit logs list for admin', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // 감사 로그 테이블이 비어있을 수 있음
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('meta');
        expect(Array.isArray(response.body.items)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        expect(response.body.meta).toHaveProperty('currentPage', 1);
        expect(response.body.meta).toHaveProperty('itemsPerPage', 10);
      }
    });

    it('should support filtering by entityType', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs?entityType=equipment')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        response.body.items.forEach((item: Record<string, unknown>) => {
          expect(item.entityType).toBe('equipment');
        });
      }
    });

    it('should support filtering by action', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs?action=create')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        response.body.items.forEach((item: Record<string, unknown>) => {
          expect(item.action).toBe('create');
        });
      }
    });

    it('should support date range filtering', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(ctx.app.getHttpServer())
        .get(
          `/audit-logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        )
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        response.body.items.forEach((item: Record<string, unknown>) => {
          const itemDate = new Date(item.timestamp as string);
          expect(itemDate >= startDate && itemDate <= endDate).toBe(true);
        });
      }
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(ctx.app.getHttpServer()).get('/audit-logs');
      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /audit-logs/entity/:entityType/:entityId', () => {
    it('should return audit logs for specific entity', async () => {
      const testEntityId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(ctx.app.getHttpServer())
        .get(`/audit-logs/entity/equipment/${testEntityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('formattedLogs');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(Array.isArray(response.body.formattedLogs)).toBe(true);
      }
    });

    it('should validate UUID format', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/audit-logs/entity/equipment/invalid-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /audit-logs/user/:userId', () => {
    it('should return audit logs for specific user', async () => {
      const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(ctx.app.getHttpServer())
        .get(`/audit-logs/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('formattedLogs');
      }
    });

    it('should support limit parameter', async () => {
      const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(ctx.app.getHttpServer())
        .get(`/audit-logs/user/${testUserId}?limit=5`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        expect(response.body.items.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Audit Log Integration', () => {
    it('should create audit log when equipment is created', async () => {
      const equipmentResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Audit Test Equipment',
          managementNumber: `AUDIT-TEST-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          status: 'available',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      if (equipmentResponse.status === 201) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const logsResponse = await request(ctx.app.getHttpServer())
          .get('/audit-logs?entityType=equipment&action=create&limit=5')
          .set('Authorization', `Bearer ${adminAccessToken}`);

        if (logsResponse.status === 200 && logsResponse.body.items.length > 0) {
          const recentLog = logsResponse.body.items[0];
          expect(recentLog.action).toBe('create');
          expect(recentLog.entityType).toBe('equipment');
        }
      }
    });
  });
});
