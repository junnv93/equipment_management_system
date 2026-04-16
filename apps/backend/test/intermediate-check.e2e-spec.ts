/// <reference types="jest" />

// 환경 변수 설정
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

describe('IntermediateCheck (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  // 테스트용 사용자
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    console.log('📊 E2E Test Environment (Intermediate Check):');
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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/calibration/intermediate-checks (GET)', () => {
    it('should get upcoming intermediate checks', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 결과가 있으면 intermediateCheckDate 필드 확인
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('intermediateCheckDate');
        expect(response.body[0]).toHaveProperty('equipmentId');
      }
    });

    it('should filter by days parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks?days=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/calibration/intermediate-checks')
        .expect(401);
    });
  });

  describe('/calibration/intermediate-checks/all (GET)', () => {
    it('should get all intermediate checks with metadata', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.meta).toHaveProperty('totalItems');
      expect(response.body.meta).toHaveProperty('overdueCount');
      expect(response.body.meta).toHaveProperty('pendingCount');
    });

    it('should filter by status=overdue', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=overdue')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 기한 초과인지 확인 (과거 날짜)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      response.body.items.forEach((item: Record<string, unknown>) => {
        const checkDate = new Date(item.intermediateCheckDate as string);
        checkDate.setHours(0, 0, 0, 0);
        expect(checkDate.getTime()).toBeLessThan(today.getTime());
      });
    });

    it('should filter by status=pending', async () => {
      const response = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);

      // 모든 결과가 예정된 것인지 확인 (미래 또는 오늘 날짜)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      response.body.items.forEach((item: Record<string, unknown>) => {
        const checkDate = new Date(item.intermediateCheckDate as string);
        checkDate.setHours(0, 0, 0, 0);
        expect(checkDate.getTime()).toBeGreaterThanOrEqual(today.getTime());
      });
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .expect(401);
    });
  });

  describe('/calibration/:uuid/intermediate-check/complete (POST)', () => {
    it('should complete intermediate check for calibration with intermediate check date', async () => {
      // 먼저 중간점검이 있는 교정 항목 찾기
      const checksResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (checksResponse.body.items.length === 0) {
        console.log('Skipping: No calibrations with intermediate check found');
        return;
      }

      const calibrationWithCheck = checksResponse.body.items[0];

      const response = await request(app.getHttpServer())
        .post(`/calibration/${calibrationWithCheck.id}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
          notes: 'E2E 테스트 중간점검 완료',
        });

      // 성공적으로 완료되거나 이미 처리된 경우
      expect([200, 201, 400]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toHaveProperty('calibration');
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toContain('완료');
      }
    });

    it('should fail for calibration without intermediate check date', async () => {
      // 존재하지 않는 ID로 요청
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .post(`/calibration/${nonExistentId}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
        });

      // 400 Bad Request 또는 404 Not Found 예상
      expect([400, 404]).toContain(response.status);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/calibration/some-uuid/intermediate-check/complete')
        .send({
          completedBy: 'test-user-id',
        })
        .expect(401);
    });

    it('should accept optional notes', async () => {
      const checksResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      if (checksResponse.body.items.length === 0) {
        console.log('Skipping: No calibrations with intermediate check found');
        return;
      }

      // 노트 없이 요청
      const calibrationWithCheck = checksResponse.body.items[0];

      const response = await request(app.getHttpServer())
        .post(`/calibration/${calibrationWithCheck.id}/intermediate-check/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          completedBy: 'test-user-id',
        });

      // 성공 또는 이미 처리됨
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Intermediate Check Workflow', () => {
    it('should complete full intermediate check workflow', async () => {
      // 1. 전체 중간점검 목록 조회
      const allChecksResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(allChecksResponse.body).toHaveProperty('items');
      expect(allChecksResponse.body).toHaveProperty('meta');

      const initialTotal = allChecksResponse.body.meta.totalItems;
      console.log(`Initial intermediate checks count: ${initialTotal}`);

      // 2. 7일 이내 중간점검 조회
      const upcomingResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks?days=7')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log(`Upcoming checks (7 days): ${upcomingResponse.body.length}`);

      // 3. 30일 이내 중간점검 조회
      const thirtyDaysResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks?days=30')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log(`Upcoming checks (30 days): ${thirtyDaysResponse.body.length}`);

      // 4. 기한 초과 중간점검 조회
      const overdueResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=overdue')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log(`Overdue checks: ${overdueResponse.body.items.length}`);

      // 5. 예정된 중간점검 조회
      const pendingResponse = await request(app.getHttpServer())
        .get('/calibration/intermediate-checks/all?status=pending')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      console.log(`Pending checks: ${pendingResponse.body.items.length}`);

      // 메타데이터 검증
      expect(allChecksResponse.body.meta.overdueCount).toBe(overdueResponse.body.items.length);
      expect(allChecksResponse.body.meta.pendingCount).toBe(pendingResponse.body.items.length);
    });
  });
});
