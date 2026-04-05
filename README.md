# 장비 관리 시스템 (Equipment Management System)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-yellow)

**UL-QP-18 (장비 관리 절차서)** 기반, ISO/IEC 17025 인증 시험소를 위한 장비 관리 종합 웹 애플리케이션

## 목차

- [개요](#개요)
- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [시작하기](#시작하기)
- [프로젝트 구조](#프로젝트-구조)
- [개발 가이드](#개발-가이드)
- [API 문서](#api-문서)
- [환경 변수](#환경-변수)
- [트러블슈팅](#트러블슈팅)
- [기여하기](#기여하기)

---

## 개요

장비 관리 시스템은 시험소/연구소 환경의 장비 전체 수명주기를 관리하는 웹 기반 애플리케이션입니다. UL-QP-18 장비 관리 절차서와 ISO/IEC 17025 인증 요구사항을 충족하며, 장비 등록부터 교정, 반출/반입, 부적합 관리, 다단계 승인 워크플로우까지 종합적인 관리 기능을 제공합니다.

### 주요 특징

- **팀별 장비 관리**: RF팀, SAR팀, EMC팀, Automotive팀 등 팀별 장비 구분
- **반출/반입 관리**: 교정·수리·렌탈 목적의 장비 반출 및 반입 프로세스
- **교정 관리**: 교정 주기 추적, 교정 계획 (3단계 승인), 교정 인자 관리
- **부적합 관리**: 장비 부적합 등록 및 시정조치 추적
- **다단계 승인 워크플로우**: 1-step, 2-step, 3-step 승인 지원
- **문서 관리**: SHA-256 해시 기반 파일 관리, Presigned URL, 버전 관리
- **감사 로그**: 시스템 활동 이력 자동 추적
- **권한 관리**: 역할 기반 접근 제어 (RBAC) + Azure AD 인증
- **알림 시스템**: 교정 만료, 중간점검, 승인 요청 등 실시간 알림
- **다국어 지원**: 한국어/영어 (next-intl)
- **시스템 모니터링**: 서비스 헬스체크, 커넥션 풀 메트릭

---

## 주요 기능

### 장비 관리

- 장비 등록, 수정, 삭제 (승인 워크플로우 포함)
- 상세 정보 조회 (모델명, 제조사, 일련번호, 관리번호 등)
- 고급 검색 및 필터링 (URL 기반 필터 SSOT)
- 장비 상태 추적 (사용 가능, 반출 중, 교정 중, 부적합 등)
- 수리 이력 관리 (타임라인 형태)
- 장비 폐기 처리

### 반출/반입 관리

- 교정·수리·렌탈 목적의 장비 반출 신청
- 반출 승인/거부 프로세스
- 반입 장비 등록 및 관리
- 반납 기한 관리 및 이력 조회
- 확인 필요(Pending Checks) 기능

### 교정 관리

- 교정 주기 설정 및 예정 알림
- 교정 계획 수립 및 3단계 승인 워크플로우
- 교정 인자 관리 (불확도, 보정값 등)
- 중간점검 알림 및 이력 관리
- 교정 기한 초과 알림

### 부적합 관리

- 장비 부적합 등록 및 분류
- 시정조치 계획 및 추적
- 부적합 종결 승인 프로세스
- 부적합 이력 조회

### 승인 관리

- 통합 승인 관리 (1-step, 2-step, 3-step)
- 승인 대기 목록, 승인/거부 처리
- 승인 이력 조회

### 소프트웨어 관리

- 장비 관련 소프트웨어 버전 관리
- 소프트웨어 변경 이력 추적

### 리포트

- 장비 현황 리포트 생성
- 교정 현황, 부적합 현황 등 통계 리포트

### 대시보드

- 장비 통계 (총 장비, 사용 가능, 반출 중 등)
- 팀별 장비 현황
- 최근 활동 내역
- 교정 예정 목록
- 부적합 장비 현황

---

## 기술 스택

### Frontend

| 기술           | 버전 | 용도                          |
| -------------- | ---- | ----------------------------- |
| Next.js        | 16.1 | React 프레임워크 (App Router) |
| React          | 19.2 | UI 라이브러리                 |
| TypeScript     | 5.x  | 타입 안전성                   |
| TailwindCSS    | -    | 스타일링                      |
| shadcn/ui      | -    | UI 컴포넌트 (Radix 기반)      |
| TanStack Query | 5.x  | 서버 상태 관리                |
| Zod            | -    | 스키마 검증                   |
| next-intl      | 4.7  | 국제화 (한국어/영어)          |

### Backend

| 기술        | 버전 | 용도                 |
| ----------- | ---- | -------------------- |
| NestJS      | 10.x | Node.js 프레임워크   |
| TypeScript  | 5.x  | 타입 안전성          |
| Drizzle ORM | 0.45 | 데이터베이스 ORM     |
| Passport    | -    | 인증 (JWT, Azure AD) |
| Winston     | 3.x  | 로깅                 |

### Database & Infrastructure

| 기술       | 버전   | 용도                 |
| ---------- | ------ | -------------------- |
| PostgreSQL | 15     | 주 데이터베이스      |
| Redis      | Alpine | 캐싱                 |
| Docker     | -      | 인프라 컨테이너화    |
| Turborepo  | -      | 모노레포 빌드 시스템 |
| pnpm       | 10.x   | 패키지 매니저        |

---

## 시작하기

### 사전 요구사항

- Node.js 18+
- pnpm 10+
- Docker & Docker Compose

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
docker compose up -d

# 5. 데이터베이스 마이그레이션
pnpm --filter backend run db:migrate

# 6. 개발 서버 실행
pnpm dev
```

### 접속 URL

| 서비스         | URL                                                |
| -------------- | -------------------------------------------------- |
| 프론트엔드     | http://localhost:3000                              |
| 백엔드 API     | http://localhost:3001/api                          |
| Drizzle Studio | `pnpm --filter backend run db:studio` 실행 후 접속 |

### 포트 정보

| 서비스     | 포트 |
| ---------- | ---- |
| Frontend   | 3000 |
| Backend    | 3001 |
| PostgreSQL | 5432 |
| Redis      | 6379 |

---

## 프로젝트 구조

```
equipment-management-system/
├── apps/
│   ├── backend/                 # NestJS API (Port 3001)
│   │   ├── src/
│   │   │   ├── modules/         # 20개 기능 모듈
│   │   │   │   ├── approvals/           # 통합 승인 관리
│   │   │   │   ├── audit/               # 감사 로그
│   │   │   │   ├── auth/                # JWT + Azure AD 인증
│   │   │   │   ├── calibration/         # 교정 기록
│   │   │   │   ├── calibration-factors/ # 교정 인자
│   │   │   │   ├── calibration-plans/   # 교정 계획 (3단계 승인)
│   │   │   │   ├── checkouts/           # 반출 관리
│   │   │   │   ├── dashboard/           # 대시보드 통계
│   │   │   │   ├── data-migration/      # 데이터 마이그레이션
│   │   │   │   ├── documents/           # 문서 관리
│   │   │   │   ├── equipment/           # 장비 CRUD + 폐기 + 수리이력
│   │   │   │   ├── equipment-imports/   # 장비 반입
│   │   │   │   ├── monitoring/          # 시스템 모니터링
│   │   │   │   ├── non-conformances/    # 부적합 관리
│   │   │   │   ├── notifications/       # 알림 서비스
│   │   │   │   ├── reports/             # 리포트 생성
│   │   │   │   ├── settings/            # 시스템 설정
│   │   │   │   ├── software/            # 소프트웨어 관리
│   │   │   │   ├── teams/               # 팀 관리
│   │   │   │   └── users/               # 사용자 관리
│   │   │   ├── common/          # Guards, Pipes, Filters, Interceptors, Decorators, Cache
│   │   │   └── database/        # Drizzle ORM 설정
│   │   └── test/                # E2E 테스트
│   │
│   └── frontend/                # Next.js 16 App Router (Port 3000)
│       ├── app/
│       │   ├── (auth)/          # 인증 라우트 (로그인)
│       │   ├── (dashboard)/     # 대시보드 라우트 (보호)
│       │   └── api/             # API 라우트 (NextAuth)
│       ├── components/          # React 컴포넌트 (기능별 그룹)
│       │   ├── equipment/       # 장비 관리
│       │   ├── checkouts/       # 반출 관리
│       │   ├── calibration/     # 교정 관리
│       │   ├── non-conformances/# 부적합 관리
│       │   ├── approvals/       # 승인 관리
│       │   ├── layout/          # 레이아웃
│       │   ├── ui/              # shadcn/ui
│       │   └── ...              # 기타 기능별 컴포넌트
│       ├── hooks/               # 커스텀 React 훅
│       └── lib/                 # API 클라이언트, 에러, 유틸리티
│
├── packages/                    # 공유 패키지 (SSOT)
│   ├── db/                      # Drizzle ORM 스키마 정의
│   ├── schemas/                 # Zod 스키마 + Enum (프론트/백엔드 공유)
│   └── shared-constants/        # 권한, API 엔드포인트 상수
│
├── docs/                        # 프로젝트 문서
│   ├── development/             # 개발 가이드
│   └── references/              # 패턴 레퍼런스 (CAS, Backend, Frontend 등)
│
└── docker-compose.yml           # PostgreSQL + Redis 설정
```

---

## 개발 가이드

### 주요 스크립트

```bash
# 개발
pnpm dev                              # 전체 개발 서버 (Frontend + Backend)
pnpm --filter backend run dev         # 백엔드만
pnpm --filter frontend run dev        # 프론트엔드만

# 빌드
pnpm build                            # 전체 빌드
pnpm --filter backend run build       # 백엔드 빌드
pnpm --filter frontend run build      # 프론트엔드 빌드

# 타입 체크
pnpm tsc --noEmit                     # 전체 TypeScript 체크

# 린트
pnpm lint                             # 전체 린트

# 테스트
pnpm test                             # 전체 테스트
pnpm --filter backend run test        # 백엔드 유닛 테스트
pnpm --filter backend run test:e2e    # 백엔드 E2E 테스트
pnpm --filter frontend run test       # 프론트엔드 테스트
pnpm test:e2e                         # Playwright E2E 테스트
```

### Docker 명령어

```bash
docker compose up -d       # PostgreSQL + Redis 시작
docker compose down        # 컨테이너 중지
docker compose logs -f     # 로그 확인
docker compose restart     # 컨테이너 재시작
docker compose down -v     # 컨테이너 + 볼륨 삭제
```

### 데이터베이스 관리

```bash
pnpm --filter backend run db:generate  # 마이그레이션 파일 생성
pnpm --filter backend run db:migrate   # 마이그레이션 적용
pnpm --filter backend run db:studio    # Drizzle Studio GUI 실행
```

> **참고**: 이 프로젝트는 단일 DB 구조를 사용합니다 (`postgres_equipment`, 포트 5432).

### 커밋 컨벤션

```
<타입>(<범위>): <제목>

예: feat(equipment): 장비 검색 기능 추가
예: fix(checkouts): 반출 반납 날짜 버그 수정
```

**타입**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## API 문서

### 주요 엔드포인트

| 메서드 | 경로                     | 설명             |
| ------ | ------------------------ | ---------------- |
| GET    | /api/equipment           | 장비 목록 조회   |
| POST   | /api/equipment           | 장비 등록        |
| GET    | /api/equipment/:uuid     | 장비 상세 조회   |
| GET    | /api/checkouts           | 반출 목록 조회   |
| POST   | /api/checkouts           | 반출 신청        |
| GET    | /api/equipment-imports   | 반입 목록 조회   |
| GET    | /api/calibrations        | 교정 목록 조회   |
| GET    | /api/calibration-factors | 교정 인자 조회   |
| GET    | /api/calibration-plans   | 교정 계획 조회   |
| GET    | /api/non-conformances    | 부적합 목록 조회 |
| GET    | /api/approvals           | 승인 목록 조회   |
| GET    | /api/software            | 소프트웨어 조회  |
| GET    | /api/audit-logs          | 감사 로그 조회   |
| GET    | /api/reports             | 리포트 조회      |
| GET    | /api/monitoring/health   | 시스템 헬스체크  |

---

## 환경 변수

| 변수명               | 설명                   | 필수 | 예시                   |
| -------------------- | ---------------------- | ---- | ---------------------- |
| `NODE_ENV`           | 실행 환경              | Y    | `development`          |
| `PORT`               | 백엔드 포트            | Y    | `3001`                 |
| `DB_HOST`            | PostgreSQL 호스트      | Y    | `localhost`            |
| `DB_PORT`            | PostgreSQL 포트        | Y    | `5432`                 |
| `DB_USER`            | PostgreSQL 사용자      | Y    | `postgres`             |
| `DB_PASSWORD`        | PostgreSQL 비밀번호    | Y    | `postgres`             |
| `DB_NAME`            | 데이터베이스명         | Y    | `equipment_management` |
| `REDIS_HOST`         | Redis 호스트           | N    | `localhost`            |
| `REDIS_PORT`         | Redis 포트             | N    | `6379`                 |
| `JWT_SECRET`         | JWT 서명 키            | Y    | `your-secret-key`      |
| `JWT_EXPIRATION`     | JWT 만료 시간          | N    | `1d`                   |
| `AZURE_AD_CLIENT_ID` | Azure AD 클라이언트 ID | N    | -                      |
| `AZURE_AD_TENANT_ID` | Azure AD 테넌트 ID     | N    | -                      |

전체 목록은 `.env.example` 파일을 참조하세요.

---

## 트러블슈팅

### 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :3001

# 프로세스 종료
kill -9 <PID>
```

### 데이터베이스 연결 실패

```bash
# Docker 컨테이너 상태 확인
docker ps

# PostgreSQL 컨테이너 재시작
docker restart postgres_equipment

# 연결 테스트
psql -h localhost -p 5432 -U postgres -d equipment_management
```

### 의존성 문제

```bash
# node_modules 재설치
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### 빌드 오류

```bash
# Turbo 캐시 정리 후 재빌드
rm -rf .turbo
pnpm build
```

---

## 기여하기

1. Fork
2. Feature 브랜치 생성 (`git checkout -b feat/amazing-feature`)
3. 커밋 (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feat/amazing-feature`)
5. Pull Request 생성

---

## 라이선스

MIT License. [LICENSE](LICENSE) 파일 참조.

---

**마지막 업데이트**: 2026-04-02
