---
slug: rental-phase5-8
iteration: 1
verdict: PASS
---

## Contract Status

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M-1 tsc backend | PASS | `pnpm --filter backend exec tsc --noEmit` → 출력 없음 (에러 0) |
| M-2 tsc frontend | PASS | `pnpm --filter frontend exec tsc --noEmit` → 출력 없음 (에러 0) |
| M-3 notification-registry | PASS | `CHECKOUT_BORROWER_APPROVED` composite(requesterId actor + lenderTeamId team), `CHECKOUT_BORROWER_REJECTED` actor(requesterId). 모두 `NOTIFICATION_EVENTS` 경유 |
| M-4 sse-listener | PASS | `APPROVAL_AFFECTING_EVENTS` 배열 22~23번 줄에 두 이벤트 모두 포함 |
| M-5 service payload | PASS | line 1666: `lenderTeamId: checkout.lenderTeamId ?? ''` — DB 조회 결과 경유, 하드코딩 없음 |
| M-6 permission ssot | PASS | line 98: `const canBorrowerApprove = can(Permission.BORROWER_APPROVE_CHECKOUT)` — 문자열 리터럴 없음 |
| M-7 status ssot | PASS | borrower 분기 전체에서 `CSVal.PENDING`, `CSVal.BORROWER_APPROVED`, `CPVal.RENTAL` 사용 확인 |
| M-8 mutations | PASS | `borrowerApproveMutation` (line 272) → `checkoutApi.borrowerApproveCheckout`, `borrowerRejectMutation` (line 295) → `checkoutApi.borrowerRejectCheckout` |
| M-9 dialog state | PASS | `dialogState`에 `borrowerApprove`, `borrowerReject` boolean 필드 존재 (line 141~142). `borrowerRejectReason` useState 별도 존재 (line 147) |
| M-10 i18n | PASS | ko/en 모두 `fsm.action.borrower_approve`, `fsm.hint.pendingBorrowerApprove` 존재하며 비어 있지 않음. dialogs 섹션 borrower 키 6개(borrowerApproveTitle, borrowerApproveDescription, borrowerRejectTitle, borrowerRejectDescription, borrowerRejectReasonLabel, borrowerRejectReasonPlaceholder) 모두 ko/en 존재, 빈 문자열 없음 |
| M-11 handleNextStepAction | PASS | line 421~426: `case 'borrower_approve':` → `setDialogState borrowerApprove:true`, `case 'borrower_reject':` → `setDialogState borrowerReject:true` |
| M-12 no setQueryData | PASS | `grep setQueryData` 결과 없음. 양 mutation 모두 `(old?.version ?? checkout.version) + 1` 패턴 사용 |

## SHOULD Status

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S-1 LegacyActionsBlock | FAIL | PENDING + rental + canBorrowerApprove → 1차 승인/반려 버튼 존재 (line 447~471) ✓. 그러나 `BORROWER_APPROVED + canApprove → lender 최종 승인/반려` 분기 없음. LegacyActionsBlock의 lender 승인 조건(line 475)은 `CSVal.PENDING && canApprove` 전용이므로 rental 2-step 전환 후 `BORROWER_APPROVED` 상태에서 lender TM의 Legacy 경로 최종 승인/반려 버튼이 렌더되지 않음 |
| S-2 isAnyNextStepMutationPending | PASS | line 439~440: `borrowerApproveMutation.isPending \|\| borrowerRejectMutation.isPending` 포함 |
| S-3 accessibility | PASS | borrowerReject Textarea에 `aria-required="true"` (line 1248), `aria-invalid={!borrowerRejectReason.trim()}` (line 1249) 존재 |

## Issues Found

### S-1 FAIL: LegacyActionsBlock — BORROWER_APPROVED 상태에서 lender 최종 승인/반려 버튼 누락

**파일**: `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`

- **line 475**: `if (checkout.status === CSVal.PENDING && canApprove)` — PENDING 전용 조건
- BORROWER_APPROVED 상태를 포함하는 lender 승인 분기가 없음
- rental 2-step 워크플로우에서 `PENDING → BORROWER_APPROVED → APPROVED` 중 두 번째 전환은 LegacyActionsBlock 경로에서 lender TM이 버튼을 볼 수 없음
- **영향 범위**: Feature Flag OFF 경로(레거시 폴백)만 해당. NextStepPanel(Feature Flag ON) 경로는 FSM이 처리하므로 정상.

## Repair Instructions

### S-1 수리

`apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`의 LegacyActionsBlock 내 lender 최종 승인 블록(line 474~496)을 아래와 같이 수정:

```tsx
// 기존
if (checkout.status === CSVal.PENDING && canApprove) {

// 수정 후 — BORROWER_APPROVED(rental 2-step) 포함
if (
  ([CSVal.PENDING, CSVal.BORROWER_APPROVED] as CheckoutStatus[]).includes(checkout.status) &&
  canApprove
) {
```

단, `BORROWER_APPROVED` 상태에서 `canApprove`(lender TM)는 서버 사이드 scope 검증으로도 보호되므로, UI 조건 추가만으로 보안 위협 없음. SSOT는 이미 `CSVal.BORROWER_APPROVED`를 사용하므로 추가 import 불필요.
