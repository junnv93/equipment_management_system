---
slug: design-token-layer2-expansion
iteration: 1
verdict: PASS
---

# Evaluation Report

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc --noEmit 0 errors | PASS | `pnpm --filter frontend exec tsc --noEmit` exit code 0, no output |
| M2 | ELEVATION_TOKENS.surface 5단 (flush/raised/floating/emphasis/overlay) | PASS | semantic.ts:241-247 — 5개 키 모두 존재 확인 |
| M3 | TYPOGRAPHY_TOKENS에 hero/subheading/kpi/kpiLabel 존재 | PASS | semantic.ts:412(hero), 414(subheading), 416(kpi), 418(kpiLabel) |
| M4 | DIMENSION_TOKENS에 accentBar, stickyHeaderOffset 추가 | PASS | semantic.ts:463(accentBar), 465(stickyHeaderOffset) |
| M5 | CHECKOUT_STATS_VARIANTS.hero 존재 | PASS | checkout.ts:502 — `hero:` 객체 정의 확인 |
| M6 | CHECKOUT_ROW_TOKENS.hover 존재 (normal/pending) | PASS | checkout.ts:161-163 — `hover.normal`, `hover.pending` 모두 존재 |
| M7 | checkout-icons.ts 생성 + CHECKOUT_ICON_MAP export | PASS | 파일 존재, checkout-icons.ts:25 `export const CHECKOUT_ICON_MAP` |
| M8 | brand.ts progress/archive BRAND_COLORS_HEX + BRAND_CLASS_MATRIX 모두 존재 | PASS | brand.ts:43,45 (HEX), 231-249 (CLASS_MATRIX) |
| M9 | globals.css에 --brand-color-progress/archive (:root + .dark) | PASS | :root 섹션 line 412-413, .dark 섹션 line 489-490 각각 존재. `--color-brand-progress/archive` 참조 변수도 line 87-88에 추가됨 |
| M10 | index.ts에 CHECKOUT_ICON_MAP re-export | PASS | index.ts:733 `CHECKOUT_ICON_MAP` re-export 확인 |
| M11 | hex 하드코딩 0건 (수정 파일 4개) | PASS | semantic.ts, checkout.ts, checkout-icons.ts, workflow-panel.ts 모두 0건 |
| M12 | WORKFLOW_PANEL_TOKENS 유지 + NEXT_STEP_PANEL_TOKENS 추가 | PASS | workflow-panel.ts:15(WORKFLOW_PANEL_TOKENS), 71(NEXT_STEP_PANEL_TOKENS) 모두 존재 |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | CHECKOUT_STEPPER_TOKENS.status.next에 ring-dashed 포함 | FAIL | checkout.ts:373 — `next.node`에 `ring-2 ring-brand-info/40`만 있음. `ring-dashed` 없음. Tech-debt 등록 필요 |
| S2 | TYPOGRAPHY_TOKENS에 TypographyVariant 확장 타입 포함 | FAIL | semantic.ts에 `TypographyVariant` type 정의 없음. `ElevationSurface` 등 다른 타입은 있으나 TypographyVariant는 누락. Tech-debt 등록 필요 |
| S3 | CHECKOUT_STATS_VARIANTS.hero의 kpi/label이 semantic.ts 토큰 경유 | PASS | checkout.ts:505-506 — `kpi: \`${TYPOGRAPHY_TOKENS.kpi} text-5xl\``, `label: TYPOGRAPHY_TOKENS.kpiLabel` — TYPOGRAPHY_TOKENS 직접 참조 확인 |

## Issues Found

### SHOULD S1 — ring-dashed 미적용 (tech-debt)
- **위치**: `apps/frontend/lib/design-tokens/components/checkout.ts:373`
- **현재값**: `node: 'bg-brand-info/5 ring-2 ring-brand-info/40'`
- **계약 요구**: `ring-dashed` 포함
- **수정 방법**: `next.node`에 `ring-dashed` 클래스 추가. Tailwind 기본 유틸에 없는 경우 `globals.css`에 `@utility ring-dashed { ... }` 추가
- **심각도**: SHOULD (루프 차단 없음)

### SHOULD S2 — TypographyVariant 타입 누락 (tech-debt)
- **위치**: `apps/frontend/lib/design-tokens/semantic.ts`
- **현재 상태**: `ElevationLayer`, `ElevationSurface` 등은 정의되어 있으나 `TypographyVariant = keyof typeof TYPOGRAPHY_TOKENS` 미추가
- **수정 방법**: semantic.ts 하단 타입 내보내기 섹션에 `export type TypographyVariant = keyof typeof TYPOGRAPHY_TOKENS;` 추가
- **심각도**: SHOULD (루프 차단 없음)

## Overall Verdict

**PASS** — MUST 기준 12개 전부 통과. SHOULD 기준 2개(S1, S2) 미충족이나 계약상 루프 차단 대상 아님. 두 항목은 tech-debt 등록 권고.
