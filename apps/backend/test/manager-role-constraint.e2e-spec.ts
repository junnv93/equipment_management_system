/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import {
  USER_TECHNICAL_MANAGER_SUWON_ID,
  USER_TEST_ENGINEER_SUWON_ID,
  USER_TECHNICAL_MANAGER_UIWANG_ID,
} from '../src/database/utils/uuid-constants';

/**
 * 운영 책임자 역할 제한 E2E 테스트
 *
 * UL-QP-18: managerId/deputyManagerId에 기술책임자 이상만 할당 가능
 * 크로스 사이트 할당 차단
 */
describe('Equipment Manager Role Constraint (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  let testEquipmentUuid: string;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    // globalSetup이 lab_manager 역할 사용자를 시딩하므로 loginAs 직접 사용 가능
    accessToken = await loginAs(ctx.app, 'admin');

    // 시드 장비 의존 대신 자체 생성 — 테스트 자급자족
    testEquipmentUuid = await createTestEquipment(ctx.app, accessToken);
    tracker.track('equipment', testEquipmentUuid);
  }, 30000);

  afterAll(async () => {
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  /** 장비의 현재 CAS version을 조회합니다. */
  async function getEquipmentVersion(): Promise<number> {
    const detail = await request(ctx.app.getHttpServer())
      .get(API_ENDPOINTS.EQUIPMENT.GET(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`);
    return detail.body.version;
  }

  it('기술책임자를 운영 책임자(정)로 지정 — 허용', async () => {
    const version = await getEquipmentVersion();
    const resp = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', USER_TECHNICAL_MANAGER_SUWON_ID)
      .field('version', String(version));

    expect(resp.status).not.toBe(400);
  });

  it('시험실무자를 운영 책임자(정)로 지정 — 거부 (EQUIPMENT_MANAGER_ROLE_INSUFFICIENT)', async () => {
    const version = await getEquipmentVersion();
    const resp = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', USER_TEST_ENGINEER_SUWON_ID)
      .field('version', String(version));

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('시험실무자를 운영 책임자(부)로 지정 — 거부', async () => {
    const version = await getEquipmentVersion();
    const resp = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`)
      .field('deputyManagerId', USER_TEST_ENGINEER_SUWON_ID)
      .field('version', String(version));

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_ROLE_INSUFFICIENT');
  });

  it('다른 사이트 기술책임자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_SITE_MISMATCH)', async () => {
    const version = await getEquipmentVersion();
    const resp = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', USER_TECHNICAL_MANAGER_UIWANG_ID)
      .field('version', String(version));

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_SITE_MISMATCH');
  });

  it('존재하지 않는 사용자를 운영 책임자로 지정 — 거부 (EQUIPMENT_MANAGER_NOT_FOUND)', async () => {
    const version = await getEquipmentVersion();
    const resp = await request(ctx.app.getHttpServer())
      .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(testEquipmentUuid))
      .set('Authorization', `Bearer ${accessToken}`)
      .field('managerId', '00000000-0000-0000-0000-ffffffffffff')
      .field('version', String(version));

    expect(resp.status).toBe(400);
    expect(resp.body.code).toBe('EQUIPMENT_MANAGER_NOT_FOUND');
  });
});
