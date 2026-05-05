---
slug: bulk-action-bar-mutateasync-uxconsistency
mode: 1
status: completed
domain: frontend / approvals + checkouts bulk action UX
date: 2026-05-06
verdict: PASS
commits:
  - 8045a184 — feat(bulk-action-bar): enforce mutateAsync UX consistency
  - 2d4fdce9 — fix(calibration): replace randomUUID with generateOpaqueId (incidental cleanup)
---

# Sprint 3 — BulkActionBar mutateAsync UX consistency

## 배경
`BulkActionBar` / `CheckoutBulkActionBar` 의 `onBulkApprove` 콜백 시그니처가 `() => void | Promise<void>` 느슨한 union 으로 정의되어, 호출자(`ApprovalsClient` / `OutboundCheckoutsTab`)가 `mutation.mutate()` (fire-and-forget)를 전달하면 AlertDialog `await onBulkApprove()`가 즉시 resolve → API 응답 전 dialog close + isPending 시각 피드백 유실.

## 작업 (Generator)
**소스**:
- `apps/frontend/components/approvals/BulkActionBar.tsx` — 시그니처 좁힘 + try/catch swallow
- `apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx` — 동일 패턴
- `apps/frontend/components/approvals/ApprovalsClient.tsx` — `handleBulkApprove` + `handleBulkApproveWithComment` async + `mutateAsync`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — `handleBulkApprove` async + `mutateAsync`

**spec (신규)**:
- `apps/frontend/components/approvals/__tests__/BulkActionBar.test.tsx` (160 lines, 4 cases)
- `apps/frontend/components/checkouts/__tests__/CheckoutBulkActionBar.test.tsx` (140 lines, 3 cases)

**무관 변경 분리 commit**:
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `statusFilter`를 `[statusFilter]` 배열 wrap (v3 query DTO contract — `optionalCsvEnum` → `CheckoutStatus[]`로 변환)
- `apps/backend/src/modules/calibration/services/certificate-extractor.service.ts` — `randomUUID` → `generateOpaqueId` (IdentifierService SSOT, deps-supply-chain-hardening sprint와 일관)
- `apps/backend/src/modules/calibration/__tests__/certificate-extractor.integration.spec.ts` (74 lines, env-gated HCT PDF)

## MUST 기준 (Evaluator)

| # | 검증 | Expected |
|---|------|----------|
| M1 | `verify-bulk-action-bar` Step 12-1 — wrapper props 시그니처 `() => Promise<void>` | 양쪽 hit |
| M2 | Step 12-2 — union signature 잔존 0건 | 0 hit |
| M3 | Step 12-3 — 호출자 fire-and-forget `bulkApproveMutation.mutate(` 0건 | 0 hit (test 제외) |
| M4 | Step 12-4 — internal `try {` + `} catch` 양 wrapper | 양쪽 hit |
| M5 | unit test 7건 PASS (BulkActionBar.test.tsx 4 + CheckoutBulkActionBar.test.tsx 3) | 7/7 PASS |
| M6 | frontend tsc --noEmit | 0 error |
| M7 | frontend lint | 0 error |
| M8 | backend checkouts module test 회귀 | 145/145 PASS |
| M9 | 단일 cohesive commit (sprint 3 본체) + 2 chore commits 분리 (statuses fix, certificate-extractor SSOT) | 3 commits |

## SHOULD 기준 (후속 가능, 루프 차단 X)

| # | 검증 | 비고 |
|---|------|------|
| S1 | `verify-bulk-action-bar` Step 1~11 회귀 | 기존 PASS 유지 |
| S2 | E2E spec `outbound-bulk-action.spec.ts` runtime PASS | 환경 의존, e2e harness 별도 |
| S3 | Equipment generic BulkActionBar (`components/common/BulkActionBar.tsx`) 동일 패턴 적용 검토 | 도메인 wrapper 패턴 다름 — out of scope, tech-debt 등록 가능 |

## Anti-patterns (회귀 차단)

```tsx
// ❌ 시그니처 union — 호출자 fire-and-forget 전달 가능
onBulkApprove: () => void | Promise<void>;

// ❌ 호출자 fire-and-forget
const handleBulkApprove = () => {
  bulkApproveMutation.mutate({ ids });  // mutate, await 없음
};

// ❌ try 없이 await — unhandled rejection (DEV에서 console.error 폭주)
const handleBulkApprove = async () => {
  await onBulkApprove();
  setIsApproveDialogOpen(false);
};
```
