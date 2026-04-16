#!/usr/bin/env bash
# 수동 마이그레이션 파일을 DB에 적용하는 스크립트
#
# docker compose exec를 사용하여 서비스명 기반으로 접근 (컨테이너 이름 하드코딩 불필요)

set -euo pipefail

echo "==> 수동 마이그레이션 적용 시작..."
echo ""

# 프로젝트 루트 디렉토리
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANUAL_DIR="$ROOT_DIR/apps/backend/drizzle/manual"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

# SSOT: .env 기본값과 동일
DB_NAME="${DB_NAME:-equipment_management}"
DB_USER="${DB_USER:-postgres}"

# 수동 마이그레이션 파일 목록
MIGRATIONS=(
  "20260121_add_spec_match_and_calibration_required.sql"
  "20260121_add_equipment_history.sql"
  "20260121_update_role_codes.sql"
)

echo "  마이그레이션 디렉토리: $MANUAL_DIR"
echo "  적용할 마이그레이션: ${#MIGRATIONS[@]}개"
echo ""

for migration in "${MIGRATIONS[@]}"; do
  MIGRATION_FILE="$MANUAL_DIR/$migration"

  if [ ! -f "$MIGRATION_FILE" ]; then
    echo "  경고: $migration 파일을 찾을 수 없습니다. 건너뜁니다."
    continue
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  $migration"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  docker compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U "$DB_USER" -d "$DB_NAME" < "$MIGRATION_FILE" 2>&1 | grep -v "^NOTICE" || true
  echo "  -> 완료"
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  모든 수동 마이그레이션 적용 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 검증
echo "==> 스키마 검증 중..."
echo ""
echo "equipment 테이블의 spec_match, calibration_required 컬럼:"
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql -U "$DB_USER" -d "$DB_NAME" -c "\d equipment" | grep -E "(spec_match|calibration_required)" || echo "  컬럼을 찾을 수 없습니다"
echo ""
echo "검증 완료!"
