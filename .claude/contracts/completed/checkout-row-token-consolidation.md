---
slug: checkout-row-token-consolidation
type: contract
date: 2026-04-24
depends: [checkout-fsm-exhaustive-satisfies]
sprint: 2
sprint_step: 2.1, 2.2
---

# Contract: Sprint 2.1·2.2 — Row 토큰 누수 봉합 (getPurposeBarClass SSOT + YourTurn summary variant)

## Context

V2 리뷰 L-1(P0) + L-2(P1) 실측:

1. **L-1**: `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` L297-304
   ```typescript
   const getPurposeBarClass = (purpose: string): string => {
     const map: Record<string, string> = {
       calibration: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.calibration,
       repair: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.repair,
       rental: CHECKOUT_ITEM_ROW_TOKENS.purposeBar.rental,
     };
     return map[purpose] ?? CHECKOUT_ITEM_ROW_TOKENS.purposeBar.default;
   };
   ```
   토큰 참조는 하지만 **로컬 map 재구성**. `purposeBar`에 `return_to_vendor` 결측 → default로 떨어져 silent miss. purpose는 4종(`calibration`, `repair`, `rental`, `return_to_vendor`).

2. **L-2**: `CheckoutGroupCard.tsx` L397-405
   ```tsx
   <span
     data-testid="your-turn-summary"
     className="text-xs text-brand-info font-medium shrink-0"
     ...
   >
     {t('yourTurn.count', { count: yourTurnCount })}
   </span>
   ```
   `CHECKOUT_YOUR_TURN_BADGE_TOKENS`가 이미 존재(`checkout-your-turn.ts`)하지만 **요약 카운트 variant** 미등록 → raw `text-brand-info font-medium` 직접 사용. 색/두께 변경 시 2곳 touch.

두 건 모두 **Sprint 1.5 `checkout-fsm-exhaustive-satisfies` 완료 후** 수행. 이유: 2.1의 `return_to_vendor` 추가는 `satisfies Record<CheckoutPurpose, string>` 강제와 동일 PR에서 안전. Sprint 1.5 contract M8이 `stepCount`에 `return_to_vendor` 추가 요구 중 — 본 contract는 `purposeBar`에도 동일 적용.

---

## Scope

### 수정 대상
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - L893-899 `CHECKOUT_ITEM_ROW_TOKENS.purposeBar`에 `return_to_vendor: 'bg-brand-neutral'` (또는 논의 후 적절 색) 추가
  - 해당 객체에 `satisfies` 강제: `purposeBar: { base, calibration, repair, rental, return_to_vendor, default } as const satisfies { base: string } & Record<CheckoutPurpose, string> & { default: string }` 구조
  - 신규 헬퍼 export: `export function getPurposeBarClass(purpose: CheckoutPurpose): string { return CHECKOUT_ITEM_ROW_TOKENS.purposeBar[purpose]; }` — 타입 강제이므로 default fallback 불필요
- `apps/frontend/lib/design-tokens/components/checkout-your-turn.ts`
  - `CHECKOUT_YOUR_TURN_BADGE_TOKENS`에 `summary` variant 신설:
    ```typescript
    summary: {
      container: `${MICRO_TYPO.badge} text-brand-info font-medium shrink-0`,
      // 추후 배경/보더 추가 여지 남김 (현재는 텍스트만)
    }
    ```
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - L297-304 로컬 `getPurposeBarClass` 함수 **삭제** → `import { getPurposeBarClass } from '@/lib/design-tokens/components/checkout'`
  - L400 raw className `"text-xs text-brand-info font-medium shrink-0"` → `CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary.container`

### 수정 금지
- `CheckoutStatusBadge`·`CheckoutMiniProgress`·`YourTurnBadge` 본체 — 본 contract 범위 아님.
- 다른 tab/button/progress 토큰.
- purposeBar의 기존 3개 색상 값 (calibration/repair/rental) 변경 금지. `return_to_vendor` 신규 색상만 추가.

