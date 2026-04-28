# Rental Checkout Approval Workflow Fix — Architecture-Level

**Slug**: `rental-approval-workflow-fix`
**Date**: 2026-04-28
**Mode**: 2 (harness)
**Domain**: checkouts FSM × approvals × frontend action mapping × i18n × server-driven UI

---

## Context

UL-QP-18 의 대여(rental) 반출은 2단계 승인을 요구한다:

```
pending  ──borrower_approve──▶  borrower_approved  ──approve──▶  approved
            (사용 부서 TM)                          (관리 부서 TM)
            scope: requester team                   scope: lender team
            requires: BORROWER_APPROVE_CHECKOUT     requires: APPROVE_CHECKOUT
```

UI 가 *역할/상태/스코프* 에 맞는 액션 버튼을 정확히 노출하지 못해 다음 4가지 증상이 dev log 에 동시 발생.

| # | 증상 | HTTP | 원인 위치 |
|---|------|------|----------|
| 1 | `Action "approve" not allowed from status "pending" (purpose: rental)` | 400 | 평택랩(lender) TM 이 `OUTGOING` 승인 탭에서 버튼 클릭 → `/approve` 직격. FSM 은 `pending+rental` 에 `borrower_approve` 만 허용. |
| 2 | `enforceScopeForBorrower` cross-site denial | 403 | 평택랩(lender) TM 이 `pending` 상세 페이지의 `borrower_approve` 버튼 클릭 → `/borrower-approve` → 백엔드가 borrower 스코프로 거부 (requester=수원랩). |
| 3 | `[FSM drift] meta missing <id>` | warn | `findAll` 응답이 `meta.availableActions` / `meta.nextStep` 를 채우지 않음. `findOne` 만 채움. |
| 4 | `MISSING_MESSAGE: errors.UNKNOWN_ERROR.actionLabel` (ko) | warn | `errors.json` 양쪽에 `actionLabel` 키 부재 + `ERROR_MESSAGES[UNKNOWN_ERROR]` 도 부재. `t.raw()` 가 try/catch 전 next-intl warning 발생. |

### 사용자 동작 시나리오 (재현)

수원랩 TE 가 평택랩 장비로 rental 신청 → `pending`. 양쪽 TM 이 모두 `technical_manager` 역할이라 `getPermissions(role)` 결과가 동일하다 (`APPROVE_CHECKOUT + BORROWER_APPROVE_CHECKOUT` 둘 다 보유).

1. 평택랩 TM 가 승인 관리 페이지(OUTGOING 탭) 진입 → `getPendingOutgoing` 이 `statuses=pending&direction=outbound` 로 조회 → 평택랩이 lender 인 rental 이 outbound case 3 으로 노출됨 → `pending` 행이 그대로 표시.
2. 평택랩 TM 클릭 → `approvalsApi.approve('outgoing', id)` → `checkoutApi.approveCheckout(id)` → `/api/checkouts/:id/approve` → 백엔드 `assertFsmAction('approve', pending, rental)` 거부 → **400** (증상 1).
3. 평택랩 TM 가 상세 페이지로 진입 → `useCheckoutNextStep` 이 `getNextStep(pending, rental, [APPROVE, BORROWER_APPROVE, …])` 호출 → permitted 우선순위에 따라 `borrower_approve` 가 첫 매칭 → `nextAction='borrower_approve'` + `availableToCurrentUser=true` 반환 (FSM 에는 lender team identity-rule 없음).
4. 평택랩 TM 가 `borrower_approve` 버튼 클릭 → `/borrower-approve` → 백엔드 `enforceScopeForBorrower(checkout, requesterSite=수원랩)` → 평택랩 사용자라 거부 → **403** (증상 2).

### 근본 원인 (root cause synthesis)

> **FSM `getNextStep` 의 권한 모델이 "역할이 가진 permission"만 고려하고 "현재 행위자가 해당 transition 의 actor 측 (lender vs borrower) 인지"는 고려하지 않는다.** 또한 동일 역할(technical_manager) 이 lender·borrower 양측 permission 을 모두 보유하므로 FSM 단독으로는 분기 불가능. 게다가 `findAll` 이 meta(availableActions+nextStep) 를 채우지 않아 list 화면은 FSM 권위가 사라진 상태에서 하드코딩된 `approveCheckout` 으로 동작. 결과적으로 (a) FSM-actor identity 미반영, (b) findAll meta 누락, (c) approvals UI 의 purpose-blind 매핑, (d) i18n key 누락 — 4 개의 갭이 한꺼번에 작동.

