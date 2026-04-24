---
slug: legacy-actions-block-removal
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action, checkout-descriptor-phase-fields, checkout-meta-fail-closed]
sprint: 1
sprint_step: 1.4
---

# Contract: Sprint 1.4 — `LegacyActionsBlock` 삭제 + `isNextStepPanelEnabled` default ON + C-1 권한 판정 불일치 해소

## Context

V2 리뷰 F-1 (P0) + C-1 (P0) 지적:

1. **F-1**: `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` L462-663의 `LegacyActionsBlock`에 11개의 if 분기 하드코딩. `CheckoutStatus` enum 추가/삭제 시 TypeScript 완전성 검사 불가.
2. **C-1**: 목록은 `checkout.meta?.availableActions?.canApprove ?? canApprove` 경유 판정, 상세는 `can(Permission.APPROVE_CHECKOUT)` 직접 호출(L114). 같은 checkout을 **목록과 상세에서 동시에 보면 권한 판정이 갈림**. 단일 descriptor 소스 수렴만이 해법.

사용자 결정(2026-04-24): `isNextStepPanelEnabled` default ON 후 **1 스프린트 유예** → flag 자체 제거. 본 contract는 flag default ON + LegacyActionsBlock 실제 삭제 + C-1 `can(Permission.*)` 제거까지 **원자적 수행**.

**전제 (필수)**:
- Sprint 1.1 완료 — 서버가 모든 응답에서 `meta.availableActions` + `meta.nextStep` populate 보증.
- Sprint 1.2 완료 — `NextStepDescriptor.nextStepIndex` 필드 신설 (호출부 `+1` 계산 제거 가능).
- Sprint 1.3 완료 — 목록 측 `?? false` fail-closed 전환.
- `pr5-checkout-fsm-integration.md` (완료) — LegacyActionsBlock 이미 **NextStepPanel과 병행 렌더** 구조로 마이그레이션된 상태.

---

## Scope

