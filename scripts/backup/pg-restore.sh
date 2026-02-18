#!/bin/bash
# PostgreSQL 백업 복구 스크립트
# 사용법: ./pg-restore.sh <backup_file.sql.gz>

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_NAME="${DB_NAME:-equipment_management}"
DB_USER="${DB_USER:-postgres}"
CONTAINER_NAME="${CONTAINER_NAME:-equipment-management-postgres-1}"

if [ -z "${BACKUP_FILE}" ]; then
    echo "사용법: $0 <backup_file.sql.gz>"
    echo ""
    echo "사용 가능한 백업:"
    ls -lh /opt/equipment-management/backups/postgres/*.sql.gz 2>/dev/null || echo "(백업 파일 없음)"
    exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "오류: 파일을 찾을 수 없습니다: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  경고: 이 작업은 현재 데이터베이스를 덮어씁니다!"
echo "복구 파일: ${BACKUP_FILE}"
echo "대상 DB: ${DB_NAME}"
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "${CONFIRM}" != "yes" ]; then
    echo "복구 취소됨"
    exit 0
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 복구 시작..."

# 기존 연결 종료 후 DB 재생성
docker exec "${CONTAINER_NAME}" psql -U "${DB_USER}" -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
" postgres

docker exec "${CONTAINER_NAME}" dropdb -U "${DB_USER}" --if-exists "${DB_NAME}"
docker exec "${CONTAINER_NAME}" createdb -U "${DB_USER}" "${DB_NAME}"

# 복구 실행
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" "${DB_NAME}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 복구 완료"
