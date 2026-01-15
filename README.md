# 장비 관리 시스템 (Equipment Management System)

기업의 장비 대여, 교정, 반출 관리를 위한 종합 웹 애플리케이션

## 📋 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [문서](#문서)

---

## 개요

장비 관리 시스템은 기업 내 장비의 전체 수명주기를 관리하는 웹 기반 애플리케이션입니다. 장비 대여, 반출, 교정 관리부터 팀별 장비 할당까지 종합적인 관리 기능을 제공합니다.

### 주요 특징

- 🏢 **팀별 장비 관리**: RF팀, SAR팀, EMC팀, Automotive팀 등 팀별 장비 구분
- 📦 **대여/반출 관리**: 장비 대여 신청, 승인, 반납 프로세스 자동화
- 🔧 **교정 관리**: 교정 주기 추적, 알림, 이력 관리
- 📊 **대시보드**: 실시간 장비 현황 및 통계
- 🔐 **권한 관리**: 역할 기반 접근 제어 (RBAC)
- 🌐 **다국어 지원**: 한국어/영어 (i18n)

---

## 주요 기능

### 1. 장비 관리
- 장비 등록, 수정, 삭제
- 상세 정보 조회 (모델명, 제조사, 일련번호 등)
- 장비 검색 및 필터링
- 장비 상태 추적 (사용 가능, 대여 중, 반출 중, 교정 중 등)

### 2. 대여 관리
- 장비 대여 신청
- 대여 승인/거부 프로세스
- 반납 기한 관리
- 대여 이력 조회

### 3. 반출 관리
- 장비 반출 등록
- 반출 장소 및 담당자 관리
- 반출 장비 목록 관리

### 4. 교정 관리
- 교정 주기 설정
- 교정 예정 알림
- 교정 이력 관리
- 교정 기한 초과 알림

### 5. 대시보드
- 장비 통계 (총 장비, 사용 가능, 대여 중 등)
- 팀별 장비 현황
- 최근 활동 내역
- 교정 예정 목록

---

## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **UI**: ShadCN/UI, TailwindCSS
- **상태 관리**: 
  - TanStack Query (서버 상태)
  - Zustand (클라이언트 상태)
- **폼 관리**: React Hook Form + Zod
- **국제화**: next-intl

### 백엔드
- **프레임워크**: NestJS 10
- **언어**: TypeScript
- **API**: RESTful API
- **인증**: JWT
- **권한**: 역할 기반 접근 제어 (RBAC)
- **문서화**: Swagger/OpenAPI

### 데이터베이스
- **RDBMS**: PostgreSQL 15
- **ORM**: Drizzle ORM
- **마이그레이션**: Drizzle Kit
- **캐싱**: Redis

### 인프라
- **모노레포**: pnpm + Turborepo
- **컨테이너**: Docker
- **CI/CD**: GitHub Actions

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm 10+
- Docker & Docker Compose
- PostgreSQL 15 (Docker로 실행 가능)

### 설치

```bash
# 1. 저장소 클론
git clone <repository-url>
cd equipment-management-system

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일을 열어 실제 값으로 수정

# 4. Docker 컨테이너 시작 (PostgreSQL, Redis)
pnpm docker:up

# 5. 데이터베이스 마이그레이션
cd apps/backend
pnpm db:migrate

# 6. 개발 서버 실행
cd ../..
pnpm dev
```

### 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001/api
- **API 문서**: http://localhost:3001/api/docs

---

## 프로젝트 구조

```
equipment-management-system/
├── apps/
│   ├── backend/          # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── modules/  # 기능별 모듈
│   │   │   ├── database/ # 데이터베이스 관련
│   │   │   └── common/   # 공통 유틸리티
│   │   └── drizzle/      # 마이그레이션 파일
│   │
│   └── frontend/         # Next.js 프론트엔드
│       ├── app/          # App Router 페이지
│       ├── components/   # UI 컴포넌트
│       ├── lib/          # 유틸리티 함수
│       └── hooks/        # 커스텀 훅
│
├── packages/
│   ├── schemas/          # 공유 데이터 스키마
│   ├── api-client/       # API 클라이언트
│   └── ui/               # 공유 UI 컴포넌트
│
└── docs/                 # 프로젝트 문서
```

---

## 개발 가이드

### 스크립트

```bash
# 개발 서버 실행
pnpm dev

# 빌드
pnpm build

# 프로덕션 서버 실행
pnpm start

# 린트
pnpm lint

# 테스트
pnpm test

# Docker 관리
pnpm docker:up      # 컨테이너 시작
pnpm docker:down    # 컨테이너 중지
pnpm docker:logs    # 로그 확인
pnpm docker:clean   # 모든 컨테이너 및 볼륨 제거
```

### 데이터베이스 작업

```bash
cd apps/backend

# 마이그레이션 생성
pnpm db:generate

# 마이그레이션 적용
pnpm db:migrate

# Drizzle Studio 실행 (GUI)
pnpm db:studio
```

### 브랜치 전략

- `main`: 프로덕션 릴리스
- `develop`: 개발 브랜치
- `feature/*`: 새 기능 개발
- `fix/*`: 버그 수정

---

## 문서

### 주요 문서

- [프로젝트 분석 보고서](./PROJECT_ANALYSIS.md) - 현재 상태 및 문제점 분석
- [마이그레이션 가이드](./MIGRATION_GUIDE.md) - 리팩토링 변경 사항
- [다음 단계](./NEXT_STEPS.md) - 앞으로 해야 할 작업
- [백엔드 가이드](./apps/backend/README.md) - 백엔드 개발 가이드

### API 문서

개발 서버 실행 후 Swagger UI에서 확인:
- http://localhost:3001/api/docs

### 코드 규칙

프로젝트는 다음 코드 스타일을 따릅니다:

- **명명 규칙**:
  - 변수/함수: camelCase
  - 클래스/인터페이스: PascalCase
  - 상수: UPPER_SNAKE_CASE
  - 파일명: kebab-case (컴포넌트는 PascalCase)

- **커밋 메시지**:
  ```
  <타입>(<범위>): <제목>
  
  예: feat(equipment): 장비 검색 기능 추가
  ```

---

## 환경 변수

주요 환경 변수 목록:

```env
# 데이터베이스
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=equipment_management
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_URL=redis://localhost:6379

# 백엔드
PORT=3001
NODE_ENV=development

# 프론트엔드
NEXT_PUBLIC_API_URL=http://localhost:3001/api
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

자세한 내용은 `.env.example` 파일을 참조하세요.

---

## 문제 해결

### 일반적인 문제

#### 데이터베이스 연결 실패

```bash
# Docker 컨테이너 확인
docker ps

# PostgreSQL 컨테이너 재시작
docker restart postgres_equipment

# 연결 테스트
psql -h localhost -U postgres -d equipment_management
```

#### 의존성 문제

```bash
# pnpm 캐시 정리
pnpm store prune

# node_modules 재설치
rm -rf node_modules
pnpm install
```

#### 빌드 오류

```bash
# Turbo 캐시 정리
rm -rf .turbo

# 전체 재빌드
pnpm clean
pnpm install
pnpm build
```

---

## 기여하기

1. 이 저장소를 Fork
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치에 Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

코드 리뷰 후 병합됩니다.

---

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.

---

## 연락처

- **프로젝트 관리자**: [이름]
- **이메일**: [이메일]
- **이슈 트래커**: [GitHub Issues URL]

---

**마지막 업데이트**: 2026-01-15