---

## Findings

### F1 · Rental FSM 전이표 (현재 SSOT)

`packages/schemas/src/fsm/checkout-fsm.ts` `CHECKOUT_TRANSITIONS` 발췌 (rental 만):

| from | action | to | requires | nextActor | scope |
|------|--------|-----|----------|-----------|-------|
| `pending` | `borrower_approve` | `borrower_approved` | `borrower_approve:checkout` | approver | borrower (requester team) |
| `pending` | `borrower_reject` | `rejected` | `borrower_reject:checkout` | none | borrower |
| `pending` | `cancel` | `canceled` | `cancel:checkout` | none | requester |
| `borrower_approved` | `approve` | `approved` | `approve:checkout` | logistics | lender (lenderTeam) |
| `borrower_approved` | `reject` | `rejected` | `reject:checkout` | none | lender |
| `borrower_approved` | `cancel` | `canceled` | `cancel:checkout` | none | requester |
| `approved` | `lender_check` | `lender_checked` | `start:checkout` | borrower | lender |
| `lender_checked` | `borrower_receive` | `borrower_received` | `start:checkout` | lender | borrower |
| `borrower_received` | `mark_in_use` | `in_use` | `start:checkout` | borrower | borrower |
| `in_use` | `borrower_return` | `borrower_returned` | `complete:checkout` | lender | borrower |
| `borrower_returned` | `lender_receive` | `lender_received` | `complete:checkout` | approver | lender |
| `lender_received` | `submit_return` | `returned` | `complete:checkout` | approver | lender |
| `returned` | `approve_return` | `return_approved` | `approve:checkout` | none | lender |

전이표 자체는 **올바르다**. 문제는 소비자 코드.

### F2 · Role × Status × Action matrix (의도된 행동)

| Status | 평택랩 TM (lender) | 수원랩 TM (borrower) | 신청자 (requester=수원랩 TE) | 시스템 외 |
|--------|-------------------|---------------------|---------------------------|-----------|
| `pending` | _대기_ ("borrower 대기 중") | **borrower_approve / borrower_reject** | cancel | – |
| `borrower_approved` | **approve / reject** | _대기_ | cancel | – |
| `approved` | **lender_check** | _대기_ | – | – |
| `lender_checked` | _대기_ | **borrower_receive** | – | – |
| `borrower_received` | – | **mark_in_use** | – | – |
| `in_use` | – | **borrower_return** | – | – |
| `borrower_returned` | **lender_receive** | _대기_ | – | – |
| `lender_received` | **submit_return** | _대기_ | – | – |
| `returned` | **approve_return / reject_return** | _대기_ | – | – |

"lender", "borrower" identity 는 **현재 사용자의 team 이 lenderTeamId / requesterTeamId 와 일치하는가** 로 결정. 두 TM 이 같은 role 이라도 team 으로 분리 가능.

### F3 · 시스템이 깨지는 지점 (gap analysis)

