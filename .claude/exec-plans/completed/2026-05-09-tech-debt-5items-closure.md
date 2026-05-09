# Exec Plan: tech-debt-5items-closure

**Date**: 2026-05-09
**Slug**: tech-debt-5items-closure
**Mode**: 2 (Mode 1 수준 구현 — 5개 항목, 다중 도메인)

## 배경

tech-debt-tracker.md 에서 액션 가능한 5개 LOW 항목 통합 closure.
- Items 3/4 (approvals-ssot-closure): 이전 세션에서 이미 구현 완료, 계약 미검증 상태.
- Items 1/2/5: 본 sprint에서 구현.

## 항목 요약

| ID | 항목 | 상태 |
|----|------|------|
| #1 | reviewDisposalSchema discriminatedUnion | 구현 필요 |
| #2 | MaintenanceHistoryTab brand 인라인 리터럴 | 구현 필요 |
| #3 | approvals-invalidation-keys-ssot | 이미 완료 (검증만) |
| #4 | use-approval-row-transitions-safe-timeout | 이미 완료 (검증만) |
| #5 | filters-key-memoization | 구현 필요 |

## Phase 1: 변경 파일

### 1a. disposal DTO (backend)
**File**: `apps/backend/src/modules/equipment/dto/disposal.dto.ts`

현재 `reviewDisposalSchema`는 `z.object()` + `decision: ApprovalActionEnum` + `opinion` 항상 required.
목표: `z.discriminatedUnion('decision', [approve_branch, reject_branch])`로 교체.

- approve 분기: `decision: z.literal('approve')`, `opinion` optional (max만 적용)
- reject 분기: `decision: z.literal('reject')`, `opinion` required (min + max)
- `ReviewDisposalInput` 타입이 자동으로 union으로 추론됨
- `ReviewDisposalDto` 클래스: `opinion?: string` (Swagger 문서화용 — nullable 어노테이션 추가)

참조: `approveDisposalSchema` (같은 파일) — 동일 패턴 이미 구현됨.

### 1b. disposal 서비스 (backend)
**File**: `apps/backend/src/modules/equipment/services/disposal.service.ts`

- 수동 min-check (lines 177-184) 제거 — Zod discriminatedUnion이 controller 레벨에서 차단
- `trimmedOpinion` → `reviewDto.opinion?.trim() || null` (approve 시 null 허용)
- DB update approve 경로: `reviewOpinion: trimmedOpinion` (null 가능 — DB 컬럼 nullable 확인 필요)

### 2. equipment-timeline.ts (frontend design token)
**File**: `apps/frontend/lib/design-tokens/components/equipment-timeline.ts`

```typescript
export const MAINTENANCE_TIMELINE_TOKENS = {
  node: `${TIMELINE_TOKENS.node.container} bg-brand-ok text-white shadow-lg`,
  headerIcon: 'h-5 w-5 text-brand-info',
  errorIcon: 'h-8 w-8 text-brand-warning',
} as const;
```

- `index.ts`에서 re-export 추가

### 3. MaintenanceHistoryTab.tsx (frontend)
**File**: `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx`

4개 인라인 리터럴 → 토큰 경유:
- L278: `text-brand-warning` → `{MAINTENANCE_TIMELINE_TOKENS.errorIcon}`
- L292: `text-brand-info` → `{MAINTENANCE_TIMELINE_TOKENS.headerIcon}`
- L316: `text-brand-info` → `{MAINTENANCE_TIMELINE_TOKENS.headerIcon}`
- L329: `bg-brand-ok text-white shadow-lg` → `{MAINTENANCE_TIMELINE_TOKENS.node}`

### 4. OutboundCheckoutsTab.tsx (frontend)
**File**: `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`

```typescript
// Before (L145)
const filtersKey = JSON.stringify(filters);

// After
const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
```

`useMemo` 이미 import 됨 (L3).

## Phase 2: 검증

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run build
```

## Phase 3: 아카이브

- tech-debt-tracker.md 5개 항목 [x] 처리
- approvals-ssot-closure 계약 archived
- tech-debt-5items-closure 계약 archived
