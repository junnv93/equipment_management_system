/** 스로틀 윈도우: 1분 */
const THROTTLE_WINDOW_MS = 60 * 1000;

export const THROTTLE_PRESETS = {
  LOGIN: { limit: 5, ttl: THROTTLE_WINDOW_MS },
  TOKEN_REFRESH: { limit: 10, ttl: THROTTLE_WINDOW_MS },
  TEST_LOGIN: { limit: 100, ttl: THROTTLE_WINDOW_MS },
} as const;
