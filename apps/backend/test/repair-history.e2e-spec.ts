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

describe('RepairHistoryController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdRepairHistoryIds: string[] = [];
  let testEquipmentUuid: string;
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('🔧 Repair History E2E Test Environment:');
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
        name: 'E2E Test Equipment for Repair History',
        managementNumber: `E2E-RH-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-RH-${Date.now()}`,
        status: 'available',
        location: 'Test Location',
        site: 'suwon',
        approvalStatus: 'approved',
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
  });

  afterAll(async () => {
    // 테스트로 생성된 수리 이력 정리
    if (app && accessToken) {
      for (const repairId of createdRepairHistoryIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/repair-history/${repairId}`)
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

  describe('POST /equipment/:uuid/repair-history', () => {
    it('should create a new repair history record', async () => {
      const createDto = {
        repairDate: new Date().toISOString().split('T')[0],
        repairDescription: 'E2E 테스트 수리 내용 - 전원부 교체 작업 완료',
        repairedBy: '홍길동',
        repairCompany: '키사이트 코리아',
        cost: 500000,
        repairResult: 'completed',
        notes: '보증 기간 내 무상 수리',
      };

      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      if (response.status !== 201) {
        console.error('Create repair history failed:', {
          status: response.status,
          body: response.body,
          requestData: createDto,
        });
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.repairDescription).toBe(createDto.repairDescription);
      expect(response.body.repairedBy).toBe(createDto.repairedBy);
      expect(response.body.repairCompany).toBe(createDto.repairCompany);
      expect(response.body.cost).toBe(createDto.cost);
      expect(response.body.repairResult).toBe(createDto.repairResult);

      if (response.body.id) {
        createdRepairHistoryIds.push(response.body.id);
      }
    });

    it('should reject repair description less than 10 characters', async () => {
      const createDto = {
        repairDate: new Date().toISOString().split('T')[0],
        repairDescription: '짧은 내용',
        repairedBy: '홍길동',
      };

      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should create repair history with minimum required fields', async () => {
      const createDto = {
        repairDate: new Date().toISOString().split('T')[0],
        repairDescription: '필수 필드만 포함한 수리 내용 테스트',
      };

      const response = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.repairDescription).toBe(createDto.repairDescription);

      if (response.body.id) {
        createdRepairHistoryIds.push(response.body.id);
      }
    });
  });

  describe('GET /equipment/:uuid/repair-history', () => {
    it('should return a list of repair history for equipment', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('currentPage');
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history?page=1&pageSize=10`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.meta.currentPage).toBe(1);
      expect(response.body.meta.itemsPerPage).toBe(10);
    });

    it('should sort by repairDate descending by default', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (response.body.items.length > 1) {
        const dates = response.body.items.map((item: Record<string, unknown>) => new Date(item.repairDate as string).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });
  });

  describe('GET /repair-history/:uuid', () => {
    it('should return a repair history record by UUID', async () => {
      if (createdRepairHistoryIds.length > 0) {
        const repairId = createdRepairHistoryIds[0];

        const response = await request(app.getHttpServer())
          .get(`/repair-history/${repairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(repairId);
      }
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .get(`/repair-history/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /equipment/:uuid/repair-history/summary', () => {
    it('should return repair cost summary', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history/summary`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCost');
      expect(response.body).toHaveProperty('count');
      expect(typeof response.body.totalCost).toBe('number');
      expect(typeof response.body.count).toBe('number');
    });
  });

  describe('GET /equipment/:uuid/repair-history/recent', () => {
    it('should return recent repair history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history/recent?limit=3`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(3);
    });

    it('should default to 5 items', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history/recent`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeLessThanOrEqual(5);
    });
  });

  describe('PATCH /repair-history/:uuid', () => {
    it('should update repair history record', async () => {
      if (createdRepairHistoryIds.length > 0) {
        const repairId = createdRepairHistoryIds[0];

        const updateDto = {
          repairDescription: 'E2E 테스트 - 수정된 수리 내용',
          cost: 750000,
          repairResult: 'completed',
          notes: '수정된 비고',
        };

        const response = await request(app.getHttpServer())
          .patch(`/repair-history/${repairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.repairDescription).toBe(updateDto.repairDescription);
        expect(response.body.cost).toBe(updateDto.cost);
        expect(response.body.notes).toBe(updateDto.notes);
      }
    });

    it('should allow partial updates', async () => {
      if (createdRepairHistoryIds.length > 0) {
        const repairId = createdRepairHistoryIds[0];

        const updateDto = {
          cost: 800000,
        };

        const response = await request(app.getHttpServer())
          .patch(`/repair-history/${repairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.cost).toBe(updateDto.cost);
      }
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .patch(`/repair-history/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cost: 100000 })
        .expect(404);
    });
  });

  describe('DELETE /repair-history/:uuid', () => {
    it('should soft delete a repair history record', async () => {
      // 삭제용 새 레코드 생성
      const createResponse = await request(app.getHttpServer())
        .post(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString().split('T')[0],
          repairDescription: 'E2E 삭제 테스트용 수리 내용입니다',
        });

      if (createResponse.status === 201 && createResponse.body.id) {
        const repairId = createResponse.body.id;

        // 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/repair-history/${repairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(deleteResponse.body.id).toBe(repairId);
        expect(deleteResponse.body.deleted).toBe(true);

        // 삭제 후 조회 시 404 예상
        await request(app.getHttpServer())
          .get(`/repair-history/${repairId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(404);
      }
    });

    it('should return 404 when deleting non-existent record', async () => {
      const fakeUuid = '00000000-0000-4000-a000-000000000000';
      await request(app.getHttpServer())
        .delete(`/repair-history/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should reject requests without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history`)
        .expect(401);
    });

    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .get(`/equipment/${testEquipmentUuid}/repair-history`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
