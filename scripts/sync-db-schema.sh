#!/usr/bin/env bash
# DB 마이그레이션 적용 스크립트 (ADR-0010: drizzle-kit push 금지 → journal-based migrate)
#
# 구 동작: drizzle-kit push (스키마 직접 반영, __drizzle_migrations 히스토리 없음)
# 현 동작: drizzle-kit migrate (journal 기반, __drizzle_migrations 순차 적용)
#
# ADR-0010 참조: docs/adr/0010-drizzle-manual-sql-policy.md

set -euo pipefail

echo "==> DB 마이그레이션 적용 시작 (journal-based)..."
echo ""

# 프로젝트 루트 디렉토리
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# SSOT: .env 기본값과 동일
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-equipment_management}"

echo "  DB 마이그레이션 (localhost:$DB_PORT/$DB_NAME)"
echo "-------------------------------------------"
cd "$ROOT_DIR/apps/backend"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" npx drizzle-kit migrate
echo "  DB 마이그레이션 완료"
echo ""

echo "==> DB 마이그레이션 적용 완료!"
echo ""
echo "검증 명령어:"
echo "  docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c '\\d equipment'"
