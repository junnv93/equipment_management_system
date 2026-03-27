#!/bin/bash
# ─────────────────────────────────────────────
# 비밀 키 로테이션 스크립트
# 사용법: ./scripts/rotate-secrets.sh <SECRET_NAME>
#
# 지원하는 시크릿:
#   INTERNAL_API_KEY      — 무중단 로테이션 (dual-key 지원)
#   JWT_SECRET            — 재시작 필요 (기존 토큰 무효화)
#   REFRESH_TOKEN_SECRET  — 재시작 필요 (기존 토큰 무효화)
#   NEXTAUTH_SECRET       — 재시작 필요 (기존 세션 무효화)
# ─────────────────────────────────────────────

set -euo pipefail

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SECRET_NAME="${1:-}"
ENV_FILE="${ENV_FILE:-/opt/equipment-management/.env}"
COMPOSE_FILE="${COMPOSE_FILE:-/opt/equipment-management/docker-compose.prod.yml}"

# ─────────────────────────────────────────────
# 공통 유틸리티 로드 (SSOT: scripts/lib/secret-utils.sh)
# ─────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/secret-utils.sh"

# ─────────────────────────────────────────────
# 사용법 출력
# ─────────────────────────────────────────────
usage() {
  echo -e "사용법: $0 <SECRET_NAME>"
  echo -e ""
  echo -e "지원하는 시크릿:"
  echo -e "  ${GREEN}INTERNAL_API_KEY${NC}      무중단 로테이션 (dual-key 지원)"
  echo -e "  ${YELLOW}JWT_SECRET${NC}            재시작 필요 (기존 Access Token 무효화)"
  echo -e "  ${YELLOW}REFRESH_TOKEN_SECRET${NC}  재시작 필요 (기존 Refresh Token 무효화)"
  echo -e "  ${YELLOW}NEXTAUTH_SECRET${NC}       재시작 필요 (기존 세션 무효화)"
  echo -e ""
  echo -e "환경변수:"
  echo -e "  ENV_FILE       .env 파일 경로 (기본: /opt/equipment-management/.env)"
  echo -e "  COMPOSE_FILE   docker-compose 파일 (기본: /opt/equipment-management/docker-compose.prod.yml)"
  exit 1
}

# ─────────────────────────────────────────────
# 입력 검증
# ─────────────────────────────────────────────
if [ -z "$SECRET_NAME" ]; then
  usage
fi

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}오류: ${ENV_FILE} 파일이 존재하지 않습니다${NC}"
  exit 1
fi

command -v openssl >/dev/null 2>&1 || { echo -e "${RED}오류: openssl이 필요합니다${NC}"; exit 1; }

# ─────────────────────────────────────────────
# 시크릿별 로테이션 처리
# ─────────────────────────────────────────────
case "$SECRET_NAME" in
  INTERNAL_API_KEY)
    echo -e "${GREEN}INTERNAL_API_KEY 무중단 로테이션을 시작합니다...${NC}"

    CURRENT_KEY=$(grep "^INTERNAL_API_KEY=" "$ENV_FILE" | cut -d'=' -f2-)
    if [ -z "$CURRENT_KEY" ]; then
      echo -e "${RED}오류: 현재 INTERNAL_API_KEY를 찾을 수 없습니다${NC}"
      exit 1
    fi

    NEW_KEY=$(generate_secret 48)

    update_env_var "INTERNAL_API_KEY_PREVIOUS" "$CURRENT_KEY" "$ENV_FILE"
    update_env_var "INTERNAL_API_KEY" "$NEW_KEY" "$ENV_FILE"
    echo -e "${GREEN}새 키가 생성되었습니다.${NC}"

    echo -e "${YELLOW}백엔드를 재시작합니다 (이전 키와 새 키 모두 유효)...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend
    echo -e "${GREEN}백엔드 재시작 완료.${NC}"

    echo -e ""
    echo -e "${YELLOW}다음 단계:${NC}"
    echo -e "  1. 프론트엔드의 INTERNAL_API_KEY를 새 키로 업데이트하세요"
    echo -e "  2. 프론트엔드를 재시작하세요:"
    echo -e "     docker compose -f ${COMPOSE_FILE} up -d --no-deps frontend"
    echo -e "  3. 완료 확인 후 이전 키를 제거하세요:"
    echo -e "     sed -i 's|^INTERNAL_API_KEY_PREVIOUS=.*|INTERNAL_API_KEY_PREVIOUS=|' ${ENV_FILE}"
    echo -e "     docker compose -f ${COMPOSE_FILE} up -d --no-deps backend"
    ;;

  JWT_SECRET|REFRESH_TOKEN_SECRET|NEXTAUTH_SECRET)
    echo -e "${YELLOW}경고: ${SECRET_NAME} 변경 시 기존 발급된 모든 토큰/세션이 무효화됩니다.${NC}"
    echo -e "${YELLOW}모든 사용자가 재로그인해야 합니다.${NC}"
    echo -e ""
    read -p "계속하시겠습니까? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
      echo -e "${GREEN}취소되었습니다.${NC}"
      exit 0
    fi

    NEW_KEY=$(generate_secret 48)
    update_env_var "$SECRET_NAME" "$NEW_KEY" "$ENV_FILE"
    echo -e "${GREEN}${SECRET_NAME}이 업데이트되었습니다.${NC}"

    echo -e "${YELLOW}백엔드를 재시작합니다...${NC}"
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend
    echo -e "${GREEN}${SECRET_NAME} 로테이션 완료. 사용자 재로그인이 필요합니다.${NC}"
    ;;

  *)
    echo -e "${RED}오류: 지원하지 않는 시크릿입니다: ${SECRET_NAME}${NC}"
    echo -e ""
    usage
    ;;
esac
