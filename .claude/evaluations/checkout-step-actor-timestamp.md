# Evaluation: checkout-step-actor-timestamp
Date: 2026-04-29
Iteration: 1

## MUST Results
| Criterion | Status | Evidence |
|---|---|---|
| M1. Data Coverage | PASS | `buildStepMeta` switch covers all 9 status cases (CHECKOUT_DISPLAY_STEPS nonRental ∪ rental): PENDING, BORROWER_APPROVED, APPROVED, LENDER_CHECKED, CHECKED_OUT, IN_USE, BORROWER_RETURNED, RETURNED, RETURN_APPROVED. Each maps to the correct timestamp field as specified. |
| M2. Type Safety | PASS | `pnpm --filter frontend run type-check` (tsc --noEmit) exits with 0 errors. No `any` type found in any of the 4 changed FE files. `t(labelKey as never)` is a next-intl idiom, not a Rule 3 violation. `} satisfies ProgressStepDescriptor` at line 319 enforces shape. |
| M3. SSOT | PASS | (1) `buildStepMeta` switch handles exactly the 9-status union of CHECKOUT_DISPLAY_STEPS. (2) Date format uses `useFormatter().dateTime()` from next-intl (lines 94, 119 of CheckoutProgressStepper.tsx) — no hardcoded format strings. (3) Labels use `CHECKOUT_STEP_LABELS[status]` → `checkouts.stepper.*` i18n keys — both ko and en have all required keys (pendingApproval, borrowerApproved, approved, checkedOut, returned, returnApproved, lenderCheckout, borrowerReturn, inUse). (4) `CheckoutStatus` imported from `@equipment-management/schemas` in all 4 changed FE files. |
| M4. Breaking Change | PASS | Backend `CheckoutWithMeta`: existing fields (equipment, user, meta) preserved; 5 actor fields added as new (not replacing anything). Frontend `Checkout` interface: all existing fields retained; 9 new optional fields appended (`borrowerApprover`, `approver`, `lenderConfirmedAt`, `lenderConfirmedBy`, `lenderConfirmer`, `returnerId`, `returner`, `returnApprover`, `terminatedFromStatus`). `ProgressStepDescriptor` interface in packages/schemas/src/fsm/progress-step.ts: not modified. |
| M5. Accessibility | PASS | `<ol role="list" aria-label={t('progressStep.ariaLabel')}>` at line 221-223. Each step renders `<li aria-current={ariaCurrent ? 'step' : undefined}>` at lines 135-137. `<span className="sr-only">{srState}</span>` inside circle div at line 142. All existing a11y markup preserved. |
| M6. Audit Priority | PASS | `buildStepMeta` checks `eventByStatus.get(stepStatus)` at line 125 and returns immediately if event exists (lines 126-132) — BEFORE the switch statement at line 136. Fallback only runs when no audit event present. |
| M7. Build | PASS | `pnpm --filter frontend run lint` exits 0 errors/warnings. `pnpm --filter backend run lint` exits 0 errors/warnings. No new `eslint-disable` directives found in any changed file. |

## SHOULD Results
| Criterion | Status | Notes |
|---|---|---|
| S2. BE Batch Query | PASS | `findOne()` collects all 5 actor FK IDs into a `Set`, filters nulls, then executes a single `inArray(schema.users.id, Array.from(actorIdSet))` query (lines 1349-1364). Zero N+1. actorIdSet.size === 0 guard prevents empty IN clause. |
| S4. i18n Parity | PASS | `progressStep.*` keys are identical in ko and en: ariaLabel, stateDone, stateCurrent, stateLate, stateFuture, stateTerminated, metaScheduled, metaPending, actorYou, actorYouAriaLabel — all 10 keys present in both locales. Note: `stateCurrent` and `stateLate` are defined but not called by component (aria-current="step" is used for current/late states instead); this is intentional, not a parity failure. |

## Verdict
PASS

## Issues (FAIL items only)
None.

## SHOULD Tech Debt
- **S1 (terminated timestamp)**: `buildStepMeta` `default` branch returns `{}` for rejected/canceled status — no `updatedAt` timestamp shown on terminated step. The `use-checkout-progress-steps.ts` input type does not include `updatedAt` at all. Register in tech-debt-tracker as: "S1: terminated 단계(rejected/canceled)에서 updatedAt timestamp 표시 미구현 — buildStepMeta default 분기 및 UseCheckoutProgressStepsInput에 updatedAt 추가 필요."
- **S3 (unit tests)**: No unit tests found for `use-checkout-progress-steps.ts` hook or `CheckoutProgressStepper` component covering 9 status × fallback cases. Register in tech-debt-tracker as: "S3: use-checkout-progress-steps buildStepMeta 9개 status × fallback 케이스 jest 단위 테스트 미작성."
- **S5 (exhaustive check)**: `buildStepMeta` switch uses `default: return {}` rather than an exhaustive compile-time guard. Adding a new `CheckoutStatus` to CHECKOUT_DISPLAY_STEPS would silently fall through to empty meta with no compile error. Register in tech-debt-tracker as: "S5: buildStepMeta switch에 exhaustive guard 없음 — 신규 status 추가 시 컴파일 에러 미발생."
