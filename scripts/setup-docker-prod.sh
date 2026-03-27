#!/bin/bash

# 프로덕션 환경 Docker 설정 스크립트
# 사용법: ./scripts/setup-docker-prod.sh [도메인명]

set -euo pipefail

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$PROJECT_ROOT"

# 도메인 확인
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo -e "${RED}도메인 이름이 필요합니다.${NC}"
  echo -e "${YELLOW}사용법: ./scripts/setup-docker-prod.sh example.com${NC}"
  exit 1
fi

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}장비 관리 시스템 - 프로덕션 환경 설정${NC}"
echo -e "${BLUE}=======================================${NC}"
echo -e "${YELLOW}도메인: ${DOMAIN}${NC}"

# ─────────────────────────────────────────────
# 1. 필요한 디렉토리 확인 및 생성
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}필요한 디렉토리를 확인하고 생성합니다...${NC}"

mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# PostgreSQL 초기화 SQL 파일 확인 (docker-compose에서 파일로 마운트됨)
if [ ! -f "./init-postgres.sql" ]; then
  echo -e "${YELLOW}PostgreSQL 초기화 SQL 파일을 생성합니다...${NC}"
  cat > ./init-postgres.sql << 'SQLEOF'
-- PostgreSQL 초기화 스크립트
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 초기 데이터베이스 설정
ALTER DATABASE equipment_management SET timezone TO 'Asia/Seoul';
SQLEOF
  echo -e "${GREEN}PostgreSQL 초기화 SQL 파일이 생성되었습니다.${NC}"
else
  echo -e "${GREEN}PostgreSQL 초기화 SQL 파일이 이미 존재합니다.${NC}"
fi

# ─────────────────────────────────────────────
# 2. 환경 변수 파일 생성 및 시크릿 설정
# ─────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}.env 파일이 없습니다. .env.example에서 복사합니다...${NC}"
  if [ ! -f ".env.example" ]; then
    echo -e "${RED}.env.example 파일이 없습니다. 환경 변수 설정이 필요합니다.${NC}"
    exit 1
  fi
  cp .env.example .env
  echo -e "${GREEN}.env 파일이 생성되었습니다.${NC}"

  # 프로덕션 모드 설정
  sed -i "s|^NODE_ENV=.*|NODE_ENV=production|" .env

  # 모든 시크릿 일괄 생성 (SSOT: generate-secrets.sh)
  echo -e "${YELLOW}프로덕션 시크릿을 생성합니다...${NC}"
  ./scripts/generate-secrets.sh --update-env

  # FRONTEND_URL 설정
  if grep -q "^FRONTEND_URL=" .env; then
    sed -i "s|^FRONTEND_URL=.*|FRONTEND_URL=https://${DOMAIN}|" .env
  else
    echo "FRONTEND_URL=https://${DOMAIN}" >> .env
  fi

  # CACHE_DRIVER 프로덕션 설정
  sed -i "s|^CACHE_DRIVER=.*|CACHE_DRIVER=redis|" .env

  echo -e "${GREEN}프로덕션 시크릿 및 환경 설정이 완료되었습니다.${NC}"
else
  echo -e "${GREEN}.env 파일이 이미 존재합니다.${NC}"
fi

# ─────────────────────────────────────────────
# 3. 필수 환경변수 검증
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}필수 환경변수를 검증합니다...${NC}"

REQUIRED_VARS="JWT_SECRET REFRESH_TOKEN_SECRET NEXTAUTH_SECRET INTERNAL_API_KEY REDIS_PASSWORD DB_PASSWORD"
MISSING=""
for VAR in $REQUIRED_VARS; do
  VALUE=$(grep "^${VAR}=" .env 2>/dev/null | cut -d'=' -f2- || echo "")
  if [ -z "$VALUE" ] || [[ "$VALUE" == your_* ]] || [ "$VALUE" = "postgres" ]; then
    MISSING="${MISSING} ${VAR}"
  fi
