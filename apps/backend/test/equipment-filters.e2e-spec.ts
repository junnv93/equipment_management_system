/// <reference types="jest" />

import request from 'supertest';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';

/**
 * 장비 필터 E2E 테스트
 *
 * 목적: 새로 추가한 필터들이 백엔드에서 제대로 작동하는지 검증
 * - classification 필터
 * - calibrationOverdue 필터
 * - status 필터 (EQUIPMENT_STATUS_FILTER_OPTIONS)
 * - isShared 필터
 * - managementMethod 필터
 * - calibrationDue / calibrationDueAfter 필터
 */
describe('Equipment Filters (e2e)', () => {
  let ctx: TestAppContext;
  let authToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    authToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('GET /equipment - 기본 조회', () => {
    it('필터 없이 장비 목록 조회', () => {
      return request(ctx.app.getHttpServer())
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
      return request(ctx.app.getHttpServer())
        .get('/equipment?classification=fcc_emc_rf')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.classificationCode).toBe('E');
            });
          }
        });
    });

    it('classification=sar 필터 적용', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?classification=sar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.classificationCode).toBe('S');
            });
          }
        });
    });

    it('잘못된 classification 값은 무시됨 (전체 장비 반환)', () => {
      return request(ctx.app.getHttpServer())
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
      return request(ctx.app.getHttpServer())
        .get('/equipment?calibrationOverdue=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('calibrationOverdue=false는 기한 초과 제외', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?calibrationOverdue=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('GET /equipment?status= & calibrationOverdue= - 복합 필터', () => {
    it('status=available & calibrationOverdue=true 조합', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?status=available&calibrationOverdue=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.status).toBe('available');
            });
          }
        });
    });
  });

  describe('GET /equipment?managementMethod= - 교정 방법 필터', () => {
    it('managementMethod=external_calibration 필터 적용', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?managementMethod=external_calibration')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.managementMethod).toBe('external_calibration');
            });
          }
        });
    });

    it('managementMethod=self_inspection 필터 적용', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?managementMethod=self_inspection')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.managementMethod).toBe('self_inspection');
            });
          }
        });
    });

    it('managementMethod=not_applicable 필터 적용', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?managementMethod=not_applicable')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.managementMethod).toBe('not_applicable');
            });
          }
        });
    });
  });

  describe('GET /equipment?isShared= - 공용장비 필터', () => {
    it('isShared=true 필터 적용 - 공용장비만 반환', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?isShared=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.isShared).toBe(true);
            });
          }
        });
    });

    it('isShared=false 필터 적용 - 일반장비만 반환', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?isShared=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.isShared).toBe(false);
            });
          }
        });
    });
  });

  describe('GET /equipment - 교정 기한 필터 (calibrationDue/calibrationDueAfter)', () => {
    it('calibrationDue=30 - 30일 이내 교정 임박 장비', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?calibrationDue=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            const today = new Date();
            const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.nextCalibrationDate).toBeDefined();
              const calibDate = new Date(equipment.nextCalibrationDate as string);
              expect(calibDate.getTime()).toBeGreaterThanOrEqual(
                today.getTime() - 24 * 60 * 60 * 1000,
              );
              expect(calibDate.getTime()).toBeLessThanOrEqual(
                thirtyDaysLater.getTime() + 24 * 60 * 60 * 1000,
              );
            });
          }
        });
    });

    it('calibrationDueAfter=30 - 30일 이후 교정 여유 장비', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?calibrationDueAfter=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  describe('GET /equipment - 상태 필터 (EQUIPMENT_STATUS_FILTER_OPTIONS)', () => {
    const testStatuses = [
      'available',
      'checked_out',
      'calibration_overdue',
      'non_conforming',
      'spare',
      'pending_disposal',
      'disposed',
    ];

    testStatuses.forEach((status) => {
      it(`status=${status} 필터 적용`, () => {
        return request(ctx.app.getHttpServer())
          .get(`/equipment?status=${status}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('items');

            if (res.body.items.length > 0) {
              res.body.items.forEach((equipment: Record<string, unknown>) => {
                expect(equipment.status).toBe(status);
              });
            }
          });
      });
    });

    it('deprecated status=retired는 여전히 지원', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?status=retired')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('GET /equipment - 복잡한 필터 조합', () => {
    it('classification + status + managementMethod 조합', () => {
      return request(ctx.app.getHttpServer())
        .get(
          '/equipment?classification=fcc_emc_rf&status=available&managementMethod=external_calibration',
        )
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');

          if (res.body.items.length > 0) {
            res.body.items.forEach((equipment: Record<string, unknown>) => {
              expect(equipment.classificationCode).toBe('E');
              expect(equipment.status).toBe('available');
              expect(equipment.managementMethod).toBe('external_calibration');
            });
          }
        });
    });
  });

  describe('GET /equipment - 파라미터 검증', () => {
    it('음수 페이지는 서버 에러 발생', () => {
      return request(ctx.app.getHttpServer())
        .get('/equipment?page=-1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);
    });
  });
});
