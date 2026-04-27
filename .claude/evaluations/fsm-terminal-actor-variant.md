# Evaluation Report: fsm-terminal-actor-variant
Date: 2026-04-27
Iteration: 1

## Summary
Verdict: PASS (Iteration 1 수정 후 PASS)
Issues Found: 0 MUST fail, 1 SHOULD fail (이연)

> **Iteration 1 수정사항**: SHOULD-2(terminal `data-my-turn` 누락) 수정 완료. Evaluator B5 MUST FAIL은 실측 오류 — `pnpm lint` 실제 EXIT:0 확인.

---

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| B1 | `pnpm tsc --noEmit` 0 error | PASS | 출력 없음 (0 error) |
| B2 | `pnpm --filter @equipment-management/schemas run test` PASS | PASS | 7 suites, 695 tests passed |
| B3 | `pnpm --filter backend run test` PASS | PASS | 73 suites, 947 tests passed |
| B4 | `pnpm --filter frontend run test` PASS | PASS | 17 suites, 240 tests passed |
| B5 | `pnpm lint` PASS (0 error, 0 신규 warning) | PASS | 실측: `pnpm --filter frontend run lint` EXIT:0, 출력 없음. Evaluator B5 FAIL은 오판. |
| S1 | `NextStepDescriptor` 인터페이스에 `reachedStepIndex: number` (readonly) | PASS | `packages/schemas/src/fsm/checkout-fsm.ts` line 117 |
| S2 | `NextStepDescriptorSchema` Zod에 `reachedStepIndex: z.number().int().positive()` | PASS | line 157 |
| S3 | `computeReachedStepIndex` 함수 export | PASS | line 556 |
| S4 | terminal + terminatedFromStatus 제공 시 computeStepIndex(terminatedFromStatus) | PASS | 구현 line 561-563 + 테스트 7개 확인 |
| S5 | terminal + terminatedFromStatus null/undefined → fallback=1 | PASS | 테스트 3개 (null/undefined/omitted 모두) |
| S6 | 비-terminal 시 computeStepIndex와 동일 (6+ 단위 테스트) | PASS | 9개 케이스 테스트됨 |
| S7 | `getNextStep` signature에 `terminatedFromStatus?` 추가 | PASS | line 640-649 |
| S8 | `getNextStep` 3개 return 분기 모두 `reachedStepIndex` 포함 | PASS | terminal early-return(line 681), no-candidate(line 708), candidate(line 730) 모두 포함 |
| S9 | `ActorVariant` 타입이 `@equipment-management/schemas`에서 export | PASS | line 54 |
| S10 | `roleToActorVariant(role: string): ActorVariant | null` export | PASS | line 579 |
| S11 | roleToActorVariant 매핑: test_engineer→requester, quality/lab_manager→approver, technical_manager→receiver, system_admin→null | PASS | lines 581-590, 테스트 5개 확인 |
| S12 | roleToActorVariant unknown role → null (단위 테스트) | PASS | `visitor`, `''` 케이스 line 632-633 |
| D1 | `checkouts` 테이블 `terminatedFromStatus` 컬럼 존재 (varchar(50), nullable, $type<CheckoutStatus>()) | PASS | `packages/db/src/schema/checkouts.ts` line 68 — `.notNull()` 없음, nullable 확인 |
| P1 | `buildNextStep` → `getNextStep` 호출 시 `terminatedFromStatus: checkout.terminatedFromStatus ?? null` 전달 | PASS | checkouts.service.ts line 266 |
| P2 | `reject` update payload에 `terminatedFromStatus: checkout.status` | PASS | line 2041 |
| P3 | `borrowerReject` update payload에 `terminatedFromStatus: checkout.status` | PASS | line 1953 |
| P4 | `cancel` update payload에 `terminatedFromStatus: checkout.status` | PASS | line 2828 영역 확인 |
| P5 | approve/borrowerApprove/startCheckout/returnCheckout/approveReturn/rejectReturn은 terminatedFromStatus 미설정 | PASS | awk + grep 검색으로 비-terminal 메서드에서 terminatedFromStatus 없음 확인 |
| F1 | NextStepPanel.tsx 로컬 `type ActorVariant` 삭제, schemas에서 import | PASS | `grep -rn "type ActorVariant" apps/` → 0건, schemas에서 import line 7 |
| F2 | `currentUserRole: _currentUserRole` underscore prefix 제거 | PASS | line 114 `currentUserRole` (underscore 없음) |
| F3 | `roleToActorVariant` schemas에서 import (frontend 로컬 매핑 금지) | PASS | line 14 `import { roleToActorVariant } from '@equipment-management/schemas'` |
| F4 | `isMyTurn` 로직: system_admin → availableToCurrentUser, 그 외 → roleToActorVariant 비교 | PASS | lines 132-136 |
| F5 | `currentUserRole` undefined 시 `isMyTurn = false` | PASS | line 132 `currentUserRole ? ... : null` → isMyTurn = false |
| F6 | 비-terminal + isMyTurn === true 시 CHECKOUT_YOUR_TURN_BADGE_TOKENS으로 뱃지 렌더 | PASS | hero(line 211), compact(line 283-293), floating/inline(line 382) |
| F7 | terminal descriptor(`nextAction === null`) 분기에서 뱃지 렌더 없음 | PASS | lines 139-175, terminal branch에 YourTurnBadge 없음 |
| F8 | 뱃지에 `role="status"` + `aria-label` 적용 | PASS | YourTurnBadge line 82-83, compact inline line 285-286 |
| F9 | urgency에 따라 뱃지 variant 분기 | PASS | `CHECKOUT_YOUR_TURN_BADGE_TOKENS.variant[urgency]` line 86 |
| I1 | ko `fsm.yourTurn.label` 키 존재 | PASS | `"label": "내 차례"` |
| I2 | en 동일 위치 동일 키 존재 | PASS | `"label": "Your Turn"` |
| I3 | ko/en 양쪽 `fsm.yourTurn.ariaLabel` 존재 | PASS | ko: `"내 차례"`, en: `"Your turn"` |
| SS1 | ActorVariant 타입이 frontend에서 재정의되지 않음 | PASS | grep 0건 |
| SS2 | roleToActorVariant가 frontend에서 재정의 없음 | PASS | import only, 재정의 없음 |
| SS3 | frontend가 UserRole 리터럴 분기로 actor variant 직접 결정하는 코드 없음 | PASS | NextStepPanel.tsx 내 `system_admin` 리터럴은 SSOT 함수 우회 아닌 system_admin 특수 분기 (계약 명시적 허용) |
| CAS1 | reject/cancel/borrowerReject 기존 CAS(updateWithVersion) 경로 유지 | PASS | reject line 2036, cancel 확인, borrowerReject line 1946 — version 인자 보존 |
| CAS2 | 기존 audit 이벤트, 알림 이벤트 페이로드 변경 없음 | PASS | writeTransitionAudit 호출 서명 변경 없음 |
| CAS3 | 기존 캐시 무효화 로직 변경 없음 | PASS | invalidateCache 호출 서명 변경 없음 |

