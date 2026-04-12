import type { CacheKeyPrefix } from './cache-key-prefixes';

/**
 * scope-aware 캐시 키 생성 팩토리
 *
 * 키 형식 불변식:
 * - 일반 suffix: `<prefix><suffix>:<jsonParams>`
 * - scope-aware suffix: `<prefix><suffix>:t:<teamId>:<jsonParams>` (팀) 또는
 *                       `<prefix><suffix>:g:<jsonParams>` (글로벌)
 *
 * teamId는 구조적 segment로 인코딩되어 JSON params에 포함되지 않는다.
 * 이 덕에 deleteByPrefix 만으로 정확한 스코프 단위 무효화가 가능하다.
 */

/**
 * undefined/null/빈 문자열을 제거하여 결정론적 캐시 키를 보장.
 */
export function normalizeCacheParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(params).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>
  );
}

/**
 * scope-aware 캐시 키 빌더 팩토리.
 *
 * @param prefix - CACHE_KEY_PREFIXES 상수 (예: 'checkouts:')
 * @param scopeAwareSuffixes - teamId를 구조적 segment로 인코딩할 suffix 집합
 * @returns buildCacheKey 함수 — 기존 서비스의 this.buildCacheKey와 동일한 시그니처
 *
 * @example
 * ```typescript
 * private readonly buildCacheKey = createScopeAwareCacheKeyBuilder(
 *   CACHE_KEY_PREFIXES.CHECKOUTS,
 *   new Set(['list', 'summary']),
 * );
 * ```
 */
export function createScopeAwareCacheKeyBuilder(
  prefix: CacheKeyPrefix,
  scopeAwareSuffixes: ReadonlySet<string>
): (suffix: string, params?: Record<string, unknown>) => string {
  return (suffix: string, params?: Record<string, unknown>): string => {
    const baseKey = `${prefix}${suffix}`;
    if (!params) {
      return baseKey;
    }

    const normalizedParams = normalizeCacheParams(params);

    let scopeSegment = '';
    if (scopeAwareSuffixes.has(suffix)) {
      const teamIdValue = normalizedParams.teamId;
      if (typeof teamIdValue === 'string' && teamIdValue.length > 0) {
        scopeSegment = `:t:${teamIdValue}`;
        delete normalizedParams.teamId;
      } else {
        scopeSegment = ':g';
      }
    }

    const sortedParams = Object.keys(normalizedParams)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = normalizedParams[key];
          return acc;
        },
        {} as Record<string, unknown>
      );

    return `${baseKey}${scopeSegment}:${JSON.stringify(sortedParams)}`;
  };
}
