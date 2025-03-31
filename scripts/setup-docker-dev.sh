#!/bin/bash

# 개발 환경 Docker 설정 스크립트
# 사용법: ./setup-docker-dev.sh

# 색상 코드
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}====================================${NC}"
echo -e "${BLUE}장비 관리 시스템 - 개발 환경 설정${NC}"
echo -e "${BLUE}====================================${NC}"

# 필요한 디렉토리 확인 및 생성
echo -e "\n${YELLOW}필요한 디렉토리를 확인하고 생성합니다...${NC}"

if [ ! -d "./init-postgres.sql" ]; then
  echo -e "${YELLOW}init-postgres.sql 디렉토리를 생성합니다...${NC}"
  mkdir -p ./init-postgres.sql
fi

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
    echo -e "${GREEN}.env 파일이 생성되었습니다. 값을 적절히 수정하세요.${NC}"
  else
    echo -e "${RED}.env.example 파일이 없습니다. 환경 변수 설정이 필요합니다.${NC}"
    exit 1
  fi
else
  echo -e "${GREEN}.env 파일이 이미 존재합니다.${NC}"
fi

# Docker Compose 환경 준비
echo -e "\n${YELLOW}Docker Compose 환경을 준비합니다...${NC}"

# 기존 컨테이너 중지 및 삭제
echo -e "${YELLOW}기존 개발 컨테이너를 중지하고 삭제합니다...${NC}"
docker-compose down

# 이미지 다시 빌드
echo -e "${YELLOW}Docker 이미지를 빌드합니다...${NC}"
docker-compose build

# 컨테이너 시작
echo -e "${YELLOW}컨테이너를 시작합니다...${NC}"
docker-compose up -d

echo -e "\n${GREEN}=====================================================${NC}"
echo -e "${GREEN}개발 환경이 성공적으로 설정되었습니다!${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:3001"
echo -e "${BLUE}PostgreSQL:${NC} localhost:5432"
echo -e "${BLUE}Redis:${NC} localhost:6379"
echo -e "${GREEN}=====================================================${NC}"
echo -e "${YELLOW}로그를 확인하려면 다음 명령어를 실행하세요:${NC}"
echo -e "  docker-compose logs -f"
echo -e "${YELLOW}컨테이너를 중지하려면 다음 명령어를 실행하세요:${NC}"
echo -e "  docker-compose down"
echo -e "${GREEN}=====================================================${NC}" 