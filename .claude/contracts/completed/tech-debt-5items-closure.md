---
slug: tech-debt-5items-closure
title: Tech-Debt 5 Items Closure (disposal discriminatedUnion + MaintenanceHistoryTab tokens + approvals SSOT + filtersKey memo)
mode: 2
date: 2026-05-09
---

# Contract: tech-debt-5items-closure

## Scope

### Backend
- `apps/backend/src/modules/equipment/dto/disposal.dto.ts`
- `apps/backend/src/modules/equipment/services/disposal.service.ts`

### Frontend
- `apps/frontend/lib/design-tokens/components/equipment-timeline.ts`
- `apps/frontend/lib/design-tokens/index.ts`
- `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
- `apps/frontend/lib/api/approvals-invalidation.ts` (이전 세션 완료 — 검증만)
- `apps/frontend/hooks/use-approvals-item-mutations.ts` (이전 세션 완료 — 검증만)
- `apps/frontend/hooks/use-approvals-bulk-mutations.ts` (이전 세션 완료 — 검증만)
- `apps/frontend/hooks/use-approval-row-transitions.ts` (이전 세션 완료 — 검증만)

## MUST Criteria

### Item 1: reviewDisposalSchema discriminatedUnion
| ID | Criterion | Verification |
|----|-----------|-------------|
| M-1 | `reviewDisposalSchema`가 `discriminatedUnion` 사용 | `grep -c "discriminatedUnion" apps/backend/src/modules/equipment/dto/disposal.dto.ts` ≥ 2 (기존 approve + 신규 review) |
| M-2 | 수동 min-check 제거: `REJECTION_REASON_MIN_LENGTH` 검사가 reviewDisposal 메서드 본체에 없음 | `awk '/async reviewDisposal/,/^  \}$/' apps/backend/src/modules/equipment/services/disposal.service.ts \| grep -c "REJECTION_REASON_MIN_LENGTH"` = 0 |
| M-3 | backend tsc 0 errors | `pnpm --filter backend run tsc --noEmit` |
| M-4 | backend tests PASS | `pnpm --filter backend run test` |

### Item 2: MaintenanceHistoryTab design token
| ID | Criterion | Verification |
|----|-----------|-------------|
| M-5 | `MAINTENANCE_TIMELINE_TOKENS` 상수 exported from equipment-timeline.ts | `grep -c "export const MAINTENANCE_TIMELINE_TOKENS" apps/frontend/lib/design-tokens/components/equipment-timeline.ts` ≥ 1 |
| M-6 | MaintenanceHistoryTab.tsx에 `text-brand-warning` 인라인 리터럴 없음 | `grep -c "text-brand-warning" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` = 0 |
| M-7 | MaintenanceHistoryTab.tsx에 `text-brand-info` 직접 className 없음 | `grep -c "text-brand-info" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` = 0 |
| M-8 | MaintenanceHistoryTab.tsx에 `bg-brand-ok` 직접 className 없음 | `grep -c "bg-brand-ok" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` = 0 |
| M-9 | MaintenanceHistoryTab.tsx가 MAINTENANCE_TIMELINE_TOKENS 사용 | `grep -c "MAINTENANCE_TIMELINE_TOKENS" apps/frontend/components/equipment/MaintenanceHistoryTab.tsx` ≥ 3 |

### Item 3+4: approvals SSOT (이전 세션 완료 검증)
| ID | Criterion | Verification |
|----|-----------|-------------|
| M-10 | `getApprovalsInvalidationKeys` 헬퍼 exported | `grep -c "export function getApprovalsInvalidationKeys" apps/frontend/lib/api/approvals-invalidation.ts` ≥ 1 |
| M-11 | item-mutations 훅이 헬퍼 import | `grep -c "getApprovalsInvalidationKeys" apps/frontend/hooks/use-approvals-item-mutations.ts` ≥ 1 |
| M-12 | bulk-mutations 훅이 헬퍼 import | `grep -c "getApprovalsInvalidationKeys" apps/frontend/hooks/use-approvals-bulk-mutations.ts` ≥ 1 |
| M-13 | `use-approval-row-transitions.ts`가 useSafeTimeout 사용 | `grep -c "useSafeTimeout" apps/frontend/hooks/use-approval-row-transitions.ts` ≥ 1 |
| M-14 | `pendingTimers` 수동 ref 패턴 없음 | `grep -c "pendingTimers" apps/frontend/hooks/use-approval-row-transitions.ts` = 0 |

### Item 5: filters-key-memoization
| ID | Criterion | Verification |
|----|-----------|-------------|
| M-15 | `filtersKey`가 `useMemo` 경유 | `grep -c "useMemo.*JSON.stringify\|JSON.stringify.*filters" apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx` ≥ 1 |

### 빌드/타입
| ID | Criterion | Verification |
|----|-----------|-------------|
| M-16 | frontend tsc 0 errors | `pnpm --filter frontend run tsc --noEmit` |
| M-17 | frontend build PASS | `pnpm --filter frontend run build` |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S-1 | backend E2E tests PASS (disposal 경로 포함) |
| S-2 | `ReviewDisposalDto` Swagger 어노테이션이 discriminatedUnion 분기 반영 (approve: optional, reject: required) |
| S-3 | `MAINTENANCE_TIMELINE_TOKENS`이 `design-tokens/index.ts` re-export에 추가됨 |

## Success Definition

모든 MUST 통과 시 PASS.
- tech-debt-tracker.md 5개 항목 [x] 처리
- approvals-ssot-closure 계약 → completed/ 이동
- tech-debt-5items-closure 계약 → completed/ 이동