### 수정 대상
- `apps/frontend/lib/features/checkout-flags.ts` — `isNextStepPanelEnabled()` default 역전 (`!== 'false'`) + JSDoc에 "default ON · removal planned next sprint" 주석 추가.
- `apps/frontend/.env.local`, `apps/frontend/.env.example` — `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL`=`true` 주석 업데이트 (기본값 문서화).
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`:
  - L461-663의 `LegacyActionsBlock` 함수 선언 **완전 삭제**
  - L684의 `{!isNextStepPanelEnabled() && LegacyActionsBlock()}` 렌더 삭제
  - L706, L728, L1340의 `isNextStepPanelEnabled() && ...` 게이트 제거 (조건 없이 렌더)
  - L114-119의 `can(Permission.APPROVE_CHECKOUT)`, `can(Permission.BORROWER_APPROVE_CHECKOUT)`, `can(Permission.BORROWER_REJECT_CHECKOUT)`, `can(Permission.START_CHECKOUT)`, `can(Permission.COMPLETE_CHECKOUT)`, `can(Permission.CANCEL_CHECKOUT)` **6개 변수 선언 삭제**
  - 해당 변수 사용처는 `nextStepDescriptor.availableToCurrentUser` 또는 `checkout.meta?.availableActions?.can*` 경유로 대체 — LegacyActionsBlock 내부 사용처는 함수 삭제와 함께 자연 제거
  - `nextStepIndex={nextStepDescriptor.currentStepIndex + 1}` (L728-730) → `nextStepIndex={nextStepDescriptor.nextStepIndex ?? undefined}` (Sprint 1.2 필드 활용)
- `apps/frontend/components/checkouts/CheckoutStatusStepper.tsx` L54-56도 동일 `+1` 제거 → `descriptor.nextStepIndex ?? undefined`.

### 제거 대상 (Sprint 4와의 시점 조율)
- **이 contract에서 유지**: `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`의 `RentalFlowInline` 함수 + `RENTAL_FLOW_INLINE_TOKENS` 참조. 이유: Sprint 4.4에서 `CheckoutPhaseIndicator`로 대체될 예정이므로, flag 제거와 레이아웃 교체를 분리.
- **이 contract에서 제거**: `isNextStepPanelEnabled()` 게이트만. `RentalFlowInline` 자체는 **도달 불가(dead branch)** 상태로 남아도 Sprint 2.8(@deprecated 정리) 또는 Sprint 4.4에서 삭제.

### 수정 금지
- `packages/schemas/src/fsm/checkout-fsm.ts` — Sprint 1.1·1.2 결과물.
- 백엔드 checkouts 모듈.
- `NextStepPanel.tsx` (shared) — PR-4 납품물.
- `ApprovalDialog`, `RejectDialog`, `CancelDialog`, `StartDialog`, `ApproveReturnDialog`, `RejectReturnDialog`, `HandoverQRDisplay` — 호출부만 수정, 본체는 보존.

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint <수정 파일들>` error 0 | lint |
| M3 | `CheckoutDetailClient.tsx`에서 `LegacyActionsBlock` 문자열 0건 | `grep -c "LegacyActionsBlock" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx` = 0 |
| M4 | `CheckoutDetailClient.tsx`에서 `isNextStepPanelEnabled()` 호출 0건 (flag default ON으로 더 이상 게이트 불필요) | `grep -c "isNextStepPanelEnabled" apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx` = 0 |
| M5 | `CheckoutDetailClient.tsx`에서 `can(Permission.APPROVE_CHECKOUT\|BORROWER_APPROVE_CHECKOUT\|BORROWER_REJECT_CHECKOUT\|START_CHECKOUT\|COMPLETE_CHECKOUT\|CANCEL_CHECKOUT)` 호출 0건 (C-1 해소) | `grep -cE "can\(Permission\.(APPROVE_CHECKOUT\|BORROWER_APPROVE_CHECKOUT\|BORROWER_REJECT_CHECKOUT\|START_CHECKOUT\|COMPLETE_CHECKOUT\|CANCEL_CHECKOUT)\)"` = 0 |
| M6 | `CheckoutDetailClient.tsx`에서 `currentStepIndex + 1` 패턴 0건 | `grep -c "currentStepIndex + 1\|currentStepIndex+1"` = 0 |
| M7 | `CheckoutStatusStepper.tsx`에서 `currentStepIndex + 1` 패턴 0건 | 동일 grep |
| M8 | `descriptor.nextStepIndex` 사용처 존재 (Sprint 1.2 필드 활용) | `grep -c "nextStepIndex"` >= 2 (CheckoutDetailClient + Stepper) |
| M9 | `checkout-flags.ts`의 `isNextStepPanelEnabled`는 `process.env.NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL !== 'false'` — **default true** | 코드 확인 |
| M10 | `checkout-flags.ts` JSDoc에 "default ON · removal planned next sprint" 포함 | grep 확인 |
| M11 | `.env.example`에 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true` + 주석 "default since 2026-04-24" | grep 확인 |
| M12 | 변경 파일 = `checkout-flags.ts` + `.env.example` + `.env.local` + `CheckoutDetailClient.tsx` + `CheckoutStatusStepper.tsx` = **최대 5개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 5 |
| M13 | `CheckoutDetailClient.tsx` 라인 수 감소 ≥ 180 (LegacyActionsBlock ~200줄) | `git diff --stat` 확인 |
| M14 | 행위 회귀 없음 — Dialog 블록(ApprovalDialog 등) 원형 유지 | `git diff` 수동 검토: Dialog JSX ±5 라인 이내 |
| M15 | E2E `suite-ux/` 기존 반출 flow 테스트 전부 통과 | `pnpm --filter frontend run test:e2e -- checkouts/suite-ux` 통과 |
| M16 | FSM table test (Sprint 1.1) 여전히 통과 | `pnpm --filter schemas run test` 통과 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 다음 스프린트 예약: `isNextStepPanelEnabled` 함수 자체 제거 + env 변수 제거 | `checkout-flag-removal-final` |
| S2 | `RentalFlowInline` 함수 삭제 — Sprint 4.4와 합류 | `rental-flow-inline-removal` |
| S3 | Dialog 블록을 FSM action key 기반 dispatcher(`handleNextStepAction`)로 완전 이관 | `checkout-fsm-dialog-dispatcher` |
| S4 | `can(Permission.*)` 호출이 파일 전체에서 0건인지 재검증 (다른 목적 사용 없음 확인) | `checkout-detail-permission-audit` |
| S5 | LegacyActionsBlock 삭제로 인한 i18n 키 고아화 여부 — `checkouts.legacy.*` 있으면 정리 | `checkout-legacy-i18n-cleanup` |
| S6 | Playwright screenshot 회귀 비교 (before/after) | `checkout-detail-visual-regression` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx' \
  apps/frontend/components/checkouts/CheckoutStatusStepper.tsx \
  apps/frontend/lib/features/checkout-flags.ts

# 2. MUST grep
grep -c "LegacyActionsBlock" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
# 기대: 0

grep -c "isNextStepPanelEnabled" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
# 기대: 0

grep -cE "can\(Permission\.(APPROVE_CHECKOUT|BORROWER_APPROVE_CHECKOUT|BORROWER_REJECT_CHECKOUT|START_CHECKOUT|COMPLETE_CHECKOUT|CANCEL_CHECKOUT)\)" \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
# 기대: 0

grep -cE "currentStepIndex\s*\+\s*1" \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx' \
  apps/frontend/components/checkouts/CheckoutStatusStepper.tsx
# 기대: 0

grep -c "nextStepIndex" \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx' \
  apps/frontend/components/checkouts/CheckoutStatusStepper.tsx
# 기대: 2+

grep -n "default ON" apps/frontend/lib/features/checkout-flags.ts
# 기대: 1+ hit

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 5

# 4. E2E
pnpm --filter frontend run test:e2e -- checkouts/suite-ux
```

