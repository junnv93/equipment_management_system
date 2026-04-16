/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { generateUUID } from './helpers/test-utils';

describe('NonConformancesController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdNonConformanceIds: string[] = [];
  let testEquipmentUuid: string;
  const testUserId = TEST_USER_IDS.admin;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
    testEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
      name: 'E2E Test Equipment for Non-Conformances',
    });
    tracker.track('equipment', testEquipmentUuid);
  });

  afterAll(async () => {
    for (const ncId of createdNonConformanceIds) {
      tracker.track('non-conformance', ncId);
    }
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  describe('POST /non-conformances', () => {
    it('should create a new non-conformance', async () => {
      const createDto = {
        equipmentId: testEquipmentUuid,
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: testUserId,
        cause: 'E2E 테스트 부적합 원인',
        ncType: 'other',
        actionPlan: 'E2E 테스트 조치 계획',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('open');
      expect(response.body.equipmentId).toBe(testEquipmentUuid);
      expect(response.body.cause).toBe('E2E 테스트 부적합 원인');

      if (response.body.id) {
        createdNonConformanceIds.push(response.body.id);
      }
    });

    it('should reject creating non-conformance for already non-conforming equipment', async () => {
      const createDto = {
        equipmentId: testEquipmentUuid,
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: testUserId,
        cause: '중복 부적합 시도',
        ncType: 'other',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should reject invalid equipment UUID', async () => {
      const createDto = {
        equipmentId: 'invalid-uuid',
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: testUserId,
        cause: '잘못된 장비 UUID',
        ncType: 'other',
      };

      await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /non-conformances', () => {
    it('should return a list of non-conformances', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/non-conformances')
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
        .get(`/non-conformances?equipmentId=${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
      });
    });

    it('should filter by status', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/non-conformances?status=open')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('open');
      });
    });
  });

  describe('GET /non-conformances/:uuid', () => {
    it('should return a non-conformance by UUID', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const response = await request(ctx.app.getHttpServer())
          .get(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(ncId);
      }
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = generateUUID();
      await request(ctx.app.getHttpServer())
        .get(`/non-conformances/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /non-conformances/equipment/:equipmentUuid', () => {
    it('should return open non-conformances for equipment', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`/non-conformances/equipment/${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
        expect(item.status).toBe('open');
      });
    });
  });

  describe('PATCH /non-conformances/:uuid', () => {
    it('should update non-conformance correction and mark corrected', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const updateDto = {
          correctionContent: 'E2E 테스트 시정 조치 내용',
          status: 'corrected',
        };

        const response = await request(ctx.app.getHttpServer())
          .patch(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.correctionContent).toBe('E2E 테스트 시정 조치 내용');
      }
    });
  });

  describe('PATCH /non-conformances/:uuid/close', () => {
    it('should close a corrected non-conformance', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const closeDto = {
          closedBy: testUserId,
          closureNotes: 'E2E 테스트 종료 메모',
        };

        const response = await request(ctx.app.getHttpServer())
          .patch(`/non-conformances/${ncId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(closeDto)
          .expect(200);

        expect(response.body.status).toBe('closed');
        expect(response.body.closedBy).toBe(testUserId);
        expect(response.body.closureNotes).toBe('E2E 테스트 종료 메모');
      }
    });

    it('should reject closing an already closed non-conformance', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const closeDto = {
          closedBy: testUserId,
          closureNotes: '중복 종료 시도',
        };

        await request(ctx.app.getHttpServer())
          .patch(`/non-conformances/${ncId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(closeDto)
          .expect(400);
      }
    });
  });

  describe('DELETE /non-conformances/:uuid', () => {
    it('should soft delete a non-conformance', async () => {
      const deleteTestEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for NC Delete',
      });

      const createResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: deleteTestEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: 'E2E 삭제 테스트 부적합',
          ncType: 'other',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const ncId = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(deleteResponse.body.id).toBe(ncId);
        expect(deleteResponse.body.deleted).toBe(true);

        await request(ctx.app.getHttpServer())
          .get(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }

      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${deleteTestEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should return 404 when deleting non-existent non-conformance', async () => {
      const fakeUuid = generateUUID();
      await request(ctx.app.getHttpServer())
        .delete(`/non-conformances/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Non-conforming equipment rental/checkout blocking', () => {
    it('should block rental of non-conforming equipment', async () => {
      const blockTestEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for NC Block Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: blockTestEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: 'E2E 차단 테스트용 부적합',
          ncType: 'other',
        });

      if (ncResponse.status === 201) {
        const rentalResponse = await request(ctx.app.getHttpServer())
          .post('/rentals')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            equipmentId: blockTestEquipmentUuid,
            borrowerId: testUserId,
            expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            loanDate: new Date().toISOString().split('T')[0],
          });

        expect([400, 403]).toContain(rentalResponse.status);

        if (ncResponse.body.id) {
          await request(ctx.app.getHttpServer())
            .delete(`/non-conformances/${ncResponse.body.id}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }
      }

      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${blockTestEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });
  });

  describe('Non-conformance and Repair Workflow Integration', () => {
    let workflowTestEquipmentUuid: string;
    let workflowTestNcId: string;
    let workflowTestRepairId: string;

    beforeAll(async () => {
      workflowTestEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for Workflow',
      });
    });

    afterAll(async () => {
      if (ctx?.app && accessToken && workflowTestEquipmentUuid) {
        try {
          await request(ctx.app.getHttpServer())
            .delete(`/equipment/${workflowTestEquipmentUuid}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch {
          // 이미 삭제된 경우 무시
        }
      }
    });

    it('should require ncType when creating non-conformance', async () => {
      const createDto = {
        equipmentId: workflowTestEquipmentUuid,
        discoveryDate: new Date().toISOString().split('T')[0],
        discoveredBy: testUserId,
        cause: '부적합 원인',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should automatically mark non-conformance as corrected when repair is completed', async () => {
      const ncResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: workflowTestEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '센서 파손',
          ncType: 'damage',
        });

      expect(ncResponse.status).toBe(201);
      workflowTestNcId = ncResponse.body.id;
      expect(ncResponse.body.status).toBe('open');

      const equipmentCheck = await request(ctx.app.getHttpServer())
        .get(`/equipment/${workflowTestEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(equipmentCheck.body.status).toBe('non_conforming');

      const repairResponse = await request(ctx.app.getHttpServer())
        .post(`/equipment/${workflowTestEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '센서 교체 완료',
          repairedBy: '홍길동',
          repairResult: 'completed',
          nonConformanceId: workflowTestNcId,
        });

      expect(repairResponse.status).toBe(201);
      workflowTestRepairId = repairResponse.body.id;

      const ncCheck = await request(ctx.app.getHttpServer())
        .get(`/non-conformances/${workflowTestNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(ncCheck.body.status).toBe('corrected');
      expect(ncCheck.body.repairHistoryId).toBe(workflowTestRepairId);
      expect(ncCheck.body.resolutionType).toBe('repair');
    });

    it('should prevent closing damage type non-conformance without repair', async () => {
      const noRepairEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for No-Repair Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: noRepairEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '센서 파손 (수리 미등록)',
          ncType: 'damage',
        });

      const noRepairNcId = ncResponse.body.id;

      const updateResponse = await request(ctx.app.getHttpServer())
        .patch(`/non-conformances/${noRepairNcId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          correctedBy: testUserId,
        });

      if (updateResponse.status === 200) {
        const closeResponse = await request(ctx.app.getHttpServer())
          .patch(`/non-conformances/${noRepairNcId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closedBy: testUserId,
            closureNotes: '종료 시도',
          });

        expect(closeResponse.status).toBe(400);
        expect(closeResponse.body.message).toContain('수리');
      }

      await request(ctx.app.getHttpServer())
        .delete(`/non-conformances/${noRepairNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${noRepairEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking multiple repairs to one non-conformance (1:1 relationship)', async () => {
      const oneToOneEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for 1:1 Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: oneToOneEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '1:1 테스트용 부적합',
          ncType: 'malfunction',
        });

      const oneToOneNcId = ncResponse.body.id;

      const repair1Response = await request(ctx.app.getHttpServer())
        .post(`/equipment/${oneToOneEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '첫 번째 수리',
          repairResult: 'partial',
          nonConformanceId: oneToOneNcId,
        });

      expect(repair1Response.status).toBe(201);

      const repair2Response = await request(ctx.app.getHttpServer())
        .post(`/equipment/${oneToOneEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '두 번째 수리 시도',
          repairResult: 'completed',
          nonConformanceId: oneToOneNcId,
        });

      expect(repair2Response.status).toBe(400);

      await request(ctx.app.getHttpServer())
        .delete(`/non-conformances/${oneToOneNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${oneToOneEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking repair to closed non-conformance', async () => {
      const closedNcEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for Closed NC Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: closedNcEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '종료된 부적합 테스트',
          ncType: 'other',
        });

      const closedTestNcId = ncResponse.body.id;

      await request(ctx.app.getHttpServer())
        .patch(`/non-conformances/${closedTestNcId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          correctedBy: testUserId,
        });

      const closeResponse = await request(ctx.app.getHttpServer())
        .patch(`/non-conformances/${closedTestNcId}/close`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          closedBy: testUserId,
          closureNotes: '종료',
        });

      expect(closeResponse.status).toBe(200);

      const repairResponse = await request(ctx.app.getHttpServer())
        .post(`/equipment/${closedNcEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '종료된 부적합에 수리 시도',
          repairResult: 'completed',
          nonConformanceId: closedTestNcId,
        });

      expect(repairResponse.status).toBe(400);

      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${closedNcEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should restore equipment status to available after closing last non-conformance', async () => {
      if (workflowTestNcId) {
        const closeResponse = await request(ctx.app.getHttpServer())
          .patch(`/non-conformances/${workflowTestNcId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closedBy: testUserId,
            closureNotes: '워크플로우 테스트 완료',
          });

        expect(closeResponse.status).toBe(200);
        expect(closeResponse.body.status).toBe('closed');

        const equipmentCheck = await request(ctx.app.getHttpServer())
          .get(`/equipment/${workflowTestEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(equipmentCheck.body.status).toBe('available');
      }
    });
  });
});
