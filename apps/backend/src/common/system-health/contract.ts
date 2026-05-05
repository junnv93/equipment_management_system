/**
 * System Health Provider 컨트랙트 — common 레이어 SSOT.
 *
 * Layer 정합성:
 *  - GlobalExceptionFilter (common) 는 5xx 캡처를 위해 SystemErrorEventProvider 가 필요.
 *  - 하지만 common → modules 의존은 clean architecture 위반.
 *  - 해결: 인터페이스 + DI 토큰을 common 에 정의 → dashboard 모듈이 implements + provider 등록.
 *
 * dashboard 모듈의 `health-providers/types.ts` 와 `tokens.ts` 는 본 파일을 re-export.
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
   * DB 자체 장애 시에도 응답 흐름을 차단하지 않는다.
   */
  record(event: SystemErrorEventInput): Promise<void>;
}
