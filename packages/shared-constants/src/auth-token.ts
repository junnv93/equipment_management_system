/**
 * 인증 토큰 라이프사이클 상수 — SSOT
 *
 * 이 파일은 프론트엔드(NextAuth)와 백엔드(NestJS JWT)가 공유하는
 * 토큰 수명 관련 상수의 단일 소스입니다.
 *
 * ⚠️ 값을 변경하면 양쪽 시스템에 동시 적용됩니다. 반드시 검토 후 변경하세요.
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
