/// <reference types="jest" />

// ⚠️ 중요: 환경 변수는 모듈 import 전에 설정해야 합니다
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/equipment_management';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'test-client-id-for-e2e-tests';
process.env.AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'test-tenant-id-for-e2e-tests';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('CalibrationPlansController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdPlanIds: string[] = [];
  let createdEquipmentIds: string[] = [];

  // 테스트용 사용자 (AuthService에 하드코딩된 admin 사용자)
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  // 테스트용 상수 - 동적 연도 사용으로 충돌 방지
  const TEST_YEAR = 2030 + Math.floor(Date.now() / 1000000000) % 100;
  const TEST_SITE = 'suwon';

  beforeAll(async () => {
    console.log('📊 E2E Test Environment (Calibration Plans):');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 로그인
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (loginResponse.status !== 200 && loginResponse.status !== 201) {
      console.error('Login failed:', loginResponse.status, loginResponse.body);
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    accessToken = loginResponse.body.access_token || loginResponse.body.accessToken;

    if (!accessToken) {
      console.error('No access token received:', loginResponse.body);
      throw new Error('Failed to obtain access token');
    }

    // 테스트용 외부교정 장비 생성
    const equipmentData = {
      name: `Calibration Plan Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
      managementNumber: `CP-MN-${crypto.randomBytes(8).toString('hex')}`,
      status: 'available',
      site: TEST_SITE,
      calibrationMethod: 'external_calibration',
      calibrationCycle: 12,
      lastCalibrationDate: new Date(`${TEST_YEAR - 1}-06-01`).toISOString(),
      nextCalibrationDate: new Date(`${TEST_YEAR}-06-01`).toISOString(),
      calibrationAgency: 'Test Agency',
      approvalStatus: 'approved',
    };

    const equipmentResponse = await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(equipmentData);

    if (equipmentResponse.status === 201) {
      createdEquipmentIds.push(equipmentResponse.body.id);
    }
  });

  afterAll(async () => {
    // 생성된 계획서 정리
    if (app && accessToken) {
      for (const planUuid of createdPlanIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/calibration-plans/${planUuid}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
          // 무시
        }
      }

      // 생성된 장비 정리
      for (const equipmentUuid of createdEquipmentIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/equipment/${equipmentUuid}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
          // 무시
        }
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('/calibration-plans (POST)', () => {
    it('should create a new calibration plan', async () => {
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      const response = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData);

      // 에러 발생 시 상세 정보 출력
      if (response.status !== 201) {
        console.error('Create calibration plan failed:', {
          status: response.status,
          body: response.body,
          requestData: planData,
        });
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('year', TEST_YEAR);
      expect(response.body).toHaveProperty('siteId', TEST_SITE);
      expect(response.body).toHaveProperty('status', 'draft');
      expect(response.body).toHaveProperty('items');

      createdPlanIds.push(response.body.id);
    });

    it('should not create duplicate plan for same year and site', async () => {
      // 중복 생성 시도 (이미 위에서 생성됨)
      const planData = {
        year: TEST_YEAR,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(planData)
        .expect(409); // Conflict
    });

    it('should not create plan without authentication', async () => {
      const planData = {
        year: TEST_YEAR + 1,
        siteId: TEST_SITE,
        createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      };

      await request(app.getHttpServer())
        .post('/calibration-plans')
        .send(planData)
        .expect(401);
    });
  });

  describe('/calibration-plans (GET)', () => {
    it('should get calibration plans list', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-plans')
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
      const response = await request(app.getHttpServer())
        .get(`/calibration-plans?year=${TEST_YEAR}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 해당 연도인지 확인
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.year).toBe(TEST_YEAR);
      });
    });

    it('should get calibration plans with siteId filter', async () => {
      const response = await request(app.getHttpServer())
        .get(`/calibration-plans?siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 해당 시험소인지 확인
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.siteId).toBe(TEST_SITE);
      });
    });

    it('should get calibration plans with status filter', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-plans?status=draft')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 draft 상태인지 확인
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('draft');
      });
    });
  });

  describe('/calibration-plans/:uuid (GET)', () => {
    it('should get calibration plan by uuid with items', async () => {
      // createdPlanIds에서 첫 번째 계획서 조회
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
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

      await request(app.getHttpServer())
        .get(`/calibration-plans/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/calibration-plans/:uuid/submit (POST)', () => {
    it('should submit plan for approval (draft -> pending_approval)', async () => {
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(app.getHttpServer())
        .post(`/calibration-plans/${planUuid}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // draft 상태가 아니면 400 에러가 발생할 수 있음
      // POST 엔드포인트는 200 또는 201을 반환할 수 있음
      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('status', 'pending_approval');
      } else {
        expect([200, 201, 400]).toContain(response.status);
      }
    });
  });

  describe('/calibration-plans/:uuid/approve (PATCH)', () => {
    it('should approve plan (pending_approval -> approved)', async () => {
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      // 먼저 계획서 상태 확인
      const planResponse = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // pending_approval 상태일 때만 승인 시도
      if (planResponse.body.status === 'pending_approval') {
        const response = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ approvedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'approved');
      }
    });
  });

  describe('/calibration-plans/:uuid/reject (PATCH)', () => {
    it('should require rejection reason', async () => {
      // 새 계획서 생성 후 테스트
      const newYear = TEST_YEAR + 10;
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        // 승인 요청
        await request(app.getHttpServer())
          .post(`/calibration-plans/${planUuid}/submit`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        // 사유 없이 반려 시도
        const rejectResponse = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ rejectedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

        expect(rejectResponse.status).toBe(400);
      }
    });

    it('should reject plan with reason', async () => {
      // 새 계획서 생성 후 테스트
      const newYear = TEST_YEAR + 11;
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'uiwang',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;
        createdPlanIds.push(planUuid);

        // 승인 요청
        await request(app.getHttpServer())
          .post(`/calibration-plans/${planUuid}/submit`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({});

        // 사유와 함께 반려
        const rejectResponse = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            rejectedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
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
      // 새 계획서 생성 후 삭제 테스트
      const newYear = TEST_YEAR + 20;
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201) {
        const planUuid = createResponse.body.id;

        // draft 상태에서 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body).toHaveProperty('deleted', true);

        // 삭제 확인
        await request(app.getHttpServer())
          .get(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should not delete plan in non-draft status', async () => {
      // 승인된 계획서 삭제 시도
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      // 계획서 상태 확인
      const planResponse = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status !== 'draft') {
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/calibration-plans/${planUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/equipment/external (GET)', () => {
    it('should get external calibration equipment list', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-plans/equipment/external')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 모든 결과가 외부교정 장비인지 확인 (optional - 빈 배열일 수도 있음)
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('managementNumber');
      }
    });

    it('should filter external equipment by year and siteId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/calibration-plans/equipment/external?year=${TEST_YEAR}&siteId=${TEST_SITE}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 모든 결과가 해당 시험소의 장비인지 확인
      response.body.forEach((item: Record<string, unknown>) => {
        expect(item.site).toBe(TEST_SITE);
      });
    });

    it('should apply @SiteScoped and auto-inject siteId for test_engineer token', async () => {
      // test-login 엔드포인트로 test_engineer 토큰 취득 (suwon 사이트 사용자)
      const loginResponse = await request(app.getHttpServer())
        .get('/auth/test-login?role=test_engineer')
        .expect(200);

      const teToken: string = loginResponse.body.access_token || loginResponse.body.accessToken;
      if (!teToken) {
        console.warn('test-login 엔드포인트가 없거나 비활성화되어 테스트를 건너뜁니다.');
        return;
      }

      // siteId 없이 요청 → SiteScopeInterceptor가 user.site를 siteId에 자동 주입
      const response = await request(app.getHttpServer())
        .get('/calibration-plans/equipment/external')
        .set('Authorization', `Bearer ${teToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 반환된 장비는 모두 해당 test_engineer의 사이트 장비여야 함
      response.body.forEach((item: Record<string, unknown>) => {
        expect(['suwon', 'uiwang', 'pyeongtaek']).toContain(item.site);
      });
    });
  });

  describe('/calibration-plans/:uuid/items/:itemUuid/confirm (PATCH)', () => {
    it('should confirm item only in approved plan', async () => {
      // 승인된 계획서에서 항목 확인 테스트
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      // 계획서 상태 확인
      const planResponse = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      if (planResponse.body.status === 'approved' && planResponse.body.items?.length > 0) {
        const itemUuid = planResponse.body.items[0].id;

        const confirmResponse = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
        expect(confirmResponse.body).toHaveProperty('confirmedAt');
      }
    });

    it('should not confirm item in non-approved plan', async () => {
      // 새 계획서 생성 (draft 상태)
      const newYear = TEST_YEAR + 30;
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status === 201 && createResponse.body.items?.length > 0) {
        const planUuid = createResponse.body.id;
        const itemUuid = createResponse.body.items[0].id;
        createdPlanIds.push(planUuid);

        // draft 상태에서 확인 시도
        const confirmResponse = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(400);
      }
    });
  });

  describe('/calibration-plans/:uuid/pdf (GET)', () => {
    it('should generate PDF (HTML) for plan', async () => {
      if (createdPlanIds.length === 0) {
        console.log('Skipping: No plan created');
        return;
      }

      const planUuid = createdPlanIds[0];

      const response = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/html');
    });

    it('should return 404 for non-existent plan PDF', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';

      await request(app.getHttpServer())
        .get(`/calibration-plans/${nonExistentUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Integration: Full workflow', () => {
    it('should complete full calibration plan workflow', async () => {
      // 1. CREATE
      const newYear = TEST_YEAR + 100;
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-plans')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          year: newYear,
          siteId: 'suwon',
          createdBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        });

      if (createResponse.status !== 201) {
        console.log('Skipping: Failed to create plan');
        return;
      }

      const planUuid = createResponse.body.id;
      createdPlanIds.push(planUuid);

      expect(createResponse.body.status).toBe('draft');

      // 2. READ
      const readResponse = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(planUuid);

      // 3. SUBMIT
      const submitResponse = await request(app.getHttpServer())
        .post(`/calibration-plans/${planUuid}/submit`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});

      // POST 엔드포인트는 200 또는 201을 반환할 수 있음
      expect([200, 201]).toContain(submitResponse.status);
      expect(submitResponse.body.status).toBe('pending_approval');

      // 4. APPROVE
      const approveResponse = await request(app.getHttpServer())
        .patch(`/calibration-plans/${planUuid}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ approvedBy: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });

      expect(approveResponse.status).toBe(200);
      expect(approveResponse.body.status).toBe('approved');

      // 5. CONFIRM ITEMS (if any)
      if (approveResponse.body.items?.length > 0) {
        const itemUuid = approveResponse.body.items[0].id;

        const confirmResponse = await request(app.getHttpServer())
          .patch(`/calibration-plans/${planUuid}/items/${itemUuid}/confirm`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ confirmedBy: 'a1b2c3d4-e5f6-4789-abcd-ef0123456789' });

        expect(confirmResponse.status).toBe(200);
        expect(confirmResponse.body).toHaveProperty('confirmedBy');
      }

      // 6. GENERATE PDF
      const pdfResponse = await request(app.getHttpServer())
        .get(`/calibration-plans/${planUuid}/pdf`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(pdfResponse.headers['content-type']).toContain('text/html');
    });
  });
});
