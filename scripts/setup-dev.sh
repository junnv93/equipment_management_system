#!/bin/bash
set -e

echo "🚀 장비 관리 시스템 - 개발 환경 설정"
echo "=========================================="

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Node.js 버전 확인
echo ""
echo "📋 1. Node.js 버전 확인..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18 이상이 필요합니다. 현재: $(node -v)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# 2. pnpm 설치 확인
echo ""
echo "📦 2. pnpm 확인..."
if ! command -v pnpm &> /dev/null; then
  echo "pnpm이 설치되지 않았습니다. 설치 중..."
  npm install -g pnpm@latest
fi
echo -e "${GREEN}✅ pnpm $(pnpm -v)${NC}"

# 3. Docker 확인
echo ""
echo "🐳 3. Docker 확인..."
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}⚠️  Docker가 설치되지 않았습니다.${NC}"
  echo "   https://docs.docker.com/get-docker/ 에서 설치하세요."
  exit 1
fi
echo -e "${GREEN}✅ Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1)${NC}"

# 4. Docker Compose 확인
if ! command -v docker-compose &> /dev/null; then
  echo -e "${YELLOW}⚠️  docker-compose가 설치되지 않았습니다.${NC}"
  exit 1
fi
echo -e "${GREEN}✅ docker-compose $(docker-compose -v | cut -d' ' -f4 | cut -d',' -f1)${NC}"

# 5. 환경변수 파일 복사
echo ""
echo "🔐 4. 환경변수 설정..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo -e "${GREEN}✅ .env 파일 생성됨${NC}"
  echo -e "${YELLOW}⚠️  .env 파일을 수정하세요!${NC}"
else
  echo -e "${GREEN}✅ .env 파일 이미 존재${NC}"
fi

# 6. 패키지 설치
echo ""
echo "📚 5. 패키지 설치..."
pnpm install
echo -e "${GREEN}✅ 패키지 설치 완료${NC}"

# 7. Docker 인프라 시작
echo ""
echo "🗄️  6. DB 및 Redis 시작..."
docker-compose up -d postgres redis
echo -e "${GREEN}✅ 인프라 시작 완료${NC}"

# 8. DB 마이그레이션 대기
echo ""
echo "⏳ 7. PostgreSQL 준비 대기..."
sleep 5

# 9. 완료
echo ""
echo "=========================================="
echo -e "${GREEN}✅ 개발 환경 설정 완료!${NC}"
echo ""
echo "다음 명령어로 개발 서버를 시작하세요:"
echo ""
echo -e "${YELLOW}  # 백엔드 (터미널 1)${NC}"
echo "  pnpm --filter backend run dev"
echo ""
echo -e "${YELLOW}  # 프론트엔드 (터미널 2)${NC}"
echo "  pnpm --filter frontend run dev"
echo ""
echo "또는 한 번에:"
echo "  pnpm dev"
echo ""
echo "접속 주소:"
echo "  - 프론트엔드: http://localhost:3000"
echo "  - 백엔드 API: http://localhost:3001"
echo "  - PostgreSQL: localhost:${POSTGRES_PORT:-5432}"
echo "  - Redis: localhost:${REDIS_PORT:-6379}"
echo ""
