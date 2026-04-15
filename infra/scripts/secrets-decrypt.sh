#!/usr/bin/env bash
# Secret 복호화 — sops 로 infra/secrets/<env>.env.sops.yaml 을 tmpfs 로 풀어 compose 가 env_file 로 참조.
#
# tmpfs 경로 (/run/secrets/) 는 재부팅 시 사라지므로 평문 잔존 리스크가 낮다.
# WSL2 / Linux 모두 /run 은 기본 tmpfs. /run 쓰기 불가 환경(예: macOS Docker Desktop host) 일
# 경우 $SOPS_DECRYPT_DIR 환경 변수로 대체 경로를 지정하라 (권장: tmpfs mount).
#
# Usage:
#   bash infra/scripts/secrets-decrypt.sh lan        # → /run/secrets/lan.env (mode 0600)
#   bash infra/scripts/secrets-decrypt.sh prod
#   bash infra/scripts/secrets-decrypt.sh lan --dry-run    # 복호화 산출물 stdout
#
# Env vars:
#   SOPS_AGE_KEY_FILE   기본 ~/.config/sops/age/keys.txt (없으면 에러)
#   SOPS_DECRYPT_DIR    기본 /run/secrets

set -euo pipefail

ENV_NAME="${1:-}"
DRY_RUN=0
for arg in "$@"; do
  case "${arg}" in
    --dry-run) DRY_RUN=1 ;;
    lan|prod) ;;
    -h|--help) sed -n '2,20p' "$0"; exit 0 ;;
    *) printf '[secrets-decrypt] unknown arg: %s\n' "${arg}" >&2; exit 2 ;;
  esac
done

if [ -z "${ENV_NAME}" ] || { [ "${ENV_NAME}" != "lan" ] && [ "${ENV_NAME}" != "prod" ]; }; then
  printf '[secrets-decrypt] usage: %s <lan|prod> [--dry-run]\n' "$0" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${ROOT_DIR}/infra/secrets/${ENV_NAME}.env.sops.yaml"
DEST_DIR="${SOPS_DECRYPT_DIR:-/run/secrets}"
DEST="${DEST_DIR}/${ENV_NAME}.env"
AGE_KEY="${SOPS_AGE_KEY_FILE:-${HOME}/.config/sops/age/keys.txt}"

log()  { printf '[secrets-decrypt] %s\n' "$*" >&2; }
fail() { printf '[secrets-decrypt] ❌ %s\n' "$*" >&2; exit 1; }

command -v sops >/dev/null || fail "sops 미설치 — docs/operations/secret-backup.md 참조"
[ -f "${SRC}" ] || fail "암호화 파일 없음: ${SRC}"
[ -f "${AGE_KEY}" ] || fail "age 키 파일 없음: ${AGE_KEY} (age-keygen 실행 필요)"

# 암호화 검증 — sops 포맷이 아닌 평문을 실수로 커밋했을 경우 차단
grep -q 'sops:' "${SRC}" || fail "${SRC} 가 sops 포맷이 아님 (암호화 안 됨?)"

export SOPS_AGE_KEY_FILE="${AGE_KEY}"

if [ "${DRY_RUN}" -eq 1 ]; then
  log "dry-run: ${SRC} → stdout"
  sops --decrypt --output-type dotenv "${SRC}"
  exit 0
fi

mkdir -p "${DEST_DIR}" 2>/dev/null || fail "디렉토리 생성 실패: ${DEST_DIR} (권한? tmpfs?)"
# tmpfs 여부 확인 (WSL2/Linux 환경 가정)
if [ "${DEST_DIR}" = "/run/secrets" ] && ! mountpoint -q /run 2>/dev/null; then
  log "⚠  /run 이 tmpfs 가 아닐 수 있음 — 평문 잔존 리스크 확인하라"
fi

umask 077
sops --decrypt --output-type dotenv "${SRC}" > "${DEST}"
chmod 0600 "${DEST}"
log "✔ 복호화 완료: ${DEST} (mode 0600)"