---

## 표현 불가 action 매핑 (handleNextStepAction 디스패처 확장 필요 여부)

`LegacyActionsBlock` 내부 11 if 분기의 action 유형과 NextStepPanel 경로 대응 확인:

| Legacy action | NextStepPanel action | 처리 |
|---|---|---|
| 승인(`approveMutation`) | `approve` | 기존 디스패처 OK |
| 반려 다이얼로그 | `reject` | OK |
| 반출취소 | `cancel` | OK |
| 반출 시작 | `start` | OK |
| 조건 확인 페이지 이동 | `lender_check` / `borrower_receive` / `mark_in_use` / `borrower_return` / `lender_receive` | OK (router.push) |
| 반납 제출 | `submit_return` | OK |
| 반납 승인 | `approve_return` | OK |
| 반납 반려 | `reject_return` | OK |
| 차용팀 1차 승인 | `borrower_approve` | OK (handleNextStepAction S1) |
| 차용팀 1차 반려 | `borrower_reject` | OK |
| QR drawer 트리거 | — | 별도 `QrDrawerTrigger` 컴포넌트 Sprint 4.5.6에서 처리. 본 contract 범위 아님 |

→ 기존 `handleNextStepAction` 디스패처가 이미 13 action 모두 커버(`pr5-checkout-fsm-integration.md` M10 참조). 추가 구현 없음.

---

## Rollback Plan

- PR 단위 revert 가능. `isNextStepPanelEnabled`이 env로 off 가능하지만, LegacyActionsBlock이 삭제되었으므로 flag를 `false`로 돌려도 **렌더 없음 상태가 됨** (complete disable).
- 긴급 시 `git revert <본 PR commit>`으로 LegacyActionsBlock 복원.
- 그 외: hotfix용 env 변수 `NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=false`는 **이제 무효** (default ON, LegacyActionsBlock 삭제).

---

## Acceptance

루프 완료 조건 = MUST 16개 모두 PASS + E2E suite-ux 전체 회귀 통과.
F-1 + C-1 동시 해소: 상세 페이지가 descriptor 단일 소스만 경유 → 목록/상세 권한 판정 일치.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1~1.3 **선행 필수**.
- Sprint 2.8 · `@deprecated` 토큰 실제 제거 — `RENTAL_FLOW_INLINE_TOKENS` 호출부(Dead branch)가 남아있으면 여기서 정리.
- Sprint 4.4 · `rental-phase-ui.md` — `RentalFlowInline` 컴포넌트 자체 삭제 + `CheckoutPhaseIndicator` 교체.
- 후속 spring(6차) · `checkout-flag-removal-final` — `isNextStepPanelEnabled` 함수 + env 변수 자체 제거.
