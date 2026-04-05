/// <reference types="jest" />

// ⚠️ 중요: 환경 변수는 모듈 import 전에 설정해야 합니다
// packages/db/src/index.ts가 모듈 로드 시점에 실행되므로 먼저 설정 필요
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/equipment_management';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';
process.env.JWT_SECRET =
  process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-tests-minimum-32-characters-long';
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  'test-nextauth-secret-key-for-e2e-tests-minimum-32-characters-long';
// Azure AD 설정 (테스트용 더미 값 - AzureADStrategy에서 처리)
process.env.AZURE_AD_CLIENT_ID = process.env.AZURE_AD_CLIENT_ID || 'test-client-id-for-e2e-tests';
process.env.AZURE_AD_TENANT_ID = process.env.AZURE_AD_TENANT_ID || 'test-tenant-id-for-e2e-tests';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('EquipmentController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdEquipmentIds: string[] = [];
  // AuthService에 하드코딩된 사용자 사용 (현재 register 엔드포인트 없음)
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    // 데이터베이스 연결 확인 로그
    console.log('📊 E2E Test Environment:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // ✅ Single Source of Truth: 모든 검증은 Zod 스키마를 사용합니다.
    // 전역 ValidationPipe는 제거되었으며, 각 컨트롤러에서 @UsePipes(ZodValidationPipe)로 명시적 검증
    // E2E 테스트에서는 main.ts와 동일하게 전역 ValidationPipe를 사용하지 않음

    await app.init();

    // 하드코딩된 사용자로 로그인 (AuthService.login()에 정의된 사용자)
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: testUserEmail,
      password: testUserPassword,
    });

    // 로그인 성공 확인 (200 또는 201)
    if (loginResponse.status !== 200 && loginResponse.status !== 201) {
      console.error('Login failed:', loginResponse.status, loginResponse.body);
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    // access_token 또는 accessToken 모두 확인
    accessToken = loginResponse.body.access_token || loginResponse.body.accessToken;

    if (!accessToken) {
      console.error('No access token received:', loginResponse.body);
      throw new Error('Failed to obtain access token');
    }
  });

  afterAll(async () => {
    // 테스트로 생성된 모든 장비 정리
    // 주의: createdEquipmentIds는 내부 id를 저장하지만, API는 uuid를 사용
    // 정리를 위해 먼저 목록을 조회하여 uuid를 찾아야 함
    if (app && accessToken) {
      try {
        const listResponse = await request(app.getHttpServer())
          .get('/equipment')
          .set('Authorization', `Bearer ${accessToken}`);

        if (listResponse.status === 200 && listResponse.body.items) {
          // createdEquipmentIds에 있는 id와 일치하는 장비를 찾아 삭제
          for (const id of createdEquipmentIds) {
            const equipment = listResponse.body.items.find(
              (item: Record<string, unknown>) => String(item.id) === id
            );
            if (equipment && equipment.id) {
              try {
                await request(app.getHttpServer())
                  .delete(`/equipment/${equipment.id}`)
                  .set('Authorization', `Bearer ${accessToken}`);
              } catch (error) {
                // 이미 삭제된 경우 무시
              }
            }
          }
        }
      } catch (error) {
        // 정리 실패는 무시
      }
    }

    // app이 존재할 때만 close 호출
    if (app) {
      await app.close();
    }
  });

  describe('/equipment (POST)', () => {
    it('should create new equipment with minimal required fields', async () => {
      const equipmentData = {
        name: `Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        status: 'available',
        site: 'suwon', // ✅ site 필드 추가 (필수)
        approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
      };

      const response = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData);

      // 에러 발생 시 상세 정보 출력
      if (response.status !== 201) {
        console.error('Create equipment failed:', {
          status: response.status,
          body: response.body,
          requestData: equipmentData,
        });
      }

      expect(response.status).toBe(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(equipmentData.name);
      expect(response.body.managementNumber).toBe(equipmentData.managementNumber);
      expect(response.body.status).toBe(equipmentData.status);

      createdEquipmentIds.push(response.body.id.toString());
    });

    it('should create new equipment with all fields', async () => {
      const equipmentData = {
        name: `Full Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        assetNumber: `ASSET-${crypto.randomBytes(4).toString('hex')}`,
        modelName: 'Test Model',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-${crypto.randomBytes(4).toString('hex')}`,
        location: 'Test Location',
        description: 'Test Description',
        calibrationCycle: 12,
        lastCalibrationDate: new Date('2024-01-01').toISOString(),
        nextCalibrationDate: new Date('2025-01-01').toISOString(),
        calibrationAgency: 'Test Agency',
        needsIntermediateCheck: true,
        calibrationMethod: 'external_calibration',
        purchaseYear: 2023,
        supplier: 'Test Supplier',
        contactInfo: 'test@example.com',
        firmwareVersion: 'v2.0.0',
        manualLocation: '/manuals/test.pdf',
        accessories: 'Test Accessories',
        technicalManager: 'Test Manager',
        status: 'available',
        site: 'suwon', // ✅ site 필드 추가 (필수)
        approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
      };

      const response = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(equipmentData.name);
      expect(response.body.modelName).toBe(equipmentData.modelName);
      expect(response.body.manufacturer).toBe(equipmentData.manufacturer);
      expect(response.body.calibrationCycle).toBe(equipmentData.calibrationCycle);
      expect(response.body.needsIntermediateCheck).toBe(equipmentData.needsIntermediateCheck);

      createdEquipmentIds.push(response.body.id.toString());
    });

    it('should not create equipment with missing required fields', async () => {
      const invalidEquipmentData = {
        // 필수 필드 누락 (name, managementNumber)
        modelName: 'Invalid Model',
        status: 'available',
      };

      await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEquipmentData)
        .expect(400);
    });

    it('should not create equipment with duplicate management number', async () => {
      const managementNumber = `MN-${crypto.randomBytes(8).toString('hex')}`;
      const equipmentData = {
        name: `Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber,
        status: 'available',
        site: 'suwon', // ✅ site 필드 추가 (필수)
        approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
      };

      // 첫 번째 장비 생성
      const firstResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(201);

      createdEquipmentIds.push(firstResponse.body.id.toString());

      // 동일한 관리번호로 두 번째 장비 생성 시도 (실패해야 함)
      await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(400);
    });

    it('should not create equipment with invalid status', async () => {
      const equipmentData = {
        name: 'Test Equipment',
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(400);
    });

    it('should not create equipment without authentication', async () => {
      const equipmentData = {
        name: 'Test Equipment',
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        status: 'available',
      };

      await request(app.getHttpServer()).post('/equipment').send(equipmentData).expect(401);
    });
  });

  describe('/equipment (GET)', () => {
    it('should get equipment list', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment')
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

    it('should get equipment list with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment?page=1&pageSize=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta.currentPage).toBe(1);
      expect(response.body.meta.itemsPerPage).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('should get equipment list with status filter', async () => {
      // 상태로 필터링
      const response = await request(app.getHttpServer())
        .get('/equipment?status=available')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 available 상태인지 확인
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('available');
      });
    });

    it('should get equipment list with search term', async () => {
      // 생성한 장비의 이름으로 검색
      const equipmentName = 'Test Equipment';

      const response = await request(app.getHttpServer())
        .get(`/equipment?search=${encodeURIComponent(equipmentName)}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 검색어가 이름에 포함된 결과가 있는지 확인
      if (response.body.items.length > 0) {
        expect(response.body.items.some((item: Record<string, unknown>) => (item.name as string).includes(equipmentName))).toBe(
          true
        );
      }
    });

    it('should get equipment list with multiple filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment?status=available&page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.itemsPerPage).toBe(10);

      // 모든 결과가 available 상태인지 확인
      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('available');
      });
    });
  });

  describe('/equipment/:uuid (GET)', () => {
    it('should get equipment by uuid', async () => {
      // 먼저 장비 생성
      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Get Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon', // ✅ site 필드 추가 (필수)
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      // UUID로 장비 조회 (API 표준: uuid 사용)
      const response = await request(app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(equipmentUuid);
      expect(response.body.name).toBe(createResponse.body.name);
    });

    it('should return 404 for non-existent equipment', async () => {
      // 존재하지 않는 UUID로 조회 시도
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .get(`/equipment/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const testUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer()).get(`/equipment/${testUuid}`).expect(401);
    });
  });

  describe('/equipment/:uuid (PATCH)', () => {
    it('should update equipment with partial data', async () => {
      // 먼저 장비 생성
      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Update Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon', // ✅ site 필드 추가 (필수)
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      // 장비 업데이트 (UUID 사용)
      // 표준 상태값 사용: packages/schemas/src/enums.ts 참조
      const updateData = {
        status: 'in_use' as const, // API 표준 상태값: 사용 중
        description: 'Updated Description',
        location: 'Updated Location',
        approvalStatus: 'approved', // ✅ 관리자 직접 수정 (E2E 테스트용)
      };

      const response = await request(app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(equipmentUuid);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.description).toBe(updateData.description);
      expect(response.body.location).toBe(updateData.location);
    });

    it('should update equipment with calibration information', async () => {
      // 먼저 장비 생성
      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Calibration Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon', // ✅ site 필드 추가 (필수)
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      // 교정 정보 업데이트 (UUID 사용)
      const updateData = {
        calibrationCycle: 12,
        lastCalibrationDate: new Date('2024-01-01').toISOString(),
        nextCalibrationDate: new Date('2025-01-01').toISOString(),
        calibrationAgency: 'Test Agency',
        needsIntermediateCheck: true,
        calibrationMethod: 'external_calibration',
        approvalStatus: 'approved', // ✅ 관리자 직접 수정 (E2E 테스트용)
      };

      const response = await request(app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.calibrationCycle).toBe(updateData.calibrationCycle);
      expect(response.body.needsIntermediateCheck).toBe(updateData.needsIntermediateCheck);
      expect(response.body.calibrationMethod).toBe(updateData.calibrationMethod);
    });

    it('should not update equipment with invalid status', async () => {
      // 먼저 장비 생성
      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Invalid Update Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon', // ✅ site 필드 추가 (필수)
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      const invalidUpdateData = {
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });

    it('should return 404 when updating non-existent equipment', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/equipment/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        name: 'Updated Name',
      };

      const testUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/equipment/${testUuid}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/equipment/:uuid (DELETE)', () => {
    it('should delete equipment', async () => {
      // 먼저 장비 생성
      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Delete Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon', // ✅ site 필드 추가 (필수)
          approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;

      // 장비 삭제 (UUID 사용) - 관리자 직접 삭제는 202 Accepted 반환
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(deleteResponse.body).toHaveProperty('message', '장비가 삭제되었습니다.');

      // 삭제 후 조회 시 404 확인
      await request(app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent equipment', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/equipment/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const testUuid = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer()).delete(`/equipment/${testUuid}`).expect(401);
    });
  });

  describe('Integration: Full CRUD workflow', () => {
    it('should complete full CRUD workflow', async () => {
      // 1. CREATE
      const createData = {
        name: `Full CRUD Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        modelName: 'CRUD Test Model',
        manufacturer: 'CRUD Manufacturer',
        location: 'CRUD Location',
        status: 'available',
        site: 'suwon', // ✅ site 필드 추가 (필수)
        approvalStatus: 'approved', // ✅ 관리자 직접 승인 (E2E 테스트용)
      };

      const createResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createData)
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      expect(createResponse.body.name).toBe(createData.name);
      expect(createResponse.body.managementNumber).toBe(createData.managementNumber);

      // 2. READ (단일 조회 - UUID 사용)
      const readResponse = await request(app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(equipmentUuid);
      expect(readResponse.body.name).toBe(createData.name);

      // 3. UPDATE (UUID 사용)
      // 표준 상태값 사용: packages/schemas/src/enums.ts 참조
      const updateData = {
        name: 'Updated CRUD Equipment Name',
        location: 'Updated CRUD Location',
        status: 'in_use' as const, // API 표준 상태값: 사용 중
        approvalStatus: 'approved', // ✅ 관리자 직접 수정 (E2E 테스트용)
      };

      const updateResponse = await request(app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.location).toBe(updateData.location);
      expect(updateResponse.body.status).toBe(updateData.status);

      // 4. READ (목록 조회에서 업데이트된 데이터 확인)
      const listResponse = await request(app.getHttpServer())
        .get(`/equipment?search=${encodeURIComponent(updateData.name)}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const foundEquipment = listResponse.body.items.find(
        (item: Record<string, unknown>) => item.id === equipmentUuid
      );
      expect(foundEquipment).toBeDefined();
      expect(foundEquipment.name).toBe(updateData.name);

      // 5. DELETE (UUID 사용) - 관리자 직접 삭제는 202 Accepted 반환
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(deleteResponse.body).toHaveProperty('message', '장비가 삭제되었습니다.');

      // 삭제 확인
      await request(app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // createdEquipmentIds에서 제거
      const index = createdEquipmentIds.indexOf(createResponse.body.id.toString());
      if (index > -1) {
        createdEquipmentIds.splice(index, 1);
      }
    });
  });
});
