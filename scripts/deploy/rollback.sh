#!/bin/bash
set -euo pipefail

SHA="${1:-}"
REGISTRY="${DOCKER_HUB_USERNAME}/equipment-management"

if [ -z "$SHA" ]; then
  echo "Usage: $0 <git-sha>"
  echo ""
  echo "Available images:"
  docker images | grep equipment-management
  exit 1
fi

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
COMPOSE="docker compose -f /opt/equipment-management/docker-compose.prod.yml"
MAX_WAIT=120

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

log "Rolling back to SHA: ${SHA}"

docker pull "${REGISTRY}-backend:${SHA}"
docker pull "${REGISTRY}-frontend:${SHA}"

docker tag "${REGISTRY}-backend:${SHA}" "${REGISTRY}-backend:latest"
docker tag "${REGISTRY}-frontend:${SHA}" "${REGISTRY}-frontend:latest"

# 순차 재시작 (deploy.sh와 동일 순서 + healthcheck 대기)
log "Step 1/3: Rolling back backend..."
$COMPOSE up -d --no-deps backend
wait_healthy backend

log "Step 2/3: Rolling back frontend..."
$COMPOSE up -d --no-deps frontend
wait_healthy frontend

log "Step 3/3: Reloading nginx..."
$COMPOSE exec nginx nginx -s reload

log "Rollback to ${SHA} complete"
