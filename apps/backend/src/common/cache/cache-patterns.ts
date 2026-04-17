/**
 * JSON-key-order-agnostic 캐시 키 패턴 빌더.
 *
 * 문제:
 *   `buildCacheKey(prefix, { a: 1, b: 2 })` 는 `JSON.stringify(sortedParams)` 로
 *   정렬된 키 기반 문자열을 생성한다 (`prefix:{"a":1,"b":2}`).
 *   detail 캐시처럼 파라미터를 포함하는 키를 정규식으로 무효화할 때,
 *   `prefix:{"uuid":"..."}` 처럼 키 순서를 가정한 정규식은 나중에 파라미터가 추가되면
 *   silent break (invalidation 미발생 → stale cache) 한다.
 *   73차에서 equipment detail에서 발견된 이 유형의 버그를 SSOT로 박제한다.
 *
 * 원칙:
 *   detail 캐시의 식별자 필드는 무조건 `.*"<field>":"<value>"` 형태로 매칭.
 *   키 내 어느 위치에 등장하든 상관없이 매칭 보장.
 *
 * 확장:
 *   list/count 등 suffix-only 패턴은 기존 `prefix:list:*` glob로 충분 —
 *   JSON body를 포함하지 않으므로 이 헬퍼의 대상이 아니다.
 */

/**
 * 정규식 메타문자 이스케이프.
 *
 * UUID 값은 메타문자를 포함하지 않지만 `idField`가 `id` 등 임의 값이거나
 * 향후 식별자 포맷이 바뀌어도 안전하도록 방어적으로 처리.
 */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 특정 엔티티의 detail 캐시 키 매칭 정규식 문자열을 생성.
 *
 * 예:
 *   buildDetailCachePattern('equipment:', 'uuid', 'abc-123')
 *     → `^equipment:detail:.*"uuid":"abc\\-123"`
 *
 * 매칭 성공 (키 순서 무관):
 *   equipment:detail:{"uuid":"abc-123"}
 *   equipment:detail:{"includeTeam":false,"uuid":"abc-123"}
 *   equipment:detail:{"uuid":"abc-123","version":5}
 *
 * 매칭 실패:
 *   equipment:detail:{"uuid":"other-id"}
 *   equipment:list:...              (prefix + 'detail:' 미일치)
 *
 * @param prefix `CACHE_KEY_PREFIXES` 상수 값 (예: `'equipment:'` — 트레일링 `:` 포함).
 * @param idField detail 캐시 키의 식별자 필드명 (예: `'uuid'`, `'id'`).
 * @param id 식별자 값.
 */
export function buildDetailCachePattern(prefix: string, idField: string, id: string): string {
  return `^${prefix}detail:.*"${idField}":"${escapeRegExp(id)}"`;
}
