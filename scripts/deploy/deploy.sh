#!/bin/bash
# 무중단 순차 배포 스크립트
# 사용법: ./scripts/deploy/deploy.sh [sha]
# sha 미지정 시 :latest 사용

set -euo pipefail

COMPOSE="docker compose -f /opt/equipment-management/docker-compose.prod.yml"
SHA="${1:-latest}"
REGISTRY="${DOCKER_HUB_USERNAME:-myregistry}/equipment-management"
MAX_WAIT=120  # 헬스체크 최대 대기 (초)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

wait_healthy() {
  local SERVICE="$1"
  local ELAPSED=0
  log "Waiting for ${SERVICE} to be healthy..."
  until [ "$(docker inspect --format='{{.State.Health.Status}}' "$(docker compose -f /opt/equipment-management/docker-compose.prod.yml ps -q "$SERVICE")" 2>/dev/null)" = "healthy" ]; do
    sleep 5
    ELAPSED=$((ELAPSED + 5))
    if [ $ELAPSED -ge $MAX_WAIT ]; then
      log "ERROR: ${SERVICE} did not become healthy within ${MAX_WAIT}s"
      exit 1
    fi
  done
  log "${SERVICE} is healthy (${ELAPSED}s)"
}

# Step 1: DB 마이그레이션 (서비스 재시작 전 먼저 실행)
log "Step 1/4: Running database migrations..."
$COMPOSE --profile migration run --rm migration
log "Migrations complete"

# Step 2: Backend 재배포
log "Step 2/4: Deploying backend..."
$COMPOSE up -d --no-deps --pull=always backend
wait_healthy backend

# Step 3: Frontend 재배포
log "Step 3/4: Deploying frontend..."
$COMPOSE up -d --no-deps --pull=always frontend
wait_healthy frontend

# Step 4: Nginx reload (다운타임 없음)
log "Step 4/4: Reloading nginx..."
$COMPOSE exec nginx nginx -s reload

# 정리
docker image prune -f

log "Deployment complete! SHA: ${SHA}"
