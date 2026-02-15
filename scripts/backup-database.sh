#!/bin/bash
# PostgreSQL 자동 백업 스크립트
# 사용법: ./backup-database.sh
# Crontab 등록: 0 2 * * * /path/to/backup-database.sh

set -e  # 에러 발생 시 즉시 중단

# ============================================
# 설정 변수
# ============================================
BACKUP_DIR="/var/lib/equipment-system/backups"
DB_CONTAINER="equipment_postgres_prod"
DB_NAME="postgres_equipment"
DB_USER="postgres"
RETENTION_DAYS=30  # 백업 보관 기간

# 날짜 형식: 2026-02-15_14-30-00
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/postgres_equipment_${TIMESTAMP}.sql.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"

# ============================================
# 백업 디렉토리 생성
# ============================================
mkdir -p "${BACKUP_DIR}"

# ============================================
# 로그 함수
# ============================================
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# ============================================
# 백업 실행
# ============================================
log "백업 시작: ${DB_NAME}"

# Docker 컨테이너 확인
if ! docker ps | grep -q "${DB_CONTAINER}"; then
    log "ERROR: PostgreSQL 컨테이너가 실행 중이 아닙니다!"
    exit 1
fi

# pg_dump 실행 (압축 포함)
if docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    log "백업 성공: ${BACKUP_FILE} (크기: ${BACKUP_SIZE})"
else
    log "ERROR: 백업 실패!"
    exit 1
fi

# ============================================
# 오래된 백업 삭제 (보관 기간 초과)
# ============================================
log "오래된 백업 정리 중 (${RETENTION_DAYS}일 이전)..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "postgres_equipment_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
log "삭제된 백업: ${DELETED_COUNT}개"

# ============================================
# 백업 목록 확인
# ============================================
TOTAL_BACKUPS=$(find "${BACKUP_DIR}" -name "postgres_equipment_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
log "현재 백업 파일: ${TOTAL_BACKUPS}개 (총 크기: ${TOTAL_SIZE})"

# ============================================
# 백업 검증 (옵션: 압축 해제 테스트)
# ============================================
if gzip -t "${BACKUP_FILE}"; then
    log "백업 파일 검증 완료 (압축 무결성 OK)"
else
    log "WARNING: 백업 파일 검증 실패! 파일 손상 가능성"
fi

log "백업 완료\n"
