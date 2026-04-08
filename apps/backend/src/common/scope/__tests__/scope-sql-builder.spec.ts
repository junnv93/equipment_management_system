import { ForbiddenException } from '@nestjs/common';
import { sql, type SQL } from 'drizzle-orm';
import {
  AUDIT_LOG_SCOPE,
  CHECKOUT_DATA_SCOPE,
  EQUIPMENT_DATA_SCOPE,
  type ResolvedDataScope,
  type UserScopeContext,
} from '@equipment-management/shared-constants';
import { buildScopePredicate, dispatchScopePredicate } from '../scope-sql-builder';

/**
 * scope-sql-builder SSOT 검증.
 *
 * `buildScopePredicate` 는 `enforceScope` (요청 경계) 와 동일한 정책 상태기계를
 * 쿼리 계층에서 SQL 술어로 emit 한다. 두 함수가 같은 `resolveDataScope()` 를 통과하므로
 * 본 spec 은 buildScopePredicate 의 분기·콜백 위임·예외 시맨틱만 직접 검증하고,
 * 정책 매핑 자체는 `data-scope.spec.ts` / `scope-enforcer.spec.ts` 가 cover.
 */

const SA: UserScopeContext = { role: 'system_admin' };
const LM_SUWON: UserScopeContext = { role: 'lab_manager', site: 'suwon' };
const TE_TEAM_A: UserScopeContext = { role: 'test_engineer', site: 'suwon', teamId: 'team-A' };
const TE_NO_TEAM: UserScopeContext = { role: 'test_engineer', site: 'suwon' }; // resolver → none

// 콜백이 호출되었음을 검증하기 위한 sentinel SQL — 비교는 toString().
const siteSentinel = (s: string): SQL => sql`__site__=${s}`;
const teamSentinel = (t: string): SQL => sql`__team__=${t}`;

describe('buildScopePredicate (common/scope) — 쿼리 계층 SSOT 정책 빌더', () => {
  describe("scope.type === 'all'", () => {
    it('필터 없음 → undefined 반환 (호출자가 JOIN 자체 생략 가능)', () => {
      const result = buildScopePredicate(EQUIPMENT_DATA_SCOPE, SA, {
        site: siteSentinel,
        team: teamSentinel,
      });
      expect(result).toBeUndefined();
    });
  });

  describe("scope.type === 'site'", () => {
    it('site 콜백을 scope.site 로 호출하여 SQL 단편을 반환', () => {
      const result = buildScopePredicate(CHECKOUT_DATA_SCOPE, LM_SUWON, {
        site: siteSentinel,
        team: teamSentinel,
      });
      expect(result).toBeDefined();
      // sentinel SQL 의 chunk 에 site 값이 바인딩되었는지
      expect(JSON.stringify(result)).toContain('__site__');
      expect(JSON.stringify(result)).toContain('suwon');
    });

    it('site 콜백 미제공 → 403 SCOPE_FILTER_UNAVAILABLE', () => {
      expect(() =>
        buildScopePredicate(CHECKOUT_DATA_SCOPE, LM_SUWON, {
          team: teamSentinel,
        })
      ).toThrow(ForbiddenException);
    });
  });

  describe("scope.type === 'team'", () => {
    it('team 콜백을 scope.teamId 로 호출하여 SQL 단편을 반환', () => {
      const result = buildScopePredicate(CHECKOUT_DATA_SCOPE, TE_TEAM_A, {
        site: siteSentinel,
        team: teamSentinel,
      });
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('__team__');
      expect(JSON.stringify(result)).toContain('team-A');
    });

    it('team/site 콜백 모두 미제공 → 403 SCOPE_FILTER_UNAVAILABLE', () => {
      expect(() => buildScopePredicate(CHECKOUT_DATA_SCOPE, TE_TEAM_A, {})).toThrow(
        ForbiddenException
      );
    });

    // NOTE: "team 콜백 미제공 → site 폴백" 분기는 `resolveDataScope` 가 team 타입에
    // scope.site 를 세팅하지 않으므로 본 경로로 도달 불가능. buildScopePredicate 내부의
    // 폴백은 resolver 가 향후 site 정보를 같이 채울 경우를 위한 방어 코드로 유지된다
    // (원본 approvals.service.buildScopeCondition 과 동일).
  });

  describe("scope.type === 'none'", () => {
    it("team 정책 + teamId 미배정 사용자 → resolver 가 'none' 반환 → sql`false`", () => {
      const result = buildScopePredicate(CHECKOUT_DATA_SCOPE, TE_NO_TEAM, {
        site: siteSentinel,
        team: teamSentinel,
      });
      expect(result).toBeDefined();
      // sql`false` — 0행 안전망
      expect(JSON.stringify(result)).toContain('false');
    });

    it("policy.type === 'none' 역할 (TE + AUDIT_LOG_SCOPE) → sql`false`", () => {
      const result = buildScopePredicate(AUDIT_LOG_SCOPE, TE_TEAM_A, {
        site: siteSentinel,
        team: teamSentinel,
      });
      expect(result).toBeDefined();
      expect(JSON.stringify(result)).toContain('false');
    });
  });
});

