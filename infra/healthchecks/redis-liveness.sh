#!/bin/sh
# Redis liveness probe (SSOT).
#
# `redis-cli PING`이 PONG을 반환하면 live. requirepass가 설정된 환경에서는
# REDIS_PASSWORD env를 통해 자동 인증. 비밀번호 오류/미설정/타임아웃은 unhealthy.
#
# 사용: Docker healthcheck `CMD` — `/healthchecks/redis-liveness.sh`
# env:
#   REDIS_PORT           (default 6379)
#   REDIS_PASSWORD       (optional — requirepass 설정 환경에서만)
#   HEALTHCHECK_TIMEOUT  (default 3 초)

set -eu

PORT="${REDIS_PORT:-6379}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-3}"

if [ -n "${REDIS_PASSWORD:-}" ]; then
  RESPONSE=$(redis-cli -p "${PORT}" -a "${REDIS_PASSWORD}" --no-auth-warning \
    -t "${TIMEOUT}" PING 2>/dev/null || true)
else
  RESPONSE=$(redis-cli -p "${PORT}" -t "${TIMEOUT}" PING 2>/dev/null || true)
fi

if [ "${RESPONSE}" = "PONG" ]; then
  exit 0
fi

echo "redis-liveness: unhealthy (response='${RESPONSE}')" >&2
exit 1
