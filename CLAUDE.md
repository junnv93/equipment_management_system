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
│   │   │   ├── modules/         # 24 Feature modules
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

### Backend Modules (24)

| Module | Path | Description |
|---|---|---|
| `approvals` | `modules/approvals/` | 통합 승인 관리 (1-step, 2-step, 3-step) |
| `audit` | `modules/audit/` | 감사 로그 |
| `auth` | `modules/auth/` | JWT + Azure AD, Guards, RBAC |
| `cables` | `modules/cables/` | 케이블 관리 |
| `calibration` | `modules/calibration/` | 교정 기록 관리 |
| `calibration-factors` | `modules/calibration-factors/` | 교정 인자 관리 |
| `calibration-plans` | `modules/calibration-plans/` | 교정 계획 (3단계 승인) |
| `checkouts` | `modules/checkouts/` | 반출 관리 (교정/수리/렌탈) |
| `dashboard` | `modules/dashboard/` | 대시보드 통계 |
| `data-migration` | `modules/data-migration/` | 데이터 마이그레이션 유틸리티 |
| `documents` | `modules/documents/` | 문서 관리 (SHA-256, Presigned URL, 버전 관리) |
| `equipment` | `modules/equipment/` | 장비 CRUD + 폐기 + 수리이력 |
| `equipment-imports` | `modules/equipment-imports/` | 장비 반입 (구 rental-imports) |
| `intermediate-inspections` | `modules/intermediate-inspections/` | 중간 점검 관리 |
| `monitoring` | `modules/monitoring/` | 시스템 모니터링 |
| `non-conformances` | `modules/non-conformances/` | 부적합 관리 |
| `notifications` | `modules/notifications/` | 알림 서비스 |
| `reports` | `modules/reports/` | 리포트 생성 |
| `self-inspections` | `modules/self-inspections/` | 자체 점검 관리 |
| `settings` | `modules/settings/` | 시스템/교정 설정 관리 |
| `software-validations` | `modules/software-validations/` | 시험용 소프트웨어 유효성 검증 |
| `teams` | `modules/teams/` | 팀 관리 |
| `test-software` | `modules/test-software/` | 시험용 소프트웨어 관리 (P-number 레지스트리) |
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

> 상세: [docs/references/post-tool-use-hook.md](docs/references/post-tool-use-hook.md)

**핵심:** Prettier가 Write|Edit 후 자동 실행. `"file was modified by a linter"` 메시지는 대부분 포맷 변경만. `git diff`로 확인 후 판단.

---

## Behavioral Guidelines (코딩 전 행동 원칙)

> 상세: [docs/references/behavioral-guidelines.md](docs/references/behavioral-guidelines.md)

**이 원칙은 모든 기술 규칙보다 우선합니다.** 4가지 핵심:
1. **코딩 전에 생각하기** — 가정/트레이드오프를 표면에 드러냄. CAS·캐시·권한·상태 체크리스트
2. **최소 코드 원칙** — 요청된 것만. useState 이중관리 금지, setQueryData 금지
3. **수술적 변경** — 변경한 부분만. 인접 코드 개선/리팩토링 금지
4. **목표 기반 실행** — 성공 기준 정의 → 검증 반복

---

## Git Workflow Rules (Solo Trunk-Based)

**핵심 원칙: 1인 프로젝트 — 기본은 main 직접 작업, 위험 작업만 브랜치 + PR.**
CI 게이트는 `.husky/pre-push` (tsc + backend/frontend test)로 이동.

**일상 흐름**: `git pull` → 코딩 → `git add <files> && git commit` → `git push` (pre-push가 자동 검증).

**브랜치 필요한 예외** (월 1~2회): DB 마이그레이션 / major dep bump / 50+ 파일 리팩토링 / 실험적 작업.
네이밍: `feat/ fix/ chore/ refactor/`.

