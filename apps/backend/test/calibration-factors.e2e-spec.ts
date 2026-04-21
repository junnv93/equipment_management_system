/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';

describe('CalibrationFactorsController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdFactorIds: string[] = [];
  let testEquipmentUuid: string;
  const testUserId = TEST_USER_IDS.admin;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
    testEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
      name: 'E2E Test Equipment for Calibration Factors',
    });
    tracker.track('equipment', testEquipmentUuid);
  });

  afterAll(async () => {
    for (const factorId of createdFactorIds) {
      tracker.track('calibration-factor', factorId);
    }
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  describe('POST /calibration-factors', () => {
    it('should create a new calibration factor request', async () => {
      const createDto = {
        equipmentId: testEquipmentUuid,
        factorType: 'antenna_gain',
        factorName: 'E2E 테스트 안테나 이득',
        factorValue: 12.5,
        unit: 'dBi',
        effectiveDate: new Date().toISOString().split('T')[0],
        requestedBy: testUserId,
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.approvalStatus).toBe('pending');
      expect(response.body.equipmentId).toBe(testEquipmentUuid);
      expect(response.body.factorType).toBe('antenna_gain');
      expect(response.body.factorName).toBe('E2E 테스트 안테나 이득');

      if (response.body.id) {
        createdFactorIds.push(response.body.id);
      }
    });

    it('should create calibration factor with parameters', async () => {
      const createDto = {
        equipmentId: testEquipmentUuid,
        factorType: 'cable_loss',
        factorName: 'E2E 테스트 케이블 손실',
        factorValue: 2.3,
        unit: 'dB',
        effectiveDate: new Date().toISOString().split('T')[0],
        parameters: { length: '10m', frequency: '1GHz' },
        requestedBy: testUserId,
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body.parameters).toEqual(createDto.parameters);

      if (response.body.id) {
        createdFactorIds.push(response.body.id);
      }
    });

    it('should reject invalid factor type', async () => {
      const createDto = {
        equipmentId: testEquipmentUuid,
        factorType: 'invalid_type',
        factorName: '잘못된 타입',
        factorValue: 1.0,
        unit: 'dB',
        effectiveDate: new Date().toISOString().split('T')[0],
        requestedBy: testUserId,
      };

      await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /calibration-factors', () => {
    it('should return a list of calibration factors', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CALIBRATION_FACTORS.LIST)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should filter by equipmentId', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${API_ENDPOINTS.CALIBRATION_FACTORS.LIST}?equipmentId=${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
      });
    });

    it('should filter by approvalStatus', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${API_ENDPOINTS.CALIBRATION_FACTORS.LIST}?approvalStatus=pending`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.approvalStatus).toBe('pending');
      });
    });
  });

  describe('GET /calibration-factors/pending', () => {
    it('should return pending calibration factors', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CALIBRATION_FACTORS.PENDING)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.approvalStatus).toBe('pending');
      });
    });
  });

  describe('GET /calibration-factors/registry', () => {
    it('should return calibration factor registry', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CALIBRATION_FACTORS.REGISTRY)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('registry');
      expect(response.body).toHaveProperty('totalEquipments');
      expect(response.body).toHaveProperty('totalFactors');
      expect(response.body).toHaveProperty('generatedAt');
      expect(Array.isArray(response.body.registry)).toBe(true);
    });
  });

  describe('GET /calibration-factors/equipment/:equipmentUuid', () => {
    it('should return factors for specific equipment', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CALIBRATION_FACTORS.EQUIPMENT(testEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('equipmentId');
      expect(response.body).toHaveProperty('factors');
      expect(response.body).toHaveProperty('count');
      expect(response.body.equipmentId).toBe(testEquipmentUuid);
      expect(Array.isArray(response.body.factors)).toBe(true);
    });
  });

  describe('GET /calibration-factors/:uuid', () => {
    it('should return a calibration factor by UUID', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          factorType: 'path_loss',
          factorName: 'E2E 상세 조회 테스트',
          factorValue: 5.0,
          unit: 'dB',
          effectiveDate: new Date().toISOString().split('T')[0],
          requestedBy: testUserId,
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const factorId = createResponse.body.id;
        createdFactorIds.push(factorId);

        const response = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.CALIBRATION_FACTORS.GET(factorId))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(factorId);
        expect(response.body.factorName).toBe('E2E 상세 조회 테스트');
      }
    });

    it('should return 404 for non-existent factor UUID', async () => {
      const fakeUuid = '00000000-0000-4000-8000-000000000000';
      await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.CALIBRATION_FACTORS.GET(fakeUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /calibration-factors/:uuid/approve', () => {
    it('should approve a pending calibration factor', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          factorType: 'amplifier_gain',
          factorName: 'E2E 승인 테스트',
          factorValue: 20.0,
          unit: 'dB',
          effectiveDate: new Date().toISOString().split('T')[0],
          requestedBy: testUserId,
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const factorId = createResponse.body.id;
        createdFactorIds.push(factorId);

        const approveResponse = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.CALIBRATION_FACTORS.APPROVE(factorId))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverComment: 'E2E 테스트 승인 완료',
            version: createResponse.body.version,
          })
          .expect(200);

        expect(approveResponse.body.approvalStatus).toBe('approved');
        expect(approveResponse.body.approvedBy).toBe(testUserId);
        expect(approveResponse.body.approverComment).toBe('E2E 테스트 승인 완료');
      }
    });
  });

  describe('PATCH /calibration-factors/:uuid/reject', () => {
    it('should reject a pending calibration factor with reason', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          factorType: 'other',
          factorName: 'E2E 반려 테스트',
          factorValue: 1.0,
          unit: 'dB',
          effectiveDate: new Date().toISOString().split('T')[0],
          requestedBy: testUserId,
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const factorId = createResponse.body.id;
        createdFactorIds.push(factorId);

        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.CALIBRATION_FACTORS.REJECT(factorId))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            rejectionReason: 'E2E 테스트 반려 사유',
            version: createResponse.body.version,
          })
          .expect(200);

        expect(rejectResponse.body.approvalStatus).toBe('rejected');
        expect(rejectResponse.body.approverComment).toBe('E2E 테스트 반려 사유');
      }
    });

    it('should reject factor rejection without reason', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          factorType: 'cable_loss',
          factorName: 'E2E 반려 사유 필수 테스트',
          factorValue: 1.5,
          unit: 'dB',
          effectiveDate: new Date().toISOString().split('T')[0],
          requestedBy: testUserId,
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const factorId = createResponse.body.id;
        createdFactorIds.push(factorId);

        await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.CALIBRATION_FACTORS.REJECT(factorId))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            version: createResponse.body.version,
          })
          .expect(400);
      }
    });
  });

  describe('DELETE /calibration-factors/:uuid', () => {
    it('should soft delete a calibration factor', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CALIBRATION_FACTORS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          factorType: 'antenna_gain',
          factorName: 'E2E 삭제 테스트',
          factorValue: 10.0,
          unit: 'dBi',
          effectiveDate: new Date().toISOString().split('T')[0],
          requestedBy: testUserId,
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const factorId = createResponse.body.id;
        const factorVersion = createResponse.body.version;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(`${API_ENDPOINTS.CALIBRATION_FACTORS.DELETE(factorId)}?version=${factorVersion}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(deleteResponse.body.id).toBe(factorId);
        expect(deleteResponse.body.deleted).toBe(true);

        await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.CALIBRATION_FACTORS.GET(factorId))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });
  });
});
