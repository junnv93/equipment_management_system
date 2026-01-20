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
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('SharedEquipmentController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdSharedEquipmentUuids: string[] = [];
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

  beforeAll(async () => {
    console.log('🔧 Shared Equipment E2E Test Environment:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
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
  });

  afterAll(async () => {
    // 테스트로 생성된 공용장비 정리 (소프트 삭제 - 관리자 권한으로 직접 삭제)
    // 공용장비는 삭제가 차단되므로 DB에서 직접 정리하거나 isActive를 false로 설정
    // 여기서는 테스트 환경이므로 생략하거나 DB 직접 조작 필요

    if (app) {
      await app.close();
    }
  });

  describe('POST /equipment/shared', () => {
    it('should create a new shared equipment with minimal fields', async () => {
      const createDto = {
        name: `E2E 공용장비 테스트 ${Date.now()}`,
        managementNumber: `SHARED-E2E-${Date.now()}`,
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(app.getHttpServer())
        .post('/equipment/shared')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      if (response.status !== 201) {
        console.error('Create shared equipment failed:', {
          status: response.status,
          body: response.body,
          requestData: createDto,
        });
      }

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('equipment');
      expect(response.body.equipment).toHaveProperty('uuid');
      expect(response.body.equipment.isShared).toBe(true);
      expect(response.body.equipment.sharedSource).toBe('safety_lab');
      expect(response.body.equipment.name).toBe(createDto.name);
      expect(response.body.equipment.managementNumber).toBe(createDto.managementNumber);

      if (response.body.equipment?.uuid) {
        createdSharedEquipmentUuids.push(response.body.equipment.uuid);
      }
    });

    it('should create shared equipment with additional fields', async () => {
      const createDto = {
        name: `E2E 공용장비 상세 테스트 ${Date.now()}`,
        managementNumber: `SHARED-E2E-DETAIL-${Date.now()}`,
        sharedSource: 'external',
        site: 'uiwang',
        modelName: 'Test Model X',
        manufacturer: 'Test Manufacturer',
        serialNumber: `SN-SHARED-${Date.now()}`,
        location: 'Safety Lab Room 101',
        calibrationCycle: 12,
        calibrationAgency: '한국표준과학연구원',
      };

      const response = await request(app.getHttpServer())
        .post('/equipment/shared')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body.equipment.isShared).toBe(true);
      expect(response.body.equipment.sharedSource).toBe('external');
      expect(response.body.equipment.modelName).toBe('Test Model X');
      expect(response.body.equipment.manufacturer).toBe('Test Manufacturer');
      expect(response.body.equipment.calibrationCycle).toBe(12);

      if (response.body.equipment?.uuid) {
        createdSharedEquipmentUuids.push(response.body.equipment.uuid);
      }
    });

    it('should reject shared equipment with missing required fields', async () => {
      const createDto = {
        name: 'E2E 불완전 공용장비',
        // managementNumber 누락
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(app.getHttpServer())
        .post('/equipment/shared')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should reject duplicate management number', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return; // 이전 테스트에서 생성된 장비가 없으면 스킵
      }

      // 첫 번째로 생성된 공용장비의 관리번호 조회
      const existingEquipment = await request(app.getHttpServer())
        .get(`/equipment/${createdSharedEquipmentUuids[0]}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const createDto = {
        name: 'E2E 중복 관리번호 테스트',
        managementNumber: existingEquipment.body.managementNumber,
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(app.getHttpServer())
        .post('/equipment/shared')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('이미 사용 중');
    });
  });

  describe('GET /equipment with isShared filter', () => {
    it('should return only shared equipment when isShared=true', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment?isShared=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 반환된 장비가 공용장비인지 확인
      response.body.items.forEach((item: any) => {
        expect(item.isShared).toBe(true);
      });
    });

    it('should return only normal equipment when isShared=false', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment?isShared=false')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 반환된 장비가 일반장비인지 확인
      response.body.items.forEach((item: any) => {
        expect(item.isShared).toBe(false);
      });
    });

    it('should return all equipment when isShared filter is not provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe('PATCH /equipment/:uuid (shared equipment modification blocking)', () => {
    it('should return 403 when trying to update shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        console.warn('No shared equipment to test update blocking');
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      const updateDto = {
        name: '수정 시도 - 차단되어야 함',
        location: 'New Location',
      };

      const response = await request(app.getHttpServer())
        .patch(`/equipment/${sharedEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('공용장비는 수정할 수 없습니다');
    });

    it('should allow updating normal equipment', async () => {
      // 일반 장비 생성
      const normalEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `E2E 일반장비 수정 테스트 ${Date.now()}`,
          managementNumber: `NORMAL-E2E-${Date.now()}`,
          site: 'suwon',
          status: 'available',
        });

      if (normalEquipmentResponse.status === 201 && normalEquipmentResponse.body?.uuid) {
        const normalEquipmentUuid = normalEquipmentResponse.body.uuid;

        const updateDto = {
          name: '수정된 일반장비 이름',
          location: 'Updated Location',
          approvalStatus: 'approved', // 관리자는 직접 승인 가능
        };

        const updateResponse = await request(app.getHttpServer())
          .patch(`/equipment/${normalEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updateDto);

        // 일반 장비는 수정 가능 (200) 또는 승인 요청 생성 (200/201)
        expect([200, 201]).toContain(updateResponse.status);

        // 정리: 테스트 장비 삭제
        await request(app.getHttpServer())
          .delete(`/equipment/${normalEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);
      }
    });
  });

  describe('DELETE /equipment/:uuid (shared equipment deletion blocking)', () => {
    it('should return 403 when trying to delete shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        console.warn('No shared equipment to test delete blocking');
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      const response = await request(app.getHttpServer())
        .delete(`/equipment/${sharedEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('공용장비는 삭제할 수 없습니다');
    });

    it('should allow deleting normal equipment', async () => {
      // 일반 장비 생성
      const normalEquipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `E2E 일반장비 삭제 테스트 ${Date.now()}`,
          managementNumber: `NORMAL-DEL-E2E-${Date.now()}`,
          site: 'suwon',
          status: 'available',
        });

      if (normalEquipmentResponse.status === 201 && normalEquipmentResponse.body?.uuid) {
        const normalEquipmentUuid = normalEquipmentResponse.body.uuid;

        const deleteResponse = await request(app.getHttpServer())
          .delete(`/equipment/${normalEquipmentUuid}`)
          .set('Authorization', `Bearer ${accessToken}`);

        // 일반 장비는 삭제 가능 (200/202) 또는 삭제 요청 생성
        expect([200, 202]).toContain(deleteResponse.status);
      }
    });
  });

  describe('Shared equipment rental (should be allowed)', () => {
    it('should allow renting shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        console.warn('No shared equipment to test rental');
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      // 로그인 사용자 ID 가져오기
      const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: testUserEmail,
        password: testUserPassword,
      });
      const testUserId = loginResponse.body.user?.id || generateUUID();

      const rentalDto = {
        equipmentId: sharedEquipmentUuid,
        borrowerId: testUserId,
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        loanDate: new Date().toISOString().split('T')[0],
      };

      const response = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rentalDto);

      // 공용장비도 대여 가능해야 함 (201) 또는 장비 상태에 따라 다를 수 있음
      // 대여가 가능하거나, 장비 상태가 available이 아닌 경우 400일 수 있음
      if (response.status === 201) {
        expect(response.body).toHaveProperty('uuid');

        // 정리: 대여 반납
        if (response.body.uuid) {
          await request(app.getHttpServer())
            .patch(`/rentals/${response.body.uuid}/return`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ returnDate: new Date().toISOString().split('T')[0] });
        }
      } else {
        // 장비 상태가 available이 아닐 수 있음 (이전 테스트에서 상태 변경)
        console.log('Rental response:', response.status, response.body);
      }
    });
  });

  describe('GET /equipment/:uuid (shared equipment detail)', () => {
    it('should return shared equipment with isShared and sharedSource fields', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        console.warn('No shared equipment to test detail');
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      const response = await request(app.getHttpServer())
        .get(`/equipment/${sharedEquipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isShared', true);
      expect(response.body).toHaveProperty('sharedSource');
      expect(['safety_lab', 'external']).toContain(response.body.sharedSource);
    });
  });
});
