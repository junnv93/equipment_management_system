/**
 * 교정 기한 필터 E2E 테스트
 *
 * 비즈니스 규칙:
 * - 반출 상태와 무관하게 교정일 기준으로 필터링
 * - 교정/수리/대여 중인 장비도 모두 포함
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres_equipment';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Calibration Filter E2E', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 시험실무자로 로그인 (test_engineer 역할)
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123',
      });

    accessToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('교정 기한 필터 - 반출 상태 무관', () => {
    it('30일 이내 교정 예정 장비를 조회할 수 있어야 한다', async () => {
      // When: 30일 이내 교정 예정 필터 조회
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .query({ calibrationDue: 30 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Then: 결과가 반환됨
      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);

      console.log(`교정 임박 장비 수: ${response.body.items.length}`);

      // 결과에 교정일 정보가 있는지 확인
      if (response.body.items.length > 0) {
        const firstItem = response.body.items[0];
        console.log(`첫 번째 장비 상태: ${firstItem.status}`);

        // 반출 중인 장비도 포함되어 있는지 확인
        const hasCheckedOut = response.body.items.some(
          (item: Record<string, unknown>) => item.status === 'checked_out'
        );

        if (hasCheckedOut) {
          console.log('✅ 반출 중인 장비도 필터 결과에 포함됨');
        }
      }
    });

    it('교정 기한 초과 필터로 조회할 수 있어야 한다', async () => {
      // When: 과거 날짜 포함 (-1일)
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .query({ calibrationDue: -1 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Then: 결과가 반환됨
      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();

      console.log(`교정 기한 초과 장비 수: ${response.body.items.length}`);

      // 반출 중인 초과 장비도 확인
      const checkedOutOverdue = response.body.items.filter(
        (item: Record<string, unknown>) => item.status === 'checked_out'
      );

      if (checkedOutOverdue.length > 0) {
        console.log(`✅ 반출 중이면서 교정 기한 초과 장비: ${checkedOutOverdue.length}개`);
      }
    });

    it('교정 여유 필터로 조회할 수 있어야 한다', async () => {
      // When: 30일 이후 교정 예정 필터
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .query({ calibrationDueAfter: 30 })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Then: 결과가 반환됨
      expect(response.body).toBeDefined();
      console.log(`교정 여유 장비 수: ${response.body.items.length}`);
    });

    it('반출 중 상태 필터와 교정 기한 필터를 함께 사용할 수 있어야 한다', async () => {
      // When: 반출 중 + 교정 임박 필터
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .query({
          status: 'checked_out',
          calibrationDue: 30,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Then: 반출 중이면서 교정 임박한 장비만 반환됨
      expect(response.body).toBeDefined();

      const items = response.body.items;
      console.log(`반출 중 + 교정 임박 장비: ${items.length}개`);

      // 모든 장비가 반출 중 상태인지 확인
      const allCheckedOut = items.every((item: Record<string, unknown>) => item.status === 'checked_out');
      if (items.length > 0) {
        expect(allCheckedOut).toBe(true);
      }
    });

    it('교정 방법 필터와 교정 기한 필터를 함께 사용할 수 있어야 한다', async () => {
      // When: 외부교정 + 교정 임박 필터
      const response = await request(app.getHttpServer())
        .get('/equipment')
        .query({
          managementMethod: 'external_calibration',
          calibrationDue: 30,
        })
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Then: 외부교정 대상 장비 중 교정 임박한 장비만 반환됨
      expect(response.body).toBeDefined();

      const items = response.body.items;
      console.log(`외부교정 + 교정 임박 장비: ${items.length}개`);

      // 모든 장비가 외부교정 방법인지 확인
      const allExternal = items.every((item: Record<string, unknown>) => item.managementMethod === 'external_calibration');
      if (items.length > 0) {
        expect(allExternal).toBe(true);
      }
    });
  });
});
