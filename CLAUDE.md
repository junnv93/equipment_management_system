# CLAUDE.md - Equipment Management System

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this repository.

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
pnpm --filter backend run db:generate # Generate migration
pnpm --filter backend run db:migrate  # Run migrations
pnpm --filter backend run db:studio   # Open Drizzle Studio

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
│   │   │   ├── modules/         # Feature modules (equipment, auth, users, etc.)
│   │   │   ├── common/          # Shared utilities, guards, decorators
│   │   │   └── database/        # Drizzle ORM setup
│   │   └── test/                # E2E tests
│   │
│   └── frontend/                # Next.js 16 App Router (Port 3000)
│       ├── app/                 # Route handlers and pages
│       │   ├── (auth)/          # Auth routes (login)
│       │   ├── (dashboard)/     # Dashboard routes (protected)
│       │   └── api/             # API routes (NextAuth)
│       ├── components/          # React components
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # API clients, utilities
│
├── packages/
│   ├── db/                      # Shared Drizzle schema
│   ├── schemas/                 # Shared Zod validation schemas
│   └── api-client/              # Generated API client types
│
└── docs/
    └── development/             # Development guides
```

### Tech Stack

- **Backend**: NestJS, Drizzle ORM, PostgreSQL
- **Frontend**: Next.js 16 (App Router), React 19, TailwindCSS, shadcn/ui
- **Authentication**: NextAuth.js (Azure AD + Credentials)
- **Monorepo**: pnpm workspace
- **Infrastructure**: Docker (PostgreSQL, Redis only)

### Ports

| Service    | Port |
| ---------- | ---- |
| Frontend   | 3000 |
| Backend    | 3001 |
| PostgreSQL | 5432 |
| Redis      | 6379 |

## Critical Development Rules

### 1. Single Database Architecture

**THIS IS CRITICAL - DO NOT VIOLATE**

```
✅ CORRECT:
- Single DB: postgres_equipment (port 5432)
- DB commands: pnpm db:migrate
- Tests run on development DB

❌ NEVER SUGGEST:
- "테스트 DB와 개발 DB를 분리해야..."
- "두 DB를 동기화하려면..."
- postgres_equipment_test (removed)
- localhost:5434 (not used)
- equipment_management_test (not used)
```

### 2. Next.js 16 Patterns (REQUIRED)

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
// ✅ CORRECT - useActionState (React 19)
import { useActionState } from 'react';

// ❌ WRONG - useFormState is deprecated
import { useFormState } from 'react-dom';
```

```typescript
// ✅ CORRECT - Form actions return void, use revalidation
export async function createEquipment(formData: FormData) {
  'use server';
  await db.equipment.create({ ... });
  revalidatePath('/equipment');
  // No return!
}

// ❌ WRONG - Form actions cannot return data
export async function createEquipment(formData: FormData) {
  'use server';
  return { success: true }; // Type error!
}
```

### 3. Authentication Architecture

**NextAuth is the SINGLE source of truth for authentication.**

```typescript
// ✅ CORRECT - Use NextAuth session
import { auth } from '@/lib/auth';
const session = await auth();

// ❌ NEVER - localStorage token storage
localStorage.setItem('token', jwt); // FORBIDDEN
```

For E2E tests, use NextAuth callback API, not direct JWT manipulation:

```typescript
// ✅ CORRECT E2E test login
await page.request.post('/api/auth/callback/test-login', {
  form: { role: 'lab_manager', csrfToken, json: 'true' },
});

// ❌ WRONG - Bypassing NextAuth
page.context().addCookies([{ name: 'token', value: jwt }]);
```

### 4. Code Standards

```typescript
// ❌ NEVER use 'any'
const data: any = await fetch(...);

// ✅ Always use proper types
interface Equipment { id: string; name: string; ... }
const data: Equipment = await fetch(...).then(r => r.json());
```

```typescript
// Server Components are default - only add 'use client' when needed
// ✅ Server Component (default) - for data fetching
export default async function EquipmentPage() {
  const data = await fetchEquipment();
  return <EquipmentClient data={data} />;
}

// ✅ Client Component - for interactivity
'use client';
export function EquipmentClient({ data }) {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>...</button>;
}
```

## Domain Context (UL-QP-18)

This system implements equipment management procedures based on UL-QP-18 (장비 관리 절차서).

### Role Hierarchy

| Role                | Korean     | Permissions                          |
| ------------------- | ---------- | ------------------------------------ |
| `test_engineer`     | 시험실무자 | Basic operations, request approvals  |
| `technical_manager` | 기술책임자 | Approve requests, manage calibration |
| `lab_manager`       | 시험소장   | Full access, self-approval           |

### Equipment Status Values

```typescript
enum EquipmentStatus {
  available = 'available', // 사용가능
  in_use = 'in_use', // 사용중
  checked_out = 'checked_out', // 반출중
  calibration_scheduled = 'calibration_scheduled', // 교정예정
  calibration_overdue = 'calibration_overdue', // 교정기한초과
  non_conforming = 'non_conforming', // 부적합
  spare = 'spare', // 여분
  retired = 'retired', // 폐기
}
```

### Calibration Display Logic

Calibration status is shown as a **separate D-day badge** alongside the primary status:

- Equipment with `calibration_scheduled` or `calibration_overdue` shows primary status as "사용 가능"
- D-day badge shows countdown (D-7, D-Day) or overdue days (D+5)
- Statuses `retired`, `non_conforming`, `spare` skip calibration badge display

### Management Number Format

```
XXX – X YYYY
 │    │  └── Serial number
 │    └───── Classification (E/R/W/S/A/P)
 └────────── Site code (SUW/UIW/PYT)
```

## File Conventions

### Frontend Routes (App Router)

| File            | Purpose                                |
| --------------- | -------------------------------------- |
| `page.tsx`      | Route page component                   |
| `layout.tsx`    | Shared layout wrapper                  |
| `loading.tsx`   | Loading skeleton                       |
| `error.tsx`     | Error boundary ('use client' required) |
| `not-found.tsx` | 404 page                               |

### Component Organization

```
components/
├── equipment/           # Feature-specific components
│   ├── EquipmentTable.tsx
│   ├── EquipmentCardGrid.tsx
│   ├── EquipmentHeader.tsx
│   └── EquipmentDetailClient.tsx
├── layout/              # Layout components
├── ui/                  # shadcn/ui components
└── auth/                # Auth components
```

## Useful Skills

This project has custom Claude Code skills in `.claude/skills/`:

- **equipment-management**: Domain knowledge for UL-QP-18 procedures
- **nextjs-16**: Next.js 16 patterns and best practices

Reference these skills when working on related features.
