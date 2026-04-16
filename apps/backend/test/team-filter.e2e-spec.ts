/**
 * 팀 필터 사이트별 조회 E2E 테스트
 *
 * 비즈니스 규칙:
 * - 사용자 사이트에 맞는 팀만 조회
 * - 시험소장은 사이트 필터 변경 가능
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Team Filter E2E', () => {
  let app: INestApplication;
  let testEngineerToken: string;
  let labManagerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 시험실무자 로그인 (수원랩, test_engineer 역할)
    const engineerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'user@example.com',
        password: 'user123',
      });

    testEngineerToken = engineerLogin.body.access_token;

    // 시험소장 로그인 (lab_manager 역할)
    const managerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'admin123',
      });

    labManagerToken = managerLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('사이트별 팀 필터링', () => {
    it('수원랩 팀 목록을 조회할 수 있어야 한다', async () => {
      // When: 수원랩 팀 목록 조회
      const response = await request(app.getHttpServer())
        .get('/teams')
        .query({ site: 'suwon', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      // Then: 수원랩 팀만 반환됨
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const teams = response.body.data;
      console.log(`수원랩 팀 수: ${teams.length}`);

      // 모든 팀이 수원랩 소속인지 확인
      const allSuwon = teams.every((team: any) => team.site === 'suwon');
      expect(allSuwon).toBe(true);

      // 팀 이름 출력
      teams.forEach((team: any) => {
        console.log(`  - ${team.name} (${team.type})`);
      });
    });

    it('의왕랩 팀 목록을 조회할 수 있어야 한다', async () => {
      // When: 의왕랩 팀 목록 조회
      const response = await request(app.getHttpServer())
        .get('/teams')
        .query({ site: 'uiwang', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      // Then: 의왕랩 팀만 반환됨
      expect(response.body).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);

      const teams = response.body.data;
      console.log(`의왕랩 팀 수: ${teams.length}`);

      const allUiwang = teams.every((team: any) => team.site === 'uiwang');
      expect(allUiwang).toBe(true);

      teams.forEach((team: any) => {
        console.log(`  - ${team.name} (${team.type})`);
      });
    });

    it('사이트 필터 없이 조회하면 모든 팀이 반환되어야 한다', async () => {
      // When: 사이트 필터 없이 조회 (시험소장 권한)
      const response = await request(app.getHttpServer())
        .get('/teams')
        .query({ pageSize: 100 })
        .set('Authorization', `Bearer ${labManagerToken}`)
        .expect(200);

      // Then: 모든 사이트의 팀이 반환됨
      const teams = response.body.data;
      console.log(`전체 팀 수: ${teams.length}`);

      expect(teams.length).toBeGreaterThan(0);

      // 수원과 의왕 팀이 모두 포함되어 있는지 확인
      const hasSuwon = teams.some((team: any) => team.site === 'suwon');
      const hasUiwang = teams.some((team: any) => team.site === 'uiwang');

      expect(hasSuwon).toBe(true);
      expect(hasUiwang).toBe(true);

      console.log(`✅ 수원랩 팀 포함: ${hasSuwon}, 의왕랩 팀 포함: ${hasUiwang}`);
    });

    it('팀 검색이 사이트 필터와 함께 동작해야 한다', async () => {
      // When: 수원랩에서 'RF' 검색
      const response = await request(app.getHttpServer())
        .get('/teams')
        .query({ site: 'suwon', search: 'RF', pageSize: 100 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      // Then: 수원랩 RF 관련 팀만 반환됨
      const teams = response.body.data;
      console.log(`수원랩 RF 팀 검색 결과: ${teams.length}개`);

      teams.forEach((team: any) => {
        expect(team.site).toBe('suwon');
        console.log(`  - ${team.name} (타입: ${team.type})`);
      });
    });

    it('페이지네이션이 사이트 필터와 함께 동작해야 한다', async () => {
      // When: 수원랩 팀 1페이지 (2개씩)
      const response = await request(app.getHttpServer())
        .get('/teams')
        .query({ site: 'suwon', page: 1, pageSize: 2 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      // Then: 최대 2개까지만 반환됨
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.pagination).toBeDefined();
      expect(Number(response.body.meta.pagination.pageSize)).toBe(2);
      expect(Number(response.body.meta.pagination.page)).toBe(1);

      console.log(`페이지네이션 테스트 - 반환된 팀 수: ${response.body.data.length}`);
    });
  });

  describe('팀 상세 조회', () => {
    it('특정 팀을 ID로 조회할 수 있어야 한다', async () => {
      // Given: 팀 목록에서 첫 번째 팀 ID 가져오기
      const listResponse = await request(app.getHttpServer())
        .get('/teams')
        .query({ site: 'suwon', pageSize: 1 })
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      const firstTeam = listResponse.body.data[0];
      expect(firstTeam).toBeDefined();

      // When: 팀 상세 조회
      const detailResponse = await request(app.getHttpServer())
        .get(`/teams/${firstTeam.id}`)
        .set('Authorization', `Bearer ${testEngineerToken}`)
        .expect(200);

      // Then: 팀 정보가 반환됨
      expect(detailResponse.body.data).toBeDefined();
      expect(detailResponse.body.data.id).toBe(firstTeam.id);
      expect(detailResponse.body.data.name).toBe(firstTeam.name);
      expect(detailResponse.body.data.site).toBe('suwon');

      console.log(`팀 상세 조회: ${detailResponse.body.data.name}`);
    });
  });
});
