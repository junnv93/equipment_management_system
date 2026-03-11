/**
 * 인증 토큰 라이프사이클 + 세션 동작 상수 — SSOT
 *
 * - 토큰 수명 (ACCESS/REFRESH): 프론트엔드(NextAuth) + 백엔드(NestJS JWT) 공유
 * - Idle Timeout / Session Sync: 프론트엔드 전용
 *
 * ⚠️ 토큰 수명 값을 변경하면 양쪽 시스템에 동시 적용됩니다. 반드시 검토 후 변경하세요.
 *
 * 의존 관계 (안전 조건):
 *   REFRESH_BUFFER_SECONDS < ACCESS_TOKEN_TTL_SECONDS / 2
 *   현재: 60 < 450  ✅
 *
 *   REFRESH_BUFFER_SECONDS >> 실제 refresh API 응답 시간 (~200ms)
 *   현재: 60s >> 0.2s  ✅
 */

/** Access Token 유효 기간 (초). 백엔드 JWT 서명과 프론트엔드 갱신 트리거에 사용. */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 900s = 15분

/** Refresh Token 유효 기간 (초). 백엔드 서명 + 프론트엔드 NextAuth session.maxAge 기준. */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 604800s = 7일

/**
 * 절대 세션 수명 (초).
 * 마지막 활동과 무관하게 이 기간 이후에는 재로그인 강제.
 * 프론트엔드 JWT 콜백과 백엔드 refreshTokens() 양쪽에서 동일하게 검증.
 */
export const ABSOLUTE_SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 2592000s = 30일

/**
 * Access Token 선제 갱신 버퍼 (초).
 * 만료까지 이 시간 이하로 남으면 프론트엔드가 선제적으로 refresh를 실행.
 *
 * Single-Flight 패턴과의 관계:
 * - 이 값이 클수록 "refresh zone" 진입이 빨라져 불필요한 refresh 빈도가 증가.
 * - 이 값이 작을수록 만료 직전 API 호출이 실패할 위험 증가.
 * - 아래 안전 조건을 항상 유지할 것.
 *
 * 안전 조건: REFRESH_BUFFER_SECONDS < ACCESS_TOKEN_TTL_SECONDS / 2
 */
export const REFRESH_BUFFER_SECONDS = 60;

/**
 * NestJS JwtModule / jwtService.sign()의 expiresIn 옵션에 사용할 문자열 형식.
 * 숫자 상수에서 자동 파생하여 두 곳의 값이 어긋나는 드리프트를 방지.
 */
export const ACCESS_TOKEN_EXPIRES_IN = `${ACCESS_TOKEN_TTL_SECONDS}s` as const; // '900s'
export const REFRESH_TOKEN_EXPIRES_IN = `${REFRESH_TOKEN_TTL_SECONDS}s` as const; // '604800s'

// ─── Idle Timeout (무활동 자동 로그아웃) ──────────────────────────────────────

/**
 * 무활동 세션 만료 시간 (초).
 * 마지막 사용자 입력으로부터 이 시간이 경과하면 자동 로그아웃.
 */
export const IDLE_TIMEOUT_SECONDS = 30 * 60; // 1800s = 30분

/**
 * 만료 경고 표시 시작 시점 (초, 만료까지 남은 시간 기준).
 * 이 값 이하로 남으면 카운트다운 Dialog 표시.
 *
 * 안전 조건: IDLE_WARNING_BEFORE_SECONDS < IDLE_TIMEOUT_SECONDS / 2
 * 현재: 300 < 900  ✅
 */
export const IDLE_WARNING_BEFORE_SECONDS = 5 * 60; // 300s = 5분

/**
 * 활동 이벤트 throttle 간격 (밀리초).
 * 마우스/키보드 이벤트를 이 간격으로 throttle하여 타이머 리셋 성능 최적화.
 */
export const IDLE_ACTIVITY_THROTTLE_MS = 5_000; // 5초

// ─── Multi-tab Session Sync ────────────────────────────────────────────────────

/**
 * BroadcastChannel 채널 이름 (SSOT).
 * providers.tsx, use-idle-timeout.ts, use-auth.ts 에서 동일 채널 참조.
 */
export const SESSION_SYNC_CHANNEL = 'equipment-mgmt-session-sync';

/**
 * BroadcastChannel 메시지 타입 (SSOT).
 * 문자열 리터럴을 여러 파일에 흩뿌리지 않고, 이 객체를 단일 소스로 참조.
 * TypeScript가 철자 오타를 컴파일 타임에 잡아줌.
 */
export const SESSION_SYNC_MESSAGE = {
  /** 사용자 수동 로그아웃 (use-auth.ts → providers.tsx) */
  LOGOUT: 'logout',
  /** Idle Timeout 자동 로그아웃 (use-idle-timeout.ts → providers.tsx) */
  IDLE_LOGOUT: 'idle-logout',
  /** "계속 사용" 버튼 클릭 (use-idle-timeout.ts ↔ use-idle-timeout.ts) */
  ACTIVITY_RESET: 'activity-reset',
} as const;

export type SessionSyncMessageType =
  (typeof SESSION_SYNC_MESSAGE)[keyof typeof SESSION_SYNC_MESSAGE];
