# 장비 관리 시스템 문서

**UL-QP-18 기반 장비 관리 시스템** (NestJS 백엔드 + Next.js 16 프론트엔드, 수원 사무소 내부 네트워크)

> Claude Code 작업 규칙은 프로젝트 루트의 `CLAUDE.md`를 참조하세요.

---

## Claude Code 참조 문서 (CLAUDE.md에서 직접 참조)

| 파일                                                            | 내용                                                             |
| --------------------------------------------------------------- | ---------------------------------------------------------------- |
| [cas-patterns.md](references/cas-patterns.md)                   | CAS / Optimistic Locking 패턴                                    |
| [backend-patterns.md](references/backend-patterns.md)           | Zod pipeline, GlobalExceptionFilter, Auth, Caching, Transactions |
| [frontend-patterns.md](references/frontend-patterns.md)         | TanStack Query, useOptimisticMutation, Cache Invalidation        |
| [domain-context.md](references/domain-context.md)               | UL-QP-18 도메인 — 역할 계층, 상태, 승인 워크플로우               |
| [e2e-patterns.md](references/e2e-patterns.md)                   | storageState 인증, fixtures, 테스트 격리                         |
| [behavioral-guidelines.md](references/behavioral-guidelines.md) | 4가지 행동 원칙 (생각하기, 최소 코드, 수술적 변경, 목표 기반)    |
| [production-checklist.md](references/production-checklist.md)   | Backend/Frontend 엔드포인트/기능 체크리스트                      |
| [post-tool-use-hook.md](references/post-tool-use-hook.md)       | Prettier 자동 실행, git diff 검증                                |
| [git-workflow.md](references/git-workflow.md)                   | SessionStart hook, db:reset, pre-push 구성                       |
| [skills-index.md](references/skills-index.md)                   | 25개 Claude Code 스킬 한줄 요약 + 스코프                         |

---

## 개발 가이드 (development/)

| 파일                                                               | 내용                              |
| ------------------------------------------------------------------ | --------------------------------- |
| [DEV_SETUP.md](development/DEV_SETUP.md)                           | 개발 환경 설정 (pnpm, Docker, DB) |
| [DRIZZLE_MIGRATIONS.md](development/DRIZZLE_MIGRATIONS.md)         | Drizzle ORM 마이그레이션 운영     |
| [NEXTJS_16_GUIDE.md](development/NEXTJS_16_GUIDE.md)               | Next.js 16 App Router 패턴        |
| [AUTH_ARCHITECTURE.md](development/AUTH_ARCHITECTURE.md)           | JWT + Azure AD 인증 아키텍처      |
| [TEST_ENVIRONMENT_SETUP.md](development/TEST_ENVIRONMENT_SETUP.md) | 단일 DB 테스트 환경 설정          |
| [testing-guide.md](development/testing-guide.md)                   | 테스트 작성 가이드 (단위/E2E)     |
| [code-style-guide.md](development/code-style-guide.md)             | 코드 스타일 규칙                  |
| [PERFORMANCE_GUIDE.md](development/PERFORMANCE_GUIDE.md)           | 성능 최적화 패턴                  |
| [API_STANDARDS.md](development/API_STANDARDS.md)                   | REST API 설계 표준                |

---

## 기능 및 워크플로우

| 경로                                                               | 내용                                       |
| ------------------------------------------------------------------ | ------------------------------------------ |
| [features/](features/)                                             | 기능 구현 프로세스 (WF-20~WF-35)           |
| [workflows/critical-workflows.md](workflows/critical-workflows.md) | 핵심 비즈니스 워크플로우 (80KB, 전체 흐름) |
| [adr/](adr/)                                                       | 아키텍처 결정 기록 (ADR-001~003)           |

---

## UL-QP-18 절차서 및 양식 (procedure/)

| 경로                                       | 내용                                 |
| ------------------------------------------ | ------------------------------------ |
| [procedure/절차서/](procedure/절차서/)     | UL-QP-18 관련 절차서 원문            |
| [procedure/양식/](procedure/양식/)         | 11개 양식 정의 (리포트 SSOT)         |
| [procedure/실제양식/](procedure/실제양식/) | 실제 교정 검사 양식 샘플 (.docx 9개) |

---

## 보안 문서 (security/)

Azure EntraID 통합, CAR 대응, 위협 모델 관련 문서.
Lance Morrow(CISSP) 보안 리뷰 자료 포함.

---

## 역사적 문서 (archive/)

완료된 마이그레이션, 초기 구현 계획, 리팩토링 분석 등.
현재 시스템과 직접 관련 없으나 git 이력 보존 목적으로 유지.
