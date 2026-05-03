# Design Token 검증 — Step 상세 (구 파일, 분리 완료)

> 2026-05-03 이 파일의 내용은 4개의 sub-domain 파일로 이전되었습니다.
> 이 파일은 링크 호환성을 위해 유지됩니다.

## 이전 경로

| 구 Step | 새 파일 |
|---------|---------|
| Step 1 (transition-all) | [motion.md](motion.md#step-1-transition-all-금지) |
| Step 2 (focus-visible) | [aria-wcag.md](aria-wcag.md#step-2-focus-visible-우선) |
| Step 3 (Layer 3 import) | [component-tokens.md](component-tokens.md#step-3-layer-3-함수-import-경로--barrel-직접-서브패스-금지) |
| Step 4 (마이그레이션) | [component-tokens.md](component-tokens.md#step-4-마이그레이션된-컴포넌트-토큰-사용) |
| Step 5, 5b | [component-tokens.md](component-tokens.md#step-5-layer-3-컴포넌트-토큰-아키텍처--barrel-export) |
| Step 6 (TRANSITION_PRESETS) | [motion.md](motion.md#step-6-transition_presets--gettransitionclasses-속성-지정--하드코딩-트랜지션) |
| Step 7 (Architecture v3) | [component-tokens.md](component-tokens.md#step-7-architecture-v3-visual-feedback--한국어-label-잔존) |
| Step 8 (헤더 타이포그래피) | [component-tokens.md](component-tokens.md#step-8-페이지-헤더-타이포그래피-ssot) |
| Step 9 (easing 3자) | [primitives.md](primitives.md#step-9-easing_css_vars-3자-동기화) |
| Step 10 (Tailwind v4) | [component-tokens.md](component-tokens.md#step-10-tailwind-v4-호환성) |
| Step 11 (Enum↔Token) | [component-tokens.md](component-tokens.md#step-11-enum--token-record-n-way-동기화) |
| Step 12 (globals 3-way) | [primitives.md](primitives.md#step-12-globalscss-theme--primitivests-3-way-동기화) |
| Step 12 (워크플로우 인덱스) | [component-tokens.md](component-tokens.md#step-12-워크플로우-상태-인덱스-하드코딩-금지) |
| Step 13 (dead token) | [component-tokens.md](component-tokens.md#step-13-dead-token-탐지) |
| Step 14 (Collapsible) | [aria-wcag.md](aria-wcag.md#step-14-collapsiblelabeldisclosure-button-wcag-21-패턴) |
| Step 15 (stagger) | [motion.md](motion.md#step-15-staggerfadeinitem--getstaggerfadeinstyle-ssot-패턴) |
| Step 16 (SPACING_RHYTHM) | [component-tokens.md](component-tokens.md#step-16-spacing_rhythm_tokens-축-분리-필드--record-타입-narrowing) |
| Step 17 (hex) | [primitives.md](primitives.md#step-17-hex-색상-직접-하드코딩-감지-ap-01ap-04) |
| Step 19 (ring-dashed) | [component-tokens.md](component-tokens.md#step-19-ring-dashed--ring-1-조합-안티패턴) |
| Step 20 (BRAND_CLASS_MATRIX) | [primitives.md](primitives.md#step-20-brand_class_matrix-신규-색상-추가--3곳-동시-갱신) |
| Step 21 (dark prefix) | [primitives.md](primitives.md#step-21-design-token-파일-내-dark-prefix-in-brand-token-금지) |
| Step 22 (동적 보간) | [primitives.md](primitives.md#step-22-callout_tokens-text-brand-동적-보간-금지) |
| Step 32 (MENU_ITEM_TOKENS) | [component-tokens.md](component-tokens.md#step-32-menu_item_tokensdestructive-ssot--dropdownmenuitem-파괴적-액션-하드코딩-금지) |
