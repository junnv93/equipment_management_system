export const THROTTLE_PRESETS = {
  LOGIN: { limit: 5, ttl: 60000 },
  TOKEN_REFRESH: { limit: 10, ttl: 60000 },
  TEST_LOGIN: { limit: 10, ttl: 60000 },
} as const;
