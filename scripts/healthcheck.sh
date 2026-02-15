#!/bin/bash
# 시스템 헬스체크 스크립트
# 모든 서비스 상태, 디스크 사용량, 백업 상태 확인

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 설정
# ============================================
BACKUP_DIR="/var/lib/equipment-system/backups"
DATA_DIR="/var/lib/equipment-system"
COMPOSE_FILE="docker-compose.lan.yml"

# ============================================
# 헬스체크 함수
# ============================================

check_docker() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Docker 서비스 상태"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}✗ Docker가 실행 중이 아닙니다!${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ Docker 정상 작동${NC}"
}

check_containers() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "2. 컨테이너 상태"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    CONTAINERS=(
        "equipment_postgres_prod"
        "equipment_redis_prod"
        "equipment_backend_prod"
        "equipment_frontend_prod"
        "equipment_nginx_prod"
    )

    ALL_RUNNING=true
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            STATUS=$(docker inspect --format='{{.State.Status}}' "$container")
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

            if [ "$STATUS" = "running" ]; then
                if [ "$HEALTH" = "healthy" ] || [ "$HEALTH" = "none" ]; then
                    echo -e "${GREEN}✓${NC} $container (${STATUS})"
                else
                    echo -e "${YELLOW}⚠${NC} $container (${STATUS}, health: ${HEALTH})"
                    ALL_RUNNING=false
                fi
            else
                echo -e "${RED}✗${NC} $container (${STATUS})"
                ALL_RUNNING=false
            fi
        else
            echo -e "${RED}✗${NC} $container (not found)"
            ALL_RUNNING=false
        fi
    done

    if ! $ALL_RUNNING; then
        return 1
    fi
}

check_disk() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "3. 디스크 사용량"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 전체 디스크
    TOTAL_USAGE=$(df -h "${DATA_DIR}" | awk 'NR==2 {print $5}' | sed 's/%//')
    TOTAL_AVAIL=$(df -h "${DATA_DIR}" | awk 'NR==2 {print $4}')

    echo "전체 디스크: ${TOTAL_USAGE}% 사용 (여유 공간: ${TOTAL_AVAIL})"

    if [ "$TOTAL_USAGE" -gt 90 ]; then
        echo -e "${RED}✗ 디스크 용량 부족!${NC}"
    elif [ "$TOTAL_USAGE" -gt 80 ]; then
        echo -e "${YELLOW}⚠ 디스크 용량 주의${NC}"
    else
        echo -e "${GREEN}✓ 디스크 여유 공간 충분${NC}"
    fi

    # 세부 사용량
    echo ""
    echo "세부 디렉토리 크기:"
    du -sh "${DATA_DIR}"/* 2>/dev/null | sort -hr
}

check_backup() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "4. 백업 상태"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -d "${BACKUP_DIR}" ]; then
        echo -e "${RED}✗ 백업 디렉토리가 없습니다!${NC}"
        return 1
    fi

    BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "postgres_equipment_*.sql.gz" 2>/dev/null | wc -l)

    if [ "$BACKUP_COUNT" -eq 0 ]; then
        echo -e "${RED}✗ 백업 파일이 없습니다!${NC}"
        return 1
    fi

    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/postgres_equipment_*.sql.gz 2>/dev/null | head -1)
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" 2>/dev/null | cut -f1)
    BACKUP_TIME=$(stat -c %y "$LATEST_BACKUP" 2>/dev/null | cut -d'.' -f1)
    BACKUP_AGE_HOURS=$(( ( $(date +%s) - $(stat -c %Y "$LATEST_BACKUP") ) / 3600 ))

    echo "백업 파일 수: ${BACKUP_COUNT}개"
    echo "최신 백업: ${BACKUP_TIME} (${BACKUP_AGE_HOURS}시간 전)"
    echo "백업 크기: ${BACKUP_SIZE}"

    if [ "$BACKUP_AGE_HOURS" -gt 48 ]; then
        echo -e "${YELLOW}⚠ 백업이 2일 이상 오래되었습니다${NC}"
    else
        echo -e "${GREEN}✓ 백업 정상${NC}"
    fi
}

check_resources() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "5. 리소스 사용량"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo "컨테이너별 리소스 사용량 (최근 1초):"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
}

check_network() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "6. 네트워크 접근성"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Frontend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓${NC} Frontend (Port 3000) 정상"
    else
        echo -e "${RED}✗${NC} Frontend (Port 3000) 응답 없음"
    fi

    # Backend
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
        echo -e "${GREEN}✓${NC} Backend (Port 3001) 정상"
    else
        echo -e "${RED}✗${NC} Backend (Port 3001) 응답 없음"
    fi

    # Nginx
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/health | grep -q "200"; then
        echo -e "${GREEN}✓${NC} Nginx (Port 80) 정상"
    else
        echo -e "${RED}✗${NC} Nginx (Port 80) 응답 없음"
    fi
}

check_database() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "7. 데이터베이스 상태"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    DB_SIZE=$(docker exec equipment_postgres_prod psql -U postgres -d postgres_equipment -t -c \
        "SELECT pg_size_pretty(pg_database_size('postgres_equipment'));" 2>/dev/null | xargs)

    TABLE_COUNT=$(docker exec equipment_postgres_prod psql -U postgres -d postgres_equipment -t -c \
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)

    CONNECTION_COUNT=$(docker exec equipment_postgres_prod psql -U postgres -d postgres_equipment -t -c \
        "SELECT count(*) FROM pg_stat_activity WHERE datname = 'postgres_equipment';" 2>/dev/null | xargs)

    echo "DB 크기: ${DB_SIZE}"
    echo "테이블 수: ${TABLE_COUNT}개"
    echo "활성 연결: ${CONNECTION_COUNT}개"

    if [ "$CONNECTION_COUNT" -gt 50 ]; then
        echo -e "${YELLOW}⚠ DB 연결 수가 많습니다${NC}"
    else
        echo -e "${GREEN}✓ DB 정상${NC}"
    fi
}

# ============================================
# 메인 실행
# ============================================
echo ""
echo "╔════════════════════════════════════════╗"
echo "║  장비 관리 시스템 헬스체크            ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "점검 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

FAILED=false

check_docker || FAILED=true
check_containers || FAILED=true
check_disk || FAILED=true
check_backup || FAILED=true
check_resources || FAILED=true
check_network || FAILED=true
check_database || FAILED=true

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if $FAILED; then
    echo -e "${YELLOW}⚠ 일부 항목에 문제가 있습니다${NC}"
    exit 1
else
    echo -e "${GREEN}✓ 모든 시스템 정상 작동${NC}"
    exit 0
fi
