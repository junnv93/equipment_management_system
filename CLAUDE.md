# CLAUDE.md - Equipment Management System

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this repository.
**UL-QP-18 (장비 관리 절차서)** 기반 장비 관리 시스템의 프로덕션급 개발 가이드입니다.

> 답변은 한국어로 해주세요.

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                              # Start all services (frontend + backend)
pnpm --filter backend run dev         # Backend only (NestJS)
pnpm --filter frontend run dev        # Frontend only (Next.js)

# Build
pnpm build                            # Build all packages
pnpm --filter backend run build       # Build backend
pnpm --filter frontend run build      # Build frontend

# Type Checking
pnpm tsc --noEmit                     # Check all TypeScript
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# Lint
pnpm lint                             # Lint all packages
pnpm --filter backend run lint
pnpm --filter frontend run lint

# Tests
pnpm test                             # Run all tests
pnpm --filter backend run test        # Backend unit tests
pnpm --filter backend run test:e2e    # Backend E2E tests
pnpm --filter frontend run test       # Frontend tests
pnpm --filter frontend run test:e2e   # Playwright E2E tests

# Database
pnpm --filter backend run db:generate # Generate migration SQL from schema diff
pnpm --filter backend run db:migrate  # Apply pending migrations (drizzle-kit migrate)
pnpm --filter backend run db:push     # Direct schema sync (dev prototyping only)
pnpm --filter backend run db:studio   # Open Drizzle Studio
pnpm --filter backend run db:reset    # DROP + CREATE + migrate + seed (PC 이동/꼬임 복구)

# Docker (Infrastructure only)
docker compose up -d                  # Start PostgreSQL + Redis
docker compose down                   # Stop containers
```

## High-Level Architecture

```
equipment_management_system/
├── apps/
│   ├── backend/                 # NestJS API (Port 3001)
│   │   ├── src/
│   │   │   ├── modules/         # 18 Feature modules
│   │   │   ├── common/          # Shared: guards, pipes, filters, interceptors, decorators, cache
│   │   │   └── database/        # Drizzle ORM setup
│   │   └── test/                # E2E tests
│   │
│   └── frontend/                # Next.js 16 App Router (Port 3000)
│       ├── app/                 # Route handlers and pages
│       │   ├── (auth)/          # Auth routes (login)
│       │   ├── (dashboard)/     # Dashboard routes (protected)
│       │   └── api/             # API routes (NextAuth)
│       ├── components/          # React components (feature-grouped)
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # API clients, errors, utilities
│
├── packages/                    # Dependency chain: schemas ← shared-constants, schemas ← db
│   ├── db/                      # Shared Drizzle schema
│   ├── schemas/                 # Shared Zod schemas + enums (SSOT)
│   └── shared-constants/        # Permissions, API endpoints
│                                # Note: Shared UI components use shadcn/ui directly in apps/frontend/components/ui/
│
└── docs/
    └── development/             # Development guides