**금지**: `--no-verify` 우회, 위험 작업 main 직접 커밋, 요청 범위 초과 "김에 같이" 변경.

**PC 이동 후**: `git pull && pnpm --filter backend run db:reset && pnpm dev` (로컬 DB는 ephemeral).

**머지 전 고위험 변경 검토 (Layer 6)**: 브랜치 머지 직전 `node scripts/ultrareview-advisor.mjs` 실행 권고.
Go 판정 시 `node scripts/ultrareview-preflight.mjs` → `/ultrareview <PR번호>`. 상세: [docs/references/ultrareview-usage.md](docs/references/ultrareview-usage.md)

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
- Single DB: equipment_management (port 5432)
- DB commands: pnpm db:migrate
- Tests run on development DB
- 컨테이너 접근: docker compose exec postgres psql ...

❌ NEVER SUGGEST:
- "테스트 DB와 개발 DB를 분리해야..."
- 별도 테스트 DB (removed)
- 하드코딩된 컨테이너 이름 (docker compose 서비스명 사용)
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
| Behavioral Guidelines | [behavioral-guidelines.md](docs/references/behavioral-guidelines.md) | 4 guidelines: think first, minimal code, surgical changes, goal-based |
| Production Checklist | [production-checklist.md](docs/references/production-checklist.md) | Backend/Frontend endpoint/feature checklists |
| PostToolUse Hook | [post-tool-use-hook.md](docs/references/post-tool-use-hook.md) | Prettier auto-run, git diff verification |
| Secret 관리 (sops+age) | [secret-backup.md](docs/operations/secret-backup.md), [secret-rotation.md](docs/operations/secret-rotation.md) | ADR-0005, `infra/secrets/*.sops.yaml`, `pnpm compose:lan`, pre-commit gitleaks |
| Self-Audit (pre-commit gate) | [self-audit.md](docs/references/self-audit.md) | 7대 체크: 하드코딩URL/eslint-disable/any/SSOT우회/role리터럴/setQueryData/a11y, 예외 승인 절차 |
| UltraReview 통합 (Layer 6) | [ultrareview-usage.md](docs/references/ultrareview-usage.md), [ultrareview-governance.md](docs/operations/ultrareview-governance.md) | 7-Layer 방어선, SSOT 파생 Trigger, Pre-upload secret gate, 피드백 루프 |

---

## Production Checklist

> 상세: [docs/references/production-checklist.md](docs/references/production-checklist.md)

Backend: CAS + Zod + Permissions + AuditLog + Cache + tsc 검증. Frontend: TanStack Query + queryKeys + VERSION_CONFLICT + tsc 검증.

---

## File Conventions

App Router: `page.tsx` (route), `layout.tsx`, `loading.tsx`, `error.tsx` ('use client'), `not-found.tsx`.
Components: feature-grouped (`equipment/`, `checkouts/`, `calibration/`, `non-conformances/`, `approvals/`, `layout/`, `ui/` (shadcn), `auth/`).

## Useful Skills

This project has 25+ custom Claude Code skills in `.claude/skills/` organized by role:
- **Domain guides**: equipment-management, nextjs-16
- **Verify skills (17)**: verify-cas / -auth / -zod / -ssot / -hardcoding / -frontend-state / -nextjs / -design-tokens / -security / -i18n / -sql-safety / -e2e / -seed-integrity / -workflows / -filters / -cache-events / -implementation
- **Review skills**: review-architecture, review-design
- **Orchestrators**: generate-prompts, manage-skills, playwright-e2e, harness
- **UltraReview 스크립트**: `scripts/ultrareview-advisor.mjs` (Go/No-Go 판정), `scripts/ultrareview-preflight.mjs` (pre-upload secret gate)

> **각 스킬의 한줄 요약 + 스코프**: [docs/references/skills-index.md](docs/references/skills-index.md) 참조. 상세 사용법은 `.claude/skills/<name>/SKILL.md`.
