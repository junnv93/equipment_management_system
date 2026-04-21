/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /non-conformances', () => {
    it('should return a list of non-conformances', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.LIST)
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
        .get(`${API_ENDPOINTS.NON_CONFORMANCES.LIST}?equipmentId=${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
      });
    });

    it('should filter by status', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${API_ENDPOINTS.NON_CONFORMANCES.LIST}?status=open`)
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
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncId))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(ncId);
      }
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = generateUUID();
      await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(fakeUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /non-conformances/equipment/:equipmentUuid', () => {
    it('should return open non-conformances for equipment', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.EQUIPMENT(testEquipmentUuid))
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

        // GET current version for CAS
        const current = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncId))
          .set('Authorization', `Bearer ${accessToken}`);

        const updateDto = {
          correctionContent: 'E2E 테스트 시정 조치 내용',
          status: 'corrected',
          version: current.body.version,
        };

        const response = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.NON_CONFORMANCES.UPDATE(ncId))
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

        // GET current version for CAS
        const current = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncId))
          .set('Authorization', `Bearer ${accessToken}`);

        const closeDto = {
          closureNotes: 'E2E 테스트 종료 메모',
          version: current.body.version,
        };

        const response = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(ncId))
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

        // GET current version for CAS
        const current = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncId))
          .set('Authorization', `Bearer ${accessToken}`);

        const closeDto = {
          closureNotes: '중복 종료 시도',
          version: current.body.version,
        };

        await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(ncId))
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
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
        const ncVersion = createResponse.body.version;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(`${API_ENDPOINTS.NON_CONFORMANCES.DELETE(ncId)}?version=${ncVersion}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(deleteResponse.body.id).toBe(ncId);
        expect(deleteResponse.body.deleted).toBe(true);

        await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncId))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(deleteTestEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should return 404 when deleting non-existent non-conformance', async () => {
      const fakeUuid = generateUUID();
      await request(ctx.app.getHttpServer())
        .delete(`${API_ENDPOINTS.NON_CONFORMANCES.DELETE(fakeUuid)}?version=1`)
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: blockTestEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: 'E2E 차단 테스트용 부적합',
          ncType: 'other',
        });

      if (ncResponse.status === 201) {
        // /checkouts: NC 장비는 체크아웃 차단(400 BadRequestException) 또는 403 권한 거부
        const checkoutResponse = await request(ctx.app.getHttpServer())
          .post(API_ENDPOINTS.CHECKOUTS.CREATE)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            equipmentIds: [blockTestEquipmentUuid],
            type: 'calibration',
            reason: 'NC 차단 테스트 체크아웃',
            expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          });

        expect([400, 403]).toContain(checkoutResponse.status);

        if (ncResponse.body.id) {
          const ncDetail = await request(ctx.app.getHttpServer())
            .get(API_ENDPOINTS.NON_CONFORMANCES.GET(ncResponse.body.id))
            .set('Authorization', `Bearer ${accessToken}`);
          await request(ctx.app.getHttpServer())
            .delete(`${API_ENDPOINTS.NON_CONFORMANCES.DELETE(ncResponse.body.id)}?version=${ncDetail.body.version}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }
      }

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(blockTestEquipmentUuid))
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
            .delete(API_ENDPOINTS.EQUIPMENT.DELETE(workflowTestEquipmentUuid))
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should automatically mark non-conformance as corrected when repair is completed', async () => {
      const ncResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
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
        .get(API_ENDPOINTS.EQUIPMENT.GET(workflowTestEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(equipmentCheck.body.status).toBe('non_conforming');

      const repairResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.REPAIR_HISTORY.CREATE(workflowTestEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '센서 교체 완료 — 파손 부품 교체 작업',
          repairResult: 'completed',
          nonConformanceId: workflowTestNcId,
        });

      expect(repairResponse.status).toBe(201);
      workflowTestRepairId = repairResponse.body.id;

      const ncCheck = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(workflowTestNcId))
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
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: noRepairEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '센서 파손 (수리 미등록)',
          ncType: 'damage',
        });

      const noRepairNcId = ncResponse.body.id;

      // GET current version for CAS
      const noRepairCurrent = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(noRepairNcId))
        .set('Authorization', `Bearer ${accessToken}`);

      const updateResponse = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.NON_CONFORMANCES.UPDATE(noRepairNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          version: noRepairCurrent.body.version,
        });

      if (updateResponse.status === 200) {
        const closeResponse = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(noRepairNcId))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closureNotes: '종료 시도',
            version: updateResponse.body.version,
          });

        expect(closeResponse.status).toBe(400);
        expect(closeResponse.body.message).toContain('수리');
      }

      // GET latest version before delete
      const noRepairLatest = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(noRepairNcId))
        .set('Authorization', `Bearer ${accessToken}`);
      await request(ctx.app.getHttpServer())
        .delete(`${API_ENDPOINTS.NON_CONFORMANCES.DELETE(noRepairNcId)}?version=${noRepairLatest.body.version}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(noRepairEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking multiple repairs to one non-conformance (1:1 relationship)', async () => {
      const oneToOneEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for 1:1 Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
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
        .post(API_ENDPOINTS.EQUIPMENT.REPAIR_HISTORY.CREATE(oneToOneEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '첫 번째 수리 — 부품 교체 작업', // min(10) 준수
          repairResult: 'partial',
          nonConformanceId: oneToOneNcId,
        });

      expect(repair1Response.status).toBe(201);

      const repair2Response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.REPAIR_HISTORY.CREATE(oneToOneEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '두 번째 수리 시도',
          repairResult: 'completed',
          nonConformanceId: oneToOneNcId,
        });

      expect(repair2Response.status).toBe(400);

      const oneToOneLatest = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(oneToOneNcId))
        .set('Authorization', `Bearer ${accessToken}`);
      await request(ctx.app.getHttpServer())
        .delete(`${API_ENDPOINTS.NON_CONFORMANCES.DELETE(oneToOneNcId)}?version=${oneToOneLatest.body.version}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(oneToOneEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking repair to closed non-conformance', async () => {
      const closedNcEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Test Equipment for Closed NC Test',
      });

      const ncResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: closedNcEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: '종료된 부적합 테스트',
          ncType: 'other',
        });

      const closedTestNcId = ncResponse.body.id;

      // GET current version for CAS
      const closedTestCurrent = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.GET(closedTestNcId))
        .set('Authorization', `Bearer ${accessToken}`);

      const updateForClose = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.NON_CONFORMANCES.UPDATE(closedTestNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          version: closedTestCurrent.body.version,
        });

      const closeResponse = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(closedTestNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          closureNotes: '종료',
          version: updateForClose.body.version,
        });

      expect(closeResponse.status).toBe(200);

      const repairResponse = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.REPAIR_HISTORY.CREATE(closedNcEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '종료된 부적합에 수리 시도',
          repairResult: 'completed',
          nonConformanceId: closedTestNcId,
        });

      expect(repairResponse.status).toBe(400);

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(closedNcEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should restore equipment status to available after closing last non-conformance', async () => {
      if (workflowTestNcId) {
        // GET current version for CAS
        const wfCurrent = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.NON_CONFORMANCES.GET(workflowTestNcId))
          .set('Authorization', `Bearer ${accessToken}`);

        const closeResponse = await request(ctx.app.getHttpServer())
          .patch(API_ENDPOINTS.NON_CONFORMANCES.CLOSE(workflowTestNcId))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closureNotes: '워크플로우 테스트 완료',
            version: wfCurrent.body.version,
          });

        expect(closeResponse.status).toBe(200);
        expect(closeResponse.body.status).toBe('closed');

        const equipmentCheck = await request(ctx.app.getHttpServer())
          .get(API_ENDPOINTS.EQUIPMENT.GET(workflowTestEquipmentUuid))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(equipmentCheck.body.status).toBe('available');
      }
    });
  });

  // ============================================================================
  // Attachments (P2-A 전용 엔드포인트 — UPLOAD/DELETE_NON_CONFORMANCE_ATTACHMENT)
  // ============================================================================
  describe('Attachments', () => {
    let attachNcId: string;
    let attachEquipmentUuid: string;
    let uploadedDocId: string | undefined;

    // 최소 유효 JPEG magic bytes — FileUploadService 파일 내용 검증 통과용
    // JPEG SOI(FF D8 FF E0) + APP0 marker + minimal JFIF header
    const MINIMAL_JPEG = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
    ]);

    beforeAll(async () => {
      // 독립 equipment + NC — 다른 테스트와 격리
      attachEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
        name: 'E2E Attachments Equipment',
      });
      tracker.track('equipment', attachEquipmentUuid);

      const createRes = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: attachEquipmentUuid,
          discoveryDate: new Date().toISOString().split('T')[0],
          discoveredBy: testUserId,
          cause: 'Attachment flow test',
          ncType: 'damage',
        });
      expect(createRes.status).toBe(201);
      attachNcId = createRes.body.id;
      createdNonConformanceIds.push(attachNcId);
    });

    it('GET /non-conformances/:id/attachments — 초기 상태: 빈 배열', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('POST /non-conformances/:id/attachments — 사진 업로드 → 200 + document', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('documentType', 'equipment_photo')
        .field('description', 'E2E test photo')
        .attach('file', MINIMAL_JPEG, {
          filename: 'site.jpg',
          contentType: 'image/jpeg',
        });

      expect(response.status).toBe(201);
      expect(response.body.document).toBeDefined();
      expect(response.body.document.nonConformanceId).toBe(attachNcId);
      uploadedDocId = response.body.document.id;
    });

    it('GET /non-conformances/:id/attachments — 업로드 후 1개 조회', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(uploadedDocId);
    });

    it('POST /non-conformances/:id/attachments — 파일 없으면 400', async () => {
      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('documentType', 'equipment_photo');

      expect(response.status).toBe(400);
    });

    it('DELETE /non-conformances/:id/attachments/:docId — 소프트 삭제 → 200', async () => {
      if (!uploadedDocId) throw new Error('uploadedDocId missing — previous test must pass first');

      const response = await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENT(attachNcId, uploadedDocId))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);

      // 재조회 시 빈 배열(soft-delete → status='deleted'는 findByNonConformanceId 필터링됨)
      const afterDelete = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(afterDelete.body).toHaveLength(0);
    });

    it('DELETE /non-conformances/:otherId/attachments/:docId — 다른 NC의 문서는 400 (도메인 격리)', async () => {
      // 1) 새 문서 업로드
      const uploadRes = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENTS(attachNcId))
        .set('Authorization', `Bearer ${accessToken}`)
        .field('documentType', 'equipment_photo')
        .attach('file', MINIMAL_JPEG, { filename: 'x.jpg', contentType: 'image/jpeg' });
      const newDocId = uploadRes.body.document.id;

      // 2) 다른 NC id로 삭제 시도 → 400
      const otherId = generateUUID();
      const deleteRes = await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.NON_CONFORMANCES.ATTACHMENT(otherId, newDocId))
        .set('Authorization', `Bearer ${accessToken}`);

      // 다른 NC가 존재하지 않으면 findOneBasic에서 404 일수 있음.
      // 존재하지만 소유가 다르면 400 (DOCUMENT_OWNER_MISMATCH).
      expect([400, 404]).toContain(deleteRes.status);
    });
  });
});
