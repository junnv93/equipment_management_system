#!/bin/bash

# 프로덕션 환경 Docker 설정 스크립트
# 사용법: ./setup-docker-prod.sh [도메인명]

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 도메인 확인
DOMAIN=$1
if [ -z "$DOMAIN" ]; then
  echo -e "${RED}도메인 이름이 필요합니다.${NC}"
  echo -e "${YELLOW}사용법: ./setup-docker-prod.sh example.com${NC}"
  exit 1
fi

echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}장비 관리 시스템 - 프로덕션 환경 설정${NC}"
echo -e "${BLUE}=======================================${NC}"
echo -e "${YELLOW}도메인: ${DOMAIN}${NC}"

# 필요한 디렉토리 확인 및 생성
echo -e "\n${YELLOW}필요한 디렉토리를 확인하고 생성합니다...${NC}"

mkdir -p ./init-postgres.sql
mkdir -p ./nginx/certs
mkdir -p ./nginx/conf.d
mkdir -p ./certbot/conf
mkdir -p ./certbot/www

# PostgreSQL 초기화 SQL 파일 확인
if [ ! -f "./init-postgres.sql/init.sql" ]; then
  echo -e "${YELLOW}PostgreSQL 초기화 SQL 파일을 생성합니다...${NC}"
  cat > ./init-postgres.sql/init.sql << 'EOF'
-- PostgreSQL 초기화 스크립트
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 초기 데이터베이스 설정
ALTER DATABASE equipment_management SET timezone TO 'Asia/Seoul';
EOF
  echo -e "${GREEN}PostgreSQL 초기화 SQL 파일이 생성되었습니다.${NC}"
else
  echo -e "${GREEN}PostgreSQL 초기화 SQL 파일이 이미 존재합니다.${NC}"
fi

# 환경 변수 파일 확인
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}.env 파일이 없습니다. .env.example에서 복사합니다...${NC}"
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}.env 파일이 생성되었습니다. 프로덕션 값으로 수정하세요.${NC}"
    
    # DB 비밀번호 자동 생성
    DB_PASSWORD=$(openssl rand -base64 12)
    JWT_SECRET=$(openssl rand -base64 32)
    
    # .env 파일 수정
    sed -i "s/NODE_ENV=development/NODE_ENV=production/g" .env
    sed -i "s/DB_PASSWORD=postgres/DB_PASSWORD=$DB_PASSWORD/g" .env
    sed -i "s/JWT_SECRET=your_jwt_secret_key/JWT_SECRET=$JWT_SECRET/g" .env
    
    echo -e "${GREEN}보안 비밀번호가 자동으로 생성되었습니다.${NC}"
  else
    echo -e "${RED}.env.example 파일이 없습니다. 환경 변수 설정이 필요합니다.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}.env 파일이 이미 존재합니다.${NC}"
fi

# Nginx 설정 업데이트
echo -e "\n${YELLOW}Nginx 설정을 업데이트합니다...${NC}"
sed -i "s/example.com/$DOMAIN/g" ./nginx/conf.d/default.conf

# Docker Compose 환경 준비
echo -e "\n${YELLOW}Docker Compose 프로덕션 환경을 준비합니다...${NC}"

# 기존 컨테이너 중지 및 삭제
echo -e "${YELLOW}기존 컨테이너를 중지하고 삭제합니다...${NC}"
docker-compose -f docker-compose.prod.yml down

# 이미지 다시 빌드
echo -e "${YELLOW}Docker 이미지를 빌드합니다...${NC}"
docker-compose -f docker-compose.prod.yml build

# SSL 인증서 초기 설정
echo -e "\n${YELLOW}SSL 인증서 초기 설정을 진행합니다...${NC}"
echo -e "${YELLOW}Nginx 컨테이너만 먼저 시작합니다...${NC}"

# Nginx와 Certbot만 시작 (임시 설정으로)
cat > ./nginx/conf.d/temp.conf << EOF
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'SSL 인증서 설정 중입니다. 잠시 후 다시 시도해주세요.';
        add_header Content-Type text/plain;
    }
}
EOF

# 임시 Nginx 시작
docker-compose -f docker-compose.prod.yml up -d nginx

# Certbot으로 SSL 인증서 발급
echo -e "${YELLOW}Certbot으로 SSL 인증서를 발급합니다...${NC}"
docker-compose -f docker-compose.prod.yml run --rm certbot certonly --webroot --webroot-path=/var/www/certbot --force-renewal --email admin@$DOMAIN --agree-tos --no-eff-email -d $DOMAIN

# 임시 설정 제거 및 원래 설정 복원
rm -f ./nginx/conf.d/temp.conf
docker-compose -f docker-compose.prod.yml restart nginx

# 전체 스택 시작
echo -e "${YELLOW}전체 스택을 시작합니다...${NC}"
docker-compose -f docker-compose.prod.yml up -d

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}프로덕션 환경이 성공적으로 설정되었습니다!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${BLUE}웹사이트:${NC} https://$DOMAIN"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${YELLOW}로그를 확인하려면 다음 명령어를 실행하세요:${NC}"
echo -e "  docker-compose -f docker-compose.prod.yml logs -f"
echo -e "${YELLOW}컨테이너를 중지하려면 다음 명령어를 실행하세요:${NC}"
echo -e "  docker-compose -f docker-compose.prod.yml down"
echo -e "${GREEN}=====================================================${NC}" 