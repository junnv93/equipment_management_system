/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { toTestPath } from './helpers/test-paths';

describe('CheckoutsController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdCheckoutIds: string[] = [];
  let testEquipmentUuid: string;
  const testApproverId = TEST_USER_IDS.admin;
  const tracker = new ResourceTracker();

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
    testEquipmentUuid = await createTestEquipment(ctx.app, accessToken, {
      name: 'E2E Test Equipment for Checkout',
    });
    tracker.track('equipment', testEquipmentUuid);
  });

  afterAll(async () => {
    for (const checkoutId of createdCheckoutIds) {
      tracker.track('checkout', checkoutId);
    }
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  describe('POST /checkouts', () => {
    it('should create a new checkout request', async () => {
      const createCheckoutDto = {
        equipmentIds: [testEquipmentUuid],
        purpose: 'calibration',
        destination: 'E2E 테스트 교정기관',
        reason: 'E2E 테스트를 위한 반출 신청',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCheckoutDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
      expect(response.body.purpose).toBe('calibration');

      if (response.body.id) {
        createdCheckoutIds.push(response.body.id);
      }
    });

    it('should reject checkout request with invalid equipment UUID', async () => {
      const createCheckoutDto = {
        equipmentIds: ['invalid-uuid'],
        purpose: 'calibration',
        destination: 'Test',
        reason: 'Invalid UUID test',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCheckoutDto)
        .expect(400);
    });
  });

  describe('GET /checkouts', () => {
    it('should return a list of checkouts', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CHECKOUTS.LIST))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should filter checkouts by purpose', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${toTestPath(API_ENDPOINTS.CHECKOUTS.LIST)}?purpose=calibration`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(
        response.body.items.every(
          (item: Record<string, unknown>) => item.purpose === 'calibration',
        ),
      ).toBe(true);
    });
  });

  describe('GET /checkouts/:uuid', () => {
    it('should return a checkout by UUID', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'repair',
          destination: 'E2E 테스트 수리점',
          reason: 'E2E 상세 조회 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const response = await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.CHECKOUTS.GET(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(checkoutUuid);
        expect(response.body.purpose).toBe('repair');
      }
    });

    it('should return 404 for non-existent checkout UUID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CHECKOUTS.GET(fakeUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /checkouts/:uuid/approve', () => {
    it('should approve first (internal purpose - calibration)', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'calibration',
          destination: 'E2E 테스트 교정기관',
          reason: 'E2E 1차 승인 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const approveResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.APPROVE(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
        expect(approveResponse.body.approverId).toBe(testApproverId);
      }
    });

    it('should approve checkout (external rental)', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'rental',
          destination: 'E2E 테스트 외부 대여처',
          reason: 'E2E 2단계 승인 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const approveResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.APPROVE(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
        expect(approveResponse.body.approverId).toBe(testApproverId);
      }
    });
  });

  describe('PATCH /checkouts/:uuid/approve (unified)', () => {
    it('should approve checkout (unified approval)', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'rental',
          destination: 'E2E 테스트 외부 대여처',
          reason: 'E2E 최종 승인 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const approveResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.APPROVE(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
        expect(approveResponse.body.approverId).toBe(testApproverId);
      }
    });
  });

  describe('PATCH /checkouts/:uuid/reject', () => {
    it('should reject checkout with reason', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'calibration',
          destination: 'E2E 테스트 교정기관',
          reason: 'E2E 반려 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.REJECT(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
            reason: 'E2E 테스트를 위한 반려 사유',
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
        expect(rejectResponse.body.rejectionReason).toBe('E2E 테스트를 위한 반려 사유');
      }
    });

    it('should reject checkout rejection without reason', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'calibration',
          destination: 'E2E 테스트 교정기관',
          reason: 'E2E 반려 사유 필수 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.REJECT(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(400);
      }
    });
  });

  describe('POST /checkouts/:uuid/return', () => {
    it('should return checkout with inspection', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'calibration',
          destination: 'E2E 테스트 교정기관',
          reason: 'E2E 반입 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.APPROVE(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.CHECKOUTS.START(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201);

        // RETURN 경로는 SSOT 경유 (POST 메서드는 현상 유지 — HTTP 메서드 불일치 tech-debt)
        const returnResponse = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.CHECKOUTS.RETURN(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            calibrationChecked: true,
            workingStatusChecked: true,
            inspectionNotes: 'E2E 테스트: 교정 완료, 정상 작동 확인',
          })
          .expect(201);

        expect(returnResponse.body.status).toBe('returned');
        expect(returnResponse.body.calibrationChecked).toBe(true);
        expect(returnResponse.body.workingStatusChecked).toBe(true);
        expect(returnResponse.body.actualReturnDate).toBeDefined();
      }
    });
  });

  describe('PATCH /checkouts/:uuid/cancel', () => {
    it('should cancel a pending checkout', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CHECKOUTS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentIds: [testEquipmentUuid],
          purpose: 'calibration',
          destination: 'E2E 테스트 교정기관',
          reason: 'E2E 취소 테스트',
          expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const checkoutUuid = createResponse.body.id;
        createdCheckoutIds.push(checkoutUuid);

        const cancelResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CHECKOUTS.CANCEL(checkoutUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(cancelResponse.body.status).toBe('canceled');
      }
    });
  });
});
