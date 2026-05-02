import { SYSTEM_USER_UUID } from '../../database/utils/uuid-constants';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** audit_logs 관련 request 최소 인터페이스 — Express Request 하위 호환 */
interface AuditRequest {
  params?: Record<string, string | undefined>;
  method?: string;
  route?: { path?: string } | null;
  originalUrl?: string;
  url?: string;
}

export interface ResolvedAuditEntityId {
  entityId: string;
  entityName?: string;
  useSentinel: boolean;
}

/**
 * request.params 에서 UUID v4 형식 식별자 추출 (uuid > id > entityId 우선)
 * audit_logs.entityId 가 uuid NOT NULL이므로 형식 검증 필수.
 * 추출 실패 시 undefined — 호출자가 SYSTEM_USER_UUID sentinel 로 fallback.
 */
export function extractAuditEntityId(request: AuditRequest): string | undefined {
  const params = (request.params ?? {}) as Record<string, string | undefined>;
  const candidates = [params.uuid, params.id, params.entityId];
  return candidates.find((c): c is string => typeof c === 'string' && UUID_REGEX.test(c));
}

/**
 * UUID 추출 결과를 sentinel fallback 포함 형태로 반환.
 *
 * - UUID 추출 성공: `{ entityId: uuid, useSentinel: false }`
 * - UUID 추출 실패: `{ entityId: SYSTEM_USER_UUID, entityName: '${method} ${path}', useSentinel: true }`
 *   → entityName에 path-based human-readable 식별자 보존 (SQL `WHERE entity_name LIKE ...` 분석용)
 */
export function resolveAuditEntityIdWithSentinel(request: AuditRequest): ResolvedAuditEntityId {
  const extracted = extractAuditEntityId(request);
  if (extracted) {
    return { entityId: extracted, useSentinel: false };
  }
  const path = request.route?.path ?? request.originalUrl ?? request.url ?? '';
  return {
    entityId: SYSTEM_USER_UUID,
    entityName: `${request.method ?? 'UNKNOWN'} ${path}`,
    useSentinel: true,
  };
}

/**
 * request path segment 기반 entityType 추론.
 * 예: `/api/equipment/:uuid` → `'equipment'`
 *     `/api/calibration-plans/:uuid/items` → `'items'` (마지막 비변수 segment)
 *
 * 추론 실패 시 `'unknown'`.
 */
export function inferEntityTypeFromPath(request: AuditRequest): string {
  const path = request.route?.path ?? request.url ?? '';
  const segments = path
    .split('/')
    .filter(Boolean)
    .filter((s: string) => !s.startsWith(':'));
  const last = segments[segments.length - 1];
  if (!last || last === 'api') return 'unknown';
  return last;
}