| Gap ID | File:Line | 설명 |
|--------|-----------|------|
| **G1** (FSM-actor) | `packages/schemas/src/fsm/checkout-fsm.ts:614-732` | `canPerformAction` / `getNextStep` 가 **actor identity** (lenderTeam vs requesterTeam vs userTeam) 를 받지 않음 → permission 만으로 transition 매칭 → 동일 역할 양측 permission 보유 시 첫 매칭 transition 노출. |
| **G2** (BE meta findAll) | `apps/backend/src/modules/checkouts/checkouts.service.ts:725-734` | `findAll` 응답 sortedItems 에 `meta.availableActions` / `meta.nextStep` 미주입. `findOne` 만 채움. → FE warnMetaDrift 트리거. |
| **G3** (BE availableActions 부족) | `apps/backend/src/modules/checkouts/checkouts.service.ts:1402-1434` | `CheckoutAvailableActions` 에 `canBorrowerApprove` / `canBorrowerReject` 필드 부재. lender team identity-rule 만 `canApprove` 에 적용, borrower team identity-rule 미적용. |
| **G4** (FE approvals dispatch) | `apps/frontend/lib/api/approvals-api.ts:802-829` | `approve('outgoing', id)` 가 status/purpose 무관하게 `checkoutApi.approveCheckout` 호출. rental+pending 인 경우 borrower_approve 가 필요한데 식별 못함. |
| **G5** (FE list UX) | `apps/frontend/components/checkouts/CheckoutGroupCard.tsx:222-235` | `handleRowAction(action)` 의 `case 'approve'` 와 `case 'borrower_approve'` 둘 다 `approveMutation` 으로 매핑 → `/approve` 발사. |
| **G6** (FE next-step fallback risk) | `apps/frontend/hooks/use-checkout-next-step.ts:44-52` | 서버 nextStep 미존재 시 client-side `getNextStep` 으로 fallback — G1 결함이 그대로 노출됨. |
| **G7** (Approvals query coverage) | `apps/frontend/lib/api/approvals-api.ts:498-525` | OUTGOING 탭이 `pending` 만 조회 → rental `borrower_approved` (lender 차례) 누락. **반대로 `pending` 인데 borrower 차례인 rental 이 lender 의 OUTGOING 에 잘못 노출.** → outgoing 의미가 흐려짐. |
| **G8** (i18n actionLabel) | `apps/frontend/messages/{ko,en}/errors.json:189/201` | `UNKNOWN_ERROR.actionLabel` 키 부재. `getLocalizedErrorInfo` 의 `t.raw()` 호출이 next-intl `MISSING_MESSAGE` warning 발생. |
| **G9** (BorrowerApproved reachable check) | `apps/backend/src/modules/checkouts/checkouts.service.ts:893-913` | `getPendingChecksCount` 가 `pending` 상태를 borrower 의 "내 차례" 에 포함하지 않음 → 신규 rental 신청 시 borrower TM 이 nav 배지로 알 수 없음. |

---

## Recommended Approach (Phased)

진행 원칙:
- **수술적 변경**: SSOT FSM 본체(`canPerformAction`/`getNextStep` 기존 시그니처) 는 호환성 유지하되, **선택적 actor context** 파라미터로 확장.
- **defense in depth 보존**: backend scope guard (`enforceScopeForBorrower/Lender`) 그대로. UI 사전 차단은 **2차 방어**, 서버가 1차.
- **Server-driven UI 강화**: meta(availableActions + nextStep) 를 `findAll/findOne` 양쪽 응답 항상 동봉. FE 는 서버 권위만 신뢰, role/status 직접 분기 금지.

### Phase A — SSOT 확장: actor identity 를 FSM 권위에 합류

**A-1.** `packages/schemas/src/fsm/checkout-fsm.ts`
- 새 타입: `CheckoutActorContext` (선택 입력, undefined 시 기존 동작 유지)
  ```ts
  interface CheckoutActorContext {
    userTeamId?: string | null;
    lenderTeamId?: string | null;
    requesterTeamId?: string | null;
  }
  ```
- 새 매핑: `TRANSITION_ACTOR_SIDE: Record<CheckoutAction, 'lender' | 'borrower' | 'requester' | 'any'>` (모든 action 에 대해 어느 측 actor 인지 SSOT 선언)
- `canPerformAction` 시그니처 확장: `(checkout, action, userPermissions, actorCtx?)` — actorCtx 제공 시 transition 의 `actor side` 와 `userTeamId === {lenderTeamId|requesterTeamId}` 일치 검증. 불일치 시 `{ ok: false, reason: 'actor_team_mismatch' }`.
- `getNextStep` 시그니처 확장 동일. 매칭 우선순위: (1) permission OK + actor team OK, (2) permission OK + actor team mismatch → `availableToCurrentUser=false, blockingReason='actor_team'`, (3) permission 없음 → 기존 `'permission'`.
- `NextStepDescriptorSchema` 의 `blockingReason` enum 에 `'actor_team'` 추가.
- 기존 280 row table test (`fsm/__tests__/checkout-fsm.table.test.ts`) 와 fixture 가 actorCtx 없이 호출되므로 **호환성 유지**. 신규 actorCtx 시나리오용 별도 테이블 추가.

**A-2.** `packages/schemas/src/fsm/checkout-fsm.ts` - rental_phase descriptor
- 기존 i18n key 가 actor side 별로 안내 메시지 분기 가능하도록, transition 의 `hintKey` SSOT 유지하되, 추가 `waitingActor` hint key 도입 (이미 `waitingApprover` 가 있음 — 새 케이스: `pendingBorrowerWait` for lender pov in pending).

### Phase B — Backend: scope guard 정합 + meta 항상 응답

