# Contract: sprint-1-4-legacy-actions-removal

Sprint 1.4 — LegacyActionsBlock 제거 + isNextStepPanelEnabled() 상시화

## Scope

- `apps/frontend/lib/features/checkout-flags.ts`
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
- `apps/frontend/.env.local`
- `apps/frontend/.env.example`
- `.claude/exec-plans/tech-debt-tracker.md`

## MUST Criteria (모두 PASS여야 루프 종료)

| ID  | Criterion |
|-----|-----------|
| M1  | `pnpm --filter frontend run tsc --noEmit` 에러 0건 |
| M2  | `grep -n "isNextStepPanelEnabled" CheckoutDetailClient.tsx` 결과 0건 |
| M3  | `grep -n "LegacyActionsBlock" CheckoutDetailClient.tsx` 결과 0건 |
| M4  | `checkout-flags.ts`가 `return true` 단일 반환 (process.env 참조 없음) |
| M5  | `CheckoutDetailClient.tsx` 내 `canApprove`, `canBorrowerApprove`, `canBorrowerReject`, `canStart`, `canComplete`, `canCancelCheckout` 참조 0건 |
| M6  | `CheckoutDetailClient.tsx` 내 `handoverQrOpen`, `HandoverQRDisplay`, `tQr`, `QrCode`, `CheckCheck` 참조 0건 (모두 LegacyActionsBlock 전용이었음) |
| M7  | NextStepPanel이 조건 없이 직접 렌더됨 (isNextStepPanelEnabled 래퍼 제거) |
| M8  | 모바일 bottom sheet 조건에서 `isNextStepPanelEnabled()` 제거 |
| M9  | `.env.local`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 줄 없음 |
| M10 | `.env.example`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 줄 없음 |
| M11 | tech-debt-tracker.md에서 flag 상시화 항목 [x] 체크 완료 |
| M12 | `handleNextStepAction`이 여전히 정의되고 `borrower_approve`/`borrower_reject` case 포함 |
| M13 | 모든 Dialog 컴포넌트(reject/start/approveReturn/rejectReturn/cancel/borrowerApprove/borrowerReject) 여전히 정의 |

## SHOULD Criteria (실패 시 tech-debt 기록, 루프 차단 안 함)

| ID  | Criterion |
|-----|-----------|
| S1  | `pnpm --filter frontend run test` PASS |
| S2  | verify-checkout-fsm Step 19 (NO_EQUIPMENT guard), Step 32 (280 table test) 확인 |
| S3  | tech-debt-tracker에 `checkout-legacy-next-step-panel-cleanup` 항목의 트리거 조건 활성화 표시 |

## 검증 명령

```bash
# M1
pnpm --filter frontend run tsc --noEmit

# M2, M3, M5, M6
grep -n "isNextStepPanelEnabled\|LegacyActionsBlock" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "canApprove\|canBorrowerApprove\|canBorrowerReject\|canStart\|canComplete\|canCancelCheckout" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
grep -n "handoverQrOpen\|HandoverQRDisplay\|tQr\|QrCode\|CheckCheck" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx

# M4
cat apps/frontend/lib/features/checkout-flags.ts

# M9, M10
grep "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" apps/frontend/.env.local apps/frontend/.env.example
```