done

if [ -n "$MISSING" ]; then
  echo -e "${RED}오류: 다음 환경변수가 설정되지 않았습니다:${MISSING}${NC}"
  echo -e "${YELLOW}./scripts/generate-secrets.sh --update-env 를 실행하여 시크릿을 생성하세요.${NC}"
  exit 1
fi
echo -e "${GREEN}모든 필수 환경변수가 설정되었습니다.${NC}"

# ─────────────────────────────────────────────
# 4. Nginx 설정 — 템플릿에서 생성 (재실행 안전)
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}Nginx 설정을 업데이트합니다...${NC}"
if [ -f "./nginx/nginx.conf.template" ]; then
  cp ./nginx/nginx.conf.template ./nginx/nginx.conf
  sed -i "s|DOMAIN_PLACEHOLDER|${DOMAIN}|g" ./nginx/nginx.conf
  echo -e "${GREEN}nginx.conf에 도메인(${DOMAIN})이 설정되었습니다.${NC}"
else
  echo -e "${RED}nginx/nginx.conf.template 파일이 없습니다.${NC}"
  exit 1
fi

# ─────────────────────────────────────────────
# 5. Docker Compose 프로덕션 빌드
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}Docker Compose 프로덕션 환경을 준비합니다...${NC}"

echo -e "${YELLOW}기존 컨테이너를 중지하고 삭제합니다...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo -e "${YELLOW}Docker 이미지를 빌드합니다...${NC}"
docker compose -f docker-compose.prod.yml build

# ─────────────────────────────────────────────
# 6. SSL 인증서 초기 설정
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}SSL 인증서 초기 설정을 진행합니다...${NC}"

# 임시 nginx 설정 생성 (ACME challenge용)
TEMP_CONF="./nginx/temp-acme.conf"
cat > "$TEMP_CONF" << NGINXEOF
worker_processes auto;
events { worker_connections 1024; }
http {
    server {
        listen 80;
        listen [::]:80;
        server_name ${DOMAIN};

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 200 'SSL 인증서 설정 중입니다. 잠시 후 다시 시도해주세요.';
            add_header Content-Type text/plain;
        }
    }
}
NGINXEOF

# 프로덕션 nginx.conf를 임시 백업하고, ACME용 설정으로 교체
echo -e "${YELLOW}Nginx 컨테이너를 ACME 검증 모드로 시작합니다...${NC}"
cp ./nginx/nginx.conf ./nginx/nginx.conf.bak
cp "$TEMP_CONF" ./nginx/nginx.conf
docker compose -f docker-compose.prod.yml up -d nginx

# Certbot으로 SSL 인증서 발급
echo -e "${YELLOW}Certbot으로 SSL 인증서를 발급합니다...${NC}"
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --force-renewal \
  --email "admin@${DOMAIN}" \
  --agree-tos --no-eff-email \
  -d "$DOMAIN"

# 프로덕션 nginx.conf 복원 및 임시 파일 정리
mv ./nginx/nginx.conf.bak ./nginx/nginx.conf
rm -f "$TEMP_CONF"

# ─────────────────────────────────────────────
# 7. 전체 스택 시작
# ─────────────────────────────────────────────
echo -e "\n${YELLOW}전체 스택을 시작합니다...${NC}"
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker compose -f docker-compose.prod.yml up -d

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}프로덕션 환경이 성공적으로 설정되었습니다!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${BLUE}웹사이트:${NC} https://$DOMAIN"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${YELLOW}로그를 확인하려면:${NC}"
echo -e "  docker compose -f docker-compose.prod.yml logs -f"
echo -e "${YELLOW}컨테이너를 중지하려면:${NC}"
echo -e "  docker compose -f docker-compose.prod.yml down"
echo -e "${YELLOW}시크릿 로테이션:${NC}"
echo -e "  ./scripts/rotate-secrets.sh INTERNAL_API_KEY"
echo -e "${GREEN}=====================================================${NC}"
