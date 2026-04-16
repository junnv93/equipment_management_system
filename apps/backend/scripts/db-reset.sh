#!/usr/bin/env bash
# db-reset.sh — 로컬 개발 DB를 일회용으로 다루기 위한 재구축 스크립트
#
# 언제 사용하나:
#   - PC 이동 후: 다른 PC에서의 마이그레이션/seed 상태와 로컬 DB가 어긋났을 때
#   - 마이그레이션 히스토리가 꼬였을 때 (__drizzle_migrations 불일치)
#   - 깨끗한 상태에서 다시 시작하고 싶을 때
#
# 동작:
#   1) docker compose를 통해 postgres 서비스 상태 확인
#   2) DB DROP + CREATE
#   3) drizzle-kit migrate (0000 → 최신)
#   4) seed-test-new.ts 실행
#
# 전제: docker compose up -d 로 postgres + redis 서비스가 실행 중

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$BACKEND_DIR/../.." && pwd)"

# SSOT: .env에서 DB 설정을 읽거나 base.yml 기본값과 동일한 폴백 사용
DB_NAME="${DB_NAME:-equipment_management}"
DB_USER="${DB_USER:-postgres}"

# ── [1/4] Postgres 서비스 상태 확인 (서비스명 기반 — 컨테이너 이름 불필요)
echo "==> [1/4] Postgres 서비스 상태 확인"
if ! docker compose -f "$PROJECT_ROOT/docker-compose.yml" ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "ERROR: postgres 서비스가 실행 중이 아닙니다. 먼저 'docker compose up -d' 실행하세요." >&2
  exit 1
fi
echo "    ✓ postgres 서비스 실행 중"

# ── [2/4] DB DROP + CREATE
echo "==> [2/4] DB DROP + CREATE ($DB_NAME)"
docker compose -f "$PROJECT_ROOT/docker-compose.yml" exec -T postgres \
  psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
 WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${DB_NAME}";
CREATE DATABASE "${DB_NAME}";
SQL

# ── [3/4] drizzle-kit migrate
echo "==> [3/4] drizzle-kit migrate"
cd "$BACKEND_DIR"
pnpm --filter @equipment-management/db run build
npx drizzle-kit migrate

# ── [4/4] seed
echo "==> [4/4] seed-test-new.ts"
npx ts-node src/database/seed-test-new.ts

echo ""
echo "✓ DB 재구축 완료. 이제 'pnpm dev' 실행하세요."
