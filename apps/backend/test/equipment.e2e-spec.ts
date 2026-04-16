/// <reference types="jest" />

import request from 'supertest';
import * as crypto from 'crypto';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

describe('EquipmentController (e2e)', () => {
  let ctx: TestAppContext;
  let accessToken: string;
  const createdEquipmentIds: string[] = [];

  beforeAll(async () => {
    ctx = await createTestApp();
    accessToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    if (ctx?.app && accessToken) {
      try {
        const listResponse = await request(ctx.app.getHttpServer())
          .get('/equipment')
          .set('Authorization', `Bearer ${accessToken}`);

        if (listResponse.status === 200 && listResponse.body.items) {
          for (const id of createdEquipmentIds) {
            const equipment = listResponse.body.items.find(
              (item: Record<string, unknown>) => String(item.id) === id,
            );
            if (equipment && equipment.id) {
              try {
                await request(ctx.app.getHttpServer())
                  .delete(`/equipment/${equipment.id}`)
                  .set('Authorization', `Bearer ${accessToken}`);
              } catch {
                // 이미 삭제된 경우 무시
              }
            }
          }
        }
      } catch {
        // 정리 실패는 무시
      }
    }

    await closeTestApp(ctx?.app);
  });

  describe('/equipment (POST)', () => {
    it('should create new equipment with minimal required fields', async () => {
      const equipmentData = {
        name: `Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
        status: 'available',
        site: 'suwon',
        initialLocation: 'Test Location',
        approvalStatus: 'approved',
      };

      const response = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData);

      expect(response.status).toBe(201);
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
        managementMethod: 'external_calibration',
        purchaseYear: 2023,
        supplier: 'Test Supplier',
        contactInfo: 'test@example.com',
        firmwareVersion: 'v2.0.0',
        manualLocation: '/manuals/test.pdf',
        accessories: 'Test Accessories',
        technicalManager: 'Test Manager',
        status: 'available',
        site: 'suwon',
        initialLocation: 'Test Location',
        approvalStatus: 'approved',
      };

      const response = await request(ctx.app.getHttpServer())
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
        modelName: 'Invalid Model',
        status: 'available',
      };

      await request(ctx.app.getHttpServer())
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
        site: 'suwon',
        initialLocation: 'Test Location',
        approvalStatus: 'approved',
      };

      const firstResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(201);

      createdEquipmentIds.push(firstResponse.body.id.toString());

      await request(ctx.app.getHttpServer())
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

      await request(ctx.app.getHttpServer())
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

      await request(ctx.app.getHttpServer()).post('/equipment').send(equipmentData).expect(401);
    });
  });

  describe('/equipment (GET)', () => {
    it('should get equipment list', async () => {
      const response = await request(ctx.app.getHttpServer())
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
      const response = await request(ctx.app.getHttpServer())
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
      const response = await request(ctx.app.getHttpServer())
        .get('/equipment?status=available')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('available');
      });
    });

    it('should get equipment list with search term', async () => {
      const equipmentName = 'Test Equipment';

      const response = await request(ctx.app.getHttpServer())
        .get(`/equipment?search=${encodeURIComponent(equipmentName)}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      if (response.body.items.length > 0) {
        expect(
          response.body.items.some((item: Record<string, unknown>) =>
            (item.name as string).includes(equipmentName),
          ),
        ).toBe(true);
      }
    });

    it('should get equipment list with multiple filters', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get('/equipment?status=available&page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta.itemsPerPage).toBe(10);

      response.body.items.forEach((item: Record<string, unknown>) => {
        expect(item.status).toBe('available');
      });
    });
  });

  describe('/equipment/:uuid (GET)', () => {
    it('should get equipment by uuid', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Get Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      const response = await request(ctx.app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(equipmentUuid);
      expect(response.body.name).toBe(createResponse.body.name);
    });

    it('should return 404 for non-existent equipment', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(ctx.app.getHttpServer())
        .get(`/equipment/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const testUuid = '00000000-0000-0000-0000-000000000000';
      await request(ctx.app.getHttpServer()).get(`/equipment/${testUuid}`).expect(401);
    });
  });

  describe('/equipment/:uuid (PATCH)', () => {
    it('should update equipment with partial data', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Update Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      const updateData = {
        status: 'spare' as const,
        description: 'Updated Description',
        location: 'Updated Location',
        approvalStatus: 'approved',
        version: createResponse.body.version ?? 1,
      };

      const response = await request(ctx.app.getHttpServer())
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
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Calibration Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      const updateData = {
        calibrationCycle: 12,
        lastCalibrationDate: new Date('2024-01-01').toISOString(),
        nextCalibrationDate: new Date('2025-01-01').toISOString(),
        calibrationAgency: 'Test Agency',
        needsIntermediateCheck: true,
        managementMethod: 'external_calibration',
        approvalStatus: 'approved',
        version: createResponse.body.version ?? 1,
      };

      const response = await request(ctx.app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.calibrationCycle).toBe(updateData.calibrationCycle);
      expect(response.body.needsIntermediateCheck).toBe(updateData.needsIntermediateCheck);
      expect(response.body.managementMethod).toBe(updateData.managementMethod);
    });

    it('should not update equipment with invalid status', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Invalid Update Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      const invalidUpdateData = {
        status: 'INVALID_STATUS',
        version: createResponse.body.version ?? 1,
      };

      await request(ctx.app.getHttpServer())
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
      await request(ctx.app.getHttpServer())
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
      await request(ctx.app.getHttpServer())
        .patch(`/equipment/${testUuid}`)
        .send(updateData)
        .expect(401);
    });
  });

  describe('/equipment/:uuid (DELETE)', () => {
    it('should delete equipment', async () => {
      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: `Delete Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
          managementNumber: `MN-${crypto.randomBytes(8).toString('hex')}`,
          status: 'available',
          site: 'suwon',
          initialLocation: 'Test Location',
          approvalStatus: 'approved',
        })
        .expect(201);

      const equipmentUuid = createResponse.body.id;

      const deleteResponse = await request(ctx.app.getHttpServer())
        .delete(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(deleteResponse.body).toHaveProperty('message', '장비가 삭제되었습니다.');

      await request(ctx.app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for deleting non-existent equipment', async () => {
      const nonExistentUuid = '00000000-0000-0000-0000-000000000000';
      await request(ctx.app.getHttpServer())
        .delete(`/equipment/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 401 without authentication', async () => {
      const testUuid = '00000000-0000-0000-0000-000000000000';
      await request(ctx.app.getHttpServer()).delete(`/equipment/${testUuid}`).expect(401);
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
        initialLocation: 'CRUD Location',
        status: 'available',
        site: 'suwon',
        approvalStatus: 'approved',
      };

      const createResponse = await request(ctx.app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createData)
        .expect(201);

      const equipmentUuid = createResponse.body.id;
      createdEquipmentIds.push(createResponse.body.id.toString());

      expect(createResponse.body.name).toBe(createData.name);
      expect(createResponse.body.managementNumber).toBe(createData.managementNumber);

      // 2. READ
      const readResponse = await request(ctx.app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(readResponse.body.id).toBe(equipmentUuid);
      expect(readResponse.body.name).toBe(createData.name);

      // 3. UPDATE
      const updateData = {
        name: 'Updated CRUD Equipment Name',
        location: 'Updated CRUD Location',
        status: 'spare' as const,
        approvalStatus: 'approved',
        version: createResponse.body.version ?? 1,
      };

      const updateResponse = await request(ctx.app.getHttpServer())
        .patch(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.location).toBe(updateData.location);
      expect(updateResponse.body.status).toBe(updateData.status);

      // 4. READ (목록 조회에서 업데이트된 데이터 확인)
      const listResponse = await request(ctx.app.getHttpServer())
        .get(`/equipment?search=${encodeURIComponent(updateData.name)}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const foundEquipment = listResponse.body.items.find(
        (item: Record<string, unknown>) => item.id === equipmentUuid,
      );
      expect(foundEquipment).toBeDefined();
      expect(foundEquipment.name).toBe(updateData.name);

      // 5. DELETE
      const deleteResponse = await request(ctx.app.getHttpServer())
        .delete(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(202);

      expect(deleteResponse.body).toHaveProperty('message', '장비가 삭제되었습니다.');

      await request(ctx.app.getHttpServer())
        .get(`/equipment/${equipmentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      const index = createdEquipmentIds.indexOf(createResponse.body.id.toString());
      if (index > -1) {
        createdEquipmentIds.splice(index, 1);
      }
    });
  });
});
