---
slug: checkout-fsm-exhaustive-satisfies
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action, checkout-descriptor-phase-fields]
sprint: 1
sprint_step: 1.5
---

# Contract: Sprint 1.5 — `satisfies Record<CheckoutStatus, ...>` 전수 전환: 누락 방지 컴파일 타임 가드

## Context

V2 리뷰 §5 확장성 지적 + 실측 결과:

1. `packages/schemas/src/fsm/checkout-fsm.ts` L465·L482 — `computeStepIndex` 내 map 선언:
   ```typescript
   const map: Partial<Record<CheckoutStatus, number>> = { ... };
   return map[status] ?? 1; // ← 누락 fallback
   ```
   `Partial`이라 누락 있어도 컴파일 OK, `?? 1`이 런타임까지 가림.

2. `apps/frontend/lib/design-tokens/components/checkout.ts` L266-278 `CHECKOUT_MINI_PROGRESS.statusToStepIndex`:
   ```typescript
   as Partial<Record<string, number>>  // ← 약한 타입 + string key
   ```
   13개 `CheckoutStatus` 중 10개만 매핑. `pending`, `rejected`, `canceled`, `return_approved`, `borrower_approved` 5개 누락(런타임 undefined).

3. L280 `stepCount`: `Record<string, number>` — `return_to_vendor` 누락.

4. L315 `RENTAL_FLOW_INLINE_TOKENS.statusToStep`: 동일 `Partial<Record<string, number>>`.

5. L55 `CHECKOUT_STATUS_BADGE_TOKENS`: `as const`만. 13개 모두 있지만 **타입 강제 없음** — 향후 상태 추가 시 누락 가능.

6. `apps/frontend/lib/design-tokens/components/checkout-timeline.ts` L19 `CHECKOUT_DISPLAY_STEPS`: 타입 있지만 `satisfies`로 exhaustive 강제 없음.

**목표**: 모든 상태 매핑을 `satisfies Record<CheckoutStatus, X>` 또는 `satisfies Record<CheckoutPurpose, X>`로 전환. 새 status/purpose 추가 시 **컴파일 에러**로 즉시 발견. V2 §5 metric "신규 상태 추가 PR size 10+ → ≤7"의 핵심 제거 기반.

---

## Scope

### 수정 대상
- `packages/schemas/src/fsm/checkout-fsm.ts`
  - L465-480 rental map: `const map = { ... } as const satisfies Record<CheckoutStatus, number>` + `?? 1` fallback 제거, 모든 13개 status 명시
  - L482-492 non-rental map: 동일 satisfies 전환
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - L266-278 `CHECKOUT_MINI_PROGRESS.statusToStepIndex`: `Partial<Record<string, number>>` → `as const satisfies Record<CheckoutStatus, number>`. 5개 누락 status 명시적 채움
  - L280-284 `CHECKOUT_MINI_PROGRESS.stepCount`: `Record<string, number>` → `satisfies Record<CheckoutPurpose, number>` (`return_to_vendor: 4` 추가)
  - L55-81 `CHECKOUT_STATUS_BADGE_TOKENS`: `as const` 뒤에 `satisfies Record<CheckoutStatus, string>` 추가
  - L315-321 `RENTAL_FLOW_INLINE_TOKENS.statusToStep`: `satisfies Record<CheckoutStatus, number | null>` (non-rental status는 `null`로 명시 — Sprint 1.4에서 dead-branch지만 타입 정합)
- `apps/frontend/lib/design-tokens/components/checkout-timeline.ts`
  - L19 `CHECKOUT_DISPLAY_STEPS`: 타입 유지하되 런타임 assertion 추가 — `CHECKOUT_DISPLAY_STEPS.rental.length === 8`, `.nonRental.length === 5` compile-time 불가능하므로 `assertFsmInvariants` 유형의 module-load assertion

### 수정 금지
- `CheckoutStatus` / `CheckoutPurpose` enum 정의 — 본 contract 아님.
- `CHECKOUT_TRANSITIONS` 테이블 (이미 module-load assertion 존재).
- UI 컴포넌트 로직.

