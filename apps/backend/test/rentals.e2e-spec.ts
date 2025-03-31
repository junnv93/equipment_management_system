/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('RentalsController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let equipmentId: string;
  let rentalId: string | null; // null 허용
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

    // 테스트용 장비 생성
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

    const equipmentResponse = await request(app.getHttpServer())
      .post('/equipment')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(equipmentData);

    equipmentId = equipmentResponse.body.id;
  });

  afterAll(async () => {
    // 테스트로 생성된 렌탈 삭제
    if (rentalId) {
      await request(app.getHttpServer())
        .delete(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }

    // 테스트로 생성된 장비 삭제
    if (equipmentId) {
      await request(app.getHttpServer())
        .delete(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }
    
    await app.close();
  });

  describe('/rentals (POST)', () => {
    it('should create new rental', async () => {
      const rentalData = {
        equipmentId: equipmentId,
        startDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7일 후
        purpose: 'Testing purpose',
      };

      const response = await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rentalData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.equipmentId).toBe(equipmentId);
      expect(response.body.status).toBe('ACTIVE');
      expect(response.body.purpose).toBe(rentalData.purpose);

      rentalId = response.body.id;

      // 장비 상태가 IN_USE로 변경되었는지 확인
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(equipmentResponse.body.status).toBe('IN_USE');
    });

    it('should not create rental with invalid data', async () => {
      const invalidRentalData = {
        // equipmentId 누락
        startDate: new Date().toISOString().split('T')[0],
        purpose: 'Invalid rental',
      };

      await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidRentalData)
        .expect(400);
    });

    it('should not create rental for non-available equipment', async () => {
      // 이미 대여 중인 장비에 대한 대여 요청
      const rentalData = {
        equipmentId: equipmentId, // 이미 대여된 장비
        startDate: new Date().toISOString().split('T')[0],
        expectedReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        purpose: 'Second rental attempt',
      };

      await request(app.getHttpServer())
        .post('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(rentalData)
        .expect(400); // 이미 대여 중인 장비는 추가 대여 불가
    });
  });

  describe('/rentals (GET)', () => {
    it('should get rentals list', async () => {
      const response = await request(app.getHttpServer())
        .get('/rentals')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should get rentals list with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/rentals?page=1&pageSize=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(5);
      expect(response.body.items.length).toBeLessThanOrEqual(5);
    });

    it('should get rentals with filters', async () => {
      // 상태로 필터링
      const response = await request(app.getHttpServer())
        .get('/rentals?status=ACTIVE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      
      // 모든 결과가 ACTIVE 상태인지 확인
      response.body.items.forEach(item => {
        expect(item.status).toBe('ACTIVE');
      });
    });
  });

  describe('/rentals/:id (GET)', () => {
    it('should get rental by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(rentalId);
      expect(response.body.equipmentId).toBe(equipmentId);
    });

    it('should return 404 for non-existent rental', async () => {
      await request(app.getHttpServer())
        .get('/rentals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('/rentals/:id/return (POST)', () => {
    it('should return a rental', async () => {
      const response = await request(app.getHttpServer())
        .post(`/rentals/${rentalId}/return`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(rentalId);
      expect(response.body.status).toBe('RETURNED');
      expect(response.body).toHaveProperty('returnDate');

      // 장비 상태가 AVAILABLE로 변경되었는지 확인
      const equipmentResponse = await request(app.getHttpServer())
        .get(`/equipment/${equipmentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(equipmentResponse.body.status).toBe('AVAILABLE');
    });

    it('should not return an already returned rental', async () => {
      await request(app.getHttpServer())
        .post(`/rentals/${rentalId}/return`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400); // 이미 반납된 대여는 다시 반납할 수 없음
    });
  });

  describe('/rentals/:id (DELETE)', () => {
    it('should delete a rental', async () => {
      await request(app.getHttpServer())
        .delete(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 삭제 후 조회 시 404 확인
      await request(app.getHttpServer())
        .get(`/rentals/${rentalId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // ID 초기화
      rentalId = null;
    });

    it('should return 404 for deleting non-existent rental', async () => {
      await request(app.getHttpServer())
        .delete('/rentals/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
}); 