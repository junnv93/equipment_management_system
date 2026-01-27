/// <reference types="jest" />

// 환경 변수 설정 (모듈 import 전에 설정)
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

describe('NonConformancesController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdNonConformanceIds: string[] = [];
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
    console.log('🔧 Non-Conformances E2E Test Environment:');
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
        name: 'E2E Test Equipment for Non-Conformances',
        managementNumber: `E2E-NC-${Date.now()}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-NC-${Date.now()}`,
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
    // 테스트로 생성된 부적합 정리
    if (app && accessToken) {
      for (const ncId of createdNonConformanceIds) {
        try {
          await request(app.getHttpServer())
            .delete(`/non-conformances/${ncId}`)
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

      const response = await request(app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      if (response.status !== 201) {
        console.error('Create non-conformance failed:', {
          status: response.status,
          body: response.body,
          requestData: createDto,
        });
      }

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

      const response = await request(app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      // 이미 부적합 상태이므로 400 에러 예상
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

      await request(app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /non-conformances', () => {
    it('should return a list of non-conformances', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
        .get(`/non-conformances?equipmentId=${testEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.equipmentId).toBe(testEquipmentUuid);
      });
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
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

        const response = await request(app.getHttpServer())
          .get(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        expect(response.body.id).toBe(ncId);
      }
    });

    it('should return 404 for non-existent UUID', async () => {
      const fakeUuid = generateUUID();
      await request(app.getHttpServer())
        .get(`/non-conformances/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('GET /non-conformances/equipment/:equipmentUuid', () => {
    it('should return open non-conformances for equipment', async () => {
      const response = await request(app.getHttpServer())
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
    it('should update non-conformance analysis', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const updateDto = {
          analysisContent: 'E2E 테스트 원인 분석 내용',
          status: 'analyzing',
        };

        const response = await request(app.getHttpServer())
          .patch(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.analysisContent).toBe('E2E 테스트 원인 분석 내용');
      }
    });

    it('should update correction content and status', async () => {
      if (createdNonConformanceIds.length > 0) {
        const ncId = createdNonConformanceIds[0];

        const updateDto = {
          correctionContent: 'E2E 테스트 조치 내용',
          correctionDate: new Date().toISOString().split('T')[0],
          correctedBy: testUserId,
          status: 'corrected',
        };

        const response = await request(app.getHttpServer())
          .patch(`/non-conformances/${ncId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto)
          .expect(200);

        expect(response.body.correctionContent).toBe('E2E 테스트 조치 내용');
        expect(response.body.status).toBe('corrected');
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

        const response = await request(app.getHttpServer())
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

        await request(app.getHttpServer())
          .patch(`/non-conformances/${ncId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(closeDto)
          .expect(400);
      }
    });
  });

  describe('DELETE /non-conformances/:uuid', () => {
    it('should soft delete a non-conformance', async () => {
      // 새로운 장비 생성 (부적합 등록용)
      const newEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for NC Delete',
          managementNumber: `E2E-NC-DEL-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-NC-DEL-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        });

      if (newEquipmentResponse.status === 201 && newEquipmentResponse.body?.id) {
        const deleteTestEquipmentUuid = newEquipmentResponse.body.id;

        // 새 부적합 생성
        const createResponse = await request(app.getHttpServer())
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

          // 삭제
          const deleteResponse = await request(app.getHttpServer())
            .delete(`/non-conformances/${ncId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(200);

          expect(deleteResponse.body.id).toBe(ncId);
          expect(deleteResponse.body.deleted).toBe(true);

          // 삭제 후 조회 시 404 예상
          await request(app.getHttpServer())
            .get(`/non-conformances/${ncId}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .expect(404);
        }

        // 테스트 장비 삭제
        await request(app.getHttpServer())
          .delete(`/equipment/${deleteTestEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });

    it('should return 404 when deleting non-existent non-conformance', async () => {
      const fakeUuid = generateUUID();
      await request(app.getHttpServer())
        .delete(`/non-conformances/${fakeUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Non-conforming equipment rental/checkout blocking', () => {
    it('should block rental of non-conforming equipment', async () => {
      // 새로운 장비 생성
      const newEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for NC Block Test',
          managementNumber: `E2E-NC-BLK-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-NC-BLK-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        });

      if (newEquipmentResponse.status === 201 && newEquipmentResponse.body?.id) {
        const blockTestEquipmentUuid = newEquipmentResponse.body.id;

        // 부적합 등록 (장비 상태가 non_conforming으로 변경됨)
        const ncResponse = await request(app.getHttpServer())
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
          // 대여 시도 (차단되어야 함)
          const rentalResponse = await request(app.getHttpServer())
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

          // 부적합 장비는 대여 불가 (400 또는 403)
          expect([400, 403]).toContain(rentalResponse.status);

          // 정리: 부적합 삭제
          if (ncResponse.body.id) {
            await request(app.getHttpServer())
              .delete(`/non-conformances/${ncResponse.body.id}`)
              .set('Authorization', `Bearer ${accessToken}`);
          }
        }

        // 테스트 장비 삭제
        await request(app.getHttpServer())
          .delete(`/equipment/${blockTestEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });

  describe('Non-conformance and Repair Workflow Integration', () => {
    let workflowTestEquipmentUuid: string;
    let workflowTestNcId: string;
    let workflowTestRepairId: string;

    beforeAll(async () => {
      // 워크플로우 테스트용 별도 장비 생성
      const equipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for Workflow',
          managementNumber: `E2E-WF-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-WF-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      if (equipmentResponse.status === 201 && equipmentResponse.body?.id) {
        workflowTestEquipmentUuid = equipmentResponse.body.id;
      } else {
        throw new Error('Failed to create workflow test equipment');
      }
    });

    afterAll(async () => {
      // 정리: 테스트 장비 삭제
      if (app && accessToken && workflowTestEquipmentUuid) {
        try {
          await request(app.getHttpServer())
            .delete(`/equipment/${workflowTestEquipmentUuid}`)
            .set('Authorization', `Bearer ${accessToken}`);
        } catch (error) {
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
        // ncType 누락
      };

      const response = await request(app.getHttpServer())
        .post('/non-conformances')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should automatically mark non-conformance as corrected when repair is completed', async () => {
      // 1. 부적합 생성 (ncType='damage')
      const ncResponse = await request(app.getHttpServer())
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

      // 2. 장비 상태 확인: non_conforming
      const equipmentCheck = await request(app.getHttpServer())
        .get(`/equipment/${workflowTestEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(equipmentCheck.body.status).toBe('non_conforming');

      // 3. 수리 등록 (nonConformanceId 연결, repairResult='completed')
      const repairResponse = await request(app.getHttpServer())
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

      // 4. 부적합 상태 확인: 자동으로 'corrected'로 변경되어야 함
      const ncCheck = await request(app.getHttpServer())
        .get(`/non-conformances/${workflowTestNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(ncCheck.body.status).toBe('corrected');
      expect(ncCheck.body.repairHistoryId).toBe(workflowTestRepairId);
      expect(ncCheck.body.resolutionType).toBe('repair');
    });

    it('should prevent closing damage type non-conformance without repair', async () => {
      // 새 장비 생성
      const newEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for No-Repair Test',
          managementNumber: `E2E-NR-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-NR-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      const noRepairEquipmentUuid = newEquipmentResponse.body.id;

      // 부적합 생성 (ncType='damage')
      const ncResponse = await request(app.getHttpServer())
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

      // 수리 없이 corrected 상태로 변경 시도
      const updateResponse = await request(app.getHttpServer())
        .patch(`/non-conformances/${noRepairNcId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          correctedBy: testUserId,
        });

      // corrected 상태로 변경은 성공할 수 있음 (서비스 레벨에서는 체크 안 함)
      // 하지만 종결 시도 시 차단되어야 함
      if (updateResponse.status === 200) {
        const closeResponse = await request(app.getHttpServer())
          .patch(`/non-conformances/${noRepairNcId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closedBy: testUserId,
            closureNotes: '종료 시도',
          });

        // damage 유형은 수리 없이 종결 불가
        expect(closeResponse.status).toBe(400);
        expect(closeResponse.body.message).toContain('수리');
      }

      // 정리
      await request(app.getHttpServer())
        .delete(`/non-conformances/${noRepairNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app.getHttpServer())
        .delete(`/equipment/${noRepairEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking multiple repairs to one non-conformance (1:1 relationship)', async () => {
      // 새 장비 생성
      const newEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for 1:1 Test',
          managementNumber: `E2E-11-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-11-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      const oneToOneEquipmentUuid = newEquipmentResponse.body.id;

      // 부적합 생성
      const ncResponse = await request(app.getHttpServer())
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

      // 첫 번째 수리 연결
      const repair1Response = await request(app.getHttpServer())
        .post(`/equipment/${oneToOneEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '첫 번째 수리',
          repairResult: 'partial',
          nonConformanceId: oneToOneNcId,
        });

      expect(repair1Response.status).toBe(201);

      // 두 번째 수리 연결 시도 (차단되어야 함)
      const repair2Response = await request(app.getHttpServer())
        .post(`/equipment/${oneToOneEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '두 번째 수리 시도',
          repairResult: 'completed',
          nonConformanceId: oneToOneNcId,
        });

      // 이미 수리가 연결되어 있으므로 400 에러 예상
      expect(repair2Response.status).toBe(400);

      // 정리
      await request(app.getHttpServer())
        .delete(`/non-conformances/${oneToOneNcId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      await request(app.getHttpServer())
        .delete(`/equipment/${oneToOneEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should prevent linking repair to closed non-conformance', async () => {
      // 새 장비 생성
      const newEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'E2E Test Equipment for Closed NC Test',
          managementNumber: `E2E-CL-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          serialNumber: `SN-CL-${Date.now()}`,
          status: 'available',
          location: 'Test Location',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      const closedNcEquipmentUuid = newEquipmentResponse.body.id;

      // 부적합 생성 (other 타입은 수리 없이도 종결 가능)
      const ncResponse = await request(app.getHttpServer())
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

      // corrected 상태로 변경
      await request(app.getHttpServer())
        .patch(`/non-conformances/${closedTestNcId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'corrected',
          correctionContent: '조치 완료',
          correctionDate: new Date().toISOString().split('T')[0],
          correctedBy: testUserId,
        });

      // 부적합 종료
      const closeResponse = await request(app.getHttpServer())
        .patch(`/non-conformances/${closedTestNcId}/close`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          closedBy: testUserId,
          closureNotes: '종료',
        });

      expect(closeResponse.status).toBe(200);

      // 종료된 부적합에 수리 연결 시도 (차단되어야 함)
      const repairResponse = await request(app.getHttpServer())
        .post(`/equipment/${closedNcEquipmentUuid}/repair-history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          repairDate: new Date().toISOString(),
          repairDescription: '종료된 부적합에 수리 시도',
          repairResult: 'completed',
          nonConformanceId: closedTestNcId,
        });

      // 종료된 부적합에는 수리 연결 불가
      expect(repairResponse.status).toBe(400);

      // 정리
      await request(app.getHttpServer())
        .delete(`/equipment/${closedNcEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should restore equipment status to available after closing last non-conformance', async () => {
      if (workflowTestNcId) {
        // 부적합 종료 (corrected 상태에서 종료 가능)
        const closeResponse = await request(app.getHttpServer())
          .patch(`/non-conformances/${workflowTestNcId}/close`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            closedBy: testUserId,
            closureNotes: '워크플로우 테스트 완료',
          });

        expect(closeResponse.status).toBe(200);
        expect(closeResponse.body.status).toBe('closed');

        // 장비 상태 확인: available로 복원되어야 함
        const equipmentCheck = await request(app.getHttpServer())
          .get(`/equipment/${workflowTestEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        expect(equipmentCheck.body.status).toBe('available');
      }
    });
  });
});
