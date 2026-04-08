import { ForbiddenException } from '@nestjs/common';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';
import { enforceReportScope } from '../report-scope-enforcement';

// SSOT: ResolvedDataScope (packages/shared-constants/src/data-scope.ts)
const NONE: ResolvedDataScope = { type: 'none', label: '접근 불가' };
const TEAM: ResolvedDataScope = { type: 'team', teamId: 'team-A', label: 'team-A 팀' };
const SITE: ResolvedDataScope = { type: 'site', site: 'suwon', label: 'suwon 사이트' };
const ALL: ResolvedDataScope = { type: 'all', label: '전체' };

describe('enforceReportScope', () => {
  describe("type: 'none'", () => {
    it('항상 ForbiddenException을 던진다 — 스코프 자체가 없음', () => {
      expect(() => enforceReportScope({}, NONE)).toThrow(ForbiddenException);
      expect(() => enforceReportScope({ site: 'suwon' }, NONE)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'team'", () => {
    it('params.teamId 미지정 → scope.teamId 강제', () => {
      const result = enforceReportScope({}, TEAM);
      expect(result).toEqual({ teamId: 'team-A', site: undefined });
    });

    it('params.teamId === scope.teamId → 허용', () => {
      const result = enforceReportScope({ teamId: 'team-A' }, TEAM);
      expect(result.teamId).toBe('team-A');
    });

    it('params.teamId !== scope.teamId → ForbiddenException (CROSS_TEAM_EXPORT_DENIED)', () => {
      expect(() => enforceReportScope({ teamId: 'team-B' }, TEAM)).toThrow(ForbiddenException);
    });

    it('params.site는 무시되고 undefined 반환 (site-only 리소스 우회 차단)', () => {
      const result = enforceReportScope({ site: 'incheon' }, TEAM);
      expect(result).toEqual({ teamId: 'team-A', site: undefined });
    });

    it('스코프 객체에 teamId 누락(해석기 버그) → ForbiddenException (fail-closed)', () => {
      const broken: ResolvedDataScope = { type: 'team', label: 'broken' };
      expect(() => enforceReportScope({}, broken)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'site'", () => {
    it('params.site 미지정 → scope.site 강제', () => {
      const result = enforceReportScope({}, SITE);
      expect(result).toEqual({ site: 'suwon', teamId: undefined });
    });

    it('params.site === scope.site → 허용', () => {
      const result = enforceReportScope({ site: 'suwon' }, SITE);
      expect(result.site).toBe('suwon');
    });

    it('params.site !== scope.site → ForbiddenException (CROSS_SITE_EXPORT_DENIED)', () => {
      expect(() => enforceReportScope({ site: 'incheon' }, SITE)).toThrow(ForbiddenException);
    });

    it('params.teamId는 같은 사이트 내 팀 필터로 허용', () => {
      const result = enforceReportScope({ teamId: 'team-X' }, SITE);
      expect(result).toEqual({ site: 'suwon', teamId: 'team-X' });
    });

    it('스코프 객체에 site 누락(해석기 버그) → ForbiddenException (fail-closed)', () => {
      const broken: ResolvedDataScope = { type: 'site', label: 'broken' };
      expect(() => enforceReportScope({}, broken)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'all'", () => {
    it('params 없음 → 둘 다 undefined (제약 없음)', () => {
      expect(enforceReportScope({}, ALL)).toEqual({ site: undefined, teamId: undefined });
    });

    it('params.site, params.teamId 모두 pass-through', () => {
      const result = enforceReportScope({ site: 'incheon', teamId: 'team-Z' }, ALL);
      expect(result).toEqual({ site: 'incheon', teamId: 'team-Z' });
    });
  });
});
