#!/usr/bin/env bash
# Predev guard — pnpm dev 시작 전 인프라 drift·오염 사전 탐지.
#
# 기본 동작은 **non-destructive (dry-run)**. 탐지한 문제는 경고만 출력하고
# 파괴적 동작(볼륨 삭제, 컨테이너 force-recreate)은 수행하지 않는다.
# 명시적 `--confirm` 플래그 또는 `PREDEV_GUARD_CONFIRM=1` 환경 변수가 있을 때만 수행.
# (메모리: feedback_destructive_dry_run_first.md — 파괴적 명령은 dry-run 후 실행)
#
# 책임:
#   1. Docker daemon 미기동 시 graceful skip (사용자 환경 비블로킹)
#   2. Redis RDB 매직바이트 검사 — 현 이미지 호환 RDB 버전 초과 시 경고
#      (+ --confirm 시 자동 볼륨 삭제: 오늘의 "Can't handle RDB format version 13" 재발 방지)
#   3. Compose config hash 비교 — compose 파일 변경 시 경고
#      (+ --confirm 시 자동 --force-recreate)
#
# 성능: read-only 검사 ≤50ms. Docker 미기동 시 즉시 반환.
#
# Usage:
#   bash infra/scripts/predev-guard.sh                 # 감지만 (기본, 파괴 없음)
#   bash infra/scripts/predev-guard.sh --confirm       # 감지 + 자동 수복
#   PREDEV_GUARD_CONFIRM=1 bash .../predev-guard.sh    # 환경변수로 CI 비대화식 허용
#   bash infra/scripts/predev-guard.sh --no-volume-delete  # 볼륨 삭제는 절대 금지 (force-recreate만 허용)

set -euo pipefail

CONFIRM=0
ALLOW_VOLUME_DELETE=1

# 환경변수 override — CI 편의
if [ "${PREDEV_GUARD_CONFIRM:-0}" = "1" ]; then
  CONFIRM=1
fi

for arg in "$@"; do
  case "${arg}" in
    --confirm)
      CONFIRM=1
      ;;
    --dry-run)
      # 후방 호환 — 과거 기본 동작 명시적 지정
      CONFIRM=0
      ;;
    --no-volume-delete)
      ALLOW_VOLUME_DELETE=0
      ;;
    -h|--help)
      sed -n '2,25p' "$0"
      exit 0
      ;;
    *)
      printf '[predev-guard] unknown option: %s\n' "${arg}" >&2
      exit 2
      ;;
  esac
done

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "${ROOT_DIR}"

STATE_DIR=".cache/predev-guard"
mkdir -p "${STATE_DIR}"

log()  { printf '[predev-guard] %s\n' "$*" >&2; }
warn() { printf '[predev-guard] ⚠  %s\n' "$*" >&2; }
hint() { printf '[predev-guard]    → %s\n' "$*" >&2; }

# 1. Docker daemon 가용성
if ! docker info >/dev/null 2>&1; then
  log "docker daemon 미기동 — 검사 skip"
  exit 0
fi

# 2. Redis RDB 포맷 드리프트 검사
# 프로젝트 name이 'equipment-management-system'(하이픈) — Compose가 볼륨 prefix에 사용.
REDIS_VOLUME_CANDIDATES=(
  "equipment-management-system_redis_data"
  "equipment_management_system_redis_data"
)
MAX_SUPPORTED_RDB_VERSION=11

for REDIS_VOLUME in "${REDIS_VOLUME_CANDIDATES[@]}"; do
  if ! docker volume inspect "${REDIS_VOLUME}" >/dev/null 2>&1; then
    continue
  fi

  MAGIC=$(docker run --rm -v "${REDIS_VOLUME}:/d:ro" alpine:latest sh -c \
    'test -s /d/dump.rdb && head -c 9 /d/dump.rdb || true' 2>/dev/null || true)

  if [ -z "${MAGIC}" ] || [ "${MAGIC#REDIS}" = "${MAGIC}" ]; then
    continue
  fi

  VERSION="${MAGIC#REDIS}"
  VERSION_NUM=$((10#${VERSION}))
  if [ "${VERSION_NUM}" -le "${MAX_SUPPORTED_RDB_VERSION}" ]; then
    continue
  fi

  # 오염 감지: 볼륨 내용 정보 출력 (메모리: dry-run 후 실행)
  warn "redis 볼륨 오염 감지: '${REDIS_VOLUME}' RDB v${VERSION_NUM} (현 이미지 지원: v${MAX_SUPPORTED_RDB_VERSION})"
  VOL_INFO=$(docker run --rm -v "${REDIS_VOLUME}:/d:ro" alpine:latest sh -c \
    'find /d -maxdepth 1 -type f -exec stat -c "%n (%s bytes)" {} \;' 2>/dev/null || true)
  hint "볼륨 내용: ${VOL_INFO:-(empty)}"

  if [ "${CONFIRM}" -eq 0 ]; then
    hint "자동 수복하려면 --confirm 또는 PREDEV_GUARD_CONFIRM=1"
    hint "또는: pnpm predev:reset"
  elif [ "${ALLOW_VOLUME_DELETE}" -eq 0 ]; then
    hint "--no-volume-delete 지정됨 — 볼륨 유지, 수동 처리 필요"
  else
    log "볼륨 '${REDIS_VOLUME}' 자동 삭제 (dev ephemeral, 데이터 손실 없음)"
    docker compose rm -sf redis >/dev/null 2>&1 || true
    docker volume rm "${REDIS_VOLUME}" >/dev/null
  fi
done

# 3. Compose config hash 비교 — 파일 변경 후 컨테이너 재생성 누락 감지
HASH_FILE="${STATE_DIR}/compose-config.hash"
CURRENT_HASH=$(docker compose config --hash '*' 2>/dev/null | sort | sha256sum | cut -d' ' -f1)
PREVIOUS_HASH=""
if [ -f "${HASH_FILE}" ]; then
  PREVIOUS_HASH=$(cat "${HASH_FILE}")
fi

if [ -n "${PREVIOUS_HASH}" ] && [ "${CURRENT_HASH}" != "${PREVIOUS_HASH}" ]; then
  warn "compose config 변경 감지 — 실행 중 컨테이너가 옛 설정일 수 있음"
  if [ "${CONFIRM}" -eq 0 ]; then
    hint "재생성: docker compose up -d --force-recreate (또는 --confirm)"
  else
    log "docker compose up -d --force-recreate 실행"
    docker compose up -d --force-recreate >/dev/null 2>&1 || true
  fi
fi

# hash 갱신은 confirm 여부와 무관 (다음 실행 비교를 위해)
echo "${CURRENT_HASH}" > "${HASH_FILE}"

log "OK"
