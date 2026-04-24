---
slug: checkout-fsm-resolve-action
type: contract
date: 2026-04-24
depends: []
sprint: 1
sprint_step: 1.1
---

# Contract: Sprint 1.1 — `getNextStep` 단일 권위 보증 + 208 조합 전수 테이블 테스트

## Context

외부 아키텍처 리뷰(V2 §2) 지적: "다음 액션" 결정이 4곳(`useCheckoutNextStep` / `useCheckoutGroupDescriptors` / `checkout.meta.availableActions` / role permissions)으로 분산.

**실측**: `packages/schemas/src/fsm/checkout-fsm.ts`의 `getNextStep(checkout, userPermissions): NextStepDescriptor`는 **이미 isomorphic**하게 존재. 서버 `checkouts.service.ts` L258에서도 import하여 응답 populate 시 호출 중. 문제는 조건부 분기:

```typescript
// apps/backend/src/modules/checkouts/checkouts.service.ts L1005
if (userPermissions) {
  const availableActions = this.calculateAvailableActions(...)
  // ...
  meta: { availableActions, nextStep }
}
```

즉, **userPermissions이 제공되지 않는 호출 경로**에서 `meta`가 비어 응답되며, 이게 클라의 `checkout.meta?.availableActions?.canApprove ?? canApprove` (role fallback) 원인. Sprint 1.1 목표: `getNextStep`을 서버 **모든 응답 경로**에서 호출 보증 + 드리프트 감지 + 208 조합 전수 테이블 테스트로 FSM 표면 compile-time/test-time 전수 검증.

---

## Scope

### 수정 대상
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — `serializeCheckout*` 함수들이 userPermissions 없는 경로를 제거. 모든 호출부에서 `AuthenticatedRequest` 주입 후 `getPermissions(req.user.role)` 전달.
- `apps/backend/src/modules/checkouts/checkouts.controller.ts` — `@Request() req` 주입이 빠진 핸들러에서 주입 추가, service 호출 시 userPermissions 전달.

### 신규 생성
- `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` — **전수 테이블 테스트**. (status 13 × purpose 4 × role 4) = 208 조합, 각각 `{ nextAction, nextActor, availableToCurrentUser, blockingReason }` 기대값을 snapshot으로 고정.
- `packages/schemas/src/fsm/__tests__/fixtures/descriptor-table.ts` — 208개 기대값 fixture. Phase 1에서는 `getNextStep` 현재 동작을 그대로 snapshot해 baseline 수립. 이후 PR에서만 의도적 변경.

### 수정 금지
- `packages/schemas/src/fsm/checkout-fsm.ts` 의 `getNextStep` 함수 본체 (기존 동작 보존). 단 **필드 확장**은 Sprint 1.2 contract에서 처리.
- 프론트엔드 훅 2종 (`use-checkout-next-step.ts`, `use-checkout-group-descriptors.ts`) — 이미 isomorphic 경유 중, 변경 없음.
- `NextStepDescriptorSchema` (Zod) — Sprint 1.2까지 유지.

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` exit 0 | 빌드 검증 |
| M2 | `pnpm --filter backend run test` 전체 통과 + 신규 table test 포함 | `pnpm --filter backend run test -- checkout-fsm.table` 통과 |
| M3 | `packages/schemas/src/fsm/__tests__/checkout-fsm.table.test.ts` 존재 + 208 조합 커버 | `it('covers all (status × purpose × role) combinations', ...)` 안에 208 assertion |
| M4 | `fixtures/descriptor-table.ts` export `DESCRIPTOR_TABLE` = `Record<\`${CheckoutStatus}:${CheckoutPurpose}:${UserRole}\`, Pick<NextStepDescriptor, 'nextAction' \| 'nextActor' \| 'availableToCurrentUser'>>` | grep: `DESCRIPTOR_TABLE` export + 208 entry keys |
| M5 | 테이블은 `satisfies`로 컴파일 타임 누락 검증 | `as const satisfies Record<...>` 표기 또는 TypeScript assertion function |
| M6 | `checkouts.service.ts`에서 `if (userPermissions)` 조건부 meta populate 분기 제거 — 모든 `serialize*` 호출이 userPermissions **필수** 수신 | `grep -n "if (userPermissions)" apps/backend/src/modules/checkouts/checkouts.service.ts` = 0 hit |
| M7 | 서비스 메서드 시그니처에서 `userPermissions?: readonly string[]` (optional) → `userPermissions: readonly string[]` (required) 전환 | `grep -nE "userPermissions\?:" apps/backend/src/modules/checkouts/checkouts.service.ts` = 0 hit |
| M8 | 모든 controller 핸들러가 `@Request() req: AuthenticatedRequest` 주입 후 `getPermissions(req.user.role)` 계산 → 서비스 전달 | grep로 `getPermissions(` 호출 수가 controller 핸들러 수와 일치 |
| M9 | 신규 `calculateAvailableActions` 입력에서 `role: UserRole | undefined` → `role: UserRole` (non-null 필수) | 타입 레벨 강제, 빌드 통과 |
| M10 | 응답 `meta` 필드 zod schema에 `availableActions` + `nextStep`이 **required**로 정의 | `CheckoutWithMetaSchema` 내 `.object({ availableActions: ..., nextStep: NextStepDescriptorSchema })` — optional `?` 없음 |
| M11 | `getNextStep` 호출은 schemas 패키지 바깥 **어디서도 로직 재구현 없음**. 동작이 필요한 곳은 import 경유만 | `grep -rn "function getNextStep\|const getNextStep =" apps/ packages/ \| grep -v schemas/src/fsm/` = 0 hit |
| M12 | 프론트엔드는 이미 `@equipment-management/schemas` import 경유 중 (변경 없음) | `grep -n "from '@equipment-management/schemas'" apps/frontend/hooks/use-checkout-next-step.ts apps/frontend/hooks/use-checkout-group-descriptors.ts` = 2 hit |
| M13 | 드리프트 감지: `NextStepDescriptorSchema.safeParse` 실패 시 백엔드 `Logger.warn('[FSM drift] server response rejected by schema', ...)` + Sentry breadcrumb | 코드 확인 (감지 지점 1곳 이상) |
| M14 | 변경 파일이 backend 2개 + schemas 2개(test + fixture) = 총 **4개** | `git diff --name-only \| grep -v '^\.claude/'` = 4 |

