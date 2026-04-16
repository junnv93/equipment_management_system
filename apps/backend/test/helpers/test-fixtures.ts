import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/** 장비 생성 기본값 */
const DEFAULT_EQUIPMENT = {
  modelName: 'Test Model',
  manufacturer: 'Test Manufacturer',
  status: 'available' as const,
  location: 'Test Location',
  site: 'suwon' as const,
  approvalStatus: 'approved' as const,
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
    .post('/equipment')
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
    .post('/cables')
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
    .post('/checkouts')
    .set('Authorization', `Bearer ${token}`)
    .send(data);

  if (response.status !== 201 || !response.body?.id) {
    throw new Error(
      `Failed to create test checkout: status ${response.status}, body ${JSON.stringify(response.body)}`,
    );
  }

  return response.body.id;
}
