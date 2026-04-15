#!/usr/bin/env bash
# Secret 편집 — sops 로 infra/secrets/<env>.env.sops.yaml 을 $EDITOR 로 열고 저장 시 자동 재암호화.
#
# Usage:
#   bash infra/scripts/secrets-edit.sh lan
#   bash infra/scripts/secrets-edit.sh prod
#   ENV=lan pnpm secrets:edit
#
# Env vars:
#   EDITOR              기본 nano (sops 기본 동작)
#   SOPS_AGE_KEY_FILE   기본 ~/.config/sops/age/keys.txt

set -euo pipefail

ENV_NAME="${1:-${ENV:-}}"
if [ -z "${ENV_NAME}" ] || { [ "${ENV_NAME}" != "lan" ] && [ "${ENV_NAME}" != "prod" ]; }; then
  printf '[secrets-edit] usage: %s <lan|prod>\n' "$0" >&2
  exit 2
fi

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
TARGET="${ROOT_DIR}/infra/secrets/${ENV_NAME}.env.sops.yaml"
AGE_KEY="${SOPS_AGE_KEY_FILE:-${HOME}/.config/sops/age/keys.txt}"

fail() { printf '[secrets-edit] ❌ %s\n' "$*" >&2; exit 1; }

command -v sops >/dev/null || fail "sops 미설치"
[ -f "${AGE_KEY}" ] || fail "age 키 파일 없음: ${AGE_KEY}"

export SOPS_AGE_KEY_FILE="${AGE_KEY}"

if [ ! -f "${TARGET}" ]; then
  printf '[secrets-edit] %s 생성합니다. .sops.yaml recipients 가 설정되어 있어야 합니다.\n' "${TARGET}" >&2
fi

cd "${ROOT_DIR}"
exec sops "${TARGET#"${ROOT_DIR}/"}"
