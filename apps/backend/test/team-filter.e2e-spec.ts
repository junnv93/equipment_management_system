/**
 * 팀 필터 사이트별 조회 E2E 테스트
 *
 * 비즈니스 규칙:
 * - 사용자 사이트에 맞는 팀만 조회
 * - 시험소장은 사이트 필터 변경 가능
 */

import request from 'supertest';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { createTestApp, closeTestApp, TestAppContext } from './helpers/test-app';
import { loginAs } from './helpers/test-auth';
import { toTestPath } from './helpers/test-paths';

describe('Team Filter E2E', () => {
  let ctx: TestAppContext;
  let testEngineerToken: string;
  let labManagerToken: string;

  beforeAll(async () => {
    ctx = await createTestApp();
    testEngineerToken = await loginAs(ctx.app, 'user');
    labManagerToken = await loginAs(ctx.app, 'admin');
  });

  afterAll(async () => {
    await closeTestApp(ctx?.app);
  });

  describe('사이트별 팀 필터링', () => {
    it('수원랩 팀 목록을 조회할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ site: 'suwon', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);

      const teams = response.body.items;
      const allSuwon = teams.every((team: Record<string, unknown>) => team.site === 'suwon');
      expect(allSuwon).toBe(true);
    });

    it('의왕랩 팀 목록을 조회할 수 있어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ site: 'uiwang', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.items).toBeDefined();
      expect(Array.isArray(response.body.items)).toBe(true);

      const teams = response.body.items;
      const allUiwang = teams.every((team: Record<string, unknown>) => team.site === 'uiwang');
      expect(allUiwang).toBe(true);
    });

    it('사이트 필터 없이 조회하면 모든 팀이 반환되어야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ pageSize: 100 })
        .set('Authorization', `Bearer ${labManagerToken}`)
        .expect(200);

      const teams = response.body.items;
      expect(teams.length).toBeGreaterThan(0);

      const hasSuwon = teams.some((team: Record<string, unknown>) => team.site === 'suwon');
      const hasUiwang = teams.some((team: Record<string, unknown>) => team.site === 'uiwang');

      expect(hasSuwon).toBe(true);
      expect(hasUiwang).toBe(true);
    });

    it('팀 검색이 사이트 필터와 함께 동작해야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ site: 'suwon', search: 'RF', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      const teams = response.body.items;
      teams.forEach((team: Record<string, unknown>) => {
        expect(team.site).toBe('suwon');
      });
    });

    it('페이지네이션이 사이트 필터와 함께 동작해야 한다', async () => {
      const response = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ site: 'suwon', page: 1, pageSize: 2 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      expect(response.body.items.length).toBeLessThanOrEqual(2);
      expect(response.body.meta).toBeDefined();
      expect(Number(response.body.meta.itemsPerPage)).toBe(2);
      expect(Number(response.body.meta.currentPage)).toBe(1);
    });
  });

  describe('팀 상세 조회', () => {
    it('특정 팀을 ID로 조회할 수 있어야 한다', async () => {
      const listResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.LIST))
        .query({ site: 'suwon', pageSize: 1 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      const firstTeam = listResponse.body.items[0];
      expect(firstTeam).toBeDefined();

      const detailResponse = await request(ctx.app.getHttpServer())
        .get(toTestPath(API_ENDPOINTS.TEAMS.GET(firstTeam.id)))
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      expect(detailResponse.body).toBeDefined();
      expect(detailResponse.body.id).toBe(firstTeam.id);
      expect(detailResponse.body.name).toBe(firstTeam.name);
      expect(detailResponse.body.site).toBe('suwon');
    });
  });
});