**B-1.** `apps/backend/src/modules/checkouts/checkouts.service.ts`
- `assertFsmAction` 호출처에 actorCtx 합류:
  - `approve` (1660~): `userTeamId, lenderTeamId, requesterTeamId` 추출 후 `canPerformAction(checkout, 'approve', permissions, actorCtx)` 호출. 기존의 `lenderTeamId !== userTeamId` 거부는 유지 (이중 게이트). 단 메시지/code 통일.
  - `borrowerApprove` / `borrowerReject` 동일.
  - `reject`, `rejectReturn`, `approveReturn`, `start`, `cancel`, `submitConditionCheck`: 동일 패턴 적용.
- `calculateAvailableActions` 확장:
  - 신규 필드: `canBorrowerApprove`, `canBorrowerReject` (이전 G3).
  - 모든 boolean 을 `canPerformAction(..., actorCtx)` 결과의 `ok` 사용 → lender/borrower team identity 자동 강제. 기존 인라인 `lenderTeamOk` 분기 제거 (DRY).
- `findAll` 응답 매핑(line 708-723) 에서 each item 에 `meta` 주입:
  ```ts
  return {
    ...item,
    equipment: ...,
    user: ...,
    meta: {
      availableActions: this.calculateAvailableActions(item, userPermissions, userTeamId, ...actorCtx),
      nextStep: this.buildNextStep(item, userPermissions, actorCtx),
    },
  };
  ```
  - `findAll` 시그니처에 `userPermissions` / `userCtx` 전달 — 컨트롤러 `findAll` 가 이미 `req.user.permissions` 를 가지고 있으므로 forward.
- `getPendingChecks` 결과에도 동일 meta 주입 (사용처: nav 배지/pending-checks 페이지).
- `getPendingChecksCount` 와 `getPendingChecks` 의 borrower 측 status 필터에 **`pending`** 추가 (rental, requesterTeamId === userTeamId, role='borrower'). G9 해결.

**B-2.** `apps/backend/src/modules/checkouts/checkouts.service.ts`
- `enforceScopeForBorrower` / `enforceScopeFromCheckout` 시그니처/로직 변경 **없음**. fail-closed 보존.
- DTO `CheckoutAvailableActions` 인터페이스(line 86~) 에 신규 필드 추가 → 자동 typescript 동기화 강제.

**B-3.** `apps/backend/src/modules/approvals/approvals.service.ts:160-242` (G7)
- `outgoingCheckouts` 카운트 쿼리에 `purpose != rental OR status != pending` 필터 추가? **Open Question 1** 참조 — 옵션 평가 후 결정.

### Phase C — Frontend: server-driven action mapping 일원화

**C-1.** `apps/frontend/lib/api/checkout-api.ts`
- `CheckoutAvailableActions` 인터페이스 확장: `canBorrowerApprove`, `canBorrowerReject` 추가 (BE B-2 와 sync).
- `warnMetaDrift` 호출 위치 확인: list/detail/pending-checks 모두 — 이제 BE 가 항상 채우므로 drift 0 보장.

**C-2.** `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
- `handleRowAction` (line 222-235): `case 'approve'` 와 `case 'borrower_approve'` 분리 — 후자는 `borrowerApproveMutation` 으로 dispatch.
- `borrowerApproveMutation` 신규 훅 추가 (이전 detail page 와 동일 패턴, `approveMutation` 옆).
- `canApproveBulk` 계산은 `canApprove` 만 사용 — `pending` 인데 `canBorrowerApprove` 인 행은 bulk approve 대상이 아님 (UX 단계 분리).
- 동시에: 더 이상 `descriptor.nextAction` 을 직접 보지 않고, **`checkout.meta?.availableActions`** 만 보고 행별 노출 결정 — descriptor 는 NextStepPanel 표시용으로만.

**C-3.** `apps/frontend/lib/api/approvals-api.ts`
- `approve(category, id, ...)` 의 `case 'outgoing'` 분기에 status/purpose 기반 sub-dispatch:
  - `originalData.purpose === 'rental' && status === 'pending'` → `checkoutApi.borrowerApproveCheckout`
  - 그 외 → `checkoutApi.approveCheckout`
- `reject` 도 동일 분기 (`borrowerRejectCheckout`).
- 더 안전한 대안 (선호): **server-driven** — `originalData.meta.availableActions.canBorrowerApprove` 가 true 면 borrower endpoint, 아니면 approve endpoint. → BE meta 가 신뢰 소스. **Open Question 2** 참조.
- `getPendingOutgoing` 쿼리: `direction=outbound` 만으로는 G7 잔존 — **백엔드에서 actionable view 만 반환하는 새 endpoint** 또는 **frontend 에서 meta 기반 필터링**. **Open Question 3** 참조.

**C-4.** `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
- `handleNextStepAction` (line 411-450) 은 이미 `borrower_approve` / `borrower_reject` 를 분리 dispatch 중 — 변경 없음.
- 단 disabled 사유 표시 (descriptor.blockingReason='actor_team') 시 i18n key `checkouts.fsm.blocked.actor_team` 추가 (Phase D).

