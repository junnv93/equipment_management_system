/// <reference types="jest" />

import request from 'supertest';
import { eq as eqOp } from 'drizzle-orm';
import { users } from '@equipment-management/db/schema/users';
import type { AppDatabase } from '@equipment-management/db';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

/**
 * 운영 책임자 역할 제한 E2E 테스트
 *
 * UL-QP-18: managerId/deputyManagerId에 기술책임자 이상만 할당 가능
 * 크로스 사이트 할당 차단
 */
describe('Equipment Manager Role Constraint (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;

  // 시드 UUID 상수
  const TECH_MANAGER_SUWON = '00000000-0000-0000-0000-000000000002';
  const TEST_ENGINEER_SUWON = '00000000-0000-0000-0000-000000000001';
  const TECH_MANAGER_UIWANG = 'f47ac10b-58cc-4372-a567-0e02b2c3d478';

  beforeAll(async () => {
    ctx = await createTestApp();

    // admin@example.com 사용자가 DB에 존재하도록 보장
    const db = ctx.module.get<AppDatabase>('DRIZZLE_INSTANCE');
    const [existing] = await db
      .select()
      .from(users)
      .where(eqOp(users.email, 'admin@example.com'))
      .limit(1);
    if (!existing) {
      await db.insert(users).values({
        email: 'admin@example.com',
        name: '관리자 (E2E)',
        role: 'lab_manager',
        site: 'suwon',
        isActive: true,
      });
    }

    accessToken = await loginAs(ctx.app, 'admin');
  }, 30000);

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  it('기술책임자를 운영 책임자(정)로 지정 — 허용', async () => {
    const resp = await request(ctx.app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TECH_MANAGER_SUWON)
      .field('version', '1');

    expect(resp.status).not.toBe(400);
  });

  it('시험실무자를 운영 책임자(정)로 지정 — 거부 (EQUIPMENT_MANAGER_ROLE_INSUFFICIENT)', async () => {
    const resp = await request(ctx.app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TEST_ENGINEER_SUWON)
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('시험실무자를 운영 책임자(부)로 지정 — 거부', async () => {
    const resp = await request(ctx.app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deputyManagerId', TEST_ENGINEER_SUWON)
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('다른 사이트 기술책임자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_SITE_MISMATCH)', async () => {
    const resp = await request(ctx.app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TECH_MANAGER_UIWANG)
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_SITE_MISMATCH');
  });

  it('존재하지 않는 사용자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_NOT_FOUND)', async () => {
    const resp = await request(ctx.app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', '00000000-0000-0000-0000-ffffffffffff')
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_NOT_FOUND');
  });
});
