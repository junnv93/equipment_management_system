/// <reference types="jest" />

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import * as crypto from 'crypto';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let adminAccessToken: string | undefined = undefined;
  let userAccessToken: string;
  let userId: string;
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin@123456';
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

    // 관리자 로그인
    try {
      const adminLoginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminEmail,
          password: adminPassword,
        });

      adminAccessToken = adminLoginResponse.body.accessToken;
    } catch (error) {
      console.log('Admin login failed, may need to create admin account first');
    }

    // 테스트 사용자 등록 및 로그인
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testUserEmail,
        password: testUserPassword,
        name: 'Test User',
      });

    const userLoginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    userAccessToken = userLoginResponse.body.accessToken;
    userId = userLoginResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should get users list if admin', async () => {
      // 관리자 토큰이 없는 경우 테스트 스킵
      if (!adminAccessToken) {
        console.log('Skipping admin test - no admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('should not allow non-admin to get users list', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });
  });

  describe('/users/profile (GET)', () => {
    it('should get own profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe(testUserEmail);
      expect(response.body).toHaveProperty('name');
      expect(response.body).not.toHaveProperty('password'); // 비밀번호 필드는 반환하지 않아야 함
    });

    it('should not get profile without authentication', async () => {
      await request(app.getHttpServer())
        .get('/users/profile')
        .expect(401);
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id if admin', async () => {
      // 관리자 토큰이 없는 경우 테스트 스킵
      if (!adminAccessToken) {
        console.log('Skipping admin test - no admin token available');
        return;
      }

      const response = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe(testUserEmail);
    });

    it('should not allow non-admin to get other user by id', async () => {
      await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });
  });

  describe('/users/profile (PATCH)', () => {
    it('should update own profile', async () => {
      const updatedName = `Updated Name ${crypto.randomBytes(4).toString('hex')}`;
      const updateData = {
        name: updatedName,
      };

      const response = await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(updatedName);
      expect(response.body.email).toBe(testUserEmail);
    });

    it('should not update profile with invalid data', async () => {
      const invalidUpdateData = {
        email: 'invalid-email', // 유효하지 않은 이메일 형식
      };

      await request(app.getHttpServer())
        .patch('/users/profile')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(invalidUpdateData)
        .expect(400);
    });
  });

  describe('/users/change-password (POST)', () => {
    it('should change user password', async () => {
      const newPassword = `NewPass@${crypto.randomBytes(4).toString('hex')}`;
      const changePasswordData = {
        currentPassword: testUserPassword,
        newPassword: newPassword,
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(changePasswordData)
        .expect(200);

      // 새 비밀번호로 로그인 시도
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUserEmail,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
    });

    it('should not change password with incorrect current password', async () => {
      const changePasswordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewSecurePassword123!',
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(changePasswordData)
        .expect(400);
    });

    it('should not change password to weak password', async () => {
      const changePasswordData = {
        currentPassword: testUserPassword,
        newPassword: 'weak', // 취약한 비밀번호
      };

      await request(app.getHttpServer())
        .post('/users/change-password')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(changePasswordData)
        .expect(400);
    });
  });

  // 관리자 권한을 가진 경우에만 아래 테스트 수행
  if (adminAccessToken) {
    describe('/users/:id (PATCH) - Admin', () => {
      it('should update user as admin', async () => {
        const updatedName = `Admin Updated ${crypto.randomBytes(4).toString('hex')}`;
        const updateData = {
          name: updatedName,
          role: 'USER',
        };

        const response = await request(app.getHttpServer())
          .patch(`/users/${userId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.id).toBe(userId);
        expect(response.body.name).toBe(updatedName);
      });
    });

    describe('/users/:id (DELETE) - Admin', () => {
      it('should delete user as admin', async () => {
        // 테스트용 새 사용자 생성
        const tempUserEmail = `temp.user.${crypto.randomBytes(4).toString('hex')}@example.com`;
        const tempUserPassword = 'Temp@123456';
        
        // 사용자 등록
        const registerResponse = await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: tempUserEmail,
            password: tempUserPassword,
            name: 'Temporary User',
          });
        
        const tempUserId = registerResponse.body.id;
        
        // 어드민으로 사용자 삭제
        await request(app.getHttpServer())
          .delete(`/users/${tempUserId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(200);
        
        // 삭제 확인
        await request(app.getHttpServer())
          .get(`/users/${tempUserId}`)
          .set('Authorization', `Bearer ${adminAccessToken}`)
          .expect(404);
      });
    });
  }
}); 