```

### Backend Modules (18)

| Module | Path | Description |
|---|---|---|
| `approvals` | `modules/approvals/` | 통합 승인 관리 (1-step, 2-step, 3-step) |
| `audit` | `modules/audit/` | 감사 로그 |
| `auth` | `modules/auth/` | JWT + Azure AD, Guards, RBAC |
| `calibration` | `modules/calibration/` | 교정 기록 관리 |
| `calibration-factors` | `modules/calibration-factors/` | 교정 인자 관리 |
| `calibration-plans` | `modules/calibration-plans/` | 교정 계획 (3단계 승인) |
| `checkouts` | `modules/checkouts/` | 반출 관리 (교정/수리/렌탈) |
| `dashboard` | `modules/dashboard/` | 대시보드 통계 |
| `equipment` | `modules/equipment/` | 장비 CRUD + 폐기 + 수리이력 |
| `equipment-imports` | `modules/equipment-imports/` | 장비 반입 (구 rental-imports) |
| `monitoring` | `modules/monitoring/` | 시스템 모니터링 |
| `non-conformances` | `modules/non-conformances/` | 부적합 관리 |
| `notifications` | `modules/notifications/` | 알림 서비스 |
| `reports` | `modules/reports/` | 리포트 생성 |
| `settings` | `modules/settings/` | 시스템/교정 설정 관리 |
| `software` | `modules/software/` | 소프트웨어 관리 |
| `teams` | `modules/teams/` | 팀 관리 |
| `users` | `modules/users/` | 사용자 관리 |

### Ports

| Service | Port |
|---|---|
| Frontend | 3000 |
| Backend | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## PostToolUse Hook 주의사항

**Prettier가 PostToolUse hook으로 Write|Edit 후 자동 실행됩니다.**

- `"file was modified by a linter"` system-reminder는 **대부분 포맷만 변경된 것**
- 이 메시지를 보고 즉시 재시도하지 말 것 — 먼저 `git diff`로 실제 상태를 확인
- Edit 실패가 의심되면: `git diff` → 변경 누락 확인 → 원인 파악(매칭 실패? Prettier 충돌?) → 대응

**대응 단계:**

1. Edit 후 `git diff`로 의도한 변경이 반영되었는지 확인
2. 반영됨 → 끝. system-reminder 무시
3. 미반영 → 원인 파악 후 Edit 재시도 (컨텍스트를 더 구체적으로)
4. Edit이 반복 실패 → `sed` 사용 가능 (최후 수단, 원인 파악 후에만)

**절대 금지:**
- `--no-verify`로 pre-commit hook 우회
- Write로 파일 전체 덮어쓰기 (다른 변경사항 소실 위험)
- "컨텍스트가 커졌다" → 별도 agent에서 재작업

---

## Behavioral Guidelines (코딩 전 행동 원칙)

**이 원칙은 모든 기술 규칙보다 우선합니다. 위반 시 불필요한 재작업과 사이드 이펙트 발생.**

### Guideline 1: 코딩 전에 생각하기

**가정을 숨기지 않는다. 혼란을 감추지 않는다. 트레이드오프를 표면에 드러낸다.**

구현 전 확인 사항:
- 상태 변경이 수반되는가? → CAS(`version` 필드) 필요 여부 먼저 판단
- 여러 해석이 가능하면 **조용히 하나를 선택하지 말고** 선택지를 제시
- 더 단순한 접근법이 있으면 말한다. 필요 시 반론을 제기한다
- 불명확하면 멈추고, **무엇이 불명확한지** 명시한 뒤 질문한다

```
// 판단 체크리스트
1. 이 변경에 CAS가 필요한가? → VersionedBaseService + versionedSchema
2. 캐시 무효화 전략은? → CacheInvalidationHelper 교차 무효화
3. 어떤 역할이 이 기능에 접근하는가? → @RequirePermissions
4. 프론트엔드 상태는 어디서 관리하는가? → TanStack Query (useState 금지)
```

### Guideline 2: 최소 코드 원칙

**요청된 문제를 해결하는 최소한의 코드만 작성한다. 추측성 코드 금지.**

- 요청되지 않은 기능, 추상화, "유연성", "설정 가능성"을 추가하지 않는다
- 불가능한 시나리오에 대한 에러 핸들링을 넣지 않는다
- 한 번만 사용되는 코드에 헬퍼/유틸리티를 만들지 않는다
- 200줄로 짠 것이 50줄로 가능하면 다시 작성한다

```typescript
// ❌ 과잉 — 한 번만 쓰는 타입 변환에 유틸리티 생성
function formatCheckoutForDisplay(checkout: Checkout): DisplayCheckout { ... }
const formatted = formatCheckoutForDisplay(checkout);

