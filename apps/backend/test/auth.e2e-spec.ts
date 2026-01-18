/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';
  const managerEmail = 'manager@example.com';
  const managerPassword = 'manager123';
  const userEmail = 'user@example.com';
  const userPassword = 'user123';

  beforeAll(async () => {
    // 테스트 환경 변수 설정
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-e2e-testing';
    process.env.NODE_ENV = 'test';

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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should login admin with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(adminEmail);
      expect(response.body.user.name).toBe('관리자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('site_admin');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login manager with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: managerEmail,
          password: managerPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(managerEmail);
      expect(response.body.user.name).toBe('기술책임자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('technical_manager');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userEmail);
      expect(response.body.user.name).toBe('시험실무자');
      expect(response.body.user.site).toBe('suwon');
      expect(response.body.user.location).toBe('수원랩');
      expect(response.body.user.roles).toContain('test_operator');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should not login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: 'wrongpassword',
        })
        .expect(401); // Unauthorized
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      // 테스트를 위한 로그인
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        });

      accessToken = response.body.access_token;
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(adminEmail);
      expect(response.body.roles).toContain('site_admin');
    });

    it('should not get user profile without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401); // Unauthorized
    });

    it('should not get user profile with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401); // Unauthorized
    });
  });

  describe('/auth/test (GET)', () => {
    it('should return test message', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/test')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // Azure AD 로그인 테스트는 실제 Azure AD 인증이 필요하므로 E2E 테스트에서는 생략
  // 이 부분은 단위 테스트나 통합 테스트로 별도 테스트
}); 