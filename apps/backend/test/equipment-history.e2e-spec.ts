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

describe('EquipmentHistoryController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testEquipmentUuid: string;
  const createdHistoryIds: { location: string[]; maintenance: string[]; incident: string[] } = {
    location: [],
    maintenance: [],
    incident: [],
  };

  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('📊 E2E Test Environment (Equipment History):');
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

    // 테스트용 장비 생성
    const equipmentData = {
      name: `History Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
      managementNumber: `MN-HIST-${crypto.randomBytes(8).toString('hex')}`,
      status: 'available',
      site: 'suwon',
      approvalStatus: 'approved',
    };

    const createResponse = await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(equipmentData);

    if (createResponse.status !== 201) {
      console.error('Equipment creation failed:', createResponse.status, createResponse.body);
      throw new Error(`Equipment creation failed with status ${createResponse.status}`);
    }

    testEquipmentUuid = createResponse.body.uuid;
    console.log(`   Test Equipment UUID: ${testEquipmentUuid}`);
  });

  afterAll(async () => {
    // 생성된 이력 정리
    if (app && accessToken) {
      try {
        for (const historyId of createdHistoryIds.location) {
          await request(app.getHttpServer())
            .delete(`/equipment/location-history/${historyId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }
        for (const historyId of createdHistoryIds.maintenance) {
          await request(app.getHttpServer())
            .delete(`/equipment/maintenance-history/${historyId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }
        for (const historyId of createdHistoryIds.incident) {
          await request(app.getHttpServer())
            .delete(`/equipment/incident-history/${historyId}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }

        // 테스트 장비 삭제
        if (testEquipmentUuid) {
          await request(app.getHttpServer())
            .delete(`/equipment/${testEquipmentUuid}`)
            .set('Authorization', `Bearer ${accessToken}`);
        }
      } catch (error) {
        // 정리 실패는 무시
      }
    }

    if (app) {
      await app.close();
    }
  });

  // ===================== 위치 변동 이력 테스트 =====================
  describe('Location History', () => {
    describe('POST /api/equipment/:uuid/location-history', () => {
      it('should create location history successfully', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: 'RF 시험실 A동 2층',
          notes: '정기 이동',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        if (response.status !== 201) {
          console.error('Create location history failed:', response.status, response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.newLocation).toBe(historyData.newLocation);
        expect(response.body.notes).toBe(historyData.notes);

        createdHistoryIds.location.push(response.body.id);
      });

      it('should fail without required newLocation field', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          // newLocation 누락
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });

      it('should fail without authentication', async () => {
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: 'Test Location',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .send(historyData);

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/equipment/:uuid/location-history', () => {
      it('should get location history list', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should return sorted by changedAt desc', async () => {
        // 추가 이력 생성
        const historyData1 = {
          changedAt: '2024-01-01',
          newLocation: '위치 1',
        };
        const historyData2 = {
          changedAt: '2024-06-01',
          newLocation: '위치 2',
        };

        const res1 = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData1);
        createdHistoryIds.location.push(res1.body.id);

        const res2 = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData2);
        createdHistoryIds.location.push(res2.body.id);

        const response = await request(app.getHttpServer())
          .get(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        // 최신 날짜가 먼저 오는지 확인 (내림차순)
        if (response.body.length >= 2) {
          const dates = response.body.map((item: any) => new Date(item.changedAt).getTime());
          for (let i = 0; i < dates.length - 1; i++) {
            expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
          }
        }
      });
    });

    describe('DELETE /api/equipment/location-history/:historyId', () => {
      it('should delete location history', async () => {
        // 먼저 이력 생성
        const historyData = {
          changedAt: new Date().toISOString().split('T')[0],
          newLocation: '삭제 테스트 위치',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        // 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/api/equipment/location-history/${historyId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });

      it('should return 404 for non-existent history', async () => {
        const nonExistentId = '00000000-0000-0000-0000-000000000000';
        const response = await request(app.getHttpServer())
          .delete(`/api/equipment/location-history/${nonExistentId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  // ===================== 유지보수 내역 테스트 =====================
  describe('Maintenance History', () => {
    describe('POST /api/equipment/:uuid/maintenance-history', () => {
      it('should create maintenance history successfully', async () => {
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
          content: '분기별 정기 점검 - 정상 동작 확인',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        if (response.status !== 201) {
          console.error('Create maintenance history failed:', response.status, response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.content).toBe(historyData.content);

        createdHistoryIds.maintenance.push(response.body.id);
      });

      it('should fail without required content field', async () => {
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
          // content 누락
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/equipment/:uuid/maintenance-history', () => {
      it('should get maintenance history list', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/equipment/${testEquipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('DELETE /api/equipment/maintenance-history/:historyId', () => {
      it('should delete maintenance history', async () => {
        // 먼저 이력 생성
        const historyData = {
          performedAt: new Date().toISOString().split('T')[0],
          content: '삭제 테스트 유지보수',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        // 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/api/equipment/maintenance-history/${historyId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });
    });
  });

  // ===================== 손상/오작동/변경/수리 내역 테스트 =====================
  describe('Incident History', () => {
    describe('POST /api/equipment/:uuid/incident-history', () => {
      it('should create damage incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'damage',
          content: '전원부 손상 발견',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        if (response.status !== 201) {
          console.error('Create incident history failed:', response.status, response.body);
        }

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.incidentType).toBe('damage');
        expect(response.body.content).toBe(historyData.content);

        createdHistoryIds.incident.push(response.body.id);
      });

      it('should create malfunction incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'malfunction',
          content: '측정값 오차 발생',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('malfunction');

        createdHistoryIds.incident.push(response.body.id);
      });

      it('should create change incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'change',
          content: '펌웨어 업데이트 진행',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('change');

        createdHistoryIds.incident.push(response.body.id);
      });

      it('should create repair incident successfully', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'repair',
          content: '전원 보드 교체 완료',
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(201);
        expect(response.body.incidentType).toBe('repair');

        createdHistoryIds.incident.push(response.body.id);
      });

      it('should fail without required incidentType field', async () => {
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          content: '테스트 내용',
          // incidentType 누락
        };

        const response = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(response.status).toBe(400);
      });
    });

    describe('GET /api/equipment/:uuid/incident-history', () => {
      it('should get incident history list', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    describe('DELETE /api/equipment/incident-history/:historyId', () => {
      it('should delete incident history', async () => {
        // 먼저 이력 생성
        const historyData = {
          occurredAt: new Date().toISOString().split('T')[0],
          incidentType: 'damage',
          content: '삭제 테스트 손상',
        };

        const createResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${testEquipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(historyData);

        expect(createResponse.status).toBe(201);
        const historyId = createResponse.body.id;

        // 삭제
        const deleteResponse = await request(app.getHttpServer())
          .delete(`/api/equipment/incident-history/${historyId}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(deleteResponse.status).toBe(200);
      });
    });
  });

  // ===================== 통합 테스트 =====================
  describe('Integration: Full History Workflow', () => {
    it('should complete full history workflow for equipment', async () => {
      // 1. 새 장비 생성
      const equipmentData = {
        name: `Integration History Test ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-INT-${crypto.randomBytes(8).toString('hex')}`,
        status: 'available',
        site: 'suwon',
        approvalStatus: 'approved',
      };

      const equipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData);

      expect(equipmentResponse.status).toBe(201);
      const equipmentUuid = equipmentResponse.body.uuid;

      try {
        // 2. 위치 변동 이력 추가
        const locationResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${equipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            changedAt: '2024-01-15',
            newLocation: '초기 설치 위치',
            notes: '신규 장비 설치',
          });
        expect(locationResponse.status).toBe(201);

        // 3. 유지보수 내역 추가
        const maintenanceResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${equipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            performedAt: '2024-03-01',
            content: '설치 후 첫 점검 완료',
          });
        expect(maintenanceResponse.status).toBe(201);

        // 4. 손상 이력 추가
        const incidentResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${equipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            occurredAt: '2024-04-10',
            incidentType: 'damage',
            content: '외부 충격으로 인한 케이스 파손',
          });
        expect(incidentResponse.status).toBe(201);

        // 5. 수리 이력 추가
        const repairResponse = await request(app.getHttpServer())
          .post(`/api/equipment/${equipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            occurredAt: '2024-04-15',
            incidentType: 'repair',
            content: '케이스 교체 완료',
          });
        expect(repairResponse.status).toBe(201);

        // 6. 모든 이력 조회 확인
        const locationHistoryResponse = await request(app.getHttpServer())
          .get(`/api/equipment/${equipmentUuid}/location-history`)
          .set('Authorization', `Bearer ${accessToken}`);
        expect(locationHistoryResponse.status).toBe(200);
        expect(locationHistoryResponse.body.length).toBeGreaterThanOrEqual(1);

        const maintenanceHistoryResponse = await request(app.getHttpServer())
          .get(`/api/equipment/${equipmentUuid}/maintenance-history`)
          .set('Authorization', `Bearer ${accessToken}`);
        expect(maintenanceHistoryResponse.status).toBe(200);
        expect(maintenanceHistoryResponse.body.length).toBeGreaterThanOrEqual(1);

        const incidentHistoryResponse = await request(app.getHttpServer())
          .get(`/api/equipment/${equipmentUuid}/incident-history`)
          .set('Authorization', `Bearer ${accessToken}`);
        expect(incidentHistoryResponse.status).toBe(200);
        expect(incidentHistoryResponse.body.length).toBeGreaterThanOrEqual(2); // damage + repair
      } finally {
        // 정리: 장비 삭제
        await request(app.getHttpServer())
          .delete(`/equipment/${equipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });
});
