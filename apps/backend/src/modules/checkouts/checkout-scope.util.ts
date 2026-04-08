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
 * 반환 값:
 *   - `{ deny: true }`           → 호출자는 즉시 0/빈 결과 반환
 *   - `{ deny: false }`          → 필터 없음 (scope=all). users JOIN 생략 가능
 *   - `{ condition: SQL, ... }`  → WHERE 에 AND 결합
 *
 * SiteScopeInterceptor 의 team→site 폴백 동작과 동일.
 */
export function buildCheckoutScopeFromResolved(
  db: AppDatabase,
  scope: ResolvedDataScope,
  direction?: CheckoutScopeDirection
): { condition?: SQL; deny: boolean } {
  switch (scope.type) {
    case 'none':
      return { deny: true };
    case 'all':
      return { deny: false };
    case 'site':
      if (!scope.site) return { deny: true };
      return { condition: buildCheckoutSiteCondition(db, scope.site, direction), deny: false };
    case 'team':
      if (scope.teamId) {
        return { condition: buildCheckoutTeamCondition(db, scope.teamId, direction), deny: false };
      }
      if (scope.site) {
        return { condition: buildCheckoutSiteCondition(db, scope.site, direction), deny: false };
      }
      return { deny: true };
    default:
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
