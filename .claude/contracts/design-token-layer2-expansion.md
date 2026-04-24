---
slug: design-token-layer2-expansion
mode: 1
created: 2026-04-24
---

# Contract: Design Token Layer 2 Expansion (PR-3)

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `tsc --noEmit` 0 errors | `pnpm --filter frontend run tsc --noEmit` |
| M2 | `ELEVATION_TOKENS.surface` 5단 존재: flush/raised/floating/emphasis/overlay | grep ELEVATION_TOKENS semantic.ts |
| M3 | `TYPOGRAPHY_TOKENS`에 hero/subheading/kpi/kpiLabel 속성 존재 | grep 'kpi\|hero\|subheading\|kpiLabel' semantic.ts |
| M4 | `DIMENSION_TOKENS`에 accentBar, stickyHeaderOffset 추가 | grep 'accentBar\|stickyHeaderOffset' semantic.ts |
| M5 | `CHECKOUT_STATS_VARIANTS.hero` 존재 | grep 'hero:' checkout.ts |
| M6 | `CHECKOUT_ROW_TOKENS.hover` 존재 (normal/pending) | grep 'hover:' checkout.ts |
| M7 | `checkout-icons.ts` 생성 + `CHECKOUT_ICON_MAP` export | ls + grep CHECKOUT_ICON_MAP |
| M8 | brand `progress`/`archive` BRAND_CLASS_MATRIX 추가 | grep 'progress\|archive' brand.ts |
| M9 | globals.css에 --brand-color-progress, --brand-color-archive CSS 변수 추가 (`:root` + `.dark`) | grep 'brand-color-progress\|brand-color-archive' globals.css |
| M10 | index.ts에 checkout-icons.ts re-export 추가 | grep 'CHECKOUT_ICON_MAP' index.ts |
| M11 | hex 하드코딩 0건 (brand.ts BRAND_COLORS_HEX 레퍼런스 참조 목적 제외) | grep -n '#[0-9a-fA-F]\{6\}' 신규/수정 코드 |
| M12 | `WORKFLOW_PANEL_TOKENS` 기존 유지 (파괴 없음) + NEXT_STEP_PANEL_TOKENS 추가 | grep WORKFLOW_PANEL_TOKENS workflow-panel.ts |

## SHOULD Criteria (실패 시 루프 차단 없음 — tech-debt 기록)

| # | Criterion |
|---|-----------|
| S1 | CHECKOUT_STEPPER_TOKENS.status.next 값이 ring-dashed 포함 (Tailwind utility 없으면 globals.css에 추가) |
| S2 | TYPOGRAPHY_TOKENS export에 TypographyVariant 확장 타입 포함 |
| S3 | CHECKOUT_STATS_VARIANTS.hero의 container/kpi/label 토큰이 semantic.ts 토큰 경유 |

## Out of Scope
- grid 레이아웃 적용 (PR-7 scope)
- NC elevation 승격 (PR-10 scope)
- 기존 컴포넌트 consume 코드 수정 (PR-5·6·7 scope)