**C-5.** `apps/frontend/components/shared/NextStepPanel.tsx`
- `descriptor.blockingReason` 분기에 `actor_team` 케이스 — 기존 `'permission'`, `'role_mismatch'` 와 동일 처리 (i18n key 변경만).

**C-6.** `apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx`, `ApprovalRow.tsx` (해당 시)
- meta-driven 노출 점검: 모든 행/카드가 `meta.availableActions.canX` 만 신뢰하도록 통일 (role 리터럴 분기 0 — verify-ssot 강제).

### Phase D — i18n 보강 + descriptor drift 0

**D-1.** `apps/frontend/messages/ko/errors.json` + `apps/frontend/messages/en/errors.json`
- `UNKNOWN_ERROR` 객체에 `actionLabel` 키 추가:
  - ko: `"actionLabel": "다시 시도"` (또는 빈 문자열 — equipment-errors 의 `severity:'error'` 패턴 검토)
  - en: `"actionLabel": "Retry"`
- `apps/frontend/lib/errors/equipment-errors.ts:332-337` `ERROR_MESSAGES[UNKNOWN_ERROR]` 에도 `actionLabel: '다시 시도'` 추가 (fallback 일관성).
- 동일 패턴 일괄 점검: `getLocalizedErrorInfo` 가 `t.raw('${code}.actionLabel')` 호출하는 모든 code 에 대해 ko/en parity 검증 (verify-i18n 으로 자동화).

**D-2.** `apps/frontend/messages/{ko,en}/checkouts.json`
- `fsm.blocked.actor_team` 신규 키 추가 (lender/borrower team mismatch 문구). 기존 `permission`, `role_mismatch` 와 parity.
- `fsm.hint.pendingBorrowerWait` 추가 (lender pov 에서 pending 상태일 때 "사용 부서 1차 승인 대기 중").

**D-3.** **schema-level guard**: `NextStepDescriptorSchema` 가 응답에 항상 포함되어야 함을 강제하기 위해 `CheckoutResponseDto` (backend) 의 meta 필드를 **required** 로 (옵셔널 → 필수) — `ZodResponse` interceptor 가 자동 검증.
- 단 `CheckoutWithMeta` 타입과 `Checkout` 타입을 분리 유지 (현재도 분리됨). list/detail 양쪽 다 `CheckoutWithMeta` 반환.

### Phase E — Verification scaffolding

**E-1.** `packages/schemas/src/fsm/__tests__/checkout-fsm.test.ts`
- 신규 테스트 추가: actorCtx 시나리오 — lender/borrower team 일치/불일치 매트릭스. 평택랩(lender) ↔ 수원랩(borrower) ↔ 다른 팀 3종.
- table test (`checkout-fsm.table.test.ts`) 에 actorCtx 케이스 옵셔널 컬럼 추가.

**E-2.** `apps/backend/src/modules/checkouts/__tests__/checkouts.service.spec.ts`
- 새 테스트:
  - `findAll` 응답 모든 item 에 `meta.availableActions` + `meta.nextStep` 존재 검증.
  - `calculateAvailableActions` 의 lender/borrower team identity 분기 (TM lender → canBorrowerApprove=false, TM borrower → canBorrowerApprove=true).
  - `approve` 가 `pending+rental` 에서 400 (`INVALID_TRANSITION`) — 기존 동작 회귀 가드.
  - `borrowerApprove` 가 lender team 사용자에게 403 — 기존 동작 회귀 가드.
- `getPendingChecks` 가 borrower 측에 `pending` rental 포함하는지 검증 (G9).

**E-3.** `.claude/skills/verify-checkout-fsm/SKILL.md`
- 신규 Step 추가 (예: Step 38): "actorCtx + canPerformAction signature alignment" — `canPerformAction` 호출처가 actorCtx 전달 / `calculateAvailableActions` 가 모든 boolean 을 actorCtx 경유하는지 검증.
- Step 39: "findAll meta 항상 채움" — `checkouts.service.ts findAll` 결과 매핑에 `meta:` 가 포함되는지 grep.
- Step 40: "approvals dispatch FSM-aware" — `approvals-api.ts approve('outgoing', …)` 가 `originalData.meta` 또는 status/purpose 기반 분기 수행하는지.

