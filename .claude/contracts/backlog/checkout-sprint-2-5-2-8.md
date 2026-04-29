---
slug: checkout-sprint-2-5-2-8
created: 2026-04-26
sprint: Sprint 2.5~2.8 (V2 L-5~L-8)
mode: 2
round: 1
---

# Contract: Checkout Sprint 2.5~2.8 — Token Layer 봉합

V2 외부 리뷰 L-5~L-8 토큰 레이어 일관성 봉합. 4개 마이크로 스프린트를 한 번에 묶어
디자인 토큰 SSOT 일탈을 제거하고 `@deprecated` 회귀 방지 가드를 신설한다.

기존 exec-plan: `.claude/exec-plans/active/2026-04-24-checkouts-v3-roadmap.md` (Sprint 2.5~2.8 섹션)

## 영향 파일 (7개)

1. `apps/frontend/lib/design-tokens/semantic.ts`
2. `apps/frontend/lib/design-tokens/components/checkout.ts`
3. `apps/frontend/lib/design-tokens/index.ts`
4. `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
5. `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
6. `apps/frontend/components/checkouts/CheckoutListTabs.tsx`
7. `apps/frontend/eslint.config.mjs`

---

## MUST (loop-blocking failures)

### M-1: SECTION_RHYTHM_TOKENS.tight 일괄 적용 (L-5)

- `OutboundCheckoutsTab.tsx` main return 루트가 `<div className={SECTION_RHYTHM_TOKENS.tight}>` 로 감싸짐
- Stats grid div에서 `mb-5` 클래스가 **완전히 제거**됨
- `SECTION_RHYTHM_TOKENS` 가 `@/lib/design-tokens` 에서 import 추가됨
- `CheckoutListTabs.tsx` tablist div에서 `mb-4` 클래스가 **완전히 제거**됨

### M-2: FOCUS_TOKENS.ringCurrent 신설 + raw 클래스 제거 (L-6)

- `semantic.ts`: `FOCUS_TOKENS` 객체에 **top-level** `ringCurrent: 'ring-2 ring-brand-info ring-offset-2'` 프로퍼티 추가 (NOT inside `classes`)
- `checkout.ts`: `CHECKOUT_STEPPER_TOKENS.status.current.node` 에서 raw `ring-2 ring-brand-info ring-offset-2` 가 사라지고 `FOCUS_TOKENS.ringCurrent` 참조

### M-3: CHECKOUT_INBOUND_SECTION_TOKENS.container 에 pl-4 흡수 (L-7)

- `checkout.ts`: `CHECKOUT_INBOUND_SECTION_TOKENS.container` 값이 `'space-y-3 pl-4'`
- `InboundCheckoutsTab.tsx`: 3곳 className 배열에서 `'pl-4'` 리터럴 **제거**

### M-4: @deprecated 토큰 안전 제거 (L-8)

- `checkout.ts` 에서 삭제: `MINI_PROGRESS_STEPS`, `CHECKOUT_STATS_CHECKED_OUT`, `CHECKOUT_STATS_RETURNED`, `CHECKOUT_STATS_VARIANTS.inProgress` 키
- `index.ts` 에서 re-export 삭제 (위 4개 동일)
- **유지**: `RENTAL_FLOW_INLINE_TOKENS` — CheckoutGroupCard.tsx 활성 사용 중 (Sprint 4 이월)

### M-5: TypeScript 컴파일 통과

- `pnpm --filter frontend run tsc --noEmit` → exit 0, 0 errors

### M-6: ESLint @deprecated 가드 신설

- `eslint.config.mjs` 에 scoped typed linting 블록 추가 (`lib/design-tokens/**/*.ts` 스코프)
- `@typescript-eslint/no-deprecated: 'error'` 설정 (신규 package 없이 기존 v8.53.1 활용)
- `pnpm --filter frontend run lint` → exit 0

---

## SHOULD (non-blocking, tech-debt 등록)

- S-1: CheckoutAlertBanners, HeroKPISkeleton, HeroKPIError 의 mb-* 는 Sprint 3에서 처리
- S-2: `FOCUS_TOKENS.ringCurrent` JSDoc으로 focus-visible classes 와의 의미 차이 명시
- S-3: eslint.config.mjs typed linting 은 design-tokens 스코프만 (성능 점진 확장)

---

## MUST NOT

- `RENTAL_FLOW_INLINE_TOKENS` 삭제/변경 (Sprint 4 영역)
- `FOCUS_TOKENS.classes` 내부 구조 변경
- `CHECKOUT_STEPPER_TOKENS.status.current.node` 외 다른 status 변경
- `eslint.config.mjs` 기존 rule 수정 (no-explicit-any, no-restricted-imports 등)
- `package.json` / `pnpm-lock.yaml` 변경
- 비즈니스 로직, props, 핸들러 수정 (오직 className 관련 변경만)

---

## 검증 시퀀스

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
grep -nE "\bmb-(4|5)\b" "apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx"
grep -nE "\bmb-4\b" apps/frontend/components/checkouts/CheckoutListTabs.tsx
grep -n "SECTION_RHYTHM_TOKENS" "apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx"
grep -n "ringCurrent" apps/frontend/lib/design-tokens/semantic.ts
grep -n "FOCUS_TOKENS.ringCurrent" apps/frontend/lib/design-tokens/components/checkout.ts
grep -n "ring-2 ring-brand-info ring-offset-2" apps/frontend/lib/design-tokens/components/checkout.ts
grep -n "space-y-3 pl-4" apps/frontend/lib/design-tokens/components/checkout.ts
grep -nE "['\"]pl-4['\"]" "apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx"
grep -n "MINI_PROGRESS_STEPS\|CHECKOUT_STATS_CHECKED_OUT\|CHECKOUT_STATS_RETURNED" apps/frontend/lib/design-tokens/components/checkout.ts
grep -rn "MINI_PROGRESS_STEPS\|CHECKOUT_STATS_CHECKED_OUT\|CHECKOUT_STATS_RETURNED" apps/frontend/app apps/frontend/components apps/frontend/lib apps/frontend/hooks
grep -n "RENTAL_FLOW_INLINE_TOKENS" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
grep -n "no-deprecated" apps/frontend/eslint.config.mjs
```
