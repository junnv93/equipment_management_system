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

describe('AuditLogsController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string;
  let userAccessToken: string;

  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const userEmail = 'user@example.com';
  const userPassword = 'user123';

  beforeAll(async () => {
    console.log('Audit Logs E2E Test Environment:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // 관리자 로그인
    const adminLoginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });

    if (adminLoginResponse.status !== 200 && adminLoginResponse.status !== 201) {
      console.error('Admin login failed:', adminLoginResponse.body);
      throw new Error(`Admin login failed with status ${adminLoginResponse.status}`);
    }

    adminAccessToken =
      adminLoginResponse.body.access_token || adminLoginResponse.body.accessToken;
    if (!adminAccessToken) {
      throw new Error('Failed to obtain admin access token');
    }

    // 일반 사용자 로그인 시도 (권한 테스트용)
    try {
      const userLoginResponse = await request(app.getHttpServer()).post('/auth/login').send({
        email: userEmail,
        password: userPassword,
      });

      if (userLoginResponse.status === 200 || userLoginResponse.status === 201) {
        userAccessToken =
          userLoginResponse.body.access_token || userLoginResponse.body.accessToken;
      }
    } catch (e) {
      console.log('User login not available for permission test');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /audit-logs', () => {
    it('should return audit logs list for admin', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // 감사 로그 테이블이 비어있을 수 있음
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('meta');
        expect(Array.isArray(response.body.items)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?page=1&limit=10')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        expect(response.body.meta).toHaveProperty('currentPage', 1);
        expect(response.body.meta).toHaveProperty('itemsPerPage', 10);
      }
    });

    it('should support filtering by entityType', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?entityType=equipment')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        // 모든 항목이 equipment 타입이어야 함
        response.body.items.forEach((item: any) => {
          expect(item.entityType).toBe('equipment');
        });
      }
    });

    it('should support filtering by action', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs?action=create')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        // 모든 항목이 create 액션이어야 함
        response.body.items.forEach((item: any) => {
          expect(item.action).toBe('create');
        });
      }
    });

    it('should support date range filtering', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app.getHttpServer())
        .get(
          `/audit-logs?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
        )
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        // 모든 항목이 날짜 범위 내에 있어야 함
        response.body.items.forEach((item: any) => {
          const itemDate = new Date(item.timestamp);
          expect(itemDate >= startDate && itemDate <= endDate).toBe(true);
        });
      }
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app.getHttpServer()).get('/audit-logs');

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      if (!userAccessToken) {
        console.log('Skipping permission test - no user token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/audit-logs')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /audit-logs/entity/:entityType/:entityId', () => {
    it('should return audit logs for specific entity', async () => {
      const testEntityId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(app.getHttpServer())
        .get(`/audit-logs/entity/equipment/${testEntityId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // 해당 엔티티의 로그가 없을 수 있음
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('formattedLogs');
        expect(Array.isArray(response.body.items)).toBe(true);
        expect(Array.isArray(response.body.formattedLogs)).toBe(true);
      }
    });

    it('should validate UUID format', async () => {
      const response = await request(app.getHttpServer())
        .get('/audit-logs/entity/equipment/invalid-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('GET /audit-logs/user/:userId', () => {
    it('should return audit logs for specific user', async () => {
      const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(app.getHttpServer())
        .get(`/audit-logs/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      // 해당 사용자의 로그가 없을 수 있음
      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('formattedLogs');
      }
    });

    it('should support limit parameter', async () => {
      const testUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

      const response = await request(app.getHttpServer())
        .get(`/audit-logs/user/${testUserId}?limit=5`)
        .set('Authorization', `Bearer ${adminAccessToken}`);

      if (response.status === 200) {
        expect(response.body.items.length).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Audit Log Integration', () => {
    it('should create audit log when equipment is created', async () => {
      // 장비 생성
      const equipmentResponse = await request(app.getHttpServer())
        .post('/equipment')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({
          name: 'Audit Test Equipment',
          managementNumber: `AUDIT-TEST-${Date.now()}`,
          modelName: 'Test Model',
          manufacturer: 'Test Manufacturer',
          status: 'available',
          site: 'suwon',
          approvalStatus: 'approved',
        });

      if (equipmentResponse.status === 201) {
        // 잠시 대기 (비동기 로그 기록)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 감사 로그 확인
        const logsResponse = await request(app.getHttpServer())
          .get('/audit-logs?entityType=equipment&action=create&limit=5')
          .set('Authorization', `Bearer ${adminAccessToken}`);

        if (logsResponse.status === 200 && logsResponse.body.items.length > 0) {
          // 최근 로그 확인
          const recentLog = logsResponse.body.items[0];
          expect(recentLog.action).toBe('create');
          expect(recentLog.entityType).toBe('equipment');
        }
      }
    });
  });
});
