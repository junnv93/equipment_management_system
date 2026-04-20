/// <reference types="jest" />

import request from 'supertest';
import postgres from 'postgres';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs, TEST_USER_IDS } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';
import { ResourceTracker } from './helpers/test-cleanup';
import { getWorkerUniqueYear } from './helpers/test-isolation';
import { toTestPath } from './helpers/test-paths';

describe('CalibrationPlansController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdPlanIds: string[] = [];
  const tracker = new ResourceTracker();

  // 스키마 허용 연도 [2020, 2100]. 이 스펙은 base year에서 +1/+10/+11/+20/+30/+50 파생 사용.
  // getWorkerUniqueYear는 JEST_WORKER_ID + crypto.randomInt 조합으로
  // (a) worker 간 슬롯 격리 (b) 재실행 간 고유값을 보장.
  // 기존 "2030 + (Date.now()/1B % 70)" 방식은 ~11일 주기로만 변해 병렬 worker 충돌 및
  // TEST_YEAR + 100이 schema.max 초과하여 silent skip되던 버그를 동시 해결.
  const TEST_YEAR_MAX_DERIVATION = 50;
  const TEST_YEAR = getWorkerUniqueYear({ maxDerivation: TEST_YEAR_MAX_DERIVATION });
  const TEST_SITE = 'suwon';

  let adminToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    // technical_manager has CREATE_CALIBRATION_PLAN; lab_manager does not (직무분리)
    accessToken = await loginAs(ctx.app, 'manager');
    adminToken = await loginAs(ctx.app, 'admin');

    // 이전 실행 잔여 plan 정리 — (year, siteId) unique constraint 충돌 방지.
    // DELETE API는 draft 상태만 허용하므로, pending_review/approved 등으로 남은 경우 API가 작동하지 않음.
    // 테스트 격리를 위해 DB 직접 삭제 사용 (FK CASCADE로 plan_items도 삭제됨).
    //
    // 테스트 내부 파생 연도 범위: TEST_YEAR ~ TEST_YEAR + TEST_YEAR_MAX_DERIVATION.
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');
    const cleanupSql = postgres(databaseUrl);
    try {
      await cleanupSql`
        DELETE FROM calibration_plans
        WHERE year BETWEEN ${TEST_YEAR} AND ${TEST_YEAR + TEST_YEAR_MAX_DERIVATION}
          AND site_id = ${TEST_SITE}
      `;
    } finally {
      await cleanupSql.end();
    }

    // lab_manager(admin)만 직접 장비 생성 가능 — technical_manager는 승인 워크플로우 경유
    const equipmentId = await createTestEquipment(ctx.app, adminToken, {
      site: TEST_SITE,
      managementMethod: 'external_calibration',
      calibrationCycle: 12,
      lastCalibrationDate: new Date(`${TEST_YEAR - 1}-06-01`).toISOString(),
      nextCalibrationDate: new Date(`${TEST_YEAR}-06-01`).toISOString(),
      calibrationAgency: 'Test Agency',
    });
    tracker.track('equipment', equipmentId);
  });

  afterAll(async () => {
    for (const planUuid of createdPlanIds) {
      try {
        await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.DELETE(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`);
      } catch {
        // 무시
      }
    }
    await tracker.cleanupAll(ctx.app, accessToken);
    await closeTestApp(ctx?.app);
  });

  describe('/calibration-plans (POST)', () => {
    it('should create a new calibration plan', async () => {
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: TEST_USER_IDS.admin,
      };

      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('year', TEST_YEAR);
      expect(response.body).toHaveProperty('siteId', TEST_SITE);
      expect(response.body).toHaveProperty('status', 'draft');
      expect(response.body).toHaveProperty('items');

      createdPlanIds.push(response.body.id);
    });

    it('should not create duplicate plan for same year and site', async () => {
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: TEST_USER_IDS.admin,
      };

      await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData)
        .expect(409);
    });

    it('should not create plan without authentication', async () => {
      const planData = {
        year: TEST_YEAR + 1,
        siteId: TEST_SITE,
        createdBy: TEST_USER_IDS.admin,
      };

      await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .send(planData)
        .expect(401);
    });
  });

  describe('/calibration-plans (GET)', () => {
    it('should get calibration plans list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.LIST))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
      expect(response.body.meta).toHaveProperty('itemsPerPage');
      expect(response.body.meta).toHaveProperty('totalPages');
    });

    it('should get calibration plans with year filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.LIST)}?year=${TEST_YEAR}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.year).toBe(TEST_YEAR);
      });
    });

    it('should get calibration plans with siteId filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.LIST)}?siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.siteId).toBe(TEST_SITE);
      });
    });

    it('should get calibration plans with status filter', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.LIST)}?status=draft`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('draft');
      });
    });
  });

  describe('/calibration-plans/:uuid (GET)', () => {
    it('should get calibration plan by uuid with items', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', planUuid);
      expect(response.body).toHaveProperty('year');
      expect(response.body).toHaveProperty('siteId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('should return 404 for non-existent plan', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(nonExistentUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/calibration-plans/:uuid/submit (POST)', () => {
    it('should submit plan for review (draft -> pending_review)', async () => {
      // 3단계 승인 플로우: TM이 submit → pending_review (QM 검토 요청).
      // 기존 2단계(→pending_approval)에서 변경됨. submit은 submitForReview의 deprecated alias.
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('status', 'pending_review');
      } else {
        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('/calibration-plans/:uuid/approve (PATCH)', () => {
    it('should approve plan (pending_review → review → approved, full chain)', async () => {
      // 3단계 플로우: plan이 pending_review 상태라면 먼저 review해야 approve 가능.
      // 이전 submit 테스트가 plan을 pending_review로 만들어두었으므로 여기서 review → approve.
      // CAS: review/approve는 casVersion 필수 (optimistic locking).
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);

      // pending_review → pending_approval
      // 주의: plan 스키마는 casVersion 필드 사용 (일반 version 아님).
      if (planResponse.body.status === 'pending_review') {
        const reviewResp = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(planUuid)))
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ casVersion: planResponse.body.casVersion });
        expect(reviewResp.status).toBe(200);
        expect(reviewResp.body.status).toBe('pending_approval');
      }

      // pending_approval → approved
      const latest = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);
      if (latest.body.status === 'pending_approval') {
        const response = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(planUuid)))
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ casVersion: latest.body.casVersion });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'approved');
      }
    });
  });

  describe('/calibration-plans/:uuid/reject (PATCH)', () => {
    it('should require rejection reason', async () => {
      const newYear = TEST_YEAR + 10;
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: TEST_USER_IDS.admin,
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(planUuid)))
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ rejectedBy: TEST_USER_IDS.admin });

        expect(rejectResponse.status).toBe(400);
      }
    });

    it('should reject plan with reason', async () => {
      const newYear = TEST_YEAR + 11;
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: TEST_USER_IDS.admin,
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        const submitResp = await request(ctx.app.getHttpServer())
          .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        // reject DTO는 casVersion 필수 (plan 스키마는 casVersion 필드 사용).
        const rejectResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.REJECT(planUuid)))
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            casVersion: submitResp.body.casVersion,
            rejectionReason: '계획서 내용 수정 필요',
          });

        expect(rejectResponse.status).toBe(200);
        expect(rejectResponse.body).toHaveProperty('status', 'rejected');
        expect(rejectResponse.body).toHaveProperty('rejectionReason', '계획서 내용 수정 필요');
      }
    });
  });

  describe('/calibration-plans/:uuid (DELETE)', () => {
    it('should delete plan only in draft status', async () => {
      const newYear = TEST_YEAR + 20;
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: TEST_USER_IDS.admin,
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;

        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.DELETE(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('deleted', true);

        await request(ctx.app.getHttpServer())
          .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should not delete plan in non-draft status', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status !== 'draft') {
        const deleteResponse = await request(ctx.app.getHttpServer())
          .delete(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.DELETE(planUuid)))
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/equipment/external (GET)', () => {
    it('should get external calibration equipment list', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXTERNAL_EQUIPMENT))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('managementNumber');
      }
    });

    it('should filter external equipment by year and siteId', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXTERNAL_EQUIPMENT)}?year=${TEST_YEAR}&siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      response.body.forEach((item: Record<string, unknown>) => {
        expect(item.site).toBe(TEST_SITE);
      });
    });

    it('should apply @SiteScoped and auto-inject siteId for test_engineer token', async () => {
      let teToken: string;
      try {
        teToken = await loginAs(ctx.app, 'user');
      } catch {
        return;
      }

      // test_engineer doesn't have VIEW_CALIBRATION_PLANS permission → 403
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXTERNAL_EQUIPMENT))
        .set('Authorization', `Bearer ${teToken}`);

      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(Array.isArray(response.body)).toBe(true);
        response.body.forEach((item: Record<string, unknown>) => {
          expect(['suwon', 'uiwang', 'pyeongtaek']).toContain(item.site);
        });
      }
    });
  });

  describe('/calibration-plans/:uuid/items/:itemUuid/confirm (PATCH)', () => {
    it('should confirm item only in approved plan', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const planResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status === 'approved' && planResponse.body.items?.length > 0) {
        const itemUuid = planResponse.body.items[0].id;

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ITEM(planUuid, itemUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: TEST_USER_IDS.manager });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
        expect(confirmResponse.body).toHaveProperty('confirmedAt');
      }
    });

    it('should not confirm item in non-approved plan', async () => {
      const newYear = TEST_YEAR + 30;
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: TEST_USER_IDS.admin,
        });

      if (createResponse.status === 201 && createResponse.body.items?.length > 0) {
        const planUuid = createResponse.body.id;
        const itemUuid = createResponse.body.items[0].id;
        createdPlanIds.push(planUuid);

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ITEM(planUuid, itemUuid)))
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: TEST_USER_IDS.manager });

        expect(confirmResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/:uuid/export (GET)', () => {
    // 엔드포인트 리네임: /pdf → /export (현재 컨트롤러 @Get(':uuid/export'))
    it('should export plan document (xlsx or 404 if template missing)', async () => {
      if (createdPlanIds.length === 0) {
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXPORT(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);

      // 200(성공) 또는 404(양식 템플릿 파일 누락 — form-template.service의 graceful ENOENT 처리).
      // 500은 허용하지 않음: 서버 에러는 실제 버그.
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['content-type']).toBeDefined();
      } else {
        // 404면 의미있는 에러 코드 반환
        expect(response.body.code).toBe('FORM_TEMPLATE_NOT_FOUND');
      }
    });

    it('should return 404 for non-existent plan export', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXPORT(nonExistentUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should complete full 3-stage approval workflow (draft → review → approval → approved)', async () => {
      // UL-QP-18 3단계 승인 플로우:
      //   1. TM(기술책임자): draft → pending_review (submit)
      //   2. QM/LM(품질·시험소장): pending_review → pending_approval (review)
      //   3. LM(시험소장): pending_approval → approved (approve)
      // admin(lab_manager)는 REVIEW_CALIBRATION_PLAN + APPROVE_CALIBRATION_PLAN 모두 보유.
      // TEST_YEAR + 30: 헬퍼의 maxDerivation 제한 내 (schema year max 준수 보장).
      const newYear = TEST_YEAR + TEST_YEAR_MAX_DERIVATION;
      const createResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CREATE))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: TEST_USER_IDS.admin,
        });

      expect(createResponse.status).toBe(201);

      const planUuid = createResponse.body.id;
      createdPlanIds.push(planUuid);

      expect(createResponse.body.status).toBe('draft');

      const readResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.GET(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(planUuid);

      // Stage 1: TM submits → pending_review
      const submitResponse = await request(ctx.app.getHttpServer())
        .post(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.SUBMIT(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      expect([200, 201]).toContain(submitResponse.status);
      expect(submitResponse.body.status).toBe('pending_review');

      // Stage 2: QM/LM reviews → pending_approval (CAS: casVersion 필수)
      // plan 스키마는 casVersion 필드 사용 (version 아님).
      const reviewResponse = await request(ctx.app.getHttpServer())
        .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.REVIEW(planUuid)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ casVersion: submitResponse.body.casVersion });

      expect(reviewResponse.status).toBe(200);
      expect(reviewResponse.body.status).toBe('pending_approval');

      // Stage 3: LM approves → approved (CAS: casVersion 필수)
      const approveResponse = await request(ctx.app.getHttpServer())
        .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.APPROVE(planUuid)))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ casVersion: reviewResponse.body.casVersion });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.status).toBe('approved');

      if (approveResponse.body.items?.length > 0) {
        const itemUuid = approveResponse.body.items[0].id;

        const confirmResponse = await request(ctx.app.getHttpServer())
          .patch(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.CONFIRM_ITEM(planUuid, itemUuid)))
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ confirmedBy: TEST_USER_IDS.manager });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
      }

      // Export 엔드포인트는 /export (리네임됨). 양식 템플릿 파일 누락 시 404.
      const exportResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.CALIBRATION_PLANS.EXPORT(planUuid)))
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 404]).toContain(exportResponse.status);
      if (exportResponse.status === 200) {
        expect(exportResponse.headers['content-type']).toBeDefined();
      }
    });
  });
});
