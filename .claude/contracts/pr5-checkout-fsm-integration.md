---
slug: pr5-checkout-fsm-integration
type: contract
date: 2026-04-24
depends: [pr1-checkout-fsm-schemas, pr3-design-tokens, pr4-next-step-panel]
---

# Contract: PR-5 CheckoutGroupCard + CheckoutDetailClient FSM 통합 + Feature Flag

## Scope

수정:
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`

확인만 (변경 없음):
- `apps/frontend/lib/features/checkout-flags.ts`
- `apps/frontend/.env.local`
- `apps/frontend/.env.example`

신규 생성: 없음.

수정 금지:
- `apps/frontend/components/checkouts/NextStepPanel.tsx` (legacy — 별도 PR에서 삭제)
- `apps/frontend/components/shared/NextStepPanel.tsx` (PR-4 납품물)
- `apps/frontend/hooks/use-checkout-next-step.ts` (PR-4 납품물)
- `packages/schemas/src/fsm/checkout-fsm.ts` (PR-1 납품물)
- 모든 mutation 정의 (`useOptimisticMutation` 블록) 및 Dialog JSX 블록

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 검증 |
| M2 | `pnpm --filter frontend exec eslint <두 파일>` error 0 | lint |
| M3 | `CheckoutGroupCard.tsx`에서 `@/components/shared/NextStepPanel` import 존재 | `grep -n "@/components/shared/NextStepPanel" CheckoutGroupCard.tsx` = 1 hit |
| M4 | `CheckoutGroupCard.tsx`에서 `<NextStepPanel variant="compact"` 렌더 | `grep -n 'variant="compact"' CheckoutGroupCard.tsx` = 1 hit |
| M5 | `CheckoutGroupCard.tsx` 렌탈 헤더 렌더가 `isNextStepPanelEnabled()` 분기로 감싸짐 | 코드 확인 (on: shared panel, off: RentalFlowInline 호출) |
| M6 | `RentalFlowInline` 함수 선언부는 보존 (rollback용) | `grep -n "function RentalFlowInline" CheckoutGroupCard.tsx` = 1 hit |
| M7 | `CheckoutDetailClient.tsx` import가 `@/components/checkouts/NextStepPanel` → `@/components/shared/NextStepPanel` 교체 | `grep -c "@/components/checkouts/NextStepPanel" CheckoutDetailClient.tsx` = 0 AND `grep -c "@/components/shared/NextStepPanel" CheckoutDetailClient.tsx` = 1 |
| M8 | `CheckoutDetailClient.tsx`에 `<NextStepPanel variant="floating"` 렌더 + `onActionClick` + `isPending` prop 전달 | grep + 코드 확인 |
| M9 | `CheckoutDetailClient.tsx`에 `function LegacyActionsBlock` 선언 존재, 기존 `renderActions` 제거 | `grep -n "LegacyActionsBlock" CheckoutDetailClient.tsx` >= 2 hit AND `grep -nE "(function renderActions\|const renderActions)" CheckoutDetailClient.tsx` = 0 |
| M10 | `handleNextStepAction` 디스패처 존재, 최소 8종 action 커버 (approve/reject/cancel/start/submit_return/approve_return/reject_return + lender 계열) | 코드 확인: switch case 존재 |
| M11 | Feature Flag ON (`isNextStepPanelEnabled()=true`) 시 `LegacyActionsBlock` 미렌더 | 코드 확인: 삼항 분기 |
| M12 | Feature Flag OFF 시 기존 UI 행위 변경 없음 | 수동 QA: flag off → legacy 경로 동작 |
| M13 | `setQueryData` 신규 호출 0 | `grep -n "setQueryData" <두 파일>` = 0 hit |
| M14 | `status === '` 직접 비교 신규 추가 0 (LegacyActionsBlock 내부 기존 비교는 허용) | `git diff` 결과에서 `^\+.*status\s*===\s*['"]` 매칭 0 |
| M15 | `CheckoutAction` 타입 import는 `@equipment-management/schemas`에서만 | `grep -n "import.*CheckoutAction" CheckoutDetailClient.tsx` → 경로 `@equipment-management/schemas` 만 매칭 |
| M16 | Design token import는 `@/lib/design-tokens` 경유 (로컬 상수 금지) | `ELEVATION_TOKENS\|TYPOGRAPHY_TOKENS\|SPACING_RHYTHM_TOKENS\|CHECKOUT_ROW_TOKENS\|NEXT_STEP_PANEL_TOKENS` 참조 시 경로 `@/lib/design-tokens` 일치 |
| M17 | env 키 양쪽 파일에 존재 | `grep -l "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" apps/frontend/.env.local apps/frontend/.env.example` = 2 파일명 출력 |
| M18 | `isNextStepPanelEnabled()` 헬퍼 경유만 사용 — 두 파일에서 `process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL` 직접 참조 0 | `grep -n "process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" <두 파일>` = 0 hit |
| M19 | Dialog JSX 블록(start/reject/approveReturn/rejectReturn/cancel) + HandoverQRDisplay 원형 유지 | diff 라인수 ±10 이내 (추출 이동은 허용) |
| M20 | 두 파일 외에 변경 없음 (확인용 파일 3개 제외) | `git diff --name-only \| grep -v '^\\.claude/'` = 정확히 2개 |

