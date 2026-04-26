/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

/**
 * Sprint 3.1: GET /checkouts/inbound-overview BFF 엔드포인트 E2E smoke test
 *
 * Contract M3: 200 + {standard, rental, internalShared, sparkline, generatedAt} 구조 확인
 * Contract M5: 인증 없이 접근 시 401 확인
 */
describe('CheckoutsController › GET /checkouts/inbound-overview (BFF E2E)', () => {
  let ctx: TestAppContext;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    adminToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  it('should return 200 with correct response shape (M3)', async () => {
    const response = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.CHECKOUTS.INBOUND_OVERVIEW)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const body = response.body as Record<string, unknown>;
    expect(body).toHaveProperty('standard');
    expect(body).toHaveProperty('rental');
    expect(body).toHaveProperty('internalShared');
    expect(body).toHaveProperty('sparkline');
    expect(body).toHaveProperty('generatedAt');

    const sparkline = body.sparkline as Record<string, unknown>;
    expect(Array.isArray(sparkline.standard)).toBe(true);
    expect(Array.isArray(sparkline.rental)).toBe(true);
    expect(Array.isArray(sparkline.internalShared)).toBe(true);
    expect((sparkline.standard as number[]).length).toBe(14);
    expect((sparkline.rental as number[]).length).toBe(14);
    expect((sparkline.internalShared as number[]).length).toBe(14);

    const standard = body.standard as Record<string, unknown>;
    expect(Array.isArray(standard.items)).toBe(true);
    expect(standard).toHaveProperty('meta');
  });

  it('should return 401 without auth token (M5)', async () => {
    await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.CHECKOUTS.INBOUND_OVERVIEW)
      .expect(401);
  });

  it('should accept valid query parameters', async () => {
    const response = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.CHECKOUTS.INBOUND_OVERVIEW)
      .query({ statusFilter: 'pending', limitPerSection: '5' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('standard');
  });
});
