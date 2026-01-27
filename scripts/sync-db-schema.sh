#!/bin/bash

# DB 스키마 동기화 스크립트
# 개발 DB와 테스트 DB를 Drizzle 스키마 파일 기준으로 동기화합니다

set -e

echo "🔄 DB 스키마 동기화 시작..."
echo ""

# 프로젝트 루트 디렉토리로 이동
cd "$(dirname "$0")/.."

echo "📦 DB 동기화 (localhost:5432)"
echo "-------------------------------------------"
cd apps/backend
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/equipment_management" npx drizzle-kit push
echo "✅ DB 동기화 완료"
echo ""

echo "🎉 DB 스키마 동기화 완료!"
echo ""
echo "📊 검증 명령어:"
echo "  docker exec postgres_equipment psql -U postgres -d equipment_management -c '\\d equipment'"
