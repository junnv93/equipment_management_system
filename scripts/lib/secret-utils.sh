#!/bin/bash
# ─────────────────────────────────────────────
# 시크릿 관리 공통 유틸리티 (SSOT)
# generate-secrets.sh, rotate-secrets.sh에서 source로 사용
# ─────────────────────────────────────────────

# 시크릿 생성 함수
# base64 특수문자(/+=) 제거 — shell, YAML, nginx, docker-compose 호환
# 2배 길이를 생성하여 특수문자 제거 후에도 원하는 길이 보장
generate_secret() {
  local LENGTH="${1:-32}"
  openssl rand -base64 $((LENGTH * 2)) | tr -d '/+=\n' | head -c "$LENGTH"
}

# 환경변수 업데이트 함수
# 키가 있으면 값 교체, 없으면 추가
update_env_var() {
  local KEY="$1"
  local VALUE="$2"
  local FILE="${3:-.env}"
  if grep -q "^${KEY}=" "$FILE"; then
    sed -i "s|^${KEY}=.*|${KEY}=${VALUE}|" "$FILE"
  else
    echo "${KEY}=${VALUE}" >> "$FILE"
  fi
}
