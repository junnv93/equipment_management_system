import { ForbiddenException } from '@nestjs/common';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';
import { enforceScope } from '../scope-enforcer';

/**
 * SSOT 정책 엔진. enforceReportScope spec 과 동등 케이스를 직접 helper 에 대해
 * 검증하여 두 소비자(SiteScopeInterceptor, enforceReportScope) 가 동일 정책을
 * 공유하고 있음을 보증.
 */
const NONE: ResolvedDataScope = { type: 'none', label: '접근 불가' };
const TEAM: ResolvedDataScope = { type: 'team', teamId: 'team-A', label: 'team-A' };
const SITE: ResolvedDataScope = { type: 'site', site: 'suwon', label: 'suwon' };
const ALL: ResolvedDataScope = { type: 'all', label: '전체' };

describe('enforceScope (common/scope) — SSOT 정책 엔진', () => {
  describe("type: 'none'", () => {
    it('항상 ForbiddenException 을 던진다', () => {
      expect(() => enforceScope({}, NONE)).toThrow(ForbiddenException);
      expect(() => enforceScope({ site: 'suwon' }, NONE)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'team'", () => {
    it('params 미지정 → scope.teamId 강제', () => {
      expect(enforceScope({}, TEAM)).toEqual({ teamId: 'team-A', site: undefined });
    });
    it('동일 teamId → 허용', () => {
      expect(enforceScope({ teamId: 'team-A' }, TEAM)).toEqual({
        teamId: 'team-A',
        site: undefined,
      });
    });
    it('다른 teamId 명시 → 403 (CROSS_TEAM_DENIED)', () => {
      expect(() => enforceScope({ teamId: 'team-B' }, TEAM)).toThrow(ForbiddenException);
    });
    it('params.site 는 무시되고 undefined (site-only 리소스 우회 차단)', () => {
      expect(enforceScope({ site: 'incheon' }, TEAM)).toEqual({
        teamId: 'team-A',
        site: undefined,
      });
    });
    it('스코프에 teamId 누락(해석기 버그) → 403 fail-closed', () => {
      const broken: ResolvedDataScope = { type: 'team', label: 'broken' };
      expect(() => enforceScope({}, broken)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'site'", () => {
    it('params 미지정 → scope.site 강제', () => {
      expect(enforceScope({}, SITE)).toEqual({ site: 'suwon', teamId: undefined });
    });
    it('동일 site → 허용', () => {
      expect(enforceScope({ site: 'suwon' }, SITE).site).toBe('suwon');
    });
    it('다른 site 명시 → 403 (CROSS_SITE_DENIED)', () => {
      expect(() => enforceScope({ site: 'incheon' }, SITE)).toThrow(ForbiddenException);
    });
    it('같은 사이트 내 params.teamId 는 자유', () => {
      expect(enforceScope({ teamId: 'team-X' }, SITE)).toEqual({
        site: 'suwon',
        teamId: 'team-X',
      });
    });
    it('스코프에 site 누락(해석기 버그) → 403 fail-closed', () => {
      const broken: ResolvedDataScope = { type: 'site', label: 'broken' };
      expect(() => enforceScope({}, broken)).toThrow(ForbiddenException);
    });
  });

  describe("type: 'all'", () => {
    it('params 없음 → 둘 다 undefined', () => {
      expect(enforceScope({}, ALL)).toEqual({ site: undefined, teamId: undefined });
    });
    it('params pass-through (admin)', () => {
      expect(enforceScope({ site: 'incheon', teamId: 'team-Z' }, ALL)).toEqual({
        site: 'incheon',
        teamId: 'team-Z',
      });
    });
  });
});
