#!/usr/bin/env bash
# ─────────────────────────────────────────────
# Docker Compose 서비스 디스커버리 유틸리티 (SSOT)
#
# 컨테이너 이름은 Docker Compose 프로젝트명에 따라 자동 생성되므로
# 하드코딩하면 안 된다 (base.yml 주석: "container_name 미지정 — 프로젝트 scope로
# 자동 생성하여 충돌 방지").
#
# 이 헬퍼는 `docker compose` CLI를 통해 서비스명 기반으로
# 컨테이너를 동적 탐지한다.
#
# 사용법:
#   source "$(dirname "${BASH_SOURCE[0]}")/../lib/docker-compose-utils.sh"
#   compose_exec "postgres" psql -U "$DB_USER" ...
# ─────────────────────────────────────────────

# Docker Compose 프로젝트 루트 탐색 (docker-compose.yml이 있는 디렉토리)
_find_compose_root() {
  local dir="${1:-$(pwd)}"
  while [[ "$dir" != "/" ]]; do
    if [[ -f "$dir/docker-compose.yml" ]] || [[ -f "$dir/compose.yml" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

# 서비스명으로 실행 중인 컨테이너 이름을 동적 탐지
# Usage: resolve_container <service_name>
# Returns: 컨테이너 이름 (stdout), 실패 시 exit 1
resolve_container() {
  local service="$1"
  if [[ -z "$service" ]]; then
    echo "ERROR: resolve_container에 서비스명이 필요합니다." >&2
    return 1
  fi

  local compose_root
  compose_root=$(_find_compose_root) || {
    echo "ERROR: docker-compose.yml을 찾을 수 없습니다." >&2
    return 1
  }

  local container
  container=$(docker compose -f "$compose_root/docker-compose.yml" ps --format '{{.Name}}' "$service" 2>/dev/null | head -1)

  if [[ -z "$container" ]]; then
    echo "ERROR: '$service' 서비스의 컨테이너가 실행 중이 아닙니다. 먼저 'docker compose up -d' 실행하세요." >&2
    return 1
  fi

  echo "$container"
}

# docker compose exec를 서비스명으로 직접 실행 (컨테이너 이름 불필요)
# Usage: compose_exec <service_name> <command...>
compose_exec() {
  local service="$1"
  shift

  local compose_root
  compose_root=$(_find_compose_root) || {
    echo "ERROR: docker-compose.yml을 찾을 수 없습니다." >&2
    return 1
  }

  docker compose -f "$compose_root/docker-compose.yml" exec -T "$service" "$@"
}