### 신규 생성
- `packages/schemas/src/fsm/__tests__/checkout-fsm.exhaustive.test.ts` — `@ts-expect-error` 기반 negative test. "새 status 추가 → 매핑 누락 시 컴파일 에러" 확인.

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` exit 0 | 빌드 통과 |
| M2 | `pnpm --filter schemas run test` + `pnpm --filter frontend run test` 통과 | 테스트 |
| M3 | `packages/schemas/src/fsm/checkout-fsm.ts`에서 `Partial<Record<CheckoutStatus,` 패턴 0건 | `grep -c "Partial<Record<CheckoutStatus"` = 0 |
| M4 | `computeStepIndex` 내부 map 2개 모두 `as const satisfies Record<CheckoutStatus, number>` | grep 확인 |
| M5 | `computeStepIndex` 내부 `?? 1` fallback 제거 (exhaustive 이후 불필요) | `grep -c "?? 1" packages/schemas/src/fsm/checkout-fsm.ts` = 0 (다른 `?? 1`이 있다면 이 함수 내부 한정) |
| M6 | `apps/frontend/lib/design-tokens/components/checkout.ts`에서 `Partial<Record<string, number>>` 패턴 0건 | `grep -c "Partial<Record<string"` = 0 |
| M7 | `CHECKOUT_MINI_PROGRESS.statusToStepIndex` 13개 `CheckoutStatus` 모두 포함 + `satisfies Record<CheckoutStatus, number>` | grep + 컴파일 |
| M8 | `CHECKOUT_MINI_PROGRESS.stepCount`에 `return_to_vendor` 포함 + `satisfies Record<CheckoutPurpose, number>` | grep |
| M9 | `CHECKOUT_STATUS_BADGE_TOKENS`에 `satisfies Record<CheckoutStatus, string>` 추가 | grep |
| M10 | `RENTAL_FLOW_INLINE_TOKENS.statusToStep` 13개 status 모두 키로 포함 (non-rental은 null) + satisfies | grep |
| M11 | `CHECKOUT_DISPLAY_STEPS` module-load에 `if (CHECKOUT_DISPLAY_STEPS.rental.length !== 8) throw` assertion | grep |
| M12 | 신규 negative test `checkout-fsm.exhaustive.test.ts` 존재 — `@ts-expect-error` 주석으로 누락 시뮬레이션 | `grep -c "@ts-expect-error" packages/schemas/src/fsm/__tests__/checkout-fsm.exhaustive.test.ts` >= 2 |
| M13 | Sprint 1.1 table test (208 조합) + Sprint 1.2 phase field test 여전히 통과 | 테스트 |
| M14 | 변경 파일 = schemas 2 + frontend 2 + test 1 = **5개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` = 5 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `rental-phase.ts`의 `RENTAL_STATUS_TO_PHASE` 매핑도 동일 satisfies 확인 (Sprint 1.2 결과물 재검증) | `rental-phase-satisfies-audit` |
| S2 | `CheckoutStatus` 추가/삭제 시 touch 지점 감소 측정 — 리뷰 §5 metric. "현재 vs 이번 PR 이후" 비교 문서 작성 | `fsm-touchpoint-reduction-doc` |
| S3 | design-token 다른 checkout 관련 Partial 잔존 전수 스캔 (`tab-badge`, `your-turn`, `timeline`) | `design-tokens-partial-audit` |
| S4 | `computeStepIndex`가 `canceled`/`rejected` 같은 terminal 상태에서 "마지막 reached step"을 반환하는지 정합 확인 (현재 `?? 1`이 false positive "step 1"을 반환함) | `fsm-terminal-step-index-semantics` |

---

## Verification Commands

```bash
# 1. 타입 + 테스트
pnpm tsc --noEmit
pnpm --filter schemas run test
pnpm --filter frontend run test

# 2. MUST grep
grep -rn "Partial<Record<CheckoutStatus" packages/schemas/src/fsm/
# 기대: 0 hit

grep -c "Partial<Record<string" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 0

grep -c "as const satisfies Record<CheckoutStatus" \
  packages/schemas/src/fsm/checkout-fsm.ts \
  apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 5+ (computeStepIndex 2곳 + mini progress + badge + rental inline)

grep -c "satisfies Record<CheckoutPurpose" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1+

test -f packages/schemas/src/fsm/__tests__/checkout-fsm.exhaustive.test.ts && echo OK
grep -c "@ts-expect-error" packages/schemas/src/fsm/__tests__/checkout-fsm.exhaustive.test.ts
# 기대: 2+

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 5
```

