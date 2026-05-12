/**
 * Fuzzy 검색 유틸리티 (SSOT).
 *
 * NFD normalization + lowercase — 한글/영어 accent-insensitive 검색.
 * 외부 라이브러리 의존 없이 substring 매칭으로 구현.
 *
 * **결정 근거**: fuse.js 도입 대신 자체 구현 유지.
 * 재검토 트리거 (dataset > 500 / 5+ 도메인 / 오타 허용 UX 요구 / p95 latency > 16ms)
 * 충족 시 ADR-0012 신규 작성으로 supersede.
 *
 * @see docs/adr/0011-fuzzy-search-implementation.md
 */

function normalize(str: string): string {
  return str.normalize('NFD').toLowerCase();
}

/**
 * 단일 문자열 fuzzy 매칭.
 * 공백으로 분리된 각 토큰이 target에 모두 포함되면 match.
 */
export function fuzzyMatch(query: string, target: string): boolean {
  if (!query.trim()) return true;
  const normalizedTarget = normalize(target);
  return query
    .trim()
    .split(/\s+/)
    .every((token) => normalizedTarget.includes(normalize(token)));
}

/**
 * 배열 필터링.
 * @param items - 검색 대상 배열
 * @param query - 검색어
 * @param getLabel - 각 아이템에서 검색 대상 문자열 추출 함수
 */
export function fuzzyFilter<T>(items: T[], query: string, getLabel: (item: T) => string): T[] {
  if (!query.trim()) return items;
  return items.filter((item) => fuzzyMatch(query, getLabel(item)));
}
