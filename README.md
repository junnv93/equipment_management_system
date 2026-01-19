# 장비 관리 시스템 (Equipment Management System)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-yellow)

기업의 장비 대여, 교정, 반출 관리를 위한 종합 웹 애플리케이션

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

장비 관리 시스템은 기업 내 장비의 전체 수명주기를 관리하는 웹 기반 애플리케이션입니다. 장비 대여, 반출, 교정 관리부터 팀별 장비 할당까지 종합적인 관리 기능을 제공합니다.

### 주요 특징

- **팀별 장비 관리**: RF팀, SAR팀, EMC팀, Automotive팀 등 팀별 장비 구분
- **대여/반출 관리**: 장비 대여 신청, 승인, 반납 프로세스 자동화
- **교정 관리**: 교정 주기 추적, 알림, 이력 관리
- **대시보드**: 실시간 장비 현황 및 통계
- **권한 관리**: 역할 기반 접근 제어 (RBAC) + Azure AD 인증
- **다국어 지원**: 한국어/영어 (i18n)

---

## 주요 기능

### 장비 관리

- 장비 등록, 수정, 삭제
- 상세 정보 조회 (모델명, 제조사, 일련번호 등)
- 장비 검색 및 필터링
- 장비 상태 추적 (사용 가능, 대여 중, 반출 중, 교정 중 등)

### 대여 관리

- 장비 대여 신청
- 대여 승인/거부 프로세스
- 반납 기한 관리
- 대여 이력 조회

### 반출 관리

- 장비 반출 등록
- 반출 장소 및 담당자 관리
- 반출 장비 목록 관리

### 교정 관리

- 교정 주기 설정
- 교정 예정 알림
- 교정 이력 관리
- 교정 기한 초과 알림

### 대시보드

- 장비 통계 (총 장비, 사용 가능, 대여 중 등)
- 팀별 장비 현황
- 최근 활동 내역
- 교정 예정 목록

---

## 기술 스택

### Frontend

| 기술            | 버전   | 용도                          |
| --------------- | ------ | ----------------------------- |
| Next.js         | 14.0.3 | React 프레임워크 (App Router) |
| TypeScript      | 5.x    | 타입 안전성                   |
| TailwindCSS     | -      | 스타일링                      |
| Radix UI        | -      | 헤드리스 UI 컴포넌트          |
| TanStack Query  | 5.0    | 서버 상태 관리                |
| React Hook Form | 7.48   | 폼 관리                       |
| Zod             | -      | 스키마 검증                   |
| next-intl       | 4.7    | 국제화                        |

### Backend

| 기술        | 버전 | 용도                 |
| ----------- | ---- | -------------------- |
| NestJS      | 10.x | Node.js 프레임워크   |
| TypeScript  | 5.x  | 타입 안전성          |
| Drizzle ORM | -    | 데이터베이스 ORM     |
| Passport    | -    | 인증 (JWT, Azure AD) |
| Swagger     | 7.x  | API 문서화           |
| Winston     | 3.x  | 로깅                 |

### Database & Infrastructure

| 기술       | 버전   | 용도                 |
| ---------- | ------ | -------------------- |
| PostgreSQL | 15     | 주 데이터베이스      |
| Redis      | Alpine | 캐싱                 |
| Docker     | -      | 컨테이너화           |
| Turborepo  | 1.13   | 모노레포 빌드 시스템 |
| pnpm       | 10.7   | 패키지 매니저        |

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
pnpm docker:up

# 5. 데이터베이스 마이그레이션
cd apps/backend
pnpm db:migrate

