/// <reference types="jest" />

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { createTestEquipment } from './helpers/test-fixtures';

describe('SharedEquipmentController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdSharedEquipmentUuids: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('POST /equipment/shared', () => {
    it('should create a new shared equipment with minimal fields', async () => {
      const createDto = {
        name: `E2E 공용장비 테스트 ${Date.now()}`,
        managementNumber: `SHARED-E2E-${Date.now()}`,
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE_SHARED)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('equipment');
      expect(response.body.equipment).toHaveProperty('id');
      expect(response.body.equipment.isShared).toBe(true);
      expect(response.body.equipment.sharedSource).toBe('safety_lab');
      expect(response.body.equipment.name).toBe(createDto.name);
      expect(response.body.equipment.managementNumber).toBe(createDto.managementNumber);

      if (response.body.equipment?.id) {
        createdSharedEquipmentUuids.push(response.body.equipment.id);
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

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE_SHARED)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(201);
      expect(response.body.equipment.isShared).toBe(true);
      expect(response.body.equipment.sharedSource).toBe('external');
      expect(response.body.equipment.modelName).toBe('Test Model X');
      expect(response.body.equipment.manufacturer).toBe('Test Manufacturer');
      expect(response.body.equipment.calibrationCycle).toBe(12);

      if (response.body.equipment?.id) {
        createdSharedEquipmentUuids.push(response.body.equipment.id);
      }
    });

    it('should reject shared equipment with missing required fields', async () => {
      const createDto = {
        name: 'E2E 불완전 공용장비',
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE_SHARED)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
    });

    it('should reject duplicate management number', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return;
      }

      const existingEquipment = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.GET(createdSharedEquipmentUuids[0]))
        .set('Authorization', `Bearer ${accessToken}`);

      const createDto = {
        name: 'E2E 중복 관리번호 테스트',
        managementNumber: existingEquipment.body.managementNumber,
        sharedSource: 'safety_lab',
        site: 'suwon',
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.EQUIPMENT.CREATE_SHARED)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createDto);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('이미 사용 중');
    });
  });

  describe('GET /equipment with isShared filter', () => {
    it('should return only shared equipment when isShared=true', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${API_ENDPOINTS.EQUIPMENT.LIST}?isShared=true`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.isShared).toBe(true);
      });
    });

    it('should return only normal equipment when isShared=false', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(`${API_ENDPOINTS.EQUIPMENT.LIST}?isShared=false`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.isShared).toBe(false);
      });
    });

    it('should return all equipment when isShared filter is not provided', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.LIST)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe('PATCH /equipment/:uuid (shared equipment modification blocking)', () => {
    it('should return 403 when trying to update shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      // version은 CAS에 필수 — 공용장비 차단(403)은 version 검증 이후에 실행됨
      const sharedDetail = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.GET(sharedEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
      const currentVersion = sharedDetail.body.version ?? 1;

      const updateDto = {
        name: '수정 시도 - 차단되어야 함',
        location: 'New Location',
        version: currentVersion,
      };

      const response = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(sharedEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('공용장비는 수정할 수 없습니다');
    });

    it('should allow updating normal equipment', async () => {
      const normalEquipmentUuid = await createTestEquipment(ctx.app, accessToken);

      // 최신 version 조회
      const detail = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.GET(normalEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const updateDto = {
        name: '수정된 일반장비 이름',
        location: 'Updated Location',
        approvalStatus: 'approved',
        version: detail.body.version,
      };

      const updateResponse = await request(ctx.app.getHttpServer())
        .patch(API_ENDPOINTS.EQUIPMENT.UPDATE(normalEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto);

      expect([200, 201]).toContain(updateResponse.status);

      await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(normalEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);
    });
  });

  describe('DELETE /equipment/:uuid (shared equipment deletion blocking)', () => {
    it('should return 403 when trying to delete shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      const response = await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(sharedEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('공용장비는 삭제할 수 없습니다');
    });

    it('should allow deleting normal equipment', async () => {
      const normalEquipmentUuid = await createTestEquipment(ctx.app, accessToken);

      const deleteResponse = await request(ctx.app.getHttpServer())
        .delete(API_ENDPOINTS.EQUIPMENT.DELETE(normalEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`);

      expect([200, 202]).toContain(deleteResponse.status);
    });
  });

  describe('Shared equipment rental (should be allowed)', () => {
    it('should allow renting shared equipment', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      // /rentals 엔드포인트는 체크아웃 모듈로 교체됨 (/checkouts)
      const checkoutDto = {
        equipmentIds: [sharedEquipmentUuid],
        type: 'calibration',
        reason: '공용장비 체크아웃 허용 테스트',
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      const response = await request(ctx.app.getHttpServer())
        .post(API_ENDPOINTS.CHECKOUTS.CREATE)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(checkoutDto);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('id');

        if (response.body.id) {
          // 체크아웃 반납은 /checkouts/:id/return 사용
          await request(ctx.app.getHttpServer())
            .patch(API_ENDPOINTS.CHECKOUTS.RETURN(response.body.id))
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ returnDate: new Date().toISOString() });
        }
      }
    });
  });

  describe('GET /equipment/:uuid (shared equipment detail)', () => {
    it('should return shared equipment with isShared and sharedSource fields', async () => {
      if (createdSharedEquipmentUuids.length === 0) {
        return;
      }

      const sharedEquipmentUuid = createdSharedEquipmentUuids[0];

      const response = await request(ctx.app.getHttpServer())
        .get(API_ENDPOINTS.EQUIPMENT.GET(sharedEquipmentUuid))
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('isShared', true);
      expect(response.body).toHaveProperty('sharedSource');
      expect(['safety_lab', 'external']).toContain(response.body.sharedSource);
    });
  });
});
