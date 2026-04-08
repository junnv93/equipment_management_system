/**
 * Checkout 소유권 스코프 SSOT (List / KPI / Action 가드 통합)
 *
 * 본 파일은 `enforceScopeFromData` (checkouts.service.ts) 와 동일한 정의를
 * SQL predicate 로 표현하는 **단일** 헬퍼이다. checkouts list, approvals KPI/카운트,
 * dashboard 등 모든 read-side 쿼리는 반드시 이 헬퍼를 호출해야 한다.
 *
 * SSOT 정의 (3-case):
 *   case 1 (비rental + equipment.site/team = us)  →  우리 장비가 outgoing
 *   case 2 (rental  + requester.site/team = us)   →  우리가 빌려옴 (inbound 가시성)
 *   case 3 (rental  + lenderSite/Team    = us)    →  우리가 빌려줌 (outgoing rental)
 *
 * 직접 인라인 SQL 작성을 금지한다 — drift 방지.
 */
import { and, eq, inArray, ne, or, sql, SQL } from 'drizzle-orm';
import type { AppDatabase } from '@equipment-management/db';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import {
  resolveDataScope,
  type ResolvedDataScope,
  type UserScopeContext,
  type FeatureScopePolicy,
} from '@equipment-management/shared-constants';
import * as schema from '@equipment-management/db/schema';
import { checkouts, checkoutItems } from '@equipment-management/db/schema/checkouts';
import { dispatchScopePredicate } from '../../common/scope/scope-sql-builder';

export type CheckoutScopeDirection = 'outbound' | 'inbound' | undefined;

/**
 * site 단위 ownership predicate (3-case).
 * direction 미지정 시 case 1+2+3 모두 OR.
 */
export function buildCheckoutSiteCondition(
  db: AppDatabase,
  site: string,
  direction?: CheckoutScopeDirection
): SQL {
  const checkoutIdsBySite = db
    .select({ id: checkoutItems.checkoutId })
    .from(checkoutItems)
    .innerJoin(schema.equipment, eq(checkoutItems.equipmentId, schema.equipment.id))
    .where(eq(schema.equipment.site, site));

  const requesterIdsBySite = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.site, site));

  const inEquipSite = sql`${checkouts.id} IN (${checkoutIdsBySite})`;
  const isRental = eq(checkouts.purpose, CPVal.RENTAL);
  const isNonRental = ne(checkouts.purpose, CPVal.RENTAL);
  const lenderEq = eq(checkouts.lenderSiteId, site);
  const requesterIn = inArray(checkouts.requesterId, requesterIdsBySite);

  if (direction === 'outbound') {
    return or(and(isNonRental, inEquipSite), and(isRental, lenderEq))!;
  }
  if (direction === 'inbound') {
    return and(isRental, requesterIn)!;
  }
  return or(and(isNonRental, inEquipSite), and(isRental, lenderEq), and(isRental, requesterIn))!;
}

/**
 * team 단위 ownership predicate (3-case).
 */
export function buildCheckoutTeamCondition(
  db: AppDatabase,
  teamId: string,
  direction?: CheckoutScopeDirection
): SQL {
  const checkoutIdsByEquipTeam = db
    .select({ id: checkoutItems.checkoutId })
    .from(checkoutItems)
    .innerJoin(schema.equipment, eq(checkoutItems.equipmentId, schema.equipment.id))
    .where(eq(schema.equipment.teamId, teamId));

  const requesterIdsByTeam = db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.teamId, teamId));

  const inEquipTeam = sql`${checkouts.id} IN (${checkoutIdsByEquipTeam})`;
  const isRental = eq(checkouts.purpose, CPVal.RENTAL);
  const isNonRental = ne(checkouts.purpose, CPVal.RENTAL);
  const lenderEq = eq(checkouts.lenderTeamId, teamId);
  const requesterIn = inArray(checkouts.requesterId, requesterIdsByTeam);

  if (direction === 'outbound') {
    return or(and(isNonRental, inEquipTeam), and(isRental, lenderEq))!;
  }
  if (direction === 'inbound') {
    return and(isRental, requesterIn)!;
  }
  return or(and(isNonRental, inEquipTeam), and(isRental, lenderEq), and(isRental, requesterIn))!;
}

/**
 * `ResolvedDataScope` (resolveDataScope 결과) → checkout SQL predicate.
 *
 * 정책 상태기계는 `common/scope/scope-sql-builder.ts:dispatchScopePredicate` SSOT 를
 * 사용하고, 본 함수는 checkout 의 3-case OR (rental/inbound/outbound) 도메인 SQL 빌더
 * 만 콜백으로 위임한다. 외부 contract `{ deny, condition? }` 는 보존:
 *
 *   - `{ deny: true }`           → 호출자는 즉시 0/빈 결과 반환 (none / unavailable)
 *   - `{ deny: false }`          → 필터 없음 (scope=all). users JOIN 생략 가능
 *   - `{ condition: SQL, ... }`  → WHERE 에 AND 결합
 *
 * `unavailable` 분기는 본 함수가 site/team 콜백을 항상 제공하므로 도달 불가능 — 안전망.
 */
export function buildCheckoutScopeFromResolved(
  db: AppDatabase,
  scope: ResolvedDataScope,
  direction?: CheckoutScopeDirection
): { condition?: SQL; deny: boolean } {
  const result = dispatchScopePredicate(scope, {
    site: (s) => buildCheckoutSiteCondition(db, s, direction),
    team: (t) => buildCheckoutTeamCondition(db, t, direction),
  });
  switch (result.kind) {
    case 'all':
      return { deny: false };
    case 'none':
      return { deny: true };
    case 'condition':
      return { condition: result.condition, deny: false };
    case 'unavailable':
      // 본 함수는 양 콜백을 항상 제공하므로 unreachable — 안전망 fail-closed
      return { deny: true };
  }
}

/**
 * 편의 래퍼: UserScopeContext + policy → predicate 한 번에.
 */
export function buildCheckoutScopeForUser(
  db: AppDatabase,
  userCtx: UserScopeContext,
  policy: FeatureScopePolicy,
  direction?: CheckoutScopeDirection
): { condition?: SQL; deny: boolean } {
  return buildCheckoutScopeFromResolved(db, resolveDataScope(userCtx, policy), direction);
}