---

## SHOULD Criteria (실패 시 tech-debt 등록 후 통과)

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `handleNextStepAction`이 `borrower_approve`/`borrower_reject` action도 safe no-op으로 처리 | `checkout-fsm-borrower-actions` |
| S2 | Flag 상시화 후속 PR에서 `RentalFlowInline` 함수 + `RENTAL_FLOW_INLINE_TOKENS` + `i18n.checkouts.rentalFlow.*` 제거 티켓 등록 | `checkout-legacy-rental-flow-cleanup` |
| S3 | Flag 상시화 후속 PR에서 `components/checkouts/NextStepPanel.tsx` legacy 파일 삭제 티켓 등록 | `checkout-legacy-next-step-panel-cleanup` |
| S4 | CheckoutGroupCard의 compact 패널에 `onActionClick`/`isPending` 연결 (인라인 승인 축약) | `checkout-group-card-fsm-actions` |
| S5 | floating 패널 action 클릭 → FSM 전용 Dialog 도입 검토 | `checkout-fsm-dedicated-dialogs` |
| S6 | Playwright 스모크: flag on/off 비교 시나리오 추가 | `checkout-fsm-e2e-smoke` |
| S7 | `isAnyNextStepMutationPending` useMemo 최적화 | 경미함 — 생략 가능 |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'

# 2. MUST grep 번들
grep -n "@/components/shared/NextStepPanel" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx

grep -n "@/components/checkouts/NextStepPanel" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 0 hit

grep -n 'variant="compact"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
grep -n 'variant="floating"' apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx

grep -n "function LegacyActionsBlock\|const LegacyActionsBlock" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx

grep -nE "function renderActions|const renderActions" \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 0 hit

grep -n "setQueryData\|process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx
# 기대: 0 hit

grep -l "NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL" \
  apps/frontend/.env.local apps/frontend/.env.example
# 기대: 2 파일명

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 2
```

---

## Action → Handler 전체 매핑 (M10 기준)

| Action | Handler |
|--------|---------|
| `approve` | `approveMutation.mutate()` |
| `reject` | `setDialogState({reject: true})` 또는 setRejectDialogOpen |
| `cancel` | `setDialogState({cancel: true})` 또는 setCancelDialogOpen |
| `start` | `setDialogState({start: true})` 또는 setStartDialogOpen |
| `lender_check` | `router.push(\`/checkouts/${id}/check\`)` |
| `borrower_receive` | `router.push(\`/checkouts/${id}/check\`)` |
| `mark_in_use` | `router.push(\`/checkouts/${id}/check\`)` |
| `borrower_return` | `router.push(\`/checkouts/${id}/check\`)` |
| `lender_receive` | `router.push(\`/checkouts/${id}/check\`)` |
| `submit_return` | `router.push(\`/checkouts/${id}/return\`)` |
| `approve_return` | `approveReturnMutation.mutate()` 또는 setApproveReturnDialogOpen |
| `reject_return` | `setDialogState({rejectReturn: true})` 또는 setRejectReturnDialogOpen |
| `borrower_approve` | no-op (SHOULD S1) |
| `borrower_reject` | no-op (SHOULD S1) |

---

## Acceptance

루프 완료 조건 = 위 MUST 20개 모두 PASS.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.
