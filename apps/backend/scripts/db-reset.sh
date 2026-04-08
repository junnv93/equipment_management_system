#!/usr/bin/env bash
# db-reset.sh — 로컬 개발 DB를 일회용으로 다루기 위한 재구축 스크립트
#
# 언제 사용하나:
#   - PC 이동 후: 다른 PC에서의 마이그레이션/seed 상태와 로컬 DB가 어긋났을 때
#   - 마이그레이션 히스토리가 꼬였을 때 (__drizzle_migrations 불일치)
#   - 깨끗한 상태에서 다시 시작하고 싶을 때
#
# 동작:
#   1) postgres_equipment 컨테이너의 equipment_management DB 연결 강제 종료
#   2) DB DROP + CREATE
#   3) drizzle-kit migrate (0000 → 최신)
#   4) seed-test-new.ts 실행
#
# 전제: docker compose up -d 로 postgres_equipment + redis_equipment 이 실행 중

set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-postgres_equipment}"
DB_NAME="${DB_NAME:-equipment_management}"
DB_USER="${DB_USER:-postgres}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "==> [1/4] Postgres 컨테이너 상태 확인 ($CONTAINER)"
if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "ERROR: $CONTAINER 컨테이너가 실행 중이 아닙니다. 먼저 'docker compose up -d' 실행하세요." >&2
  exit 1
fi

echo "==> [2/4] DB DROP + CREATE ($DB_NAME)"
docker exec -i "$CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
 WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${DB_NAME}";
CREATE DATABASE "${DB_NAME}";
SQL

echo "==> [3/4] drizzle-kit migrate"
cd "$BACKEND_DIR"
pnpm --filter @equipment-management/db run build
npx drizzle-kit migrate

echo "==> [4/4] seed-test-new.ts"
npx ts-node src/database/seed-test-new.ts

echo ""
echo "✓ DB 재구축 완료. 이제 'pnpm dev' 실행하세요."
