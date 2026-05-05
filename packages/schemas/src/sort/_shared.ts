/**
 * Sort Enum SSOT — 도메인별 sort enum 빌더 + 파서
 *
 * 모든 backend Query DTO의 `sort` 필드는 per-domain sort enum (`packages/schemas/src/sort/<domain>-sort.ts`)을
 * 사용. 이 파일은 도메인별 enum 생성과 값 파싱의 단일 진입점.
 *
 * 결합형 enum 표현 (`'<field>.<direction>'`):
 * - URL safe (점은 URL-safe 문자)
 * - JSON serialization-safe
 * - 단일 string 파라미터로 처리 — 기존 frontend SearchParams `?sort=name.asc` 형식 보존
 *
 * Sort enum과 service-layer ORDER BY 매핑은 분리:
 * - Schema = validation (이 패키지)
 * - Mapper = ORM coupling (apps/backend/src/modules/<domain>/utils/<domain>-sort-mapper.ts)
 *
 * Type safety는 mapper의 `as const satisfies Record<XxxSortField, PgColumn>`로 컴파일타임 강제.
 */

import { z } from 'zod';
import { SORT_ORDER_VALUES } from '../enums/shared';

/**
 * Sort 방향 SSOT — `enums/shared.ts`의 `SORT_ORDER_VALUES`(asc/desc)를 그대로 사용.
 * 별도 별칭 export로 sort 도메인 모듈에서 직관적 import 가능.
 */
export const SORT_DIRECTION_VALUES = SORT_ORDER_VALUES;
export type SortDirection = (typeof SORT_DIRECTION_VALUES)[number];

/**
 * 도메인별 sort 결합형 값 빌더.
 *
 * field 배열에 대해 `${field}.asc` / `${field}.desc` 카르테시안 곱을 생성.
 *
 * @param fields - 허용된 sort 필드명 readonly 튜플 (≥ 1)
 * @returns 결합형 string literal 튜플 — `z.enum`에 그대로 전달 가능
 *
 * @example
 *   const FIELDS = ['createdAt', 'name'] as const;
 *   const VALUES = buildSortValues(FIELDS);
 *   // → ['createdAt.asc', 'createdAt.desc', 'name.asc', 'name.desc']
 */
export function buildSortValues<F extends readonly [string, ...string[]]>(
  fields: F
): readonly [`${F[number]}.${SortDirection}`, ...`${F[number]}.${SortDirection}`[]] {
  const values: `${string}.${SortDirection}`[] = [];
  for (const field of fields) {
    for (const direction of SORT_DIRECTION_VALUES) {
      values.push(`${field}.${direction}`);
    }
  }
  return values as unknown as readonly [
    `${F[number]}.${SortDirection}`,
    ...`${F[number]}.${SortDirection}`[],
  ];
}

/**
 * 도메인별 sort enum 빌더.
 *
 * 결합형 string literal을 z.enum으로 wrap.
 *
 * @example
 *   const CHECKOUT_SORT_FIELDS = ['createdAt', 'checkoutDate'] as const;
 *   export const CheckoutSortEnum = buildSortEnum(CHECKOUT_SORT_FIELDS);
 *   export type CheckoutSortValue = z.infer<typeof CheckoutSortEnum>;
 *   // → 'createdAt.asc' | 'createdAt.desc' | 'checkoutDate.asc' | 'checkoutDate.desc'
 */
export function buildSortEnum<F extends readonly [string, ...string[]]>(fields: F) {
  return z.enum(buildSortValues(fields));
}

/**
 * Sort 결합형 값 파서 — `'createdAt.desc'` → `{ field: 'createdAt', direction: 'desc' }`.
 *
 * 파라미터 타입은 도메인별 SortValue 유니언으로 좁혀서 호출 — invalid 문자열은
 * 컴파일 타임에 차단됨. 런타임 가드는 z.enum 검증으로 이미 보장됨.
 *
 * @param value - sort enum 검증을 통과한 결합형 값
 */
export function parseSortValue<S extends `${string}.${SortDirection}`>(
  value: S
): { field: S extends `${infer F}.${SortDirection}` ? F : string; direction: SortDirection } {
  const lastDot = value.lastIndexOf('.');
  const field = value.slice(0, lastDot);
  const direction = value.slice(lastDot + 1) as SortDirection;
  return { field: field as S extends `${infer F}.${SortDirection}` ? F : string, direction };
}
