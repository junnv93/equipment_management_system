#!/bin/sh
# Postgres liveness probe (SSOT).
#
# `pg_isready`는 Postgres 공식 readiness 유틸리티. 초기화 중(exit 1),
# 연결 거부(exit 2), 기타 오류(exit 3)를 구분하며 본 probe에서는 0만 live로 간주.
#
# 사용: Docker healthcheck `CMD` — `/healthchecks/postgres-liveness.sh`
# env:
#   POSTGRES_PORT        (default 5432)
#   POSTGRES_USER        (default postgres)
#   HEALTHCHECK_TIMEOUT  (default 3 초)

set -eu

PORT="${POSTGRES_PORT:-5432}"
USER="${POSTGRES_USER:-postgres}"
TIMEOUT="${HEALTHCHECK_TIMEOUT:-3}"

if pg_isready -h localhost -p "${PORT}" -U "${USER}" -t "${TIMEOUT}" >/dev/null 2>&1; then
  exit 0
fi

echo "postgres-liveness: unhealthy (pg_isready failed)" >&2
exit 1