/**
 * 하위 dispatch 계층 — checkout-scope.util 등 discriminated union 을 직접 소비하는
 * 도메인 헬퍼들이 같은 상태기계를 공유함을 보증하는 회귀 가드.
 */
describe('dispatchScopePredicate (lower-level state machine)', () => {
  const callbacks = { site: siteSentinel, team: teamSentinel };

  it("scope.type='all' → kind: 'all'", () => {
    const r = dispatchScopePredicate({ type: 'all' } as ResolvedDataScope, callbacks);
    expect(r.kind).toBe('all');
  });

  it("scope.type='none' → kind: 'none'", () => {
    const r = dispatchScopePredicate({ type: 'none' } as ResolvedDataScope, callbacks);
    expect(r.kind).toBe('none');
  });

  it("scope.type='site' + site → kind: 'condition' (site 콜백 호출)", () => {
    const r = dispatchScopePredicate(
      { type: 'site', site: 'suwon' } as ResolvedDataScope,
      callbacks
    );
    expect(r.kind).toBe('condition');
  });

  it("scope.type='site' + scope.site 누락 → kind: 'none' (fail-closed, no throw)", () => {
    const r = dispatchScopePredicate({ type: 'site' } as ResolvedDataScope, callbacks);
    expect(r.kind).toBe('none');
  });

  it("scope.type='site' + site 콜백 미제공 → kind: 'unavailable' (no throw)", () => {
    const r = dispatchScopePredicate({ type: 'site', site: 'suwon' } as ResolvedDataScope, {
      team: teamSentinel,
    });
    expect(r.kind).toBe('unavailable');
  });

  it("scope.type='team' + teamId + team 콜백 → kind: 'condition'", () => {
    const r = dispatchScopePredicate(
      { type: 'team', teamId: 'team-A' } as ResolvedDataScope,
      callbacks
    );
    expect(r.kind).toBe('condition');
  });

  it("scope.type='team' + teamId 만 + team 콜백 미제공 → kind: 'none' (fail-closed, site 폴백 불가)", () => {
    // scope.site 가 없으므로 site 콜백이 있어도 폴백 불가 → 안전망 deny
    const r = dispatchScopePredicate({ type: 'team', teamId: 'team-A' } as ResolvedDataScope, {
      site: siteSentinel,
    });
    expect(r.kind).toBe('none');
  });

  it("scope.type='team' + teamId + scope.site 동봉 + team 콜백 미제공 → site 폴백 (kind: 'condition')", () => {
    const r = dispatchScopePredicate(
      { type: 'team', teamId: 'team-A', site: 'suwon' } as ResolvedDataScope,
      { site: siteSentinel }
    );
    expect(r.kind).toBe('condition');
  });

  it("scope.type='team' + teamId + 두 콜백 모두 미제공 → kind: 'unavailable'", () => {
    const r = dispatchScopePredicate({ type: 'team', teamId: 'team-A' } as ResolvedDataScope, {});
    expect(r.kind).toBe('unavailable');
  });

  it("scope.type='team' + teamId/site 모두 누락 → kind: 'none'", () => {
    const r = dispatchScopePredicate({ type: 'team' } as ResolvedDataScope, callbacks);
    expect(r.kind).toBe('none');
  });
});