# 6. 개발 서버 실행
cd ../..
pnpm dev
```

### 접속 URL

| 서비스             | URL                            |
| ------------------ | ------------------------------ |
| 프론트엔드         | http://localhost:3000          |
| 백엔드 API         | http://localhost:3001/api      |
| API 문서 (Swagger) | http://localhost:3001/api/docs |
| Drizzle Studio     | `pnpm db:studio` 실행 후 접속  |

---

## 프로젝트 구조

```
equipment-management-system/
├── apps/
│   ├── backend/              # NestJS 백엔드
│   │   ├── src/
│   │   │   ├── modules/      # 기능별 모듈 (equipment, rental, calibration 등)
│   │   │   ├── database/     # 데이터베이스 설정 및 마이그레이션
│   │   │   └── common/       # 공통 유틸리티, 가드, 데코레이터
│   │   └── test/             # E2E 테스트
│   │
│   ├── frontend/             # Next.js 프론트엔드
│   │   ├── app/              # App Router 페이지
│   │   ├── components/       # UI 컴포넌트
│   │   ├── lib/              # API 클라이언트, 유틸리티
│   │   └── hooks/            # 커스텀 훅
│   │
│   └── server/               # 추가 서버 (선택적)
│
├── packages/
│   ├── db/                   # Drizzle ORM 스키마 및 마이그레이션
│   ├── schemas/              # Zod 스키마 (프론트엔드/백엔드 공유)
│   ├── api-client/           # 타입 안전한 API 클라이언트
│   └── ui/                   # 공유 UI 컴포넌트
│
├── docker/                   # Docker 설정 파일
├── docs/                     # 프로젝트 문서
└── scripts/                  # 유틸리티 스크립트
```

---

## 개발 가이드

### 주요 스크립트

```bash
# 개발 서버 (모든 앱)
pnpm dev

# 빌드
pnpm build

# 린트
pnpm lint

# 테스트
pnpm test

# 타입 체크
pnpm type-check
```

### Docker 명령어

```bash
pnpm docker:up       # 컨테이너 시작
pnpm docker:down     # 컨테이너 중지
pnpm docker:logs     # 로그 확인
pnpm docker:restart  # 컨테이너 재시작
pnpm docker:clean    # 컨테이너 및 볼륨 완전 삭제
```

### 데이터베이스 작업

```bash
cd apps/backend

pnpm db:generate     # 마이그레이션 파일 생성
pnpm db:migrate      # 마이그레이션 적용
pnpm db:studio       # Drizzle Studio GUI 실행
```

### 커밋 컨벤션

```
<타입>(<범위>): <제목>

예: feat(equipment): 장비 검색 기능 추가
예: fix(rental): 대여 반납 날짜 버그 수정
```

**타입**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## API 문서

개발 서버 실행 후 Swagger UI에서 전체 API 문서를 확인할 수 있습니다:

**http://localhost:3001/api/docs**

### 주요 엔드포인트

| 메서드 | 경로               | 설명           |
| ------ | ------------------ | -------------- |
| GET    | /api/equipment     | 장비 목록 조회 |
| POST   | /api/equipment     | 장비 등록      |
| GET    | /api/equipment/:id | 장비 상세 조회 |
| GET    | /api/rentals       | 대여 목록 조회 |
| POST   | /api/rentals       | 대여 신청      |
| GET    | /api/calibrations  | 교정 목록 조회 |

---

## 환경 변수

| 변수명               | 설명                   | 필수 | 예시                   |
| -------------------- | ---------------------- | ---- | ---------------------- |
| `NODE_ENV`           | 실행 환경              | Y    | `development`          |
| `PORT`               | 백엔드 포트            | Y    | `3001`                 |
| `DB_HOST`            | PostgreSQL 호스트      | Y    | `localhost`            |
| `DB_PORT`            | PostgreSQL 포트        | Y    | `5433`                 |
| `DB_USER`            | PostgreSQL 사용자      | Y    | `postgres`             |
| `DB_PASSWORD`        | PostgreSQL 비밀번호    | Y    | `postgres`             |
| `DB_NAME`            | 데이터베이스명         | Y    | `equipment_management` |
| `REDIS_HOST`         | Redis 호스트           | N    | `localhost`            |
| `REDIS_PORT`         | Redis 포트             | N    | `6380`                 |
| `JWT_SECRET`         | JWT 서명 키            | Y    | `your-secret-key`      |
| `JWT_EXPIRATION`     | JWT 만료 시간          | N    | `1d`                   |
| `AZURE_AD_CLIENT_ID` | Azure AD 클라이언트 ID | N    | -                      |
| `AZURE_AD_TENANT_ID` | Azure AD 테넌트 ID     | N    | -                      |

전체 목록은 `.env.example` 파일을 참조하세요.

---

## 트러블슈팅

### 포트 충돌

**문제:** `Error: listen EADDRINUSE: address already in use`

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

# 연결 테스트 (포트 5433 사용)
psql -h localhost -p 5433 -U postgres -d equipment_management
```

### 의존성 문제

```bash
# node_modules 재설치
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
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
2. Feature 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 커밋 (`git commit -m 'feat: Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Pull Request 생성

---

## 라이선스

MIT License. [LICENSE](LICENSE) 파일 참조.

---

**마지막 업데이트**: 2026-01-19
