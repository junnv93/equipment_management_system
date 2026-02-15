#!/bin/bash
# PostgreSQL 백업 복원 스크립트
# 사용법: ./restore-database.sh /path/to/backup_file.sql.gz

set -e

# ============================================
# 설정 변수
# ============================================
DB_CONTAINER="equipment_postgres_prod"
DB_NAME="postgres_equipment"
DB_USER="postgres"

# ============================================
# 인자 확인
# ============================================
if [ $# -eq 0 ]; then
    echo "사용법: $0 <백업파일.sql.gz>"
    echo ""
    echo "사용 가능한 백업 파일 목록:"
    ls -lh /var/lib/equipment-system/backups/postgres_equipment_*.sql.gz 2>/dev/null || echo "백업 파일 없음"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "ERROR: 백업 파일이 존재하지 않습니다: ${BACKUP_FILE}"
    exit 1
fi

# ============================================
# 안전 확인
# ============================================
echo "⚠️  경고: 기존 데이터베이스가 완전히 삭제됩니다!"
echo "백업 파일: ${BACKUP_FILE}"
echo ""
read -p "정말 복원하시겠습니까? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "복원 취소됨"
    exit 0
fi

# ============================================
# Docker 컨테이너 확인
# ============================================
if ! docker ps | grep -q "${DB_CONTAINER}"; then
    echo "ERROR: PostgreSQL 컨테이너가 실행 중이 아닙니다!"
    exit 1
fi

# ============================================
# 복원 실행
# ============================================
echo "복원 시작..."

# 기존 연결 종료
echo "1. 기존 DB 연결 종료 중..."
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# 기존 DB 삭제 및 재생성
echo "2. 기존 DB 삭제 및 재생성 중..."
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# 백업 복원
echo "3. 백업 데이터 복원 중..."
gunzip < "${BACKUP_FILE}" | docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}"

echo ""
echo "✅ 복원 완료!"
echo ""

# 복원 검증
echo "4. 복원 검증 중..."
TABLE_COUNT=$(docker exec -t "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c \
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "복원된 테이블 수: ${TABLE_COUNT}"

echo ""
echo "⚠️  애플리케이션을 재시작해주세요:"
echo "   docker compose -f docker-compose.lan.yml restart backend frontend"
