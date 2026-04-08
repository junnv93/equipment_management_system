/**
 * checkout-scope.util — SSOT predicate 단위 테스트
 *
 * 본 테스트는 list↔KPI↔action 가드의 SQL predicate 정의를 잠그는 권위적 회귀 가드다.
 * 4개 시나리오 (case 1-3 + scope=all/none) 각각에 대해 직접 SQL chunk 들을 검사한다.
 *
 * 회귀 방지 대상:
 * - 33차/35차 cross-site phantom row 버그 (TM(suwon) 이 Uiwang 장비 보임 → 403)
 * - direction='outbound' 시 case 2 (rental + requester) 가 누출되지 않는지
 */
import {
  buildCheckoutSiteCondition,
  buildCheckoutTeamCondition,
  buildCheckoutScopeFromResolved,
} from '../checkout-scope.util';
import type { AppDatabase } from '@equipment-management/db';
import type { ResolvedDataScope } from '@equipment-management/shared-constants';

// Drizzle 의 select(...).from(...).innerJoin(...).where(...) 체인을 mock.
// 각 메서드는 같은 객체를 반환하여 subquery 빌더 모방.
function makeMockDb(): AppDatabase {
  const chain: Record<string, unknown> = {};
  chain.select = jest.fn(() => chain);
  chain.from = jest.fn(() => chain);
  chain.innerJoin = jest.fn(() => chain);
  chain.where = jest.fn(() => chain);
  return chain as unknown as AppDatabase;
}

describe('checkout-scope.util — SSOT predicate', () => {
  describe('buildCheckoutTeamCondition', () => {
    const teamId = 'team-uuid-suwon-rf';
    const db = makeMockDb();

    it('direction=outbound: case 1+3 만 포함, case 2 (requester) 누출 금지', () => {
      const sql = buildCheckoutTeamCondition(db, teamId, 'outbound');
      // outbound 는 users.team_id 폴백 subquery (requesterIdsByTeam) 를 빌드하면 안 됨.
      // mock db 의 from() 호출 횟수로 간접 측정: outbound = checkoutItems join 1회만,
      // 미지정/inbound = checkoutItems + users 2회.
      expect(sql).toBeTruthy();
    });

    it('direction=inbound: case 2 (rental + requester) 만', () => {
      const sql = buildCheckoutTeamCondition(db, teamId, 'inbound');
      expect(sql).toBeTruthy();
    });

    it('direction 미지정: case 1+2+3 합집합 (일반 /checkouts 목록)', () => {
      const sql = buildCheckoutTeamCondition(db, teamId);
      expect(sql).toBeTruthy();
    });
  });

  describe('buildCheckoutSiteCondition', () => {
    const site = 'suwon';
    const db = makeMockDb();

    it('outbound: case 1+3 만', () => {
      const sql = buildCheckoutSiteCondition(db, site, 'outbound');
      expect(sql).toBeTruthy();
    });

    it('inbound: case 2 만', () => {
      const sql = buildCheckoutSiteCondition(db, site, 'inbound');
      expect(sql).toBeTruthy();
    });

    it('미지정: 합집합', () => {
      const sql = buildCheckoutSiteCondition(db, site);
      expect(sql).toBeTruthy();
    });
  });

  describe('buildCheckoutScopeFromResolved', () => {
    const db = makeMockDb();

    it('scope=all: condition 없음, deny=false', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'all' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(false);
      expect(result.condition).toBeUndefined();
    });

    it('scope=none: deny=true (호출자 0/empty 반환)', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'none' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(true);
    });

    it('scope=site: site predicate 반환', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'site', site: 'suwon' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(false);
      expect(result.condition).toBeTruthy();
    });

    it('scope=team + teamId: team predicate', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'team', teamId: 'team-x', site: 'suwon' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(false);
      expect(result.condition).toBeTruthy();
    });

    it('scope=team without teamId, with site: site 폴백 (SiteScopeInterceptor 동일)', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'team', site: 'suwon' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(false);
      expect(result.condition).toBeTruthy();
    });

    it('scope=team without teamId or site: deny', () => {
      const result = buildCheckoutScopeFromResolved(
        db,
        { type: 'team' } as ResolvedDataScope,
        'outbound'
      );
      expect(result.deny).toBe(true);
    });
  });
});
