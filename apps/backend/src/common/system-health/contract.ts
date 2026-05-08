/**
 * System Health Provider 컨트랙트 — common 레이어 SSOT.
 *
 * Layer 정합성:
 *  - GlobalExceptionFilter (common) 는 5xx 캡처를 위해 SystemErrorEventProvider 가 필요.
 *  - 하지만 common → modules 의존은 clean architecture 위반.
 *  - Solution: define interfaces + DI tokens here (common) → dashboard module implements + registers.
 *
 * Re-export shims removed 2026-05-08 (system-health-cluster-closure).
 * Import directly from this file.
 */

import type {
  SystemHealthStorageBackend,
  SystemHealthQueueBackend,
  SystemHealthErrorSource,
} from '@equipment-management/shared-constants';

// ============================================================================
// DI 토큰
// ============================================================================
//
// Symbol 토큰 — TOKEN_BLACKLIST 패턴. NestJS DI 가 interface 를 reflect 못하므로 Symbol 필요.

export const STORAGE_HEALTH_PROVIDER = Symbol('STORAGE_HEALTH_PROVIDER');
export const ASYNC_WORK_BACKLOG_PROVIDER = Symbol('ASYNC_WORK_BACKLOG_PROVIDER');
export const SYSTEM_ERROR_EVENT_PROVIDER = Symbol('SYSTEM_ERROR_EVENT_PROVIDER');
export const SYSTEM_HEALTH_RATE_LIMITER = Symbol('SYSTEM_HEALTH_RATE_LIMITER');

// ============================================================================
// Storage 메트릭
// ============================================================================

export interface StorageHealthSnapshot {
  dbSizeBytes: number;
  diskUsedBytes: number | null;
  diskTotalBytes: number | null;
  storagePct: number | null;
  backend: SystemHealthStorageBackend;
}

export interface StorageHealthProvider {
  read(): Promise<StorageHealthSnapshot>;
}

// ============================================================================
// Async work backlog 메트릭
// ============================================================================

export interface AsyncWorkBacklogSnapshot {
  queueSize: number;
  backend: SystemHealthQueueBackend;
}

export interface AsyncWorkBacklogProvider {
  read(): Promise<AsyncWorkBacklogSnapshot>;
}

// ============================================================================
// System error event rate limiter
// ============================================================================
//
// 5xx 이벤트 캡처 시 분당 INSERT 상한 + 동일 (errorCode, route) dedupe 를 담당.
//
// 클러스터 안전 구현: Redis Lua atomic counter + SET NX EX dedupe.
// Graceful degradation: Redis 미가용 시 in-memory fallback — record() 의 fire-and-forget
// contract (어떤 예외도 throw 하지 않음) 불변.

/** rate limiter drop 사유 — Prometheus counter label SSOT */
export type SystemErrorEventDropReason =
  | 'rate-limit' // 분당 INSERT 상한 초과
  | 'dedupe' // 동일 (errorCode, route) 분당 중복
  | 'errorcode-truncate' // errorCode varchar 한계 초과 — INSERT 는 진행되나 변형 표면화
  | 'rate-limit-fallback'; // Redis 미가용 → in-memory fallback 경로의 rate-limit drop

export interface SystemHealthRateLimiter {
  /**
   * 이벤트 캡처 허용 여부를 결정.
   * - allowed: true → INSERT 진행
   * - allowed: false → INSERT 생략, reason 으로 Prometheus counter 증가
   * Redis 장애 시 in-memory fallback 자동 전환 — throw 하지 않는다.
   */
  acquireSlot(
    event: Pick<SystemErrorEventInput, 'errorCode' | 'normalizedRoute'>
  ): Promise<{ allowed: boolean; reason: SystemErrorEventDropReason | null }>;
}

// ============================================================================
// System error event 메트릭
// ============================================================================
//
// PII deny-list (강제):
//  - request payload (요청 본문 / 요청 헤더 / 요청 쿼리스트링) 캡처 금지.
//  - userId 는 nullable.
//  - production stack 은 stackHash (SHA-256), development 만 stackPreview 4096 자.
//  - errorCode 는 ErrorCode enum 값 또는 'UnknownError'.
//  - normalizedRoute 는 UUID/숫자 ID 마스킹 후.

export interface SystemErrorEventInput {
  errorCode: string;
  httpMethod: string;
  normalizedRoute: string;
  statusCode: number;
  userId: string | null;
  stackHash: string | null;
  stackPreview: string | null;
}

export interface SystemErrorEventCount {
  errorCount24h: number;
  source: SystemHealthErrorSource;
}

export interface SystemErrorEventProvider {
  /** 최근 24h 시스템 에러 카운트. fallback path (audit-rejection-proxy) 는 env 로 명시 활성화 시에만. */
  count24h(): Promise<SystemErrorEventCount>;

  /**
   * fire-and-forget INSERT — 호출자가 await 해도 어떤 예외도 throw 하지 않는다.
   * Does not block the response flow even when the DB itself fails.
   */
  record(event: SystemErrorEventInput): Promise<void>;
}