// ✅ 최소 — 인라인으로 충분
const displayData = { ...checkout, statusLabel: STATUS_LABELS[checkout.status] };
```

**프로젝트 특화 함정:**
- `useOptimisticMutation`의 `onSuccess`에서 `setQueryData` 호출 금지 (TData ≠ TCachedData 75%)
- Drizzle ORM에서 correlated subquery 대신 JOIN + GROUP BY 사용 (subquery는 0 반환)
- 필터 상태를 `useState`로 이중 관리하지 않는다 (URL 파라미터가 SSOT)

### Guideline 3: 수술적 변경 (Surgical Changes)

**변경한 부분만 건드린다. 자기가 만든 잔여물만 정리한다.**

기존 코드 편집 시:
- 인접 코드의 "개선", 주석 추가, 포맷팅 변경 금지
- 고장나지 않은 것을 리팩토링하지 않는다
- 기존 스타일에 맞춘다 (더 좋은 방법을 알아도)
- 관련 없는 데드 코드를 발견하면 **언급만** 하고 삭제하지 않는다

자신의 변경으로 인한 잔여물:
- 자신의 변경이 만든 미사용 import/변수/함수는 제거한다
- 기존에 있던 데드 코드는 요청 없이 제거하지 않는다

**검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되어야 한다.

### Guideline 4: 목표 기반 실행

**성공 기준을 정의하고, 검증될 때까지 반복한다.**

작업을 검증 가능한 목표로 변환:

```
"유효성 검사 추가" → "잘못된 입력 테스트 작성 → 통과시키기"
"버그 수정"       → "재현 테스트 작성 → 통과시키기"
"리팩토링"        → "기존 테스트 통과 확인 → 변경 → 재확인"
```

다단계 작업 시 검증 계획 명시:

```
1. [단계] → 검증: pnpm tsc --noEmit (타입 에러 0)
2. [단계] → 검증: pnpm --filter backend run test (관련 스위트)
3. [단계] → 검증: 브라우저에서 해당 페이지 동작 확인
```

**명확한 성공 기준 = 독립적 반복 가능. 모호한 기준("되게 만들기") = 매번 확인 필요.**

---

## Git Workflow Rules (Solo Trunk-Based)

**핵심 원칙: 1인 프로젝트 — 기본은 main 직접 작업, 위험 작업만 브랜치 + PR.**
CI 게이트는 `.husky/pre-push` (tsc + backend/frontend test)로 이동.

**일상 흐름**: `git pull` → 코딩 → `git add <files> && git commit` → `git push` (pre-push가 자동 검증).

**브랜치 필요한 예외** (월 1~2회): DB 마이그레이션 / major dep bump / 50+ 파일 리팩토링 / 실험적 작업.
네이밍: `feat/ fix/ chore/ refactor/`.

**금지**: `--no-verify` 우회, 위험 작업 main 직접 커밋, 요청 범위 초과 "김에 같이" 변경.

**PC 이동 후**: `git pull && pnpm --filter backend run db:reset && pnpm dev` (로컬 DB는 ephemeral).

> **상세 절차 (SessionStart hook 해석, db:reset 내부 동작, pre-push 구성 등)**: [docs/references/git-workflow.md](docs/references/git-workflow.md) 참조

---

## CRITICAL Rules (위반 시 프로덕션 버그)

### Rule 0: SSOT (Single Source of Truth)

**Shared types and constants MUST be imported from packages, not redefined.**

```typescript
// ✅ CORRECT
import { UserRole, EquipmentStatus, CheckoutStatus } from '@equipment-management/schemas';
import { Permission, API_ENDPOINTS } from '@equipment-management/shared-constants';

// ❌ WRONG - 로컬 재정의 금지
type UserRole = 'ADMIN' | 'USER' | 'MANAGER'; // Wrong values!
```

| Data Type | SSOT Package | Example |
|---|---|---|
| Enums (Status, Role) | `@equipment-management/schemas` | `EquipmentStatus`, `UserRole`, `CheckoutStatus` |
| Permissions | `@equipment-management/shared-constants` | `Permission.VIEW_EQUIPMENT` |
| API Endpoints | `@equipment-management/shared-constants` | `API_ENDPOINTS.EQUIPMENT.LIST` |
| Management Number | `@equipment-management/schemas` | `generateManagementNumber()` |
| Query Keys | `lib/api/query-config.ts` | `queryKeys.equipment.detail(id)` |
| Equipment Filters | `lib/utils/equipment-filter-utils.ts` | `parseEquipmentFiltersFromSearchParams()` |
| Error Codes | `lib/errors/equipment-errors.ts` | `EquipmentErrorCode.VERSION_CONFLICT` |

> **Frontend-specific UI options (SITE_OPTIONS, CLASSIFICATION_OPTIONS) are allowed locally.**

### Rule 1: Single Database Architecture

**THIS IS CRITICAL - DO NOT VIOLATE**

```
✅ CORRECT:
- Single DB: postgres_equipment (port 5432)
- DB commands: pnpm db:migrate
- Tests run on development DB

❌ NEVER SUGGEST:
- "테스트 DB와 개발 DB를 분리해야..."
- postgres_equipment_test (removed)
- localhost:5434 (not used)
```

### Rule 2: Server-Side User Extraction (Security)

**서버에서 userId를 추출해야 합니다. 클라이언트 body의 userId를 절대 신뢰하면 안 됩니다.**

```typescript
// ✅ CORRECT — JWT에서 추출
@Patch(':uuid/approve')
async approve(@Param('uuid') uuid: string, @Request() req: AuthenticatedRequest) {
  const approverId = req.user?.userId; // ← 서버에서 추출
}

// ❌ WRONG — 클라이언트 body 신뢰 금지
async approve(@Body() dto: { approverId: string }) {
  await this.service.approve(dto.approverId); // 위조 가능!
}
```

### Rule 3: TypeScript Strict (`any` 금지)

```typescript
// ❌ NEVER
const data: any = await fetch(...);

// ✅ Always use proper types
interface Equipment { id: string; name: string; }
const data: Equipment = await fetch(...).then(r => r.json());
```

### Rule 4: Next.js 16 Patterns

```typescript
// ✅ CORRECT - params/searchParams are Promise
export default async function Page(props: PageProps<'/equipment/[id]'>) {
  const { id } = await props.params;
  const equipment = await getEquipment(id);
  return <EquipmentDetailClient equipment={equipment} />;
}