---

## SHOULD Criteria (실패 시 tech-debt 등록 후 통과)

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | 208 조합 중 `nextAction: null` (terminal) 케이스가 `REJECTED`·`CANCELED`·`RETURN_APPROVED` 3종 × 4 purpose × 4 role = 48건과 일치 | `fsm-table-terminal-count` |
| S2 | fixture 생성 스크립트 `pnpm --filter schemas run gen:descriptor-table` 제공 (baseline 재생성용) | `fsm-fixture-generator-script` |
| S3 | `calculateAvailableActions`와 `getNextStep`이 **동일 transition table**을 참조하도록 `canPerformAction` 경유로 리팩토링 | `checkouts-available-actions-refactor` |
| S4 | 테이블 테스트 fail 시 diff 출력 (expected vs actual) | `fsm-table-diff-reporter` |

---

## Verification Commands

```bash
# 1. 타입 + 테스트
pnpm --filter backend exec tsc --noEmit
pnpm --filter schemas run test
pnpm --filter backend run test -- checkout-fsm.table

# 2. MUST grep
grep -n "if (userPermissions)" apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 0 hit (M6)

grep -nE "userPermissions\?:" apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 0 hit (M7)

grep -rn "function getNextStep\|const getNextStep =" apps/ packages/ | grep -v "schemas/src/fsm/"
# 기대: 0 hit (M11)

grep -c "from '@equipment-management/schemas'" \
  apps/frontend/hooks/use-checkout-next-step.ts \
  apps/frontend/hooks/use-checkout-group-descriptors.ts
# 기대: 1 1 (M12)

# 3. 테이블 fixture entry count
node -e "const t = require('./packages/schemas/dist/fsm/__tests__/fixtures/descriptor-table.js'); console.log(Object.keys(t.DESCRIPTOR_TABLE).length)"
# 기대: 208

# 4. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 4
```

---

## 208 조합 산출 근거

- `CheckoutStatus` 13종: `pending`, `borrower_approved`, `approved`, `lender_checked`, `borrower_received`, `checked_out`, `in_use`, `overdue`, `borrower_returned`, `lender_received`, `returned`, `return_approved`, `rejected`, `canceled` (actual enum 길이 확인 후 조정. `CHECKOUT_STATUS_VALUES.length`를 런타임 assert)
- `CheckoutPurpose` 4종: `calibration`, `repair`, `rental`, `return_to_vendor`
- `UserRole` 4종: `test_engineer`, `lab_manager`, `technical_manager`, `admin`

**실제 count**: `CHECKOUT_STATUS_VALUES.length × CheckoutPurpose 4 × UserRole 4`. 테스트 선언부에 `expect(CHECKOUT_STATUS_VALUES.length * 4 * 4).toBe(entryCount)` assertion 포함.

---

## Acceptance

루프 완료 조건 = 위 MUST 14개 모두 PASS + 208 table test 통과.
서버 응답 `meta` 필드가 **항상** populate되어 Sprint 1.3 (fail-closed `?? false`) 구현이 안전해진다.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.2 · `checkout-descriptor-phase-fields.md` — `NextStepDescriptor`에 `nextStepIndex` + `phase` 필드 신설. 본 contract의 208 table fixture도 신규 필드까지 확장.
- Sprint 1.3 · `checkout-meta-fail-closed.md` — 본 contract가 meta 항상 populate 보증함 → 클라가 `?? false` 안전하게 전환.
- Sprint 1.5 · `checkout-fsm-exhaustive-satisfies.md` — `computeStepIndex` 내부 `Partial<Record<CheckoutStatus, number>>`을 `satisfies Record<CheckoutStatus, number>`로 강제 (누락 런타임 탈출 차단).
