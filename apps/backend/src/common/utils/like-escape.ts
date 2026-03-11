/**
 * SQL LIKE 패턴 이스케이프 유틸리티
 *
 * PostgreSQL LIKE 와일드카드(%, _)를 이스케이프하고,
 * 명시적 ESCAPE 절을 포함한 Drizzle SQL 헬퍼를 제공합니다.
 *
 * 이스케이프 문자: '!' (SQL/LIKE 양쪽에서 비특수 문자 — 설정 무관하게 안전)
 *
 * @example
 * // 단순 검색 (권장: safeIlike 사용)
 * safeIlike(field, likeContains(userInput))
 *
 * // 접두사 검색
 * safeIlike(field, likeStartsWith(userInput))
 */

import { sql, type SQL, type Column } from 'drizzle-orm';

/**
 * LIKE 이스케이프 문자 (SSOT)
 *
 * '!'를 사용하는 이유:
 * - '\' 는 standard_conforming_strings 설정에 따라 해석이 달라짐
 * - '!' 는 SQL, LIKE, 정규식 어디에서도 특수문자가 아님
 *
 * 이 상수는 escapeLikePattern, safeIlike, safeLike 모두에서 참조.
 * 변경 시 세 곳 모두 자동으로 따라감.
 */
export const LIKE_ESCAPE_CHAR = '!';

/**
 * LIKE 와일드카드 문자를 이스케이프합니다.
 *
 * 순서: 이스케이프 문자 자체 → % → _ (이스케이프 문자 먼저 처리해야 이중 이스케이프 방지)
 *
 * @param value - 사용자 입력 문자열
 * @returns 이스케이프된 문자열 (와일드카드 래핑 없음)
 */
export function escapeLikePattern(value: string): string {
  const e = LIKE_ESCAPE_CHAR;
  // 이스케이프 문자 자체를 먼저 처리 (이중 이스케이프 방지)
  // 그 다음 LIKE 와일드카드 문자를 이스케이프
  const escapeCharRegex = new RegExp(escapeRegExp(e), 'g');
  return value.replace(escapeCharRegex, `${e}${e}`).replace(/%/g, `${e}%`).replace(/_/g, `${e}_`);
}

/**
 * 정규식 특수문자 이스케이프 (LIKE_ESCAPE_CHAR가 정규식 특수문자일 경우 대비)
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * CONTAINS 검색 패턴: %escaped_value%
 */
export function likeContains(value: string): string {
  return `%${escapeLikePattern(value)}%`;
}

/**
 * STARTS WITH 검색 패턴: escaped_value%
 */
export function likeStartsWith(value: string): string {
  return `${escapeLikePattern(value)}%`;
}

/**
 * ENDS WITH 검색 패턴: %escaped_value
 */
export function likeEndsWith(value: string): string {
  return `%${escapeLikePattern(value)}`;
}

/**
 * 명시적 ESCAPE 절을 포함한 ILIKE (case-insensitive)
 *
 * Drizzle의 ilike()는 ESCAPE 절을 생성하지 않아
 * PostgreSQL 설정에 따라 이스케이프 동작이 달라질 수 있음.
 * 이 함수는 항상 `ESCAPE '!'`를 명시하여 결정론적 동작을 보장.
 *
 * ESCAPE를 SQL 리터럴로 삽입하여 PostgreSQL 플래너가
 * GIN trigram 인덱스를 활용할 수 있도록 합니다.
 * (파라미터 바인딩 시 플래너가 인덱스 사용을 포기할 수 있음)
 *
 * @example
 * safeIlike(equipment.name, likeContains(search))
 * // → "equipment"."name" ILIKE $1 ESCAPE '!'
 */
export function safeIlike(column: Column, pattern: string): SQL {
  return sql`${column} ILIKE ${pattern} ESCAPE ${sql.raw(`'${LIKE_ESCAPE_CHAR}'`)}`;
}

/**
 * 명시적 ESCAPE 절을 포함한 LIKE (case-sensitive)
 */
export function safeLike(column: Column, pattern: string): SQL {
  return sql`${column} LIKE ${pattern} ESCAPE ${sql.raw(`'${LIKE_ESCAPE_CHAR}'`)}`;
}