**E-4.** `.claude/skills/verify-i18n/SKILL.md`
- 신규 Step: `getLocalizedErrorInfo` 가 사용하는 모든 EquipmentErrorCode 의 `actionLabel` 키 ko/en 양쪽 parity 자동 스캔.

**E-5.** `apps/frontend/tests/e2e/features/checkouts/` (있다면)
- 새 시나리오 (또는 기존 update): 수원랩 TE rental 신청 → 수원랩 TM borrower_approve → 평택랩 TM approve → lender_check → … → return_approved 까지 전 6단계.
- 평택랩 TM 이 `pending` 상세에서 `borrower_approve` 버튼 disabled + 사유 표시 검증.

---

## Critical Files

| Path | After change |
|------|--------------|
| `packages/schemas/src/fsm/checkout-fsm.ts` | `canPerformAction` / `getNextStep` 가 옵셔널 `CheckoutActorContext` 받음. `TRANSITION_ACTOR_SIDE` SSOT 추가. `blockingReason` enum 에 `'actor_team'`. |
| `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` | actorCtx 옵셔널 컬럼 추가 + 신규 매트릭스 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | `assertFsmAction`/`buildNextStep`/`calculateAvailableActions` 가 actorCtx 사용. `findAll` 결과에 meta 항상 주입. `CheckoutAvailableActions` 에 `canBorrowerApprove`/`canBorrowerReject`. `getPendingChecks(Count)` 에 borrower pending 포함. |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts` | `findAll` 가 service 에 `userPermissions`+`userTeamId`+ team scope 전달 (이미 일부 보유) |
| `apps/backend/src/modules/checkouts/dto/checkout-response.dto.ts` | meta 필드 required 화 |
| `apps/backend/src/modules/approvals/approvals.service.ts` | OUTGOING 카운트가 actor-actionable 만 집계 (Open Q1 결정 후) |
| `apps/frontend/lib/api/checkout-api.ts` | `CheckoutAvailableActions` 확장 |
| `apps/frontend/lib/api/approvals-api.ts` | `approve('outgoing')` / `reject('outgoing')` 가 server-driven sub-dispatch (meta 기반) |
| `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` | `handleRowAction` 의 borrower_approve 분리. row visibility 는 `meta.availableActions` 만 사용. |
| `apps/frontend/hooks/use-checkout-next-step.ts` | 서버 nextStep 우선 (변경 없음) — 단 BE 가 항상 채워주므로 fallback 경로 거의 미사용 |
| `apps/frontend/components/shared/NextStepPanel.tsx` | `blockingReason: 'actor_team'` 분기 |
| `apps/frontend/messages/ko/errors.json` + `en/errors.json` | `UNKNOWN_ERROR.actionLabel` 추가 |
| `apps/frontend/messages/ko/checkouts.json` + `en/checkouts.json` | `fsm.blocked.actor_team`, `fsm.hint.pendingBorrowerWait` |
| `apps/frontend/lib/errors/equipment-errors.ts` | `ERROR_MESSAGES[UNKNOWN_ERROR].actionLabel` 추가 |
| `.claude/skills/verify-checkout-fsm/SKILL.md` | Step 38-40 추가 |
| `.claude/skills/verify-i18n/SKILL.md` | error actionLabel parity step |
| `apps/frontend/tests/e2e/features/checkouts/` | 2단계 승인 + lender wait disabled e2e |

대략 **15-18 파일 수정**, 신규 파일 **0** (기존 SSOT 확장으로 충분).

---

## User Decisions (2026-04-28 confirmed)

- **Q1 = A**: rental+pending 행을 OUTGOING 탭에 노출 + disabled + 사유 표시. KPI 카운트는 actionable만 BE에서 별도 집계.
- **Q2 = A**: approvals dispatch는 server meta(`availableActions.canBorrowerApprove`) 기반.
- **Q3 = A**: FSM 본체(`canPerformAction`/`getNextStep`)에 옵셔널 `CheckoutActorContext` 합류.

---

## Open Questions for User

### Q1. OUTGOING 승인 탭의 rental+pending 처리 방식 (G7)

평택랩 TM 의 OUTGOING 탭에서 "수원랩이 빌려가는 rental 의 pending" 행을 어떻게 다룰 것인가?

- **Option A — 노출하되 disabled + 사유 표시 (선호)**: row 가 보이지만 액션 버튼은 disabled, NextStepPanel 이 "사용 부서 1차 승인 대기 중" 표시. 백로그 가시성 유지. (memory: "Disabled + 사유 표시 우선")
- **Option B — 노출 안 함**: outgoing 카운트/리스트에서 제외. lender 의 액션 큐를 "지금 내가 처리할 것" 으로만 좁힘. KPI 단순화. 단 lender 가 "빌리는 측이 아직 1차 승인 안 함" 사실을 모름.
- **Option C — 별도 sub-tab 분리**: OUTGOING > "내 차례" / "대기 중" 2 분할. UI 복잡도 ↑.

A 가 시니어 표준 (빈 화면보다 정보 밀도 + 사유 표시) 이지만, KPI 카드의 "outgoing 카운트" 는 actionable 만 세는 것이 정직함. **추천: A + KPI 카운트는 actionable 만 (BE 에서 분리 집계)**.

### Q2. Approvals dispatch 의 FSM 분기 방식 (C-3)

- **Option A — server meta 기반 (선호)**: `item.originalData.meta.availableActions.canBorrowerApprove ? borrower : approve`. BE 권위 단일.
- **Option B — purpose+status 기반 client-side**: `purpose==='rental' && status==='pending' → borrower`. BE 응답 구조에 의존하지 않으나 FSM 룰 중복.

A 가 SSOT 원칙. 단 meta 항상 포함 (Phase B-1) 이 선결조건.

### Q3. `canPerformAction` actor identity 통합 깊이 (A-1)

- **Option A — FSM 본체에 actorCtx 합류 (선호)**: 단일 권위. BE/FE 양쪽이 동일 함수 사용 → drift 0. 280 row table test 호환성 유지 (옵셔널 파라미터).
- **Option B — service-layer 분리 가드**: FSM 은 permission 만, service 가 별도 `assertActorIdentity` 호출. 명시적이지만 호출자가 깜빡할 위험.

A 가 시니어 표준 (single source of truth). 단 FSM 시그니처 확장 영향 점검 필요 — verify-checkout-fsm Step 28-37 가 모두 신호.

---

## Verification Steps

```bash
# 0) 사전 안전: deps drift
pnpm -w install --frozen-lockfile

