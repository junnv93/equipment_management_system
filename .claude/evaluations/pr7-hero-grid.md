---
slug: pr7-hero-grid
date: 2026-04-24
iteration: 1
verdict: PASS
---

# Evaluation: PR-7 Hero Grid

## Build Verification
| Check | Result |
|-------|--------|
| tsc --noEmit | PASS |
| build | PASS |

## Contract Criteria
| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M-1 tsc | PASS | `pnpm --filter frontend exec tsc --noEmit` 종료코드 0, 출력 없음 |
| M-2 heroVariantKey logic | PASS | L206: `summary.overdue > 0 ? 'overdue' : null` — 계약 조건 정확히 일치 |
| M-3 grid classes | PASS | L213: `heroVariantKey ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'` — 양쪽 분기 계약 일치 |
| M-4 hero elevation+container | PASS | L230: `CHECKOUT_STATS_VARIANTS.hero.surface` (hero 시), L234: `CHECKOUT_STATS_VARIANTS.hero.container` (hero 시). non-hero는 `variantTokens.elevation` 유지 (L231-233) |
| M-5 hero typography | PASS | L289: `CHECKOUT_STATS_VARIANTS.hero.kpi` (isHero 시), L291: `variantTokens.valueTypography` (non-hero 시) |
| M-6 aria-label | PASS | L286: `aria-label={\`${t(card.labelKey)} ${card.value}건\`}` — value div에 번역값 + 건 형식 적용. Card 레벨(L254)은 `t(card.labelKey)` 단독 사용 (계약 대상은 value div) |
| M-7 regression | PASS | build PASS, heroVariantKey=null 분기는 기존 grid 클래스 및 variantTokens 경로 그대로 유지 |
| S-1 hero sub-label | PASS | L302: `isHero ? CHECKOUT_STATS_VARIANTS.hero.label : MICRO_TYPO.label` — hero.label 토큰 적용 |
| S-2 no transition-all | PASS | OutboundCheckoutsTab.tsx 내 `transition-all` 없음. `CHECKOUT_MOTION.statsCard`는 `TRANSITION_PRESETS.fastBorderBg`(`getTransitionClasses('fast', ['border-color', 'background-color'])`)로 specific properties만 사용 |

## Issues Found

없음. 모든 MUST·SHOULD 기준 통과.

## Summary

PR-7 hero grid 구현은 계약의 모든 MUST 및 SHOULD 기준을 충족한다. heroVariantKey 선택 로직, 그리드 레이아웃 분기, 토큰 적용(surface/container/kpi/label), aria-label 포맷, 회귀 부재 모두 정상이며 `transition-all` 위반도 없다.
