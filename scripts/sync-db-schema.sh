#!/usr/bin/env bash
# DB 스키마 동기화 스크립트
# Drizzle 스키마 파일 기준으로 개발 DB를 동기화합니다
#
# docker compose exec를 사용하여 서비스명 기반으로 접근 (컨테이너 이름 하드코딩 불필요)

set -euo pipefail

echo "==> DB 스키마 동기화 시작..."
echo ""

# 프로젝트 루트 디렉토리
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# SSOT: .env 기본값과 동일
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-equipment_management}"

echo "  DB 동기화 (localhost:$DB_PORT/$DB_NAME)"
echo "-------------------------------------------"
cd "$ROOT_DIR/apps/backend"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}" npx drizzle-kit push
echo "  DB 동기화 완료"
echo ""

echo "==> DB 스키마 동기화 완료!"
echo ""
echo "검증 명령어:"
echo "  docker compose exec postgres psql -U $DB_USER -d $DB_NAME -c '\\d equipment'"
