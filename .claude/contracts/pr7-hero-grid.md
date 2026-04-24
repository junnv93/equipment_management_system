---
slug: pr7-hero-grid
mode: 1
date: 2026-04-24
---

# Contract: PR-7 Checkout Stats Hero Grid

## Scope

`OutboundCheckoutsTab.tsx` 단일 파일에 CHECKOUT_STATS_VARIANTS.hero 토큰 적용.

## MUST Criteria

### M-1: TypeScript PASS
- `pnpm --filter frontend run tsc --noEmit` 종료코드 0

### M-2: heroVariantKey 선택 로직
- `summary.overdue > 0` 이면 `heroVariantKey === 'overdue'`
- `summary.overdue === 0` 이면 `heroVariantKey === null` (그리드 기존 유지)

### M-3: Hero 그리드 레이아웃
- heroVariantKey 존재 시 grid = `grid-cols-4 sm:grid-cols-6 lg:grid-cols-6`
- heroVariantKey null 시 grid = `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` (기존 유지)

### M-4: Hero 카드 클래스 적용
- `isHero=true` 카드에 `CHECKOUT_STATS_VARIANTS.hero.surface` (elevation)
- `isHero=true` 카드에 `CHECKOUT_STATS_VARIANTS.hero.container` (col-span)
- 기존 `elevation` 토큰은 hero가 아닌 카드에만 유지

### M-5: Hero 타이포그래피
- `isHero=true` 카드 value에 `CHECKOUT_STATS_VARIANTS.hero.kpi` 적용
- 기존 non-hero는 `variantTokens.valueTypography` 유지

### M-6: aria-label 수정
- value div의 `aria-label`이 번역 키 문자열이 아닌 `t(card.labelKey)` 번역값 사용
- 형식: `` `${t(card.labelKey)} ${card.value}건` ``

### M-7: 회귀 없음
- `pnpm --filter frontend run build` PASS
- heroVariantKey null일 때 기존 동작 동일

## SHOULD Criteria

### S-1: hero sub-label 타이포그래피
- `isHero=true` 카드 sub-label에 `CHECKOUT_STATS_VARIANTS.hero.label` 적용

### S-2: transition-all 0건
- 추가된 클래스에 `transition-all` 없음
