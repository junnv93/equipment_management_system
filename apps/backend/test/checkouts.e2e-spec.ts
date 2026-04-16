/// <reference types="jest" />

// ⚠️ 중요: 환경 변수는 모듈 import 전에 설정해야 합니다
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
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

describe('CheckoutsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdCheckoutIds: string[] = [];
  let testEquipmentUuid: string;
  let testApproverId: string; // ✅ UUID 형식의 승인자 ID
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('📊 Checkouts E2E Test Environment:');
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
        name: 'E2E Test Equipment for Checkout',
        managementNumber: `E2E-CHECKOUT-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-${Date.now()}`,
        status: 'available',
        location: 'Test Location',
        site: 'suwon', // ✅ site 필드 추가 (필수)
        approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
      });

    if (equipmentResponse.status === 201 && equipmentResponse.body?.id) {
      testEquipmentUuid = equipmentResponse.body.id;
    } else {
      console.error('Equipment creation failed:', {
        status: equipmentResponse.status,
        body: equipmentResponse.body,
      });
      throw new Error('Failed to create test equipment');
    }

    // ✅ 테스트용 승인자 ID 생성 (UUID 형식)
    // 로그인 응답에서 사용자 ID를 가져오되, UUID 형식이 아니면 생성
    const loginUserId = loginResponse.body.user?.id;
    
    // UUID 형식 검증 함수
    const isValidUUID = (str: string): boolean => {
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    };
    
    // UUID v4 형식 생성 함수
    const generateUUID = (): string => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
    
    if (loginUserId && isValidUUID(loginUserId)) {
      // 로그인 응답의 사용자 ID가 유효한 UUID 형식인 경우
      testApproverId = loginUserId;
    } else {
      // UUID 형식이 아니거나 없는 경우, 테스트용 UUID 생성
      testApproverId = generateUUID();
      console.warn(
        `⚠️  로그인 응답의 사용자 ID(${loginUserId || '없음'})가 UUID 형식이 아니어서 테스트용 UUID를 생성했습니다: ${testApproverId}`
      );
    }
  });

  afterAll(async () => {
    // 테스트로 생성된 반출 정리
    if (app && accessToken) {
      for (const checkoutId of createdCheckoutIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/checkouts/${checkoutId}`)
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

  describe('POST /checkouts', () => {
    it('should create a new checkout request', async () => {
      const createCheckoutDto = {
        equipmentIds: [testEquipmentUuid],
        purpose: 'calibration',
        destination: 'E2E 테스트 교정기관',
        reason: 'E2E 테스트를 위한 반출 신청',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(app.getHttpServer())
        .post('/checkouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCheckoutDto);

      // 에러 발생 시 상세 정보 출력
      if (response.status !== 201) {
        console.error('Create checkout failed:', {
          status: response.status,
          body: response.body,
          requestData: createCheckoutDto,
          testEquipmentUuid,
        });
      }

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

      await request(app.getHttpServer())
        .post('/checkouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createCheckoutDto)
        .expect(400);
    });
  });

  describe('GET /checkouts', () => {
    it('should return a list of checkouts', async () => {
      const response = await request(app.getHttpServer())
        .get('/checkouts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should filter checkouts by purpose', async () => {
      const response = await request(app.getHttpServer())
        .get('/checkouts?purpose=calibration')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.items.every((item: Record<string, unknown>) => item.purpose === 'calibration')).toBe(true);
    });
  });

  describe('GET /checkouts/:uuid', () => {
    it('should return a checkout by UUID', async () => {
      // 먼저 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        const response = await request(app.getHttpServer())
          .get(`/checkouts/${checkoutUuid}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(checkoutUuid);
        expect(response.body.purpose).toBe('repair');
      }
    });

    it('should return 404 for non-existent checkout UUID', async () => {
      const fakeUuid = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/checkouts/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      // 에러 발생 시 상세 정보 출력
      if (response.status !== 404) {
        console.error('Get non-existent checkout failed:', {
          status: response.status,
          body: response.body,
          fakeUuid,
        });
      }

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /checkouts/:uuid/approve', () => {
    it('should approve first (internal purpose - calibration)', async () => {
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 승인 (모든 목적 1단계 통합)
        const approveResponse = await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        // 승인 완료
        expect(approveResponse.body.status).toBe('approved');
        expect(approveResponse.body.approverId).toBe(testApproverId);
      }
    });

    it('should approve checkout (external rental)', async () => {
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 승인 (모든 목적 1단계 통합)
        const approveResponse = await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/approve`)
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

  describe('PATCH /checkouts/:uuid/approve', () => {
    it('should approve checkout (unified approval)', async () => {
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 승인
        const approveResponse = await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/approve`)
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
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 반려 (사유 필수)
        const rejectResponse = await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/reject`)
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
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 반려 사유 없이 반려 시도 (400 에러 예상)
        await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
            // reason 필드 누락
          })
          .expect(400);
      }
    });
  });

  describe('POST /checkouts/:uuid/return', () => {
    it('should return checkout with inspection', async () => {
      // 반출 생성 및 승인
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 승인 (모든 목적 1단계 통합)
        await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testApproverId,
          })
          .expect(200);

        // 반출 시작
        await request(app.getHttpServer())
          .post(`/checkouts/${checkoutUuid}/start`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201);

        // 반입 처리 (검사 정보 포함)
        const returnResponse = await request(app.getHttpServer())
          .post(`/checkouts/${checkoutUuid}/return`)
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
      // 반출 생성
      const createResponse = await request(app.getHttpServer())
        .post('/checkouts')
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

        // 취소
        const cancelResponse = await request(app.getHttpServer())
          .patch(`/checkouts/${checkoutUuid}/cancel`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(cancelResponse.body.status).toBe('canceled');
      }
    });
  });
});
