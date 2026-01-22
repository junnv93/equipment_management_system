# 장비 관리 시스템 - 개발 명령어

.PHONY: help setup dev build test clean docker-up docker-down

# 기본 명령어 (help)
help:
	@echo "=========================================="
	@echo "장비 관리 시스템 - 개발 명령어"
	@echo "=========================================="
	@echo ""
	@echo "초기 설정:"
	@echo "  make setup          - 개발 환경 자동 설정"
	@echo ""
	@echo "개발:"
	@echo "  make dev            - 개발 서버 시작 (모든 서비스)"
	@echo "  make dev-backend    - 백엔드만 시작"
	@echo "  make dev-frontend   - 프론트엔드만 시작"
	@echo ""
	@echo "빌드 & 테스트:"
	@echo "  make build          - 전체 빌드"
	@echo "  make test           - 전체 테스트"
	@echo "  make test-e2e       - E2E 테스트"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up      - PostgreSQL & Redis 시작"
	@echo "  make docker-down    - 모든 컨테이너 종료"
	@echo "  make docker-logs    - Docker 로그 확인"
	@echo ""
	@echo "유틸리티:"
	@echo "  make clean          - 빌드 아티팩트 삭제"
	@echo "  make db-studio      - Drizzle Studio 실행"
	@echo ""

# 초기 설정
setup:
	@echo "🚀 개발 환경 설정 중..."
	@chmod +x ./scripts/setup-dev.sh
	@./scripts/setup-dev.sh

# 개발 서버
dev:
	@echo "🚀 개발 서버 시작..."
	@pnpm dev

dev-backend:
	@echo "🚀 백엔드 서버 시작..."
	@pnpm --filter backend run dev

dev-frontend:
	@echo "🚀 프론트엔드 서버 시작..."
	@pnpm --filter frontend run dev

# 빌드
build:
	@echo "🔨 전체 빌드 중..."
	@pnpm build

build-backend:
	@pnpm --filter backend run build

build-frontend:
	@pnpm --filter frontend run build

# 테스트
test:
	@echo "🧪 테스트 실행 중..."
	@pnpm test

test-e2e:
	@echo "🧪 E2E 테스트 실행 중..."
	@pnpm test:e2e

# Docker
docker-up:
	@echo "🐳 PostgreSQL & Redis 시작..."
	@docker-compose up -d postgres redis
	@echo "✅ 인프라 시작 완료"
	@docker-compose ps

docker-down:
	@echo "🛑 Docker 컨테이너 종료..."
	@docker-compose down

docker-logs:
	@docker-compose logs -f

docker-clean:
	@echo "🧹 Docker 볼륨 및 컨테이너 삭제..."
	@docker-compose down -v

# 데이터베이스
db-studio:
	@echo "🗄️  Drizzle Studio 시작..."
	@pnpm --filter backend run db:studio

db-migrate:
	@echo "🗄️  마이그레이션 실행..."
	@pnpm --filter backend run db:migrate

# 정리
clean:
	@echo "🧹 빌드 아티팩트 삭제..."
	@find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "✅ 정리 완료"

# 전체 재설치
reinstall:
	@echo "🔄 의존성 재설치..."
	@rm -rf node_modules
	@pnpm install

# 상태 확인
status:
	@echo "📊 시스템 상태 확인..."
	@echo ""
	@echo "Node.js: $$(node -v)"
	@echo "pnpm: $$(pnpm -v)"
	@echo "Docker: $$(docker -v)"
	@echo ""
	@echo "Docker 컨테이너 상태:"
	@docker-compose ps
