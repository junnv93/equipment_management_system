/// <reference types="jest" />

// ErrorCode enum 값이 controller → service → HTTP response 체인을 통해
// 올바르게 전파되는지 통합 검증.
// manager-role-constraint.e2e-spec.ts (EQUIPMENT_MANAGER_* 코드 커버)를 보완.

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { ErrorCode } from '@equipment-management/schemas';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';

const NON_EXISTENT_UUID = '00000000-0000-0000-0000-000000000099';

describe('Equipment Domain ErrorCode Integration (e2e)', () => {
  let ctx: TestAppContext;
  let systemAdminToken: string;
  let managerToken: string;
  let testEquipmentUuid: string;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    systemAdminToken = await loginAs(ctx.app, 'systemAdmin');
    managerToken = await loginAs(ctx.app, 'manager');
    testEquipmentUuid = await createTestEquipment(ctx.app);
    tracker.track('equipment', testEquipmentUuid);
  }, 30000);

  afterAll(async () => {
    await tracker.cleanupAll(ctx.app, systemAdminToken);
    await closeTestApp(ctx?.app);
  });

  describe('equipment.service — 중복 관리번호', () => {
    it('중복 관리번호로 생성 시 400 + EQUIPMENT_MANAGEMENT_NUMBER_DUPLICATE', async () => {
      const detail = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.GET(testEquipmentUuid))
        .set('Authorization', `Bearer ${systemAdminToken}`);

      expect(detail.status).toBe(200);
      const { managementNumber, site, name, equipmentType } = detail.body as {
        managementNumber: string;
        site: string;
        name: string;
        equipmentType: string;
      };

      const resp = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE)
        .set('Authorization', `Bearer ${systemAdminToken}`)
        .send({
          name,
          managementNumber,
          modelName: 'Duplicate Test',
          manufacturer: 'Test Co',
          serialNumber: `SN-DUP-${Date.now()}`,
          location: '테스트 위치',
          initialLocation: '테스트 위치',
          site,
          equipmentType,
          status: 'available',
        });

      expect(resp.status).toBe(400);
      expect(resp.body.code).toBe(ErrorCode.EquipmentManagementNumberDuplicate);
    });
  });

  describe('equipment-approval.service — 요청 조회 에러', () => {
    it('존재하지 않는 요청 UUID 조회 → 404 + EQUIPMENT_REQUEST_NOT_FOUND', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.REQUESTS.GET(NON_EXISTENT_UUID))
        .set('Authorization', `Bearer ${managerToken}`);

      expect(resp.status).toBe(404);
      expect(resp.body.code).toBe(ErrorCode.EquipmentRequestNotFound);
    });
  });

  describe('equipment-history.service — 이력 조회 에러', () => {
    it('존재하지 않는 장비 UUID로 위치 이력 조회 → 404 + EQUIPMENT_NOT_FOUND', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(NON_EXISTENT_UUID))
        .set('Authorization', `Bearer ${systemAdminToken}`);

      expect(resp.status).toBe(404);
      expect(resp.body.code).toBe(ErrorCode.EquipmentNotFound);
    });

    it('존재하지 않는 location history UUID 삭제 → 404 + HISTORY_NOT_FOUND', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(NON_EXISTENT_UUID))
        .set('Authorization', `Bearer ${systemAdminToken}`);

      expect(resp.status).toBe(404);
      expect(resp.body.code).toBe(ErrorCode.HistoryNotFound);
    });
  });

  describe('repair-history.service — 수리 이력 에러', () => {
    it('존재하지 않는 repair history UUID 조회 → 404 + REPAIR_HISTORY_NOT_FOUND', async () => {
      const resp = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.REPAIR_HISTORY.GET(NON_EXISTENT_UUID))
        .set('Authorization', `Bearer ${systemAdminToken}`);

      expect(resp.status).toBe(404);
      expect(resp.body.code).toBe(ErrorCode.RepairHistoryNotFound);
    });
  });
});