# 1) 타입 체크 (BE+FE)
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 2) lint
pnpm --filter backend run lint
pnpm --filter frontend run lint

# 3) FSM 단위 + table test (회귀)
pnpm --filter @equipment-management/schemas run test

# 4) BE checkouts/approvals
pnpm --filter backend run test -- --testPathPattern='checkouts|approvals'

# 5) skill verifications
# verify-checkout-fsm  (38-40 신규 스텝 포함)
# verify-ssot          (canBorrowerApprove role 리터럴 0 강제)
# verify-i18n          (UNKNOWN_ERROR.actionLabel parity + 신규 fsm.blocked.actor_team)
# verify-cas           (approve/borrowerApprove CAS 보존)
# verify-security      (enforceScopeForBorrower fail-close 유지)
# verify-frontend-state(setQueryData 0 / useState 이중관리 0)

# 6) review-architecture (multi-layer)
# 7) E2E (시나리오)
pnpm --filter frontend run test:e2e -- checkouts
# 시나리오: 수원랩 TE 신청 → 수원랩 TM borrower_approve → 평택랩 TM approve → lender_check → borrower_receive → mark_in_use → borrower_return → lender_receive → submit_return → approve_return

# 8) Browser smoke (mcp__playwright-test)
# - 평택랩 TM 로그인 → /admin/approvals?tab=outgoing → rental+pending 행 disabled + 사유 표시
# - 평택랩 TM /checkouts/<id> 진입 → NextStepPanel "사용 부서 1차 승인 대기" + 모든 액션 버튼 disabled
# - 수원랩 TM 로그인 → 동일 rental → borrower_approve 활성, 클릭 성공 → status borrower_approved
# - 평택랩 TM 새로고침 → approve 활성, 클릭 성공 → status approved

