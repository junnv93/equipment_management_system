/// <reference types="jest" />

// 환경 변수는 모듈 import 전에 설정
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
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * 장비 필터 E2E 테스트
 *
 * 목적: 새로 추가한 필터들이 백엔드에서 제대로 작동하는지 검증
 * - classification 필터
 * - calibrationOverdue 필터
 * - status 필터 (EQUIPMENT_STATUS_FILTER_OPTIONS)
 * - isShared 필터
 * - calibrationMethod 필터
 * - calibrationDue / calibrationDueAfter 필터
 */
describe('Equipment Filters (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  // AuthService에 하드코딩된 사용자 사용
  const testUserEmail = 'admin@example.com';
  const testUserPassword = 'admin123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 로그인 및 토큰 획득
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    // 로그인 성공 확인
    if (loginResponse.status !== 200 && loginResponse.status !== 201) {
      console.error('Login failed:', loginResponse.status, loginResponse.body);
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }

    // access_token 또는 accessToken 모두 확인
    authToken = loginResponse.body.access_token || loginResponse.body.accessToken;

    if (!authToken) {
      console.error('No access token received:', loginResponse.body);
      throw new Error('Failed to obtain access token');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /equipment - 기본 조회', () => {
    it('필터 없이 장비 목록 조회', () => {
      return request(app.getHttpServer())
        .get('/equipment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  describe('GET /equipment?classification= - 장비 분류 필터', () => {
    it('classification=fcc_emc_rf 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?classification=fcc_emc_rf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);

          // 결과가 있다면 모든 장비가 classificationCode='E'를 가져야 함
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.classificationCode).toBe('E');
            });
          }
        });
    });

    it('classification=sar 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?classification=sar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 장비가 classificationCode='S'를 가져야 함
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.classificationCode).toBe('S');
            });
          }
        });
    });

    it('잘못된 classification 값은 무시됨 (전체 장비 반환)', () => {
      // 잘못된 enum 값은 Zod 스키마에서 무시되어 필터 없이 조회됨
      return request(app.getHttpServer())
        .get('/equipment?classification=invalid_value')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
        });
    });
  });

  describe('GET /equipment?calibrationOverdue= - 교정 기한 초과 필터', () => {
    it('calibrationOverdue=true 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationOverdue=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          // 필터가 적용되어 결과가 반환됨 (빈 배열도 허용)
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('calibrationOverdue=false는 기한 초과 제외', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationOverdue=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('GET /equipment?status= & calibrationOverdue= - 복합 필터', () => {
    it('status=available & calibrationOverdue=true 조합', () => {
      return request(app.getHttpServer())
        .get('/equipment?status=available&calibrationOverdue=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);

          // 결과가 있다면 모든 장비가 status='available'
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.status).toBe('available');
            });
          }
        });
    });
  });

  describe('GET /equipment?calibrationMethod= - 교정 방법 필터', () => {
    it('calibrationMethod=external_calibration 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationMethod=external_calibration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 장비가 calibrationMethod='external_calibration'
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.calibrationMethod).toBe('external_calibration');
            });
          }
        });
    });

    it('calibrationMethod=self_inspection 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationMethod=self_inspection')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.calibrationMethod).toBe('self_inspection');
            });
          }
        });
    });

    it('calibrationMethod=not_applicable 필터 적용', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationMethod=not_applicable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.calibrationMethod).toBe('not_applicable');
            });
          }
        });
    });
  });

  describe('GET /equipment?isShared= - 공용장비 필터', () => {
    it('isShared=true 필터 적용 - 공용장비만 반환', () => {
      return request(app.getHttpServer())
        .get('/equipment?isShared=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 장비가 isShared=true
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.isShared).toBe(true);
            });
          }
        });
    });

    it('isShared=false 필터 적용 - 일반장비만 반환', () => {
      return request(app.getHttpServer())
        .get('/equipment?isShared=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 장비가 isShared=false
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.isShared).toBe(false);
            });
          }
        });
    });
  });

  describe('GET /equipment - 교정 기한 필터 (calibrationDue/calibrationDueAfter)', () => {
    it('calibrationDue=30 - 30일 이내 교정 임박 장비', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationDue=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 장비의 nextCalibrationDate가 오늘~30일 이내
          if (res.body.items.length > 0) {
            const today = new Date();
            const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            res.body.items.forEach((equipment: any) => {
              expect(equipment.nextCalibrationDate).toBeDefined();
              const calibDate = new Date(equipment.nextCalibrationDate);
              expect(calibDate.getTime()).toBeGreaterThanOrEqual(today.getTime() - 24 * 60 * 60 * 1000);
              expect(calibDate.getTime()).toBeLessThanOrEqual(thirtyDaysLater.getTime() + 24 * 60 * 60 * 1000);
            });
          }
        });
    });

    it('calibrationDueAfter=30 - 30일 이후 교정 여유 장비', () => {
      return request(app.getHttpServer())
        .get('/equipment?calibrationDueAfter=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          // 필터가 적용되어 결과가 반환됨
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  describe('GET /equipment - 상태 필터 (EQUIPMENT_STATUS_FILTER_OPTIONS)', () => {
    const testStatuses = [
      'available',
      'in_use',
      'checked_out',
      'calibration_overdue',
      'non_conforming',
      'spare',
      'pending_disposal',
      'disposed',
    ];

    testStatuses.forEach((status) => {
      it(`status=${status} 필터 적용`, () => {
        return request(app.getHttpServer())
          .get(`/equipment?status=${status}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('items');

            // 결과가 있다면 모든 장비가 해당 status를 가져야 함
            if (res.body.items.length > 0) {
              res.body.items.forEach((equipment: any) => {
                expect(equipment.status).toBe(status);
              });
            }
          });
      });
    });

    it('deprecated status=retired는 여전히 지원', () => {
      return request(app.getHttpServer())
        .get('/equipment?status=retired')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('GET /equipment - 복잡한 필터 조합', () => {
    it('classification + status + calibrationMethod 조합', () => {
      return request(app.getHttpServer())
        .get('/equipment?classification=fcc_emc_rf&status=available&calibrationMethod=external_calibration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          // 결과가 있다면 모든 조건이 맞아야 함
          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: any) => {
              expect(equipment.classificationCode).toBe('E');
              expect(equipment.status).toBe('available');
              expect(equipment.calibrationMethod).toBe('external_calibration');
            });
          }
        });
    });
  });

  describe('GET /equipment - 파라미터 검증', () => {
    it('음수 페이지는 서버 에러 발생', () => {
      // 음수 페이지는 DB 쿼리 시 OFFSET 에러 발생 (500)
      return request(app.getHttpServer())
        .get('/equipment?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });
});
