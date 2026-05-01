import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { TEAM_FCC_EMC_RF_SUWON_ID } from '../../src/database/utils/uuid-constants';
import { loginAs } from './test-auth';

/**
 * 장비 생성 기본값 — CreateEquipmentDto 필수 필드 포함
 *
 * ⚠️ teamId 필수: team-scoped 필터(calibration-plans equipment.teamId, intermediate-checks 등)에서
 * 결과 empty가 되지 않도록 technical_manager의 소속 팀(TEAM_FCC_EMC_RF_SUWON_ID)에 등록.
 * UL-QP-18 EQUIPMENT_TEAM_SCOPE_ONLY 제약: 등록자(technical_manager)는 자기 팀에만 등록 가능.
 * override로 다른 팀 지정 가능 (단, 다른 팀 지정 시 EQUIPMENT_TEAM_SCOPE_ONLY 403 발생 가능).
 */
const DEFAULT_EQUIPMENT = {
  modelName: 'Test Model',
  manufacturer: 'Test Manufacturer',
  status: 'available' as const,
  location: 'Test Location',
  initialLocation: 'Test Location',
  site: 'suwon' as const,
  approvalStatus: 'approved' as const,
  teamId: TEAM_FCC_EMC_RF_SUWON_ID,
};

/**
 * 테스트용 장비를 생성합니다.
 *
 * UL-QP-18 직무분리(commit 77cb3f37) 영향:
 * - `lab_manager`는 CREATE_EQUIPMENT 권한 없음
 * - `technical_manager`/`test_engineer`는 등록 시 승인 워크플로 진입 (pending_approval 요청 생성)
 * - `system_admin`만 승인 절차 우회하여 직접 등록 (equipment.controller.ts:208 명시 예외)
 *
 * fixture는 setup용이므로 호출부 역할(admin/manager/user)과 무관하게
 * 항상 system_admin 토큰을 내부 발급해 장비를 직접 등록한다.
 * 호출부의 토큰 인자는 더 이상 사용되지 않으나, 기존 호출부 호환을 위해 시그니처는 유지한다.
 *
 * @param app NestJS 테스트 앱 인스턴스
 * @param _token 더 이상 사용 안 함 — 헬퍼 내부에서 system_admin 토큰 자체 발급
 * @param overrides 장비 필드 오버라이드
 * @returns 생성된 장비의 UUID
 * @throws 장비 생성 실패 시 에러
 */
export async function createTestEquipment(
  app: INestApplication,
  _token: string,
  overrides?: Record<string, unknown>,
): Promise<string> {
  const creatorToken = await loginAs(app, 'systemAdmin');
  const suffix = Date.now();
  const data = {
    name: `E2E Test Equipment ${suffix}`,
    managementNumber: `E2E-${suffix}`,
    serialNumber: `SN-${suffix}`,
    ...DEFAULT_EQUIPMENT,
    ...overrides,
  };

  const response = await request(app.getHttpServer())
    .post(API_ENDPOINTS.EQUIPMENT.CREATE)
    .set('Authorization', `Bearer ${creatorToken}`)
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
    .post(API_ENDPOINTS.CABLES.CREATE)
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
    .post(API_ENDPOINTS.CHECKOUTS.CREATE)
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
