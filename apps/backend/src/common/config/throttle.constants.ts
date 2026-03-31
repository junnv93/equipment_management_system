/** 스로틀 윈도우: 1분 */
const THROTTLE_WINDOW_MS = 60 * 1000;

/**
 * ThrottlerModule.forRoot()에 전달하는 throttler 설정 배열 (SSOT)
 *
 * app.module.ts는 이 배열을 직접 import한다.
 * 이름을 추가/변경하면 SKIP_ALL_THROTTLES도 자동 반영된다.
 */
export const THROTTLER_CONFIGS = [
  {
    name: 'short',
    ttl: 1000, // 1초
    limit: 20, // 1초당 20회 (대시보드 등 동시 요청 허용)
  },
  {
    name: 'medium',
    ttl: 10000, // 10초
    limit: 100, // 10초당 100회
  },
  {
    name: 'long',
    ttl: 60000, // 1분
    limit: 300, // 1분당 300회 (기본)
  },
] as const;

/**
 * @SkipThrottle()에 전달하는 "모든 throttler 스킵" 맵 (SSOT)
 *
 * @nestjs/throttler v6에서 @SkipThrottle() 기본값은 { default: true } 이므로
 * named throttler에는 효과 없음 — 반드시 이 상수를 사용해야 한다.
 */
export const SKIP_ALL_THROTTLES = Object.fromEntries(
  THROTTLER_CONFIGS.map((c) => [c.name, true])
) as Record<string, boolean>;

export const THROTTLE_PRESETS = {
  LOGIN: { limit: 5, ttl: THROTTLE_WINDOW_MS },
  TOKEN_REFRESH: { limit: 10, ttl: THROTTLE_WINDOW_MS },
  TEST_LOGIN: { limit: 100, ttl: THROTTLE_WINDOW_MS },
} as const;
