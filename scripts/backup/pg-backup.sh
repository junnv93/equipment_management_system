#!/bin/bash
# PostgreSQL 자동 백업 스크립트
# 사용법: ./pg-backup.sh
# crontab: 0 2 * * * /opt/equipment-management/scripts/backup/pg-backup.sh >> /var/log/pg-backup.log 2>&1

set -euo pipefail

# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/opt/equipment-management/backups/postgres}"
DB_NAME="${DB_NAME:-equipment_management}"
DB_USER="${DB_USER:-postgres}"
RETAIN_DAYS="${RETAIN_DAYS:-7}"
CONTAINER_NAME="${CONTAINER_NAME:-equipment-management-postgres-1}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

# ─────────────────────────────────────────────
# 백업 디렉토리 생성
# ─────────────────────────────────────────────
mkdir -p "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 시작: ${DB_NAME}"

# ─────────────────────────────────────────────
# pg_dump 실행 (gzip 압축)
# ─────────────────────────────────────────────
if docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 백업 완료: ${BACKUP_FILE} (${BACKUP_SIZE})"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 오류: 백업 실패" >&2
    exit 1
fi

# ─────────────────────────────────────────────
# 백업 파일 무결성 검증
# ─────────────────────────────────────────────
if gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 무결성 검증 통과"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 오류: 백업 파일 손상 감지" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# ─────────────────────────────────────────────
# 오래된 백업 정리 (RETAIN_DAYS일 이상)
# ─────────────────────────────────────────────
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${RETAIN_DAYS}" | wc -l)
find "${BACKUP_DIR}" -name "*.sql.gz" -mtime "+${RETAIN_DAYS}" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] ${DELETED_COUNT}개 오래된 백업 삭제 (${RETAIN_DAYS}일 이상)"

# ─────────────────────────────────────────────
# 백업 목록 출력
# ─────────────────────────────────────────────
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 현재 백업: ${BACKUP_COUNT}개, 총 크기: ${TOTAL_SIZE}"