---

## Negative Test 예시 (M12)

```typescript
// packages/schemas/src/fsm/__tests__/checkout-fsm.exhaustive.test.ts
import type { CheckoutStatus } from '../../enums/checkout';

describe('exhaustive satisfies guards', () => {
  it('statusToStepIndex 누락 시 컴파일 에러 발생 (type-level)', () => {
    type _Ensure = Record<CheckoutStatus, number>;

    // @ts-expect-error — 일부 status 누락 시 컴파일 실패해야 함
    const incomplete = { pending: 1 } as const satisfies Record<CheckoutStatus, number>;

    expect(incomplete).toBeDefined(); // runtime check는 의미 없음. 컴파일 통과 여부가 test의 본질.
  });

  it('stepCount에 새 purpose 추가 누락 시 컴파일 에러', () => {
    // @ts-expect-error
    const stepCount = { calibration: 4 } as const satisfies Record<CheckoutPurpose, number>;
    expect(stepCount).toBeDefined();
  });
});
```

`@ts-expect-error`가 실제로 컴파일 에러를 누를 때만 `tsc --noEmit`이 통과. 에러가 없으면 TypeScript가 "Unused '@ts-expect-error' directive" 경고로 실패 → exhaustive guard 작동 증명.

---

## 통합 시나리오: 새 `CheckoutStatus` 추가 시 touch 지점 (리뷰 §5)

본 contract 적용 전: 누락되어도 컴파일 OK, 런타임 `?? 1`로 숨김. 신규 상태 추가 시 **touch 필요 파일 10+개 중 안전망 0개**.

본 contract 적용 후: 다음 7곳에서 **컴파일 에러 발생**으로 강제 인지 —

1. `schemas/enums/checkout.ts` (enum 추가)
2. `schemas/fsm/checkout-fsm.ts` `computeStepIndex` 2개 map
3. `schemas/fsm/rental-phase.ts` `RENTAL_STATUS_TO_PHASE`
4. `design-tokens/components/checkout.ts` `CHECKOUT_MINI_PROGRESS.statusToStepIndex`
5. `design-tokens/components/checkout.ts` `CHECKOUT_STATUS_BADGE_TOKENS`
6. `design-tokens/components/checkout.ts` `RENTAL_FLOW_INLINE_TOKENS.statusToStep`
7. `design-tokens/components/checkout-timeline.ts` `CHECKOUT_DISPLAY_STEPS` (런타임 assertion)

→ 리뷰 §5 목표: "상단 7곳만 수정하면 끝나는 구조"가 본 contract로 **실제 강제**됨. V2 §10 metric "신규 상태 추가 PR size 10+ → ≤7" 달성 기반.

---

## Acceptance

루프 완료 조건 = MUST 14개 모두 PASS + negative test가 `@ts-expect-error` 디렉티브로 컴파일 타임 누락 검출 증명.
향후 `CheckoutStatus` 추가 시 컴파일 에러로 7개 touch 지점 자동 안내.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1·1.2 **선행**. 1.1의 208 table fixture가 exhaustive 매핑 기반.
- Sprint 1.4 · `legacy-actions-block-removal.md` — 같은 PR 또는 연속 PR. 본 contract의 satisfies가 LegacyActionsBlock 제거 후의 FSM 단일 경로 정합성을 보장.
- Sprint 2.1 · `checkout-token-layer-leak-cleanup.md` (작성 예정) — `purposeBar`의 `return_to_vendor` 추가도 동일 satisfies 원칙 적용.
- Sprint 4.4 · `rental-phase-ui.md` (작성 예정) — `CheckoutPhaseIndicator`가 본 contract의 satisfies 기반 매핑 의존.
