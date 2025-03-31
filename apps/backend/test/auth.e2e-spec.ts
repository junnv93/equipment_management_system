/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
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
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(adminEmail);
      expect(response.body.user.name).toBe('관리자');
      expect(response.body.user.roles).toContain('ADMIN');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login manager with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: managerEmail,
          password: managerPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(managerEmail);
      expect(response.body.user.name).toBe('매니저');
      expect(response.body.user.roles).toContain('MANAGER');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userEmail,
          password: userPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userEmail);
      expect(response.body.user.name).toBe('일반 사용자');
      expect(response.body.user.roles).toContain('USER');
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
      expect(response.body.roles).toContain('ADMIN');
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