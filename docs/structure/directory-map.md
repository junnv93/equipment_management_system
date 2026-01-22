# 장비 관리 시스템 - 디렉토리 구조 맵

## 루트 디렉토리

- `.cursor/`: Cursor IDE 관련 파일
- `.git/`: Git 버전 관리 파일
- `.github/`: GitHub 관련 파일 (Actions, Issue/PR 템플릿 등)
- `.next/`: Next.js 빌드 출력 디렉토리
- `.pnpm-store/`: PNPM 패키지 캐시
- `.turbo/`: Turborepo 캐시
- `apps/`: 애플리케이션 코드
- `docs/`: 프로젝트 문서
- `docker/`: Docker 관련 파일
- `node_modules/`: 프로젝트 의존성
- `packages/`: 공유 패키지
- `scripts/`: 유틸리티 스크립트

## 애플리케이션 코드 (apps/)

- `apps/backend/`: NestJS 백엔드 애플리케이션
- `apps/frontend/`: Next.js 프론트엔드 애플리케이션

## 공유 패키지 (packages/)

- `packages/api-client/`: API 클라이언트 라이브러리
- `packages/schemas/`: 공유 데이터 스키마 및 타입 (Zod)
- `packages/db/`: Drizzle ORM 스키마 및 마이그레이션

## Docker 관련 파일

- `docker-compose.yml`: 개발용 Docker Compose 설정 (PostgreSQL, Redis만 포함)

## 사용하지 않거나 조사가 필요한 디렉토리

- `database/`: 데이터베이스 관련 파일
- `init-postgres.sql/`: PostgreSQL 초기화 스크립트
- `logging/`: 로깅 관련 파일
- `monitoring/`: 모니터링 관련 파일
- `nginx/`: NGINX 설정
- `old_project/`: 이전 프로젝트 코드
- `security/`: 보안 관련 파일
- `screenshot/`: 스크린샷 파일

## 구성 파일

- `.dockerignore`: Docker 빌드 시 제외할 파일
- `.env`: 환경 변수
- `.env.example`: 환경 변수 예시
- `.gitignore`: Git 제외 파일
- `.npmrc`: NPM 설정
- `package.json`: 프로젝트 의존성 및 스크립트
- `pnpm-lock.yaml`: PNPM 의존성 잠금 파일
- `pnpm-workspace.yaml`: PNPM 워크스페이스 설정
- `tsconfig.json`: TypeScript 설정
- `turbo.json`: Turborepo 설정
