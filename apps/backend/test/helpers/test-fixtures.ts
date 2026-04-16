import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import postgres from 'postgres';
import { TEST_USER_DETAILS } from './test-auth';

/** 장비 생성 기본값 — CreateEquipmentDto 필수 필드 포함 */
const DEFAULT_EQUIPMENT = {
  modelName: 'Test Model',
  manufacturer: 'Test Manufacturer',
  status: 'available' as const,
  location: 'Test Location',
  initialLocation: 'Test Location',
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

/**
 * 테스트 사용자를 DB에 직접 시딩합니다.
 * 승인 프로세스 등에서 외래 키 제약 조건 충족을 위해 사용합니다.
 *
 * @returns postgres.Sql 인스턴스 (afterAll에서 sql.end()로 정리)
 */
export async function seedTestUsers(): Promise<postgres.Sql> {
  const sql = postgres(process.env.DATABASE_URL as string);

  for (const user of TEST_USER_DETAILS) {
    try {
      await sql`
        INSERT INTO users (id, email, name, role, site, location, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.name}, ${user.role}, ${user.site}, ${user.location}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          site = EXCLUDED.site,
          location = EXCLUDED.location,
          updated_at = NOW()
      `;
    } catch {
      // 시드 실패 무시 — 이미 존재하는 경우
    }
  }

  return sql;
}
