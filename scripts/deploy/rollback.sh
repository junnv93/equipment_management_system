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

log "Rolling back to SHA: ${SHA}"

docker pull "${REGISTRY}-backend:${SHA}"
docker pull "${REGISTRY}-frontend:${SHA}"

docker tag "${REGISTRY}-backend:${SHA}" "${REGISTRY}-backend:latest"
docker tag "${REGISTRY}-frontend:${SHA}" "${REGISTRY}-frontend:latest"

# 순차 재시작 (deploy.sh와 동일 순서)
$COMPOSE up -d --no-deps backend
sleep 20
$COMPOSE up -d --no-deps frontend
sleep 10
$COMPOSE exec nginx nginx -s reload

log "Rollback to ${SHA} complete"
