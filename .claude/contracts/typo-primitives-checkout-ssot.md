# Contract: typo-primitives-checkout-ssot (78-1)

**Slug**: typo-primitives-checkout-ssot  
**Date**: 2026-04-21  
**Mode**: 1 (Lightweight)

## Scope

타이포 primitives 확장 (`2xs`) + semantic MICRO_TYPO 3종 + checkout.ts 하드코딩 7곳 제거 + 소비자 컴포넌트 정리.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `grep "text-\[[0-9]+px\]" apps/frontend/lib/design-tokens/components/checkout.ts` → 0 hit | grep |
| M2 | `grep "text-\[[0-9]+px\]" apps/frontend/components/checkouts` → 0 hit | grep |
| M3 | `pnpm --filter frontend exec tsc --noEmit` → exit 0 | tsc |
| M4 | `primitives.ts`에 `'2xs'` 키 존재 | grep |
| M5 | `semantic.ts`에 `MICRO_TYPO` export 및 badge/label/caption 3종 필드 존재 | grep |
| M6 | 변경 파일 수 ≤ 8 | git diff --name-only |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `SIZE_PRIMITIVES`에 `pagination` 항목 추가 |
| S2 | `WIDTH_PRIMITIVES` export 신규 (hairline) |
| S3 | `CheckoutListSkeleton.tsx`의 `w-[Npx]` → 표준 Tailwind 유틸리티 |
| S4 | `checkout.ts`의 `w-[3px]` → 명명된 토큰 참조 |
| S5 | `checkout.ts`의 `w-[30px] h-[30px]` → 명명된 토큰 참조 |

## Out of Scope (78-3에서 처리)

- RENTAL_FLOW_INLINE_TOKENS circle/arrow/stepLabel 컴포넌트 재설계
- CHECKOUT_MINI_PROGRESS dot 내부 숫자 sr-only 이동
- STEPPER_LABEL_MAP SSOT 승격