// ❌ WRONG - Direct access without await
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}
```

```typescript
// ✅ useActionState (React 19) — ❌ useFormState is deprecated
import { useActionState } from 'react';
```

```typescript
// ✅ Next.js 16 Proxy 컨벤션 — middleware 컨벤션은 deprecated
// 파일: proxy.ts (루트), 함수명: proxy, config는 직접 정의 (re-export 불가)
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] };

// ❌ WRONG - Next.js 16에서 middleware.ts + middleware 함수명은 deprecated
export async function middleware(request: NextRequest) { ... }
```

---

## Deep-Dive References

상세 패턴은 별도 참조 파일에 문서화되어 있습니다. 관련 기능 작업 시 참조하세요.

| Topic | File | Key Concepts |
|-------|------|-------------|
| CAS / Optimistic Locking | [cas-patterns.md](docs/references/cas-patterns.md) | VersionedBaseService, version field, cache coherence on 409 |
| Backend Patterns | [backend-patterns.md](docs/references/backend-patterns.md) | Zod pipeline, GlobalExceptionFilter, Auth, Caching, Transactions |
| Frontend Patterns | [frontend-patterns.md](docs/references/frontend-patterns.md) | TanStack Query, useOptimisticMutation, Cache Invalidation |
| Domain Context (UL-QP-18) | [domain-context.md](docs/references/domain-context.md) | Role hierarchy, Equipment/Checkout status, Approval workflows |
| E2E Testing | [e2e-patterns.md](docs/references/e2e-patterns.md) | storageState auth, fixtures, test isolation, anti-patterns |

---

## Production Checklist

### Backend Endpoint 추가 시

- [ ] CAS 필요 여부 확인 (상태 변경 → `version` 필드 + `VersionedBaseService`)
- [ ] Zod schema + `versionedSchema` + `ZodValidationPipe`
- [ ] `@RequirePermissions(Permission.XXX)` 데코레이터
- [ ] `req.user.userId` 서버 사이드 추출 (body에서 userId 받지 않기)
- [ ] `@AuditLog()` 데코레이터
- [ ] 캐시 무효화 전략 (`CacheInvalidationHelper`)
- [ ] 에러 응답에 `code` 필드 정의 (VERSION_CONFLICT 등)
- [ ] 다중 테이블 업데이트 → `db.transaction()`
- [ ] **검증:** `pnpm --filter backend run tsc --noEmit` 통과
- [ ] **검증:** 관련 유닛 테스트 통과 (`pnpm --filter backend run test -- --grep "모듈명"`)

### Frontend 기능 추가 시

- [ ] 서버 상태 → TanStack Query (useState 금지)
- [ ] 상태 변경 → `useOptimisticMutation`
- [ ] `queryKeys` 팩토리 등록 (`lib/api/query-config.ts`)
- [ ] VERSION_CONFLICT 에러 특별 처리
- [ ] Loading / Error / Empty state
- [ ] 캐시 무효화 (`EquipmentCacheInvalidation` or `invalidateQueries`)
- [ ] **검증:** `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] **검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되는지 diff 재확인

---

## File Conventions

### Frontend Routes (App Router)

| File | Purpose |
|---|---|
| `page.tsx` | Route page component |
| `layout.tsx` | Shared layout wrapper |
| `loading.tsx` | Loading skeleton |
| `error.tsx` | Error boundary ('use client' required) |
| `not-found.tsx` | 404 page |

### Component Organization

```
components/
├── equipment/           # 장비 관리
├── checkouts/           # 반출 관리
├── calibration/         # 교정 관리
├── non-conformances/    # 부적합 관리
├── approvals/           # 승인 관리
├── layout/              # 레이아웃
├── ui/                  # shadcn/ui
└── auth/                # 인증
```

## Useful Skills

This project has 25+ custom Claude Code skills in `.claude/skills/` organized by role:
- **Domain guides**: equipment-management, nextjs-16
- **Verify skills (16)**: verify-cas / -auth / -zod / -ssot / -hardcoding / -frontend-state / -nextjs / -design-tokens / -security / -i18n / -sql-safety / -e2e / -seed-integrity / -workflows / -filters / -implementation
- **Review skills**: review-architecture, review-design
- **Orchestrators**: generate-prompts, manage-skills, playwright-e2e, harness

> **각 스킬의 한줄 요약 + 스코프**: [docs/references/skills-index.md](docs/references/skills-index.md) 참조. 상세 사용법은 `.claude/skills/<name>/SKILL.md`.
