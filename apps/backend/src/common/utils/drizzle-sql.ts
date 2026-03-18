/**
 * Drizzle SQL 유틸리티 — PostgreSQL 타입 안전성 보장
 *
 * 문제:
 * PostgreSQL의 count(*), sum() 등 집계 함수는 bigint를 반환하고,
 * pg 드라이버는 bigint를 JavaScript string으로 변환합니다.
 * Drizzle의 sql<number> 제네릭은 TypeScript 타입일 뿐 런타임 변환을 하지 않습니다.
 *
 * 결과:
 * "0" + "0" = "00" 같은 문자열 연결 버그 발생 (숫자 덧셈 기대).
 *
 * 해결:
 * SQL 레벨에서 ::int 캐스트하여 pg 드라이버가 JavaScript number를 반환하도록 강제.
 * 이 유틸리티를 사용하면 소비자에서 Number() 변환이 불필요합니다.
 *
 * @example
 * // Before (위험)
 * sql<number>`count(*) filter (where ...)`.as('urgent')
 * // → pg 드라이버가 string "0" 반환 → "0" + "0" = "00"
 *
 * // After (안전)
 * countInt().as('total')
 * // → ::int 캐스트 → pg 드라이버가 number 0 반환 → 0 + 0 = 0
 */

import { sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

/**
 * count(*)::int — bigint→int 캐스트로 JS number 반환 보장
 *
 * Drizzle 내장 count()의 안전한 대체
 */
export function countInt(): SQL<number> {
  return sql<number>`count(*)::int`;
}

/**
 * count(*) filter (where condition)::int — 조건부 카운트 + int 캐스트
 *
 * PostgreSQL의 FILTER 절을 사용한 조건부 집계.
 * ::int 캐스트로 JS number 반환을 보장합니다.
 *
 * @param condition - WHERE 조건 (Drizzle SQL expression)
 *
 * @example
 * countFilterInt(lte(schema.checkouts.createdAt, thresholdDate)).as('urgent')
 */
export function countFilterInt(condition: SQL): SQL<number> {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

/**
 * SQL 집계 결과를 number로 안전하게 변환
 *
 * pg 드라이버의 bigint→string 변환을 방어하는 런타임 유틸리티.
 * SQL 레벨 ::int 캐스트를 사용하지 못하는 경우(Drizzle 내장 count 등)의 폴백.
 *
 * @param value - SQL 집계 결과 (number | string | null | undefined)
 * @param fallback - null/undefined 시 기본값 (기본: 0)
 */
export function toSafeInt(value: unknown, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}
