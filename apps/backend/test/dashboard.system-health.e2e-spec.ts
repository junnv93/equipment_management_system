/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, type TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

describe('DashboardController — GET /api/dashboard/system-health (e2e)', () => {
  let ctx: TestAppContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  it('200 — SYSTEM_ADMIN 은 시스템 상태 조회 가능 + 응답 shape 검증', async () => {
    const token = await loginAs(ctx.app, 'systemAdmin');

    const res = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.DASHBOARD.SYSTEM_HEALTH)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // SystemHealthMetricsDto 핵심 필드 존재 검증
    expect(res.body).toHaveProperty('activeUsers');
    expect(res.body).toHaveProperty('dbResponseMs');
    expect(res.body).toHaveProperty('storagePct');
    expect(res.body).toHaveProperty('queueSize');
    expect(res.body).toHaveProperty('errorCount24h');
    expect(res.body).toHaveProperty('overallStatus');
    expect(res.body).toHaveProperty('measuredAt');

    // overallStatus 는 3 값 중 하나
    expect(['healthy', 'degraded', 'down']).toContain(res.body.overallStatus);

    // measuredAt 은 ISO 8601 문자열
    expect(typeof res.body.measuredAt).toBe('string');
    expect(new Date(res.body.measuredAt).getTime()).not.toBeNaN();
  });

  it('403 — lab_manager(admin role) 는 시스템 상태 조회 불가', async () => {
    const token = await loginAs(ctx.app, 'admin');

    const res = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.DASHBOARD.SYSTEM_HEALTH)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('403 — technical_manager(manager role) 는 시스템 상태 조회 불가', async () => {
    const token = await loginAs(ctx.app, 'manager');

    const res = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.DASHBOARD.SYSTEM_HEALTH)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it('401 — Authorization 헤더 없으면 인증 실패', async () => {
    const res = await request(ctx.app.getHttpServer()).get(API_ENDPOINTS.DASHBOARD.SYSTEM_HEALTH);

    expect(res.status).toBe(401);
  });
});
