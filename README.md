# 장비 관리 시스템 (Equipment Management System)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Version](https://img.shields.io/badge/version-1.0.0-orange)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D10.0.0-yellow)

**UL-QP-18 (장비 관리 절차서)** 기반, ISO/IEC 17025 인증 시험소를 위한 장비 관리 종합 웹 애플리케이션.
장비 등록부터 교정, 반출/반입, 부적합 관리, 다단계 승인 워크플로우까지 장비 전체 수명주기를 관리합니다.

---

## 주요 기능

| 기능                | 설명                                                        | 상세 문서                                               |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| **장비 관리**       | 등록, 수정, 폐기, 상태 추적, 수리 이력, 고급 검색/필터링    | [프로세스](docs/features/equipment-lifecycle.md)        |
| **반출/반입 관리**  | 교정·수리·렌탈 목적 반출 신청, 승인, 반입, 반납 기한 관리   | [프로세스](docs/features/checkout-import-flow.md)       |
| **교정 관리**       | 교정 주기 추적, 교정 계획 (3단계 승인), 교정 인자, 중간점검 | [프로세스](docs/features/calibration-workflow.md)       |
| **부적합 관리**     | 부적합 등록/분류, 시정조치 추적, 종결 승인                  | [프로세스](docs/features/non-conformance-management.md) |
| **승인 워크플로우** | 통합 승인 관리 (1-step, 2-step, 3-step)                     | [프로세스](docs/features/approval-workflow.md)          |
| **문서 관리**       | SHA-256 해시 기반 파일 관리, Presigned URL, 버전 관리       | —                                                       |
| **감사 로그**       | 시스템 활동 이력 자동 추적                                  | —                                                       |
| **알림 시스템**     | 교정 만료, 중간점검, 승인 요청 등 실시간 알림               | —                                                       |
| **대시보드**        | 장비 통계, 팀별 현황, 최근 활동, 교정 예정                  | —                                                       |
| **권한 관리**       | 역할 기반 접근 제어 (RBAC) + Azure AD 인증                  | —                                                       |

---

## 기술 스택

| 영역         | 기술                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, TailwindCSS, shadcn/ui, TanStack Query 5, next-intl |
| **Backend**  | NestJS 11, TypeScript, Drizzle ORM, Passport (JWT + Azure AD), Winston                             |
| **Database** | PostgreSQL 15, Redis (캐싱)                                                                        |
| **Infra**    | Docker Compose, Turborepo (모노레포), pnpm, Nginx, Prometheus + Grafana                            |

> 기술 선택 배경은 [ADR 문서](docs/adr/) 참조

---

## 빠른 시작

```bash
# 1. 의존성 설치
pnpm install

# 2. 인프라 컨테이너 시작 (PostgreSQL, Redis, RustFS)
docker compose up -d

# 3. 환경 변수 설정
cp .env.example .env    # 실제 값으로 수정

# 4. DB 마이그레이션
pnpm --filter backend run db:migrate

# 5. 개발 서버 실행
pnpm dev                # Frontend :3000 / Backend :3001
```

> 상세 환경 설정은 [개발 환경 설정 가이드](docs/development/DEV_SETUP.md) 참조

---

## API 엔드포인트 요약

| 메서드    | 경로                       | 설명                   |
| --------- | -------------------------- | ---------------------- |
| GET/POST  | `/api/equipment`           | 장비 목록/등록         |
| GET/PATCH | `/api/equipment/:uuid`     | 장비 상세/수정         |
| GET/POST  | `/api/checkouts`           | 반출 목록/신청         |
| GET/POST  | `/api/equipment-imports`   | 반입 목록/등록         |
| GET/POST  | `/api/calibrations`        | 교정 기록              |
| GET/POST  | `/api/calibration-plans`   | 교정 계획 (3단계 승인) |
| GET       | `/api/calibration-factors` | 교정 인자              |
| GET       | `/api/non-conformances`    | 부적합 목록            |
| GET       | `/api/approvals`           | 통합 승인 목록         |
| GET       | `/api/audit-logs`          | 감사 로그              |
| GET       | `/api/monitoring/health`   | 시스템 헬스체크        |

---

## 프로젝트 구조

```
equipment-management-system/
├── apps/
│   ├── backend/           # NestJS API (:3001) — 25개 기능 모듈
│   └── frontend/          # Next.js 16 App Router (:3000)
├── packages/
│   ├── db/                # Drizzle ORM 스키마 정의
│   ├── schemas/           # Zod 스키마 + Enum (SSOT)
│   └── shared-constants/  # 권한, API 엔드포인트 상수
└── docs/                  # 프로젝트 문서
```

> 상세 디렉토리 구조는 [docs/structure/directory-map.md](docs/structure/directory-map.md) 참조

---

## 상세 문서

| 카테고리            | 문서                                                          | 설명                                       |
| ------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| **시작하기**        | [개발 환경 설정](docs/development/DEV_SETUP.md)               | 필수 소프트웨어, 환경 변수, DB 설정        |
| **아키텍처**        | [ADR (Architecture Decision Records)](docs/adr/)              | 기술 선택 배경 및 설계 결정                |
| **기능 프로세스**   | [docs/features/](docs/features/)                              | 주요 기능별 워크플로우 및 프로세스         |
| **인프라**          | [Docker/배포 구성](docs/infrastructure/)                      | Docker Compose, 모니터링, 네트워크         |
| **백엔드 패턴**     | [backend-patterns.md](docs/references/backend-patterns.md)    | Zod 파이프라인, 예외 처리, 인증, 캐싱      |
| **프론트엔드 패턴** | [frontend-patterns.md](docs/references/frontend-patterns.md)  | TanStack Query, Optimistic UI, 캐시 전략   |
| **도메인 컨텍스트** | [domain-context.md](docs/references/domain-context.md)        | 역할 계층, 장비/반출 상태, 승인 워크플로우 |
| **CAS 패턴**        | [cas-patterns.md](docs/references/cas-patterns.md)            | 낙관적 잠금, 버전 충돌 처리                |
| **E2E 테스트**      | [e2e-patterns.md](docs/references/e2e-patterns.md)            | Playwright, 인증 fixture, 테스트 격리      |
| **워크플로우 검증** | [critical-workflows.md](docs/workflows/critical-workflows.md) | UL-QP-18 기반 E2E 검증 체크리스트          |

---

## 라이선스

MIT License. [LICENSE](LICENSE) 파일 참조.
