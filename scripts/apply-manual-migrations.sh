#!/bin/bash

# 수동 마이그레이션 파일을 모든 DB에 적용하는 스크립트

set -e

echo "🔄 수동 마이그레이션 적용 시작..."
echo ""

# 프로젝트 루트 디렉토리
ROOT_DIR="$(dirname "$0")/.."
MANUAL_DIR="$ROOT_DIR/apps/backend/drizzle/manual"

# 수동 마이그레이션 파일 목록
MIGRATIONS=(
  "20260121_add_spec_match_and_calibration_required.sql"
  "20260121_add_equipment_history.sql"
  "20260121_update_role_codes.sql"
)

echo "📁 마이그레이션 디렉토리: $MANUAL_DIR"
echo "📝 적용할 마이그레이션: ${#MIGRATIONS[@]}개"
echo ""

for migration in "${MIGRATIONS[@]}"; do
  MIGRATION_FILE="$MANUAL_DIR/$migration"

  if [ ! -f "$MIGRATION_FILE" ]; then
    echo "⚠️  경고: $migration 파일을 찾을 수 없습니다. 건너뜁니다."
    continue
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📦 $migration"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # DB에 적용
  echo "  → DB (localhost:5433/equipment_management)"
  docker exec -i postgres_equipment psql -U postgres -d equipment_management < "$MIGRATION_FILE" 2>&1 | grep -v "^NOTICE" || true
  echo "  ✅ 완료"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 모든 수동 마이그레이션 적용 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 검증
echo "📊 스키마 검증 중..."
echo ""
echo "DB - equipment 테이블의 spec_match, calibration_required 컬럼:"
docker exec postgres_equipment psql -U postgres -d equipment_management -c "\d equipment" | grep -E "(spec_match|calibration_required)" || echo "  ⚠️  컬럼을 찾을 수 없습니다"
echo ""
echo "✅ 검증 완료!"
