# 장비 관리 시스템

장비 관리, 교정, 대여/반출 관리를 위한 웹 애플리케이션입니다.

## 기술 스택

- **프론트엔드**: Next.js 14+, TypeScript, TailwindCSS, ShadCN/UI
- **백엔드**: NestJS, TypeScript, Drizzle ORM
- **데이터베이스**: PostgreSQL
- **캐싱**: Redis
- **컨테이너화**: Docker, Docker Compose
- **패키지 관리**: pnpm 워크스페이스 (모노레포)
- **CI/CD**: GitHub Actions

## 시작하기

### 사전 요구 사항

- Docker 및 Docker Compose 설치
- Node.js 18+ 및 pnpm 설치

### 환경 설정

1. 저장소 클론
   ```bash
   git clone https://github.com/your-username/equipment-management-system.git
   cd equipment-management-system
   ```

2. 개발 환경 설정 스크립트 실행
   ```bash
   bash scripts/setup.sh
   ```

3. 로컬 개발을 위한 Docker 환경 실행
   ```bash
   docker-compose up -d
   ```

4. 브라우저에서 접속
   - 프론트엔드: http://localhost:3000
   - 백엔드 API: http://localhost:3001

### 개발 환경

Docker 없이 로컬에서 개발하려면:

1. 의존성 설치
   ```bash
   pnpm install
   ```

2. PostgreSQL 및 Redis 실행 (Docker 사용)
   ```bash
   docker-compose up -d postgres redis
   ```

3. 백엔드 실행
   ```bash
   pnpm dev:backend
   ```

4. 프론트엔드 실행
   ```bash
   pnpm dev:frontend
   ```

## 프로젝트 구조

```
/
├── .github/                 # GitHub 워크플로우 설정
│   └── workflows/           # CI/CD 워크플로우
├── apps/                    # 애플리케이션
│   ├── backend/             # NestJS 백엔드 앱
│   └── frontend/            # Next.js 프론트엔드 앱
├── packages/                # 공유 패키지
│   ├── schemas/             # 공유 스키마 및 타입
│   ├── ui/                  # 공유 UI 컴포넌트
│   └── api-client/          # API 클라이언트
├── scripts/                 # 유틸리티 스크립트
├── init-postgres.sql/       # PostgreSQL 초기화 스크립트
├── docker-compose.yml       # 개발용 Docker 설정
├── docker-compose.prod.yml  # 프로덕션용 Docker 설정
├── .npmrc                   # pnpm 설정
├── .eslintrc.js             # ESLint 공통 설정
├── tsconfig.json            # TypeScript 공통 설정
```

## 주요 기능

- 장비 관리 (등록, 조회, 수정, 삭제)
- 장비 교정 관리 (교정 일정, 교정 기록 관리)
- 장비 대여 및 반출 관리
- 팀별 장비 관리
- 대시보드 및 통계

## 모노레포 패키지 관리

### 패키지 의존성 추가

특정 워크스페이스에 의존성 추가:
```bash
pnpm --filter <패키지명> add <의존성>
```

예: 백엔드에 lodash 추가
```bash
pnpm --filter backend add lodash
```

개발 의존성 추가:
```bash
pnpm --filter <패키지명> add -D <의존성>
```

루트 워크스페이스에 공통 개발 의존성 추가:
```bash
pnpm add -D -w <의존성>
```

### 패키지 빌드

전체 패키지 빌드:
```bash
pnpm build
```

특정 패키지만 빌드:
```bash
pnpm --filter <패키지명> build
```

## 오류 처리

프로젝트에는 체계적인 오류 처리 시스템이 통합되어 있습니다:

- 표준화된 오류 코드 및 메시지
- 프론트엔드와 백엔드 간 일관된 오류 처리
- Zod를 사용한 유효성 검사 오류 처리
- 로깅 및 모니터링 통합

## 문제 해결

일반적인 문제 및 해결 방법:

### Docker 이미지 재빌드

의존성 변경 후 Docker 이미지를 재빌드하려면:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 데이터베이스 초기화

데이터베이스를 초기화하려면:

```bash
docker-compose down -v
docker-compose up -d
```

### 모노레포 캐시 정리

문제가 발생할 경우 캐시를 정리합니다:

```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

## UI 컴포넌트 설정

이 프로젝트는 ShadCN UI 컴포넌트 라이브러리를 사용합니다. 새로운 컴포넌트를 추가하거나 기존 문제를 해결하려면 다음 안내를 참조하세요.

### 초기 설정

프로젝트에 필요한 모든 UI 컴포넌트와 의존성을 설치하려면:

```bash
# 설정 스크립트 실행
bash scripts/setup-ui.sh
```

### 개별 컴포넌트 추가

필요한 컴포넌트만 추가하려면:

```bash
cd apps/frontend
npx shadcn-ui@latest add [component-name]
```

### 의존성 문제 해결

ShadCN UI 관련 의존성 오류가 발생하면:

```bash
# 필수 의존성 설치
pnpm --filter frontend add @radix-ui/react-slot class-variance-authority clsx tailwind-merge

# Docker 환경에서는 이미지 재빌드
docker-compose build frontend
docker-compose up -d frontend
```
