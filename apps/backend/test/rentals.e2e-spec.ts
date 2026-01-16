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

describe('RentalsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdLoanIds: string[] = [];
  let testEquipmentUuid: string;
  let testUserId: string;
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('📊 Rentals E2E Test Environment:');
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
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    accessToken = loginResponse.body.access_token || loginResponse.body.accessToken;
    if (!accessToken) {
      throw new Error('Failed to obtain access token');
    }

    // 테스트용 장비 생성
    const equipmentResponse = await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'E2E Test Equipment for Rental',
        managementNumber: `E2E-RENTAL-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-${Date.now()}`,
        status: 'available',
        location: 'Test Location',
      });

    if (equipmentResponse.status === 201 && equipmentResponse.body?.uuid) {
      testEquipmentUuid = equipmentResponse.body.uuid;
    } else {
      console.error('Equipment creation failed:', {
        status: equipmentResponse.status,
        body: equipmentResponse.body,
      });
      throw new Error('Failed to create test equipment');
    }

    // 테스트용 사용자 ID (현재는 하드코딩된 사용자 사용)
    testUserId = loginResponse.body.user?.id || 'test-user-id';
  });

  afterAll(async () => {
    // 테스트로 생성된 대여 정리
    if (app && accessToken) {
      for (const loanId of createdLoanIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/rentals/${loanId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
          // 이미 삭제된 경우 무시
        }
      }
    }

    // 테스트용 장비 삭제
    if (app && accessToken && testEquipmentUuid) {
      try {
        await request(app.getHttpServer())
          .delete(`/equipment/${testEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      } catch (error) {
        // 이미 삭제된 경우 무시
      }
    }

    if (app) {
      await app.close();
    }
  });

  describe('POST /rentals', () => {
    it('should create a new rental request', async () => {
      const createRentalDto = {
        equipmentId: testEquipmentUuid,
        userId: testUserId,
        expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        purpose: 'E2E 테스트를 위한 대여 신청',
      };

      const response = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createRentalDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
      expect(response.body.equipmentId).toBe(testEquipmentUuid);

      if (response.body.id) {
        createdLoanIds.push(response.body.id);
      }
    });

    it('should reject rental request with invalid equipment UUID', async () => {
      const createRentalDto = {
        equipmentId: 'invalid-uuid',
        userId: testUserId,
        expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        purpose: 'Invalid UUID test',
      };

      await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createRentalDto)
        .expect(400);
    });
  });

  describe('GET /rentals', () => {
    it('should return a list of rentals', async () => {
      const response = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should filter rentals by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/rentals?statuses=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.every((item: any) => item.status === 'pending')).toBe(true);
    });
  });

  describe('GET /rentals/:uuid', () => {
    it('should return a rental by UUID', async () => {
      // 먼저 대여 생성
      const createResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          userId: testUserId,
          expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          purpose: 'E2E 상세 조회 테스트',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const loanUuid = createResponse.body.id;
        createdLoanIds.push(loanUuid);

        const response = await request(app.getHttpServer())
          .get(`/rentals/${loanUuid}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(loanUuid);
        expect(response.body.equipmentId).toBe(testEquipmentUuid);
      }
    });

    it('should return 404 for non-existent rental UUID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/rentals/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /rentals/:uuid/approve', () => {
    it('should approve a pending rental', async () => {
      // 대여 생성
      const createResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          userId: testUserId,
          expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          purpose: 'E2E 승인 테스트',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const loanUuid = createResponse.body.id;
        createdLoanIds.push(loanUuid);

        // 승인
        const approveResponse = await request(app.getHttpServer())
          .patch(`/rentals/${loanUuid}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
          })
          .expect(200);

        expect(approveResponse.body.status).toBe('approved');
        expect(approveResponse.body.approverId).toBe(testUserId);
      }
    });
  });

  describe('PATCH /rentals/:uuid/reject', () => {
    it('should reject a pending rental with reason', async () => {
      // 대여 생성
      const createResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          userId: testUserId,
          expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          purpose: 'E2E 반려 테스트',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const loanUuid = createResponse.body.id;
        createdLoanIds.push(loanUuid);

        // 반려 (사유 필수)
        const rejectResponse = await request(app.getHttpServer())
          .patch(`/rentals/${loanUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
            reason: 'E2E 테스트를 위한 반려 사유',
          })
          .expect(200);

        expect(rejectResponse.body.status).toBe('rejected');
        expect(rejectResponse.body.rejectionReason).toBe('E2E 테스트를 위한 반려 사유');
      }
    });

    it('should reject rental rejection without reason', async () => {
      // 대여 생성
      const createResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          userId: testUserId,
          expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          purpose: 'E2E 반려 사유 필수 테스트',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const loanUuid = createResponse.body.id;
        createdLoanIds.push(loanUuid);

        // 반려 사유 없이 반려 시도 (400 에러 예상)
        await request(app.getHttpServer())
          .patch(`/rentals/${loanUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
            // reason 필드 누락
          })
          .expect(400);
      }
    });
  });

  describe('PATCH /rentals/:uuid/cancel', () => {
    it('should cancel a pending rental', async () => {
      // 대여 생성
      const createResponse = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          equipmentId: testEquipmentUuid,
          userId: testUserId,
          expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          purpose: 'E2E 취소 테스트',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const loanUuid = createResponse.body.id;
        createdLoanIds.push(loanUuid);

        // 취소
        const cancelResponse = await request(app.getHttpServer())
          .patch(`/rentals/${loanUuid}/cancel`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(cancelResponse.body.status).toBe('canceled');
      }
    });
  });
});