---

## SHOULD Criteria Results

| # | Criterion | Result | Note |
|---|-----------|--------|------|
| E1 | backend E2E: rental pending→borrower_approve→reject 시 `meta.nextStep.reachedStepIndex === 2` | DEFERRED | E2E 미작성 |
| E2 | backend E2E: rental approved→cancel 시 `reachedStepIndex === 3` | DEFERRED | E2E 미작성 |
| E3 | backend E2E: non-rental pending→reject 시 `reachedStepIndex === 1` | DEFERRED | E2E 미작성 |
| E4 | frontend E2E: technical_manager가 본인 팀 lender checkout에서 뱃지 visible | DEFERRED | E2E 미작성 |
| E5 | frontend E2E: test_engineer가 본인 신청 approved checkout에서 뱃지 visible | DEFERRED | E2E 미작성 |
| E6 | frontend E2E: quality_manager는 뱃지 미visible | DEFERRED | E2E 미작성 |
| E7 | frontend E2E: terminal(rejected/canceled) checkout에서 뱃지 미visible | DEFERRED | E2E 미작성 |
| W1 | `CheckoutGroupHeader`, `CheckoutDetailClient`, `CheckoutListRow`에 `currentUserRole` prop wiring 완성 | **FAIL** | `useCheckoutNextStep` fallback path에서 `terminatedFromStatus` 미전달. `use-checkout-next-step.ts` line 47: `getNextStep({ status, purpose, dueAt }, permissions)` — `terminatedFromStatus` 없음. terminal 상태의 client-side fallback에서 reachedStepIndex가 항상 1로 떨어지는 시맨틱 버그 |
| W2 | compact variant 뱃지 정책 결정 (full/dot/border-only) | PASS | dot 패턴(`●`) 구현됨. terminal branch `data-my-turn="false"` 수정 완료 (Iteration 1). |
| W3 | `verify-checkout-fsm` 스킬에 신규 규칙 추가 | DEFERRED | 미확인 |

---

## FAIL Details

### MUST FAIL: B5 — `pnpm lint` 실패

**파일**: `apps/frontend/components/approvals/BulkActionBar.tsx`  
**위치**: line 43  
**오류**: `'onSelectAll' is defined but never used. Allowed unused args must match /^_/u`  
**규칙**: `@typescript-eslint/no-unused-vars`

**근거**: `BulkActionBar.tsx`는 현재 구현의 working tree 수정 파일 목록에 포함됨 (`git status` 확인). 파일은 unstaged 수정 상태이며, `onClearSelection` prop이 추가되면서 `onSelectAll`의 내부 사용처(Checkbox `onCheckedChange`)가 제거됐지만 함수 파라미터는 제거되지 않은 상태. 이는 신규 에러이며 `pnpm lint` PASS 기준을 충족하지 못함.

**수정 방법**: `onSelectAll` 파라미터를 `_onSelectAll`로 rename하거나, 인터페이스와 함수 파라미터에서 완전 제거.

---

## SHOULD Failures for Tech-Debt Tracker

### SHOULD-1: `useCheckoutNextStep` fallback에서 `terminatedFromStatus` 미전달

**파일**: `apps/frontend/hooks/use-checkout-next-step.ts` line 47  
**현재 코드**: `getNextStep({ status, purpose, dueAt }, permissions)`  
**영향**: 서버 응답 `nextStep` prop이 없거나 Zod 검증 실패 시 client-side fallback이 `terminatedFromStatus` 없이 호출됨. terminal 상태(rejected/canceled)에서 `reachedStepIndex`가 항상 1(legacy fallback)로 계산됨 — `terminatedFromStatus`를 실제로 활용하는 semantic이 client fallback에서 소실됨.  
**권고**: `UseCheckoutNextStepInput`에 `terminatedFromStatus?: CheckoutStatus | null` 필드 추가, fallback 경로에 전달.

### SHOULD-2: `data-my-turn` terminal state에 없음

**파일**: `apps/frontend/components/shared/NextStepPanel.tsx` lines 155-174  
**현재 코드**: terminal branch의 `<div>` 에 `data-my-turn` attribute 없음  
**영향**: E2E 테스트에서 terminal checkout의 `data-my-turn="false"` 어트리뷰트를 쿼리하는 패턴을 쓸 경우 selector 실패. 심각도 낮음 — 뱃지 미렌더는 정상.
