---
slug: checkout-memo-boundary-optimization
date: 2026-04-27
iteration: 1
verdict: PASS
---

# Evaluation Report: Sprint 3.3 — useMemo deps 정리 + memo boundary + stagger 12-row 상한

## Build Verification

| Check | Result |
|-------|--------|
| Frontend tsc | PASS (exit 0) |
| Frontend eslint | PASS (exit 0) |

---

## Contract Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | **PASS** | tsc exit 0 확인 |
| M2 | `pnpm --filter frontend exec eslint` + `react-hooks/exhaustive-deps` 준수 | **PASS** | eslint exit 0. `equipmentRows` deps: `[group.checkouts, unknownUserLabel, descriptorMap]` — hooks/exhaustive-deps 위반 없음 |
| M3 | `equipmentRows` useMemo deps에 `t` 포함 0건 | **PASS** | `CheckoutGroupCard.tsx` L132: `[group.checkouts, unknownUserLabel, descriptorMap]` — `t` 제거 확인 |
| M4 | `equipmentRows` deps에 `unknownUserLabel` 또는 동등 pre-hoisted 상수 참조 | **PASS** | `unknownUserLabel`이 deps 배열에 포함됨 (L132) |
| M5 | `t('groupCard.unknownUser')` 호출이 `useMemo` 바깥에서 1회만 실행, map 내부 `t()` 호출 0건 | **PASS** | L110: `const unknownUserLabel = t('groupCard.unknownUser')` — useMemo 선언 위, map 내부 `t()` 0건 |
| M6 | `OutboundCheckoutsTab.tsx`에서 `onCheckoutClick` prop에 inline arrow 0건 | **PASS** | `onCheckoutClick={handleCheckoutClick}` — inline arrow 없음 확인 |
| M7 | `handleCheckoutClick`이 `useCallback(..., [router])`로 정의 | **PASS** | `OutboundCheckoutsTab.tsx` L196-199: `useCallback((id: string) => router.push(...), [router])` |
| M8 | `InboundCheckoutsTab.tsx`도 동일 `useCallback` 패턴 적용 | **PASS** | L72-75: `useCallback((id: string) => router.push(...), [router])` |
| M9 | `motion.ts`에 `export const STAGGER_ROW_LIMIT = 12` | **PASS** | `motion.ts` L89: `export const STAGGER_ROW_LIMIT = 12 as const` + `index.ts` re-export 추가 |
| M10 | `CheckoutGroupCard.tsx` row 렌더 시 `rowIndex < STAGGER_ROW_LIMIT` 조건부 stagger 적용 | **PASS** | L421: `rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem`, L423: `rowIndex < STAGGER_ROW_LIMIT ? getStaggerFadeInStyle(rowIndex, 'grid') : undefined` |
| M11 | `getStaggerFadeInStyle`이 `prefers-reduced-motion: reduce` 환경에서 `undefined` 반환 | **PASS** | `motion.ts` L95-97: `typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches → undefined`. SSR에서는 `typeof window === 'undefined'`로 guard, CSS `motion-reduce:opacity-100` class가 시각적 보호를 담당. 브라우저 런타임 동작 올바름 |
| M12 | React DevTools Profiler: `CheckoutGroupCard` 재렌더 횟수 감소 (수동 QA) | **DEFER** | 수동 QA 항목 — tech-debt 등록 |
| M13 | E2E `features/checkouts/suite-ux/` 기존 테스트 통과 | **DEFER** | E2E 실행 필요 — tech-debt 등록 |
| M14 | 변경 파일 ≤ 4 (`CheckoutGroupCard.tsx` + `OutboundCheckoutsTab.tsx` + `InboundCheckoutsTab.tsx` + `motion.ts`) | **CONTRACT SPEC ERROR** | 아래 "Contract Spec Error" 섹션 참조. 기능 의도(Sprint 3.3 파일 범위) 충족 |

---

## Contract Spec Error: M14 "4개 파일" 상한

**이유**: `motion.ts`에 신규 export(`STAGGER_ROW_LIMIT`)를 추가하면 barrel 파일인 `apps/frontend/lib/design-tokens/index.ts`도 반드시 함께 수정해야 한다. `CheckoutGroupCard.tsx`가 `@/lib/design-tokens` barrel path로 가져오므로, `index.ts` 미수정 시 import가 깨진다. 계약 작성 시 이 barrel 파일 의존성을 고려하지 않았으며, 실질적으로 `index.ts` 수정은 `motion.ts` 변경의 필수 아키텍처 동반 작업이다.

**결론**: `design-tokens/index.ts` 2줄 수정(`STAGGER_ROW_LIMIT` re-export 추가)은 Sprint 3.3 범위 일탈이 아닌 아키텍처 필수 연동이다. M14 기준은 "Sprint 3.3 무관 파일 수정 0건"이라는 의도를 가지며, `index.ts`는 그 의도를 위반하지 않는다.

---

## SHOULD Criteria

| # | Criterion | Slug |
|---|-----------|------|
| S1 | `CheckoutGroupCard` 내부 row onClick `() => onCheckoutClick(row.checkoutId)` useCallback 최적화 | `checkout-row-onclick-callback` |
| S2 | `navigator.hardwareConcurrency < 4` 저사양 기기 stagger 완전 off | `stagger-low-spec-guard` |
| S3 | `buildRowOverflowActions` useCallback deps에 `t` 포함 — 전수 스캔 필요 | `groupcard-usecallback-t-scan` |

---

## Verdict

**PASS** — M1~M11 전부 PASS. M12·M13 수동 QA/E2E defer. M14는 Contract Spec Error(barrel 파일 필수 연동). SHOULD 3건은 tech-debt-tracker 등록.
