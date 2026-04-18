/** 스로틀 윈도우: 1분 */
const THROTTLE_WINDOW_MS = 60 * 1000;

/** 테스트 환경 여부 */
const IS_TEST = process.env.NODE_ENV === 'test';

/** 테스트 환경에서는 rate limit을 사실상 무제한으로 설정 */
const TEST_MULTIPLIER = IS_TEST ? 1000 : 1;

/**
 * ThrottlerModule.forRoot()에 전달하는 throttler 설정 배열 (SSOT)
 *
 * app.module.ts는 이 배열을 직접 import한다.
 * 이름을 추가/변경하면 SKIP_ALL_THROTTLES도 자동 반영된다.
 *
 * NODE_ENV=test 시 limit을 1000배로 증가시켜 E2E 테스트에서 429 방지.
 */
export const THROTTLER_CONFIGS = [
  {
    name: 'short',
    ttl: 1000, // 1초
    limit: 20 * TEST_MULTIPLIER, // 프로덕션: 20, 테스트: 20000
  },
  {
    name: 'medium',
    ttl: 10000, // 10초
    limit: 100 * TEST_MULTIPLIER, // 프로덕션: 100, 테스트: 100000
  },
  {
    name: 'long',
    ttl: 60000, // 1분
    limit: 300 * TEST_MULTIPLIER, // 프로덕션: 300, 테스트: 300000
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
  /** CSP violation report — @Public 엔드포인트이므로 엄격 제한. 분당 10회/IP */
  CSP_REPORT: { limit: 10, ttl: THROTTLE_WINDOW_MS },
} as const;

/**
 * Named throttler 환경에서 특정 프리셋을 모든 throttler에 적용하는 헬퍼.
 * `@Throttle({ default: ... })`은 named throttler에서 무효 → 이 함수로 short/medium/long 전부 오버라이드.
 */
export function throttleAllNamed(preset: {
  limit: number;
  ttl: number;
}): Record<string, { limit: number; ttl: number }> {
  return Object.fromEntries(THROTTLER_CONFIGS.map((c) => [c.name, preset])) as Record<
    string,
    { limit: number; ttl: number }
  >;
}
