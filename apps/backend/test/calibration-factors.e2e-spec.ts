/// <reference types="jest" />

// 환경 변수 설정 (모듈 import 전에 설정)
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

describe('CalibrationFactorsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdFactorIds: string[] = [];
  let testEquipmentUuid: string;
  // ✅ 기본값 설정: UUID v4 형식 (DTO에서 @IsUUID('4') 사용)
  // AuthService의 '00000000-...-000000000001'은 UUID v4가 아니므로 직접 생성
  let testUserId: string = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  // UUID v4 형식 생성 함수
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // UUID 형식 검증 함수
  const isValidUUID = (str: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  beforeAll(async () => {
    console.log('📊 Calibration Factors E2E Test Environment:');
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
      console.error('Login failed:', loginResponse.body);
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
        name: 'E2E Test Equipment for Calibration Factors',
        managementNumber: `E2E-CF-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-CF-${Date.now()}`,
        status: 'available',
        location: 'Test Location',
        site: 'suwon',
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

    // 테스트용 사용자 ID 설정
    const loginUserId = loginResponse.body.user?.id;
    if (loginUserId && isValidUUID(loginUserId)) {
      testUserId = loginUserId;
    } else {
      testUserId = generateUUID();
      console.warn(`⚠️ Generated test UUID: ${testUserId}`);
    }
  });

  afterAll(async () => {
    // 테스트로 생성된 보정계수 정리
    if (app && accessToken) {
      for (const factorId of createdFactorIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/calibration-factors/${factorId}`)
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

      const response = await request(app.getHttpServer())
        .post('/calibration-factors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      if (response.status !== 201) {
        console.error('Create calibration factor failed:', {
          status: response.status,
          body: response.body,
          requestData: createDto,
        });
      }

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

      const response = await request(app.getHttpServer())
        .post('/calibration-factors')
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

      await request(app.getHttpServer())
        .post('/calibration-factors')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /calibration-factors', () => {
    it('should return a list of calibration factors', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-factors')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should filter by equipmentId', async () => {
      const response = await request(app.getHttpServer())
        .get(`/calibration-factors?equipmentId=${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
      });
    });

    it('should filter by approvalStatus', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-factors?approvalStatus=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.approvalStatus).toBe('pending');
      });
    });
  });

  describe('GET /calibration-factors/pending', () => {
    it('should return pending calibration factors', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration-factors/pending')
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
      const response = await request(app.getHttpServer())
        .get('/calibration-factors/registry')
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
      const response = await request(app.getHttpServer())
        .get(`/calibration-factors/equipment/${testEquipmentUuid}`)
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
      // 먼저 보정계수 생성
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-factors')
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

        const response = await request(app.getHttpServer())
          .get(`/calibration-factors/${factorId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(factorId);
        expect(response.body.factorName).toBe('E2E 상세 조회 테스트');
      }
    });

    it('should return 404 for non-existent factor UUID', async () => {
      const fakeUuid = 'non-existent-uuid-id';
      await request(app.getHttpServer())
        .get(`/calibration-factors/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /calibration-factors/:uuid/approve', () => {
    it('should approve a pending calibration factor', async () => {
      // 보정계수 생성
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-factors')
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

        // 승인
        const approveResponse = await request(app.getHttpServer())
          .patch(`/calibration-factors/${factorId}/approve`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
            approverComment: 'E2E 테스트 승인 완료',
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
      // 보정계수 생성
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-factors')
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

        // 반려
        const rejectResponse = await request(app.getHttpServer())
          .patch(`/calibration-factors/${factorId}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
            rejectionReason: 'E2E 테스트 반려 사유',
          })
          .expect(200);

        expect(rejectResponse.body.approvalStatus).toBe('rejected');
        expect(rejectResponse.body.approverComment).toBe('E2E 테스트 반려 사유');
      }
    });

    it('should reject factor rejection without reason', async () => {
      // 보정계수 생성
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-factors')
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

        // 반려 사유 없이 반려 시도 (400 에러 예상)
        await request(app.getHttpServer())
          .patch(`/calibration-factors/${factorId}/reject`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            approverId: testUserId,
            // rejectionReason 누락
          })
          .expect(400);
      }
    });
  });

  describe('DELETE /calibration-factors/:uuid', () => {
    it('should soft delete a calibration factor', async () => {
      // 보정계수 생성
      const createResponse = await request(app.getHttpServer())
        .post('/calibration-factors')
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

        // 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/calibration-factors/${factorId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(deleteResponse.body.id).toBe(factorId);
        expect(deleteResponse.body.deleted).toBe(true);

        // 삭제 후 조회 시 404 예상
        await request(app.getHttpServer())
          .get(`/calibration-factors/${factorId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });
  });
});
