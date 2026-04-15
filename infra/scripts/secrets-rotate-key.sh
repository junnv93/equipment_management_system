#!/usr/bin/env bash
# age 키 회전 — .sops.yaml 의 keys: 를 변경한 뒤 기존 암호화 파일을 새 키 집합으로 재암호화.
#
# 회전 시나리오:
#   1. 새 PC 추가 — public key 를 .sops.yaml 에 추가 → 본 스크립트로 updatekeys
#   2. 키 분실/유출 — 손상된 key 를 .sops.yaml 에서 제거 → 본 스크립트로 updatekeys
#                    + 실제 secret 값들도 회전 (DB 비밀번호 등, 별도 수동 작업)
#
# Usage:
#   1) .sops.yaml 을 편집하여 keys: 섹션 갱신 + 커밋
#   2) bash infra/scripts/secrets-rotate-key.sh
#
# 본 스크립트는 .sops.yaml 을 수정하지 않는다. 키 목록 편집은 수동이다 (리뷰 지점).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
AGE_KEY="${SOPS_AGE_KEY_FILE:-${HOME}/.config/sops/age/keys.txt}"

log()  { printf '[secrets-rotate-key] %s\n' "$*" >&2; }
fail() { printf '[secrets-rotate-key] ❌ %s\n' "$*" >&2; exit 1; }

command -v sops >/dev/null || fail "sops 미설치"
[ -f "${AGE_KEY}" ] || fail "age 키 없음: ${AGE_KEY}"
[ -f "${ROOT_DIR}/.sops.yaml" ] || fail ".sops.yaml 없음"

export SOPS_AGE_KEY_FILE="${AGE_KEY}"

log ".sops.yaml 기준 recipients 재적용..."
cd "${ROOT_DIR}"

for file in infra/secrets/*.env.sops.yaml; do
  [ -f "${file}" ] || continue
  log "  updatekeys: ${file}"
  sops updatekeys --yes "${file}"
done

log "✔ 완료. 'git diff infra/secrets/' 로 변경 확인 후 커밋하라."
log "  주의: 키 유출로 인한 회전이면 secret 값 자체도 회전해야 한다 (DB 비밀번호 등)."
log "        상세 절차: docs/operations/secret-rotation.md"
