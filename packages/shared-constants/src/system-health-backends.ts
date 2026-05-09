/**
 * SystemHealthMetricsDto 의 backend identity SSOT.
 *
 * 각 메트릭이 "어떤 데이터 소스로부터 답했는가" 를 운영자/관리자에게 투명하게 노출.
 * frontend `SystemHealthCard` 의 `BackendBadge` 컴포넌트가 storage/queue/error 식별자를 Tooltip 으로 노출 (운영자 transparency 가시화).
 *
 * 분기 전략:
 *  - storage: host-disk(monitoring df 측정) → configured-capacity(env override) → pg-database(fallback, dbSize 만)
 *  - queue:   pending-work-aggregate(prom-client gauge 합산) → bullmq(future strategy)
 *  - error:   system-error-events(SSOT 테이블) → audit-rejection-proxy(legacy fallback, default off)
 *
 * 본 enum 은 backend 응답에 wire-format string 으로 직렬화되므로 값 변경 = breaking change.
 */

export const SYSTEM_HEALTH_STORAGE_BACKENDS = [
  'host-disk',
  'configured-capacity',
  'pg-database',
] as const;
export type SystemHealthStorageBackend = (typeof SYSTEM_HEALTH_STORAGE_BACKENDS)[number];

export const SYSTEM_HEALTH_QUEUE_BACKENDS = ['pending-work-aggregate', 'bullmq'] as const;
export type SystemHealthQueueBackend = (typeof SYSTEM_HEALTH_QUEUE_BACKENDS)[number];

export const SYSTEM_HEALTH_ERROR_SOURCES = [
  'system-error-events',
  'audit-rejection-proxy',
] as const;
export type SystemHealthErrorSource = (typeof SYSTEM_HEALTH_ERROR_SOURCES)[number];
