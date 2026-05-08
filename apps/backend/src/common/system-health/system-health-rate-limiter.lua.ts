/**
 * System Health Rate Limiter — Lua script SSOT
 *
 * Redis EVAL 로 atomic하게 분 윈도우 카운터를 증가.
 *
 * KEYS[1] — rate-limit counter 키 (예: sh:rl:counter:{epochMinute})
 * ARGV[1] — 최대 허용 횟수 (문자열)
 *
 * 반환값:
 *   현재 윈도우의 INSERT 카운트 (INCR 후 값).
 *   호출자는 반환값 > ARGV[1] 이면 rate-limit drop.
 *
 * atomic 보증:
 *   Lua script 는 Redis 서버에서 원자적으로 실행됨 (다른 명령 끼어들기 없음).
 *   INCR + EXPIRE 를 분리 호출하면 두 명령 사이 race 발생 가능 — Lua 로 방지.
 */
export const RATE_LIMIT_LUA = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], 65)
end
return current
` as const;
