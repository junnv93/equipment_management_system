/**
 * 교정 기한 필터 E2E 테스트
 *
 * 비즈니스 규칙:
 * - 반출 상태와 무관하게 교정일 기준으로 필터링
 * - 교정/수리/대여 중인 장비도 모두 포함
 */

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { toTestPath } from './helpers/test-paths';

describe('Calibration Filter E2E', () => {
  let ctx: TestAppContext;
  let accessToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    // 시험실무자로 로그인 (test_engineer 역할)
    accessToken = await loginAs(ctx.app, 'user');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('교정 기한 필터 - 반출 상태 무관', () => {
    it('30일 이내 교정 예정 장비를 조회할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LIST))
        .query({ calibrationDue: 30 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('교정 기한 초과 필터로 조회할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LIST))
        .query({ calibrationDue: -1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();
    });

    it('교정 여유 필터로 조회할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LIST))
        .query({ calibrationDueAfter: 30 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('반출 중 상태 필터와 교정 기한 필터를 함께 사용할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LIST))
        .query({
          status: 'checked_out',
          calibrationDue: 30,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();

      const items = response.body.items;
      const allCheckedOut = items.every(
        (item: Record<string, unknown>) => item.status === 'checked_out',
      );
      if (items.length > 0) {
        expect(allCheckedOut).toBe(true);
      }
    });

    it('교정 방법 필터와 교정 기한 필터를 함께 사용할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.EQUIPMENT.LIST))
        .query({
          managementMethod: 'external_calibration',
          calibrationDue: 30,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toBeDefined();

      const items = response.body.items;
      const allExternal = items.every(
        (item: Record<string, unknown>) => item.managementMethod === 'external_calibration',
      );
      if (items.length > 0) {
        expect(allExternal).toBe(true);
      }
    });
  });
});
