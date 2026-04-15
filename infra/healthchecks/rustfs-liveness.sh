#!/bin/sh
# Rustfs liveness probe (SSOT).
#
# Rustfs는 dedicated health endpoint를 제공하지 않음 (2026-04 기준, 공식 리포 확인).
# Root path("/")는 unauthenticated 접근 시 S3 API 규약대로 403을 반환하며 이는
# "서버 가동 중"의 정상 신호임. 200은 bucket listing 등이 허용된 경우.
# 4xx 전체(404/405 등)나 5xx, connection refused는 비정상으로 간주.
#
# 사용: Docker healthcheck `CMD` — `/healthchecks/rustfs-liveness.sh`
# env:
#   RUSTFS_PORT          (default 9000)
#   HEALTHCHECK_TIMEOUT  (default 3 초)

set -eu

PORT="${RUSTFS_PORT:-9000}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-3}"

CODE=$(curl -s --max-time "${TIMEOUT}" -o /dev/null -w '%{http_code}' \
  "http://localhost:${PORT}/" || echo '000')

case "${CODE}" in
  200|403) exit 0 ;;
  *)
    echo "rustfs-liveness: unhealthy (HTTP ${CODE})" >&2
    exit 1
    ;;
esac