### 신규 생성
- (없음 — 기존 토큰 확장 + 헬퍼 export만)

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint <수정 파일들>` error 0 | lint |
| M3 | `checkout.ts`의 `purposeBar` 객체에 `return_to_vendor` 키 존재 | `grep -n "return_to_vendor" apps/frontend/lib/design-tokens/components/checkout.ts` >= 1 hit |
| M4 | `purposeBar`가 `satisfies Record<CheckoutPurpose, string>` 또는 동등한 exhaustive 제약 선언 | grep + 컴파일 타임 강제 |
| M5 | `checkout.ts`에서 `export function getPurposeBarClass(purpose: CheckoutPurpose): string` export 존재 | `grep -n "export function getPurposeBarClass\|export const getPurposeBarClass" apps/frontend/lib/design-tokens/components/checkout.ts` = 1 hit |
| M6 | `CheckoutGroupCard.tsx`에 로컬 `const getPurposeBarClass =` 선언 0건 (import만) | `grep -c "const getPurposeBarClass" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 |
| M7 | `CheckoutGroupCard.tsx`가 `getPurposeBarClass`를 design-tokens에서 import | `grep -n "import.*getPurposeBarClass.*@/lib/design-tokens" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 1 hit |
| M8 | `checkout-your-turn.ts`의 `CHECKOUT_YOUR_TURN_BADGE_TOKENS`에 `summary` key 존재 (container 필드 이상) | grep 확인 |
| M9 | `CheckoutGroupCard.tsx` L400 부근 raw `text-brand-info font-medium` 제거 → `CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary.container` 참조 | `grep -c "text-brand-info font-medium" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 |
| M10 | `data-testid="your-turn-summary"` 여전히 존재 (E2E/테스트 회귀 방지) | `grep -n 'data-testid="your-turn-summary"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 1 hit |
| M11 | `aria-label={t('yourTurn.summaryAria', ...)}` 유지 (a11y) | grep 확인 |
| M12 | `CheckoutItemRow` 렌더(L480 부근) `getPurposeBarClass(row.purpose)` 호출 시 `row.purpose` 타입이 `CheckoutPurpose`로 좁혀짐 | tsc 통과로 암묵 검증 |
| M13 | 변경 파일 = `checkout.ts` + `checkout-your-turn.ts` + `CheckoutGroupCard.tsx` = **3개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` = 3 |
| M14 | `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.default` fallback은 **유지** (purpose 타입 정제 이전에 원시 문자열로 들어올 때 대비, 단 `getPurposeBarClass` 헬퍼는 타입 강제라 default 미사용) | 코드 확인 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `return_to_vendor` 색상을 디자인 팀과 확정 (현재 `bg-brand-neutral` 가안) — 리뷰 HTML에 명시된 색 없음. 사용자 확정 후 본 값 fix | `purpose-bar-return-to-vendor-color` |
| S2 | `CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary`에 `containerWithCount` variant(배지 형태) 추후 추가 — 현재는 텍스트만 | `your-turn-summary-chip-variant` |
| S3 | `getPurposeBarClass` 헬퍼에 JSDoc — "CheckoutPurpose enum 값만 허용, 타입 강제로 default 미사용" | `get-purpose-bar-class-jsdoc` |
| S4 | 다른 컴포넌트(CheckoutsContent·OutboundTab)에서도 raw `text-brand-info font-medium` 잔존 여부 전수 스캔 | `brand-info-font-medium-audit` |

---

## Verification Commands

```bash
# 1. 타입 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  apps/frontend/lib/design-tokens/components/checkout-your-turn.ts \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx

# 2. MUST grep
grep -c "return_to_vendor" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1+ (purposeBar 내부)

grep -c "const getPurposeBarClass" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0

grep -c "import.*getPurposeBarClass" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1

grep -c "text-brand-info font-medium" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 0

grep -n "CHECKOUT_YOUR_TURN_BADGE_TOKENS.summary" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1+ hit

grep -n 'data-testid="your-turn-summary"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1 hit

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: 3
```

---

## Acceptance

루프 완료 조건 = MUST 14개 모두 PASS. purposeBar가 `CheckoutPurpose` 전수 커버 + YourTurn 요약 카운트가 토큰 SSOT 경유.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.5 · `checkout-fsm-exhaustive-satisfies.md` — **선행**. `stepCount`에 `return_to_vendor` 추가와 동일 원칙.
- Sprint 2.3·2.4 · `checkout-i18n-tab-badge-tokens.md` — i18n 키 + tab badge alert variant.
- Sprint 2.5·2.6·2.7 · `checkout-rhythm-focus-inbound-tokens.md` — rhythm/focus/inbound.
- Sprint 4.2 · Row 3-zone 재구조화 — 본 contract의 토큰 정돈이 선행되어야 레이아웃 교체 시 단일 소스만 수정.
