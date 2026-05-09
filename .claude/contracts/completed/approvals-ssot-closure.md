---
slug: approvals-ssot-closure
title: S-2 + S-3 Approvals SSOT Closure
mode: 1
date: 2026-05-09
---

# Contract: approvals-ssot-closure

## Scope

- `apps/frontend/lib/api/approvals-invalidation.ts` (신규)
- `apps/frontend/hooks/use-approvals-item-mutations.ts` (수정)
- `apps/frontend/hooks/use-approvals-bulk-mutations.ts` (수정)
- `apps/frontend/hooks/use-approval-row-transitions.ts` (수정)

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M-1 | `tsc --noEmit` 0 errors (frontend) | `pnpm --filter frontend run tsc --noEmit` |
| M-2 | frontend build PASS | `pnpm --filter frontend run build` |
| M-3 | frontend unit tests PASS | `pnpm --filter frontend run test` |
| M-4 | `getInvalidationKeys` useCallback이 `use-approvals-item-mutations.ts`에 존재하지 않음 | `grep -c "getInvalidationKeys" apps/frontend/hooks/use-approvals-item-mutations.ts` = 0 |
| M-5 | `getInvalidationKeys` useCallback이 `use-approvals-bulk-mutations.ts`에 존재하지 않음 | `grep -c "getInvalidationKeys" apps/frontend/hooks/use-approvals-bulk-mutations.ts` = 0 |
| M-6 | `getApprovalsInvalidationKeys` 헬퍼가 `approvals-invalidation.ts`에 export됨 | `grep -c "export function getApprovalsInvalidationKeys" apps/frontend/lib/api/approvals-invalidation.ts` ≥ 1 |
| M-7 | 두 mutation 훅이 `getApprovalsInvalidationKeys` import | `grep -c "getApprovalsInvalidationKeys" apps/frontend/hooks/use-approvals-item-mutations.ts` ≥ 1 && `grep -c "getApprovalsInvalidationKeys" apps/frontend/hooks/use-approvals-bulk-mutations.ts` ≥ 1 |
| M-8 | `use-approval-row-transitions.ts`에 `pendingTimers` ref가 없음 | `grep -c "pendingTimers" apps/frontend/hooks/use-approval-row-transitions.ts` = 0 |
| M-9 | `use-approval-row-transitions.ts`가 `useSafeTimeout` 사용 | `grep -c "useSafeTimeout" apps/frontend/hooks/use-approval-row-transitions.ts` ≥ 1 |
| M-10 | `use-approval-row-transitions.ts`에 수동 `useEffect` timer cleanup이 없음 | `grep -c "pendingTimers.current.forEach" apps/frontend/hooks/use-approval-row-transitions.ts` = 0 |
| M-11 | verify-ssot PASS (SSOT 우회 없음) | `verify-ssot` skill |
| M-12 | verify-frontend-state Step 44 (useSafeTimeout) PASS | `verify-frontend-state` skill Step 44 확인 |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S-1 | `use-approval-row-transitions.test.ts` 기존 케이스 모두 PASS (동작 불변) |
| S-2 | `approvals-invalidation.ts`에 JSDoc 또는 도메인 컨텍스트 주석 |

## Success Definition

모든 MUST 통과 시 PASS. 두 LOW tech-debt 항목을 동시에 종결하며 `tech-debt-tracker.md` [x] 처리.
