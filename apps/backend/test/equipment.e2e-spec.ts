/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('EquipmentController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let createdEquipmentId: string | null;
  const testUserEmail = `test.user.${crypto.randomBytes(4).toString('hex')}@example.com`;
  const testUserPassword = 'Test@123456';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }));
    
    await app.init();

    // 사용자 등록 및 로그인
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: 'Test User',
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    // 테스트로 생성된 장비 정리
    if (createdEquipmentId) {
      await request(app.getHttpServer())
        .delete(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }
    
    await app.close();
  });

  describe('/equipment (POST)', () => {
    it('should create new equipment', async () => {
      const equipmentData = {
        name: `Test Equipment ${crypto.randomBytes(4).toString('hex')}`,
        model: 'Test Model',
        serialNumber: `SN-${crypto.randomBytes(4).toString('hex')}`,
        managementNumber: `MN-${crypto.randomBytes(4).toString('hex')}`,
        status: 'AVAILABLE',
        purchaseDate: new Date().toISOString().split('T')[0],
        category: 'RF',
        manufacturer: 'Test Manufacturer',
        location: 'Test Location',
        description: 'Test Description',
      };

      const response = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(equipmentData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(equipmentData.name);
      expect(response.body.status).toBe(equipmentData.status);

      createdEquipmentId = response.body.id;
    });

    it('should not create equipment with invalid data', async () => {
      const invalidEquipmentData = {
        // 필수 필드 누락
        model: 'Invalid Model',
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEquipmentData)
        .expect(400);
    });

    it('should not create equipment without authentication', async () => {
      const equipmentData = {
        name: 'Test Equipment',
        model: 'Test Model',
        serialNumber: 'SN-12345',
        managementNumber: 'MN-12345',
        status: 'AVAILABLE',
        purchaseDate: new Date().toISOString().split('T')[0],
        category: 'RF',
        manufacturer: 'Test Manufacturer',
        location: 'Test Location',
      };

      await request(app.getHttpServer())
        .post('/equipment')
        .send(equipmentData)
        .expect(401);
    });
  });

  describe('/equipment (GET)', () => {
    it('should get equipment list', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('pageSize');
    });

    it('should get equipment list with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/equipment?page=1&pageSize=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('should get equipment list with filters', async () => {
      // 상태로 필터링
      const response = await request(app.getHttpServer())
        .get('/equipment?status=AVAILABLE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      
      // 모든 결과가 AVAILABLE 상태인지 확인
      response.body.items.forEach(item => {
        expect(item.status).toBe('AVAILABLE');
      });
    });

    it('should get equipment list with search term', async () => {
      // 생성한 장비의 이름으로 검색
      const equipmentName = `Test Equipment`;
      
      const response = await request(app.getHttpServer())
        .get(`/equipment?search=${equipmentName}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      
      // 검색어가 이름에 포함된 결과가 있는지 확인
      if (response.body.items.length > 0) {
        expect(response.body.items.some(item => 
          item.name.includes(equipmentName)
        )).toBe(true);
      }
    });
  });

  describe('/equipment/:id (GET)', () => {
    it('should get equipment by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(createdEquipmentId);
    });

    it('should return 404 for non-existent equipment', async () => {
      await request(app.getHttpServer())
        .get('/equipment/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/equipment/:id (PATCH)', () => {
    it('should update equipment', async () => {
      const updateData = {
        status: 'IN_USE',
        description: 'Updated Description',
      };

      const response = await request(app.getHttpServer())
        .patch(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(createdEquipmentId);
      expect(response.body.status).toBe(updateData.status);
      expect(response.body.description).toBe(updateData.description);
    });

    it('should not update equipment with invalid data', async () => {
      const invalidUpdateData = {
        status: 'INVALID_STATUS',
      };

      await request(app.getHttpServer())
        .patch(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('/equipment/:id (DELETE)', () => {
    it('should delete equipment', async () => {
      await request(app.getHttpServer())
        .delete(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 삭제 후 조회 시 404 확인
      await request(app.getHttpServer())
        .get(`/equipment/${createdEquipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // 삭제 여부를 확인했으므로 ID 초기화
      createdEquipmentId = null;
    });

    it('should return 404 for deleting non-existent equipment', async () => {
      await request(app.getHttpServer())
        .delete('/equipment/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
}); 