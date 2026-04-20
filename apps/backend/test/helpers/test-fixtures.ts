import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { TEAM_PLACEHOLDER_ID } from '../../src/database/utils/uuid-constants';
import { toTestPath } from './test-paths';

/**
 * 장비 생성 기본값 — CreateEquipmentDto 필수 필드 포함
 *
 * ⚠️ teamId 필수: team-scoped 필터(calibration-plans equipment.teamId, intermediate-checks 등)에서
 * 결과 empty가 되지 않도록 TEAM_PLACEHOLDER_ID에 소속시킨다. override로 다른 팀 지정 가능.
 */
const DEFAULT_EQUIPMENT = {
  modelName: 'Test Model',
  manufacturer: 'Test Manufacturer',
  status: 'available' as const,
  location: 'Test Location',
  initialLocation: 'Test Location',
  site: 'suwon' as const,
  approvalStatus: 'approved' as const,
  teamId: TEAM_PLACEHOLDER_ID,
};

/**
 * 테스트용 장비를 생성합니다.
 *
 * @returns 생성된 장비의 UUID
 * @throws 장비 생성 실패 시 에러
 */
export async function createTestEquipment(
  app: INestApplication,
  token: string,
  overrides?: Record<string, unknown>,
): Promise<string> {
  const suffix = Date.now();
  const data = {
    name: `E2E Test Equipment ${suffix}`,
    managementNumber: `E2E-${suffix}`,
    serialNumber: `SN-${suffix}`,
    ...DEFAULT_EQUIPMENT,
    ...overrides,
  };

  const response = await request(app.getHttpServer())
    .post(toTestPath(API_ENDPOINTS.EQUIPMENT.CREATE))
    .set('Authorization', `Bearer ${token}`)
    .send(data);

  if (response.status !== 201 || !response.body?.id) {
    throw new Error(
      `Failed to create test equipment: status ${response.status}, body ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.id;
}

/**
 * 테스트용 케이블을 생성합니다.
 *
 * @returns 생성된 케이블의 UUID
 */
export async function createTestCable(
  app: INestApplication,
  token: string,
  overrides?: Record<string, unknown>,
): Promise<string> {
  const suffix = Date.now();
  const data = {
    name: `E2E Test Cable ${suffix}`,
    cableNumber: `CABLE-${suffix}`,
    type: 'power',
    site: 'suwon',
    ...overrides,
  };

  const response = await request(app.getHttpServer())
    .post(toTestPath(API_ENDPOINTS.CABLES.CREATE))
    .set('Authorization', `Bearer ${token}`)
    .send(data);

  if (response.status !== 201 || !response.body?.id) {
    throw new Error(
      `Failed to create test cable: status ${response.status}, body ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.id;
}

/**
 * 테스트용 반출(checkout)을 생성합니다.
 *
 * @returns 생성된 반출의 UUID
 */
export async function createTestCheckout(
  app: INestApplication,
  token: string,
  equipmentId: string,
  overrides?: Record<string, unknown>,
): Promise<string> {
  const data = {
    equipmentId,
    type: 'calibration',
    reason: 'E2E Test Checkout',
    expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  };

  const response = await request(app.getHttpServer())
    .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
    .set('Authorization', `Bearer ${token}`)
    .send(data);

  if (response.status !== 201 || !response.body?.id) {
    throw new Error(
      `Failed to create test checkout: status ${response.status}, body ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.id;
}

// seedTestUsers, seedTestTeam은 제거됨 — jest-global-setup.ts가 모든 E2E 테스트 전에 1회 자동 시딩.
// 개별 스위트에서 beforeAll로 수동 시딩할 필요 없음 (test-fixtures 설계의 SSOT 강화).
