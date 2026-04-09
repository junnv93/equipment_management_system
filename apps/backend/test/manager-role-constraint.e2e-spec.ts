/// <reference types="jest" />

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/equipment_management';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'test-client-id-for-e2e-tests';
process.env.AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'test-tenant-id-for-e2e-tests';
process.env.DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || 'admin123';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { eq as eqOp } from 'drizzle-orm';
import { users } from '@equipment-management/db/schema/users';
import type { AppDatabase } from '@equipment-management/db';

/**
 * 운영 책임자 역할 제한 E2E 테스트
 *
 * UL-QP-18: managerId/deputyManagerId에 기술책임자 이상만 할당 가능
 * 크로스 사이트 할당 차단
 */
describe('Equipment Manager Role Constraint (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  // 시드 UUID 상수
  const TECH_MANAGER_SUWON = '00000000-0000-0000-0000-000000000002'; // technical_manager, suwon
  const TEST_ENGINEER_SUWON = '00000000-0000-0000-0000-000000000001'; // test_engineer, suwon
  const TECH_MANAGER_UIWANG = 'f47ac10b-58cc-4372-a567-0e02b2c3d478'; // technical_manager, uiwang

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // admin@example.com 사용자가 DB에 존재하도록 보장
    const db = moduleFixture.get<AppDatabase>('DRIZZLE_INSTANCE');
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

    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@example.com',
      password: 'admin123',
    });

    accessToken =
      loginResponse.body.data?.accessToken ||
      loginResponse.body.access_token ||
      loginResponse.body.accessToken;
  }, 30000);

  afterAll(async () => {
    await app?.close();
  });

  it('기술책임자를 운영 책임자(정)로 지정 — 허용', async () => {
    const resp = await request(app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TECH_MANAGER_SUWON)
      .field('version', '1');

    // 200 또는 409(version 충돌) — 역할 제한 에러(400)가 아니면 OK
    expect(resp.status).not.toBe(400);
  });

  it('시험실무자를 운영 책임자(정)로 지정 — 거부 (EQUIPMENT_MANAGER_ROLE_INSUFFICIENT)', async () => {
    const resp = await request(app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TEST_ENGINEER_SUWON)
      .field('version', '1');

    console.log('TEST_ENGINEER resp:', resp.status, JSON.stringify(resp.body).slice(0, 500));
    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('시험실무자를 운영 책임자(부)로 지정 — 거부', async () => {
    const resp = await request(app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deputyManagerId', TEST_ENGINEER_SUWON)
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('다른 사이트 기술책임자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_SITE_MISMATCH)', async () => {
    const resp = await request(app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', TECH_MANAGER_UIWANG)
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_SITE_MISMATCH');
  });

  it('존재하지 않는 사용자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_NOT_FOUND)', async () => {
    const resp = await request(app.getHttpServer())
      .patch('/equipment/eeee1001-0001-4001-8001-000000000001')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', '00000000-0000-0000-0000-ffffffffffff')
      .field('version', '1');

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_NOT_FOUND');
  });
});
