/**
 * 보안 관련 상수 — Backend/Frontend 공유 SSOT
 *
 * 로그인 제한, 잠금 정책 등 보안 설정의 단일 소스입니다.
 * ⚠️ 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 *
 * @example
 * // Backend
 * import { SECURITY } from '@equipment-management/shared-constants';
 * if (attempts >= SECURITY.MAX_LOGIN_ATTEMPTS) { ... }
 */
export const SECURITY = {
  /** 최대 로그인 시도 횟수 (초과 시 잠금) */
  MAX_LOGIN_ATTEMPTS: 5,
  /** 로그인 잠금 지속 시간 (ms) — 15분 */
  LOCK_DURATION_MS: 15 * 60 * 1000,
  /** 로그인 시도 윈도우 (ms) — 15분 내 시도 횟수 추적 */
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000,
} as const;
