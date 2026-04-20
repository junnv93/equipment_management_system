/// <reference types="jest" />

import request from 'supertest';
import * as crypto from 'crypto';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { toTestPath } from './helpers/test-paths';

describe('EquipmentHistoryController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  let testEquipmentUuid: string;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
    testEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
      name: `History Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
    });
    tracker.track('equipment', testEquipmentUuid);
  });

  afterAll(async () => {
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  // ===================== 위치 변동 이력 테스트 =====================
  describe('Location History', () => {
    describe('POST /equipment/:uuid/location-history', () => {
      it('should create location history successfully', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: 'RF 시험실 A동 2층',
          notes: '정기 이동',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.newLocation).toBe(historyData.newLocation);
        expect(response.body.notes).toBe(historyData.notes);

        tracker.track('location-history', response.body.id);
      });

      it('should fail without required newLocation field', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });

      it('should fail without authentication', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: 'Test Location',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .send(historyData);

        expect(response.status).toBe(401);
      });
    });

    describe('GET /equipment/:uuid/location-history', () => {
      it('should get location history list', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
      });

      it('should return sorted by changedAt desc', async () => {
        const historyData1 = {
          changedAt: '2024-01-01',
          newLocation: '위치 1',
        };
        const historyData2 = {
          changedAt: '2024-06-01',
          newLocation: '위치 2',
        };

        const res1 = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData1);
        tracker.track('location-history', res1.body.id);

        const res2 = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData2);
        tracker.track('location-history', res2.body.id);

        const response = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);

        if (response.body.items.length >= 2) {
          const dates = response.body.items.map(
            (item: Record<string, unknown>) => new Date(item.changedAt as string).getTime(),
          );
          for (let i = 0; i < dates.length - 1; i++) {
            expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
          }
        }
      });
    });

    describe('DELETE /equipment/location-history/:historyId', () => {
      it('should delete location history', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: '삭제 테스트 위치',
        };

        const createResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(historyId)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });

      it('should return 404 for non-existent history', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const response = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(nonExistentId)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  // ===================== 유지보수 내역 테스트 =====================
  describe('Maintenance History', () => {
    describe('POST /equipment/:uuid/maintenance-history', () => {
      it('should create maintenance history successfully', async () => {
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
          content: '분기별 정기 점검 - 정상 동작 확인',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toBe(historyData.content);

        tracker.track('maintenance-history', response.body.id);
      });

      it('should fail without required content field', async () => {
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /equipment/:uuid/maintenance-history', () => {
      it('should get maintenance history list', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.LIST(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
      });
    });

    describe('DELETE /equipment/maintenance-history/:historyId', () => {
      it('should delete maintenance history', async () => {
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
          content: '삭제 테스트 유지보수',
        };

        const createResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.DELETE(historyId)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });
    });
  });

  // ===================== 손상/오작동/변경/수리 내역 테스트 =====================
  describe('Incident History', () => {
    describe('POST /equipment/:uuid/incident-history', () => {
      it('should create damage incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'damage',
          content: '전원부 손상 발견',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.incidentType).toBe('damage');
        expect(response.body.content).toBe(historyData.content);

        tracker.track('incident-history', response.body.id);
      });

      it('should create malfunction incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'malfunction',
          content: '측정값 오차 발생',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('malfunction');

        tracker.track('incident-history', response.body.id);
      });

      it('should create change incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'change',
          content: '펌웨어 업데이트 진행',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('change');

        tracker.track('incident-history', response.body.id);
      });

      it('should create repair incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'repair',
          content: '전원 보드 교체 완료',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('repair');

        tracker.track('incident-history', response.body.id);
      });

      it('should fail without required incidentType field', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          content: '테스트 내용',
        };

        const response = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /equipment/:uuid/incident-history', () => {
      it('should get incident history list', async () => {
        const response = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.LIST(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('items');
        expect(Array.isArray(response.body.items)).toBe(true);
      });
    });

    describe('DELETE /equipment/incident-history/:historyId', () => {
      it('should delete incident history', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'damage',
          content: '삭제 테스트 손상',
        };

        const createResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(testEquipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(historyId)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });
    });
  });

  // ===================== 통합 테스트 =====================
  describe('Integration: Full History Workflow', () => {
    it('should complete full history workflow for equipment', async () => {
      const equipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: `Integration History Test ${crypto.randomBytes(4).toString('hex')}`,
      });

      try {
        // 위치 변동 이력
        const locationResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            changedAt: '2024-01-15',
            newLocation: '초기 설치 위치',
            notes: '신규 장비 설치',
          });
        expect(locationResponse.status).toBe(201);

        // 유지보수 내역
        const maintenanceResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            performedAt: '2024-03-01',
            content: '설치 후 첫 점검 완료',
          });
        expect(maintenanceResponse.status).toBe(201);

        // 손상 이력
        const incidentResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            occurredAt: '2024-04-10',
            incidentType: 'damage',
            content: '외부 충격으로 인한 케이스 파손',
          });
        expect(incidentResponse.status).toBe(201);

        // 수리 이력
        const repairResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            occurredAt: '2024-04-15',
            incidentType: 'repair',
            content: '케이스 교체 완료',
          });
        expect(repairResponse.status).toBe(201);

        // 모든 이력 조회
        const locationHistoryResponse = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);
        expect(locationHistoryResponse.status).toBe(200);
        expect(locationHistoryResponse.body.items.length).toBeGreaterThanOrEqual(1);

        const maintenanceHistoryResponse = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.LIST(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);
        expect(maintenanceHistoryResponse.status).toBe(200);
        expect(maintenanceHistoryResponse.body.items.length).toBeGreaterThanOrEqual(1);

        const incidentHistoryResponse = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.LIST(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);
        expect(incidentHistoryResponse.status).toBe(200);
        expect(incidentHistoryResponse.body.items.length).toBeGreaterThanOrEqual(2);
      } finally {
        await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.EQUIPMENT.DELETE(equipmentUuid)))
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });
});
