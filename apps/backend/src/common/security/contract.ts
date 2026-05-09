/**
 * Security Telemetry Provider 컨트랙트 — common 레이어 SSOT.
 *
 * Layer 정합성 (system-health/contract.ts 패턴):
 *  - GlobalExceptionFilter (common) 는 sort enum reject 등 보안 의심 이벤트를 telemetry 로 노출.
 *  - common → modules 의존 금지 → 인터페이스 + DI 토큰을 common 에 정의.
 *  - 구현체는 common 내에서 직접 등록 (도메인 의존 없음 — 단순 logger + in-memory rate limit).
 *
 * 트리거 이벤트:
 *  - sort 필드 enum reject (`code: 'invalid_value'`) — SQL injection 시도 가능성
 *  - sort 필드 max length 초과 (`code: 'too_big'`) — DoS 시도 가능성
 *
 * PII deny-list (강제):
 *  - request.body / headers / 다른 query 필드 어떤 값도 캡처 금지.
 *  - 캡처 필드: invalidValue (sort 값), normalizedRoute (UUID/숫자 ID 마스킹), httpMethod, userId (nullable).
 */

// ============================================================================
// DI 토큰
// ============================================================================

export const SORT_REJECTION_TELEMETRY = Symbol('SORT_REJECTION_TELEMETRY');

// ============================================================================
// 타입
// ============================================================================

/** sort 필드 reject 사유 — 보안 logging 시 분류 */
export type SortRejectionReason =
  | 'invalid_value' // enum allowlist 미일치 (SQL injection / typo)
  | 'too_big' // max length 초과 (DoS 시도)
  | 'invalid_type'; // 타입 불일치 (배열 등)

export interface SortRejectionEvent {
  /** 거부된 sort 값. 길이 200자 이상은 호출자가 truncate. */
  invalidValue: string;
  /** 사유 분류 — Prometheus counter label 후보 */
  reason: SortRejectionReason;
  /** UUID/숫자 ID 마스킹된 라우트 (예: `/equipment/:id/calibration-history`) */
  normalizedRoute: string;
  /** HTTP 메서드 (uppercased, 10자 truncate) */
  httpMethod: string;
  /** 인증 사용자 ID — 미인증 시 null */
  userId: string | null;
}

export interface SortRejectionTelemetry {
  /**
   * sort 필드 reject 보안 이벤트 기록.
   *
   * Contract:
   *  - fire-and-forget — 어떤 예외도 throw 하지 않는다.
   *  - 동일 (route, invalidValue) 1분 내 중복 호출은 dedupe.
   *  - 분당 최대 N건 (구현체 정책) — 폭주 시 drop.
   *  - 호출자가 ZodError 의 sort 관련 issue 만 필터링해서 호출 — service 는 이미 sort 이벤트로 가정.
   */
  recordSortRejection(event: SortRejectionEvent): void;
}