# 9) i18n parity 자동
node scripts/check-i18n-call-sites.mjs --all
```

---

## SSOT / 하드코딩 / 보안 / 접근성 체크리스트

- [ ] `packages/schemas/src/fsm/checkout-fsm.ts` 가 유일한 transition 권위. FE/BE 어디서도 transition 룰 재구현 0.
- [ ] role 리터럴 (`'technical_manager'` 등) frontend 분기 0. 모든 분기는 `meta.availableActions.canX` 또는 `descriptor.availableToCurrentUser`.
- [ ] `setQueryData` onSuccess 사용 0 — 기존 `useOptimisticMutation` 의 invalidate 패턴 유지.
- [ ] `enforceScopeForBorrower` / `enforceScopeFromCheckout` 보존 — 1차 게이트.
- [ ] CAS version 보존 — approve/borrowerApprove/reject 모두 `updateWithVersion`.
- [ ] `onVersionConflict` 훅으로 detail 캐시 invalidate (기존 보존).
- [ ] disabled 버튼에 `aria-label` + 사유 SR 텍스트 (`actor_team` blocked).
- [ ] live region: `role="status"` aria-live polite 유지 (NextStepPanel 기존 패턴).
- [ ] i18n parity ko/en 100% (verify-i18n 자동).
- [ ] dark mode 친화 (기존 token 사용 — 추가 색상 없음).
- [ ] feature flag: 변경이 동작 변경이 큼 → 점진 rollout 검토 (Open Q4 — 사용자 결정).
- [ ] bundle size: descriptor schema 확장은 미미 — bundle gate baseline 유지 예상.
- [ ] 관측: 새 audit event suffix 없음 (기존 `borrower_approved` 등 그대로).

---

## 회귀 위험 + 완화

| 위험 | 영향 | 완화 |
|------|------|------|
| `canPerformAction` 시그니처 확장 시 기존 호출처 깨짐 | BE 다수 + FE detail/group card | optional 파라미터 → undefined 시 기존 동작 유지. 280 row table test 가 회귀 가드. |
| `findAll` 에 meta 추가 시 응답 페이로드 ↑ | network | 1 row 당 ~200 bytes 증가, 50 페이지 → ~10KB. 무시 수준. cache TTL 동일. |
| approvals OUTGOING 카운트 변화 | UX (관리자 KPI) | Open Q1 결정 후 마이그레이션 노트 작성. |
| `useCheckoutNextStep` 의 client-side fallback 이 G1 노출 | 장애 회피 경로 | BE meta 항상 전달 → fallback 경로는 사실상 dead. 단 fallback 도 actorCtx 받도록 hook 시그니처 확장. |

---

## Sequencing (Generator 권장 순서)

1. **A-1, A-2** (FSM SSOT 확장) — 모든 후속이 의존. 단위 테스트 추가까지 한 번에.
2. **B-1, B-2** (BE 서비스 actorCtx 합류 + meta 항상 응답).
3. **B-3** (approvals 카운트 — Open Q1 결정 후).
4. **C-1** (FE 타입 sync).
5. **C-2, C-3** (FE row + approvals dispatch).
6. **C-4, C-5, C-6** (NextStepPanel + 잔여 UI).
7. **D-1, D-2, D-3** (i18n).
8. **E-1~E-5** (verify skills + e2e).

각 phase 사이에 `tsc --noEmit` 게이트 — drift 즉시 감지.

---

## End State (Definition of Done)

- 평택랩 TM 의 OUTGOING 탭에 rental+pending 이 **disabled + 사유** 로 표시 (Q1=A 시) 또는 비표시 (Q1=B 시) — 어느 쪽이든 `/approve` 직격 0건.
- 평택랩 TM 의 상세 페이지에서 `pending` 상태 시 `borrower_approve` 버튼 **disabled + "사용 부서 1차 승인 대기 중"** 표시.
- 수원랩 TM 만이 `pending` 상태에서 활성 `borrower_approve` 버튼 표시.
- 수원랩 TM 가 1차 승인 → `borrower_approved` → 평택랩 TM 의 NextStepPanel/OUTGOING 카드에 `approve` 활성.
- 모든 list/detail 응답에 `meta.availableActions` + `meta.nextStep` 포함 (FSM drift warning 0).
- `errors.UNKNOWN_ERROR.actionLabel` ko/en 존재 → MISSING_MESSAGE warning 0.
- `verify-checkout-fsm`, `verify-ssot`, `verify-i18n`, `verify-security`, `verify-cas`, `verify-frontend-state` 전부 PASS.
- BE checkouts + approvals jest, schemas FSM jest 전부 PASS.
- E2E: 8단계 rental 워크플로 1회 통과 + lender pending wait 화면 검증 통과.
