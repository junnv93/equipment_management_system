---
name: verify-design-tokens
description: Verifies Design Token 3-Layer architecture compliance — no transition-all (use specific properties), focus-visible over focus, correct import paths, layer reference chain (primitive→semantic→component). Run after adding/modifying components.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 컴포넌트명]'
---

# Design Token 3-Layer 아키텍처 검증

## Purpose

Design Token System v2의 3계층 아키텍처(Primitives → Semantic → Components)가 올바르게 준수되는지 검증합니다:

1. **transition-all 금지** — specific property transitions 또는 `getTransitionClasses()` 사용
2. **focus-visible 우선** — `focus:ring` 대신 `focus-visible:` 사용
3. **Layer 3 함수 import 경로** — `@/lib/design-tokens`에서 import
4. **마이그레이션된 컴포넌트 토큰 사용** — 60개 컴포넌트의 토큰 유지 확인
5. **Layer 3 토큰 아키텍처** — Layer 2(semantic)만 참조하는지
6. **TRANSITION_PRESETS 우선** — `getTransitionClasses` 대신 사전 계산 상수 사용

## When to Run

- 새로운 컴포넌트를 추가한 후
- 기존 컴포넌트의 스타일을 수정한 후
- design-tokens 시스템을 변경한 후
- PR 전 최종 점검 시

## Related Files

| File | Purpose |
|------|---------|
| `apps/frontend/lib/design-tokens/index.ts` | Public API (Layer 1-3 export) |
| `apps/frontend/lib/design-tokens/primitives.ts` | Layer 1 원시값 |
| `apps/frontend/lib/design-tokens/semantic.ts` | Layer 2 의미론적 토큰 |
| `apps/frontend/lib/design-tokens/motion.ts` | Motion 유틸리티 (getTransitionClasses, TRANSITION_PRESETS) |
| `apps/frontend/lib/design-tokens/visual-feedback.ts` | Visual Feedback System (Architecture v3) |
| `apps/frontend/lib/design-tokens/components/*.ts` | Layer 3 컴포넌트 토큰 (28개 파일) |
| `apps/frontend/lib/design-tokens/components/checkout-icons.ts` | Lucide 아이콘 SSOT — CHECKOUT_ICON_MAP |
| `apps/frontend/styles/globals.css` | Brand CSS 변수 + easing CSS 변수 + Tailwind v4 `@theme`/`@theme inline` 토큰 |
| `apps/frontend/postcss.config.js` | Tailwind v4 PostCSS 플러그인 (`@tailwindcss/postcss` 단일) |
| `apps/frontend/package.json` | Tailwind v4 의존성 (`tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`) |
| 마이그레이션된 컴포넌트 70여 개 | [references/migrated-components.md](references/migrated-components.md) 참조 |

---

## Workflow

### Step 1: transition-all 금지

shadcn/ui 제외 모든 컴포넌트에서 `transition-all` 미사용 확인.

**PASS:** 0개 결과. **FAIL:** `transition-all` → `transition-colors` 또는 `getTransitionClasses()` 변경.

상세: [references/motion.md](references/motion.md#step-1-transition-all-금지)

---

### Step 2: focus-visible 우선

shadcn/ui와 SkipLink 제외 모든 컴포넌트에서 `focus-visible:` 사용 확인.

**PASS:** `focus:ring`/`focus:outline`/`focus:bg`/`focus:text` 0개. **FAIL:** `focus-visible:` 변경.

> `focus:text-destructive` (DropdownMenuItem destructive 아이템)도 탐지 대상 — Step 32의 MENU_ITEM_TOKENS 처방과 함께 적용.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-2-focus-visible-우선)

---

### Step 3: Layer 3 함수 import 경로 + barrel 직접 서브패스 금지

컴포넌트가 design-tokens 내부 파일을 직접 서브패스로 import하지 않는지 확인. 모든 소비처는 반드시 `@/lib/design-tokens` barrel 경유.

**PASS:** 0건. **FAIL:** 서브패스 직접 import 존재 → barrel 경유로 수정 + index.ts에 re-export 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-3-layer-3-함수-import-경로--barrel-직접-서브패스-금지)

---

### Step 4: 마이그레이션된 컴포넌트 토큰 사용

60개 마이그레이션 컴포넌트에서 design-tokens import 존재 확인.

**PASS:** 모든 컴포넌트에 import. **FAIL:** 토큰 미사용 → 재마이그레이션.

상세: [references/component-tokens.md](references/component-tokens.md#step-4-마이그레이션된-컴포넌트-토큰-사용)

---

### Step 5: Layer 3 컴포넌트 토큰 아키텍처 + barrel export

Layer 3 파일이 Layer 2만 참조하는지 + index.ts barrel export 확인.

**PASS:** primitives 직접 참조 0개. `toTailwindSize`/`toTailwindGap`은 `../utils` (Layer 1.5)에서만 import. **FAIL:** semantic 경유로 변경 또는 primitives 직접 import 잔존.

상세: [references/component-tokens.md](references/component-tokens.md#step-5-layer-3-컴포넌트-토큰-아키텍처--barrel-export)

---

### Step 6: TRANSITION_PRESETS + getTransitionClasses 속성 지정 + 하드코딩 트랜지션

- **6a:** Layer 3에서 `getTransitionClasses` 런타임 호출 0개 → TRANSITION_PRESETS 사용
- **6b:** `getTransitionClasses` 호출 시 properties 배열 필수
- **6c:** `components/ui/` 외부에서 하드코딩 transition 클래스 0개
- **6d:** `index * N` raw 스태거 딜레이 0개 → `getStaggerDelay(index, type)` SSOT 함수 사용

상세: [references/motion.md](references/motion.md#step-6-transition_presets--gettransitionclasses-속성-지정--하드코딩-트랜지션)

---

### Step 7: Architecture v3 Visual Feedback + 한국어 label 잔존

- **7a:** Architecture v3 배지 패턴 — `getNotificationBadgeClasses(count)` 경유, 직접 urgency 클래스 인라인 0개
- **7b:** count/time/status 기반 Urgency 함수 사용 확인
- **7c:** Design Token에 한국어 `label` 필드 잔존 0개 (→ `labelKey` 사용)

상세: [references/component-tokens.md](references/component-tokens.md#step-7-architecture-v3-visual-feedback--한국어-label-잔존)

---

### Step 8: 페이지 헤더 타이포그래피 SSOT

- **8a:** h1 하드코딩 0개 → `PAGE_HEADER_TOKENS.title` 사용
- **8b:** 부제목 하드코딩 0개 → 토큰 subtitle 사용
- **8c:** 페이지 제목에 아이콘 미포함 (설정 페이지 면제)
- **8d:** 모듈별 헤더 토큰이 `...PAGE_HEADER_TOKENS` spread

상세: [references/component-tokens.md](references/component-tokens.md#step-8-페이지-헤더-타이포그래피-ssot)

---

### Step 9: EASING_CSS_VARS 3자 동기화

globals.css / primitives.ts / motion.ts 3곳의 easing 수가 동일한지 (현재 7개).

**PASS:** 3개 수 동일. **FAIL:** drift → 누락된 곳에 easing 추가.

상세: [references/primitives.md](references/primitives.md#step-9-easing_css_vars-3자-동기화)

---

### Step 10: Tailwind v4 호환성

v4 마이그레이션(2026-04, PR #180) 이후 다음 v3 잔재가 재도입되지 않았는지 확인.

- **10a:** `bg-opacity-*`, `text-opacity-*` 등 v4 제거 유틸리티 0 hits
- **10b:** `tailwind.config.*` 파일 존재 금지 + `@tailwind base|components|utilities` 디렉티브 0 hits
- **10c:** `tailwindcss-animate` 재도입 0 hits
- **10d:** `postcss.config.js`는 `@tailwindcss/postcss` 단일 플러그인

**PASS:** 위 4개 모두 통과. **FAIL:** 해당 패턴 제거 또는 v4 동등물로 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-10-tailwind-v4-호환성)

---

### Step 11: Enum ↔ Token Record N-way 동기화

`@equipment-management/schemas` 의 status/role/action enum 값 추가/제거 시 모든 토큰 맵에 동시 반영. loose `Record<string, ...>` 맵은 TypeScript 미탐지 — grep 필수.

**PASS:** enum 값 ⊆ 모든 N개 record 키. **FAIL:** 누락된 키를 모든 loose record + i18n 양 언어에 동시 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-11-enum--token-record-n-way-동기화)

---

### Step 12: globals.css @theme ↔ primitives.ts 3-way 동기화

Tailwind v4 CSS-first에서 `globals.css @theme` CSS 변수 값이 `primitives.ts` 숫자 상수와 일치해야 한다.

**PASS:** 각 CSS 변수 값이 primitives.ts 숫자와 단위 변환 후 일치. **FAIL:** 불일치 시 primitives.ts를 SSOT로 간주하고 globals.css 값 수정.

상세: [references/primitives.md](references/primitives.md#step-12-globalscss-theme--primitivests-3-way-동기화)

---

### Step 12b: 워크플로우 상태 인덱스 하드코딩 금지

도메인 워크플로우 상태 인덱스를 배열 SSOT에서 파생하지 않고 직접 숫자로 하드코딩 금지.

**PASS:** 0 hits. **FAIL:** `Object.fromEntries(STEPS.map(...))` 파생으로 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-12-워크플로우-상태-인덱스-하드코딩-금지)

---

### Step 13: Dead Token 탐지

`components/*.ts`에 정의되었지만 컴포넌트/페이지에서 0회 사용되는 dead token.

**PASS (INFO):** dead token 0개. **FAIL 기준:** dead token ≥ 5개. tech-debt-tracker 등록 권고.

상세: [references/component-tokens.md](references/component-tokens.md#step-13-dead-token-탐지)

---

### Step 14: Collapsible/Disclosure button WCAG 2.1 패턴

`button[aria-expanded]`는 반드시 `aria-controls`와 쌍을 이루어야 한다. `aria-controls` 값은 열고/닫는 콘텐츠 영역의 `id`와 일치해야 한다.

**PASS:** `aria-expanded`가 있는 모든 button/Button에 `aria-controls` 존재. **FAIL:** `aria-expanded` 단독 사용 → `contentId` prop 또는 인라인 `aria-controls` 추가.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-14-collapsiblelabeldisclosure-button-wcag-21-패턴)

---

### Step 14b: `requestAnimationFrame` + ref focus transfer null guard

배너/모달 닫기 후 WCAG 2.1 SC 2.4.3 포커스 이전 패턴에서 null guard 누락 시 런타임 에러.

**PASS:** 모든 `rAF` 내 focus 호출에 null guard 존재. **FAIL:** `el.focus()` bare 호출 → `el?.focus()` 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-14b-requestanimationframe--ref-focus-transfer-null-guard)

---

### Step 15: `staggerFadeInItem` + `getStaggerFadeInStyle` SSOT 패턴

섹션 stagger는 `ANIMATION_PRESETS.staggerFadeInItem` + `getStaggerFadeInStyle(index, type)` 조합 SSOT. raw 곱셈 하드코딩 금지.

**PASS:** raw index 곱셈 0건, `'link'` ctaKind 잔재 0건. **FAIL:** `getStaggerFadeInStyle(index, 'section')` 또는 `NC_SPACING_TOKENS.detail.*` SSOT 사용.

상세: [references/motion.md](references/motion.md#step-15-staggerfadeinitem--getstaggerfadeinstyle-ssot-패턴)

---

### Step 16: SPACING_RHYTHM_TOKENS 축 분리 필드 + Record 타입 narrowing

- **16a:** `.replace('p', 'px')` 안티패턴 금지 → `SPACING_RHYTHM_TOKENS.<density>.paddingX` 직접 참조
- **16b:** N×M 조합 타입을 `NCGuidanceKeyReachable`로 narrowing

**PASS:** `.replace('p', 'px')` 0건, `Record<NCGuidanceKey, ...>` 0건. **FAIL:** 해당 패턴 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-16-spacing_rhythm_tokens-축-분리-필드--record-타입-narrowing)

---

### Step 17: hex 색상 직접 하드코딩 감지 (AP-01·AP-04)

`apps/frontend/components/checkouts/**`에서 hex 색상 직접 하드코딩.

**PASS**: 출력 없음. **FAIL**: `[⑨ hex 색상]` 항목 → `BRAND_CLASS_MATRIX` 또는 Tailwind semantic token으로 교체.

상세: [references/primitives.md](references/primitives.md#step-17-hex-색상-직접-하드코딩-감지-ap-01ap-04)

---

### Step 18: UI 파생 상태 값 객체 `satisfies` 제약 + barrel export

`*StatusValues` 상수는 반드시 `as const satisfies Record<string, *Key>` 제약 + `index.ts` barrel export.

**PASS:** 모든 `*StatusValues`에 `satisfies` + barrel. **FAIL:** `satisfies` 추가 / index.ts export 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-18-ui-파생-상태-값-객체-satisfies-제약--barrel-export)

---

### Step 19: ring-dashed + ring-1 조합 안티패턴

`--tw-ring-shadow` 무효화는 `globals.css @layer utilities .ring-dashed` 내에서만. 컴포넌트 인라인 override 금지.

**PASS:** 컴포넌트에서 `--tw-ring-shadow` 인라인 재정의 0건. **FAIL:** `globals.css @layer utilities .ring-dashed` 정의로 이전.

상세: [references/component-tokens.md](references/component-tokens.md#step-19-ring-dashed--ring-1-조합-안티패턴)

---

### Step 20: BRAND_CLASS_MATRIX 신규 색상 추가 — 3곳 동시 갱신

`BRAND_COLORS_HEX` 키 추가 시 `BRAND_CLASS_MATRIX` + `globals.css :root/.dark` 3곳 동시 갱신 필수.

**PASS:** `satisfies Record<SemanticColorKey, BrandClassSet>` 존재 + globals.css CSS 변수 모두 존재. **FAIL:** 3곳 동시 갱신.

상세: [references/primitives.md](references/primitives.md#step-20-brand_class_matrix-신규-색상-추가--3곳-동시-갱신)

---

### Step 21: design-token 파일 내 dark: prefix in brand token 금지

`components/*.ts` 파일 내 brand 토큰 정의에서 `dark:bg-brand-*` 등 금지 (CSS 변수가 자동 전환).

**PASS:** 0건. **FAIL:** `dark:` prefix 제거.

상세: [references/primitives.md](references/primitives.md#step-21-design-token-파일-내-dark-prefix-in-brand-token-금지)

---

### Step 22: CALLOUT_TOKENS text-brand-${} 동적 보간 금지

`text-brand-${key}`, `bg-brand-${key}` 동적 보간은 Tailwind JIT purge에서 제거됨. 헬퍼 경유 필수.

**PASS:** 동적 보간 0건. **FAIL:** `getSemanticContainerTextClasses(key)` 또는 정적 토큰 맵으로 교체.

상세: [references/primitives.md](references/primitives.md#step-22-callout_tokens-text-brand-동적-보간-금지)

---

### Step 23: checkout-toast.ts / checkout-your-turn.ts 신규 컴포넌트 토큰 커버리지

index.ts re-export + duration 숫자 인라인 0건 + YourTurnBadge index 경유 import.

**PASS:** 3개 기준 모두 충족. **FAIL:** re-export 누락 / 숫자 인라인 → 토큰 경유 전환.

상세: [references/component-tokens.md](references/component-tokens.md#step-23-checkout-toastts--checkout-your-turnts-신규-컴포넌트-토큰-커버리지)

---

### Step 24: checkout-loading-skeleton.ts 로딩 스켈레톤 토큰 커버리지

index.ts re-export + 3개 스켈레톤 컴포넌트 SSOT 경유 + `motion-reduce:animate-none` + spinner 금지.

**PASS:** 4개 기준 모두 충족. **FAIL/INFO:** 기준 항목별 처방.

상세: [references/component-tokens.md](references/component-tokens.md#step-24-checkout-loading-skeletonts-로딩-스켈레톤-토큰-커버리지)

---

### Step 25: CSS 변수 주입 토큰 fallback 필수

`lib/design-tokens/**`에서 `var(--name)` 패턴에 fallback 값 필수. 주입 누락 시 안전한 기본값 제공.

**PASS:** `var(--name)` fallback 누락 0건. **FAIL:** `,transparent` 또는 `,initial` fallback 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-25-css-변수-주입-토큰-fallback-필수)

---

### Step 26: 사전 생성 룩업 토큰 + `satisfies Record<K, string>` 가드

유한 variant 집합은 모듈 초기화 시 사전 생성 `Record<K, string>` 선언. 함수 호출마다 concat 금지.

**PASS:** 사전 생성 Record에 `as const satisfies` 가드 존재. **FAIL:** function concat → Record 사전 생성 + satisfies 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-26-사전-생성-룩업-토큰--satisfies-recordk-string-가드)

---

### Step 27: NC compact dot 클래스 — `getNCWorkflowCompactDotClasses` SSOT 경유 필수

`NC_WORKFLOW_TOKENS.compactDot.*` 직접 접근 금지. `getNCWorkflowCompactDotClasses(...)` 경유 + index.ts re-export.

**PASS:** compactDot 직접 접근 0건 + index.ts 1건. **FAIL:** 함수 경유로 교체 / index.ts 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-27-nc-compact-dot-클래스--getncworkflowcompactdotclasses-ssot-경유-필수)

---

### Step 28: 컴포넌트 JSX 인라인 brand 리터럴 탐지

JSX `className`에서 `bg-brand-*`/`text-brand-*`/`border-brand-*` 직접 문자열 리터럴 금지. design-token 경유 필수.

**PASS:** 0건. **FAIL:** 해당 token을 Layer 3 파일에 추가 후 경유.

상세: [references/component-tokens.md](references/component-tokens.md#step-28-컴포넌트-jsx-인라인-brand-리터럴-탐지)

---

### Step 29: 크로스 도메인 공유 색상 SSOT + tabBadge alert 토큰 + `satisfies` 강제

- **29a:** 도메인 간 직접 import 0건 (공유 색상 → `semantic.ts` 배치)
- **29b:** `bg-destructive text-destructive-foreground` raw 인라인 0건 → `ALERT_TAB_BADGE_COLOR` 경유
- **29c:** `CHECKOUT_TAB_BADGE_TOKENS` `as const satisfies` 제약 + `ALERT_TAB_BADGE_COLOR` index re-export

상세: [references/component-tokens.md](references/component-tokens.md#step-29-크로스-도메인-공유-색상-ssot--tabbadge-satisfies-강제)

---

### Step 30: FOCUS_TOKENS.ringCurrent — 스테퍼 현재 단계 링 하드코딩 탐지

`ring-2 ring-brand-info ring-offset-2` 직접 조합 금지 → `FOCUS_TOKENS.ringCurrent` 경유.

**PASS:** 0건. **FAIL:** `FOCUS_TOKENS.ringCurrent`로 교체.

상세: [references/primitives.md](references/primitives.md#step-30-focus_tokensringcurrent--스테퍼-현재-단계-링-하드코딩-탐지)

---

### Step 31: callout/aside 요소 `role="alert"` 금지 — `role="status"` 강제

상태 안내 callout/banner: `role="status"` + `aria-live="polite"` 필수. `role="alert"`: AlertDialog 파괴적 작업 전용.

**PASS:** 0건 (callout은 모두 `role="status"`). **FAIL:** `role="status"` + `aria-live="polite"` 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-31-calloutaside-요소-rolealert-금지--rolestatus-강제)

---

### Step 32: MENU_ITEM_TOKENS.destructive SSOT — DropdownMenuItem 파괴적 액션 하드코딩 금지

`text-destructive focus:text-destructive` / `focus-visible:text-destructive` 리터럴 직접 사용 금지.

**PASS:** 리터럴 사용 0건 + 로컬 재정의 0건. **FAIL:** `MENU_ITEM_TOKENS.destructive` import + 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-32-menu_item_tokensdestructive-ssot--dropdownmenuitem-파괴적-액션-하드코딩-금지)

---

### Step 33: DASHBOARD_ENTRANCE/DASHBOARD_MOTION 토큰 + globals.css prefers-reduced-motion

- **33a:** `animationDelay` 인라인 0건 → `DASHBOARD_ENTRANCE.stagger.*Delay` 토큰
- **33b:** `transition-colors` 인라인 0건 → `DASHBOARD_MOTION.*` 토큰
- **33c:** `globals.css`에 `prefers-reduced-motion` 미디어 쿼리 존재
- **33d:** `@source inline()` animation-delay arbitrary 값 JIT 커버

상세: [references/motion.md](references/motion.md#step-33-dashboard_entrancedashboard_motion-토큰--globalscss-prefers-reduced-motion)

---

### Step 34: WAI-ARIA grid 패턴 — `role="grid" > role="row" > role="gridcell"` 3단계 일관성

div 기반 그리드는 `role="grid" > role="row" > role="gridcell"` 3단계 역할 계층 준수 필수.

**PASS:** `role="grid"` 선언 컴포넌트 모두 3단계 동시 존재. **FAIL:** 누락된 role 추가.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-34-wai-aria-grid-패턴--rolegrid--rolerow--rolegridcell-3단계-일관성)

---

### Step 35: `CHECKOUT_ITEM_ROW_TOKENS` zone key `satisfies { ... [key: string]: unknown }` 강제

4-zone grid 핵심 키(`grid`, `zoneStatus`, `zoneIdentity`, `zoneAction`, `miniProgressTooltipButton`) 컴파일 타임 강제.

**PASS:** `satisfies { ... [key: string]: unknown }` 제약 존재. **FAIL:** satisfies 추가.

상세: [references/component-tokens.md](references/component-tokens.md#step-35-checkout_item_row_tokens-zone-key-satisfies---key-string-unknown-강제)

---

### Step 36: `WORKFLOW_PANEL_TOKENS.variant/.actor` `satisfies Record` 완전성 + `WorkflowPanelActorVariant` export

variant 2-way + actor 3-way satisfies 가드 + `WorkflowPanelActorVariant` type export + barrel re-export.

**PASS:** 4개 기준 모두 충족. **FAIL:** satisfies 누락 / 타입 미export / barrel 누락.

상세: [references/component-tokens.md](references/component-tokens.md#step-36-workflow_panel_tokensvariantactor-satisfies-record-완전성--workflowpanelactorvariant-export)

---

### Step 37: Layer 3 토큰 파일 내 ANIMATION_PRESETS 인라인 우회 금지

`motion-safe:animate-* motion-reduce:animate-none` 페어 문자열 Layer 3 파일에서 0건. `ANIMATION_PRESETS.pulse` / `.pulseSoft` 경유 필수.

**PASS:** 0건. **FAIL:** `ANIMATION_PRESETS.pulse` 또는 `.pulseSoft`로 교체.

상세: [references/motion.md](references/motion.md#step-37-layer-3-토큰-파일-내-animation_presets-인라인-우회-금지)

---

### Step 38: AlertBanner severity → ARIA role 분기 패턴 준수

`critical/warning → role="alert"`, `info/none → role="status"` 동적 분기. 정적 하드코딩 금지.

**PASS:** severity-conditional ariaRole 분기 존재. **FAIL:** 조건부 분기로 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-38-alertbanner-severity--aria-role-분기-패턴-준수)

---

### Step 39: `getPageContainerClasses()` variant 필수 인수 — 빈 호출 금지

빈 인수 호출 시 너비 결정 불가. 모든 호출에 명시적 variant 인수 필수.

**PASS:** 0건. **FAIL:** variant 명시.

상세: [references/component-tokens.md](references/component-tokens.md#step-39-getpagecontainerclasses-variant-필수-인수--빈-호출-금지)

---

### Step 40: hover-inline 버튼 — `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon/rejectIcon` 토큰 경유 필수

`text-green-*`, `text-emerald-*`, `text-red-*` 직접 사용 금지. `APPROVAL_ACTION_BUTTON_TOKENS` 경유.

**PASS:** 0건. **FAIL:** 해당 토큰으로 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-40-hover-inline-버튼--approval_action_button_tokensapproveiconiconrejecticon-토큰-경유-필수)

---

### Step 41: 단일 `role="tablist"` + `className="contents"` ARIA tablist 패턴

`role="tablist"`는 반드시 단일 wrapper에만 적용. `map()` 내부 중복 생성 금지.

**PASS:** 컴포넌트 당 `role="tablist"` 1건. **FAIL:** 단일 wrapper로 통합.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-41-단일-roletablist--classnameconstents-aria-tablist-패턴)

---

### Step 42: NEXT_STEP_PANEL_TOKENS 토큰 체인 — workflow-panel.ts → index re-export → NextStepPanel.tsx 소비

index.ts re-export + NextStepPanel.tsx index 경유 import + container 인라인 0건 + satisfies 가드.

**PASS:** 4개 기준 모두 충족. **FAIL:** 기준 항목별 처방.

상세: [references/component-tokens.md](references/component-tokens.md#step-42-next_step_panel_tokens-토큰-체인--workflow-panelts--index-re-export--nextsteppaneltsx-소비)

---

### Step 43: 대시보드 dynamic() loading skeleton 커버리지

`dynamic()` loading 옵션에 제네릭 `<Skeleton />` 직접 사용 금지. 카드별 전용 *Skeleton 컴포넌트 필수.

**PASS:** 0줄 (모든 dynamic loading이 명명된 *Skeleton 컴포넌트 사용). **FAIL:** 전용 *Skeleton 컴포넌트 신규 생성.

상세: [references/motion.md](references/motion.md#step-43-대시보드-dynamic-loading-skeleton-커버리지)

---

### Step 44: SURFACE_INLINE_ACTION_TOKENS 4-way 동기화 + label-ko/label-mono utility

16개 CSS 변수 :root/.dark/@theme inline 3곳 + semantic.ts + label-ko/label-mono utility + atom 외부 직접 사용 0건.

**PASS:** 7개 기준 모두 충족. **FAIL:** 기준 항목별 처방.

상세: [references/component-tokens.md](references/component-tokens.md#step-44-surface_inline_action_tokens-4-way-동기화--label-kolabel-mono-utility)

---

### Step 45a: KPI grid + hero `containerInGrid` + `alertRing` 토큰 적용 강제

raw `grid-cols-N` / `col-span-N` 0건 + alertRing 토큰 host 적용 + Phase 4.5 신규 토큰 dead 0건.

**PASS:** 5개 기준 모두 충족. **FAIL:** raw grid/alertRing dead/Phase 4.5 dead.

상세: [references/component-tokens.md](references/component-tokens.md#step-45a-kpi-grid--hero-containeringrid--alertring-토큰-적용-강제)

---

### Step 45b: SIDEBAR_ROW_TOKENS Layer 3 — sibling-anchor 컴포넌트 토큰 우회 금지

SIDEBAR_ROW_TOKENS 5+ key + NavRowWithSecondaryAction 인라인 0건 + barrel export 3건.

**PASS:** 3개 기준 충족. **FAIL:** raw 위치/크기 인라인 → 토큰화.

상세: [references/component-tokens.md](references/component-tokens.md#step-45b-sidebar_row_tokens-layer-3--sibling-anchor-컴포넌트-토큰-우회-금지)

---

### Step 46: Button base cva `focus-visible:outline-*` 패턴 — ring-offset 회귀 방지

`button.tsx` base cva에 `focus-visible:ring-2 ring-offset-2` 재도입 금지. `outline` 패턴 유지.

**PASS:** ring-offset 0건 + outline 패턴 1건. **FAIL:** outline 패턴으로 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-46-button-base-cva-focus-visibleoutline--패턴--ring-offset-회귀-방지)

---

### Step 47: `compact` 컨테이너 토큰 — elevation/shadow/rounded/padding 0 원칙

`compact` 컨테이너 토큰 값에 elevation/shadow/rounded/surface-padding 클래스 0건. layout 전용만 허용.

**PASS:** 금지 클래스 0건 + layout 전용 클래스만. **FAIL:** 행 평면 이탈 → layout-only 토큰으로 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-47-compact-컨테이너-토큰--elevationshadowroundedpadding-0-원칙)

---

### Step 48: ConnectionBanner kind→role 동적 분기 — kind별 role/ariaLive 일관성

`BannerSpec.role` 필드로 동적 ARIA role 결정. offline → `role="alert"`, sw-update → `role="status"`.

**PASS:** 동적 `role={banner.role}` 참조. **FAIL:** 정적 하드코딩 → 동적 분기 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-48-connectionbanner-kindrole-동적-분기--kind별-rolearialive-일관성)

---

### Step 49: Dialog 내 필수 입력 검증 ARIA 패턴

필수 textarea: `aria-required="true"` + `aria-invalid` + `aria-describedby` 3종 + `role="alert"` 에러 `<p>`. confirm disabled: touched 가드 없이 `!value.trim()`.

**PASS:** 3종 세트 + role="alert" 에러 + 올바른 disabled. **FAIL:** 누락 항목별 처방.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-49-dialog-내-필수-입력-검증-aria-패턴)

---

### Step 50: 내비게이션 리스트 시맨틱 — `<ul role="list">` + `<li>` 패턴

내비게이션 `.map()` 컨테이너는 `<ul role="list">` + `<li>` 구조. `<div>` 또는 `role="list"` 누락 FAIL.

**PASS:** 모든 내비게이션 리스트 `<ul role="list">` + `<li>`. **FAIL:** `<ul role="list">` + `<li>` 래핑으로 교체.

상세: [references/aria-wcag.md](references/aria-wcag.md#step-50-내비게이션-리스트-시맨틱--ul-rolelist--li-패턴)

---

### Step 51: `text-[10px]` arbitrary size → `MICRO_TYPO.badge` 토큰 경유 필수

`MICRO_TYPO.badge = 'text-2xs'`가 존재하는데도 `text-[10px]` arbitrary value 사용 금지.

**PASS:** `text-[10px]` 0건. **FAIL:** `${MICRO_TYPO.badge}` 보간으로 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-51-text10px-arbitrary-size--micro_typobadge-토큰-경유-필수)

---

### Step 52: charCount 표시 패턴 — `<CharsCounter>` 호출자 강제

textarea character counter UI는 `<CharsCounter>` SSOT 컴포넌트 경유 필수. 인라인 색상 분기/임계값 계산 금지.

**PASS:** 3개 위반 패턴 0건 + `<CharsCounter>` 호출처 ≥1건. **FAIL:** `<CharsCounter count={...} max={...} />` 교체.

상세: [references/component-tokens.md](references/component-tokens.md#step-52-charcount-표시-패턴--charscounter-호출자-강제)

---

### Step 53: design-token 파일 내 `getSemanticSolidBgClasses()` SSOT 경유 필수

`lib/design-tokens/**/*.ts` 파일에서 `bg-brand-* text-white` 조합을 직접 문자열 리터럴로 사용하면 `BRAND_CLASS_MATRIX` SSOT 우회 — `getSemanticSolidBgClasses('<key>')` 함수 경유 필수.

**탐지 명령어:**
```bash
grep -rn "bg-brand-.*text-white\|text-white.*bg-brand-" \
  apps/frontend/lib/design-tokens/ --include="*.ts" \
  | grep -vE "^\s*//|getSemanticSolidBgClasses"
```

**PASS:** 0건. **FAIL:** `getSemanticSolidBgClasses('<semantic-key>')` 교체.
사례: `MAINTENANCE_TIMELINE_TOKENS.node` (2026-05-09) — `bg-brand-ok text-white` 직접 조합 → `getSemanticSolidBgClasses('ok')` 수정.

상세: [references/component-tokens.md](references/component-tokens.md#step-53-design-token-파일-내-getsemanticsolidbgclasses-ssot-경유-필수)

---

## Output Format

```markdown
| #   | 검사                           | 상태      | 상세                           |
| --- | ------------------------------ | --------- | ------------------------------ |
| 1   | transition-all 금지            | PASS/FAIL | 위반 위치 목록                 |
| 2   | focus-visible 우선             | PASS/FAIL | 위반 위치 목록                 |
| 3   | Layer 3 함수 import 경로       | PASS/FAIL | 위반 import 목록               |
| 4   | 마이그레이션된 컴포넌트 토큰   | PASS/FAIL | 토큰 미사용 컴포넌트           |
| 5   | Layer 3 컴포넌트 토큰 아키텍처 | PASS/FAIL | 위반 참조 목록                 |
| 6a  | Layer 3 getTransitionClasses   | PASS/FAIL | 잔여 런타임 호출 위치          |
| 6b  | getTransitionClasses 속성 지정 | PASS/FAIL | properties 미지정 호출 위치    |
| 6c  | 컴포넌트 하드코딩 트랜지션     | PASS/FAIL | TRANSITION_PRESETS 미사용 위치 |
| 6d  | 스태거 딜레이 SSOT             | PASS/FAIL | `index * N` raw 계산 위치      |
| 7   | Architecture v3 패턴           | PASS/INFO | Deprecated 패턴, Urgency 함수  |
| 8a  | h1 하드코딩 탐지               | PASS/FAIL | 토큰 미사용 h1 위치            |
| 8b  | 부제목 하드코딩 탐지           | PASS/FAIL | text-muted-foreground 하드코딩 |
| 8c  | 페이지 제목 아이콘 일관성      | PASS/FAIL | h1 내 아이콘 포함 페이지       |
| 8d  | 헤더 토큰 SSOT 참조            | PASS/FAIL | spread 누락 모듈               |
| 9   | Easing 3자 동기화              | PASS/FAIL | globals/primitives/motion 수 불일치 |
| 10a | v4 제거 유틸리티 0 hits        | PASS/FAIL | 발견 위치 |
| 10b | 레거시 tailwind.config.* 0 hits | PASS/FAIL | 발견 파일 |
| 10c | tailwindcss-animate 재도입 0 hits | PASS/FAIL | package.json 위치 |
| 10d | PostCSS 단일 플러그인          | PASS/FAIL | 위반 플러그인 |
| 11  | Enum↔Token N-way 동기화        | PASS/FAIL | 누락 상태 키 목록 |
| 12  | @theme CSS 변수 ↔ primitives.ts 3-way | PASS/FAIL | 불일치 변수 목록 |
| 12b | 워크플로우 상태 인덱스 하드코딩 | PASS/FAIL | magic number 위치 |
| 13  | Dead Token 탐지                | PASS/INFO/FAIL | dead token 목록 |
| 14  | aria-expanded + aria-controls 쌍 | PASS/FAIL | aria-controls 누락 위치 |
| 14b | rAF focus null guard           | PASS/FAIL | bare .focus() 위치 |
| 15  | staggerFadeInItem SSOT         | PASS/FAIL | raw 곱셈 또는 'link' ctaKind 위치 |
| 16a | SPACING_RHYTHM_TOKENS .replace() 금지 | PASS/FAIL | .replace('p','px') 위치 |
| 16b | NCGuidanceKeyReachable narrowing | PASS/FAIL | Record<NCGuidanceKey,...> 잔재 |
| 17  | hex 색상 하드코딩              | PASS/FAIL | [⑨ hex 색상] 위반 목록 |
| 18  | *StatusValues satisfies + barrel | PASS/FAIL | satisfies 미사용 또는 index.ts 누락 |
| 19  | ring-dashed --tw-ring-shadow 인라인 금지 | PASS/FAIL | 컴포넌트 직접 override 위치 |
| 20  | BRAND_CLASS_MATRIX 3곳 동시 갱신 | PASS/FAIL | satisfies 또는 CSS 변수 누락 |
| 21  | design-token dark:brand-* 금지 | PASS/FAIL | dark: prefix 사용 위치 |
| 22  | text-brand-${} 동적 보간 금지  | PASS/FAIL | 보간 발견 위치 |
| 23  | checkout-toast/your-turn 토큰  | PASS/FAIL | re-export 누락 또는 인라인 duration |
| 24  | loading-skeleton SSOT          | PASS/FAIL/INFO | index.ts 누락, animate-pulse 인라인 |
| 25  | CSS 변수 fallback 필수         | PASS/FAIL | var(--name) fallback 누락 위치 |
| 26  | 사전 생성 룩업 + satisfies 가드 | PASS/FAIL | concat 패턴 또는 satisfies 누락 |
| 27  | NC compact dot SSOT            | PASS/FAIL | compactDot 직접 접근 위치 |
| 28  | JSX 인라인 brand 리터럴 금지   | PASS/FAIL | className brand 직접 사용 위치 |
| 29a | 크로스 도메인 직접 import 금지 | PASS/FAIL | 도메인 간 import 위치 |
| 29b | tabBadge ALERT_TAB_BADGE_COLOR SSOT | PASS/FAIL | raw bg-destructive 인라인 위치 |
| 29c | CHECKOUT_TAB_BADGE_TOKENS satisfies | PASS/FAIL | satisfies 미존재 또는 re-export 누락 |
| 30  | FOCUS_TOKENS.ringCurrent SSOT  | PASS/FAIL | raw ring-2 ring-brand-info 조합 위치 |
| 31  | callout role="alert" 금지      | PASS/FAIL | callout/안내 패널 role="alert" 위치 |
| 32  | MENU_ITEM_TOKENS.destructive SSOT | PASS/FAIL | focus:text-destructive 리터럴 위치 |
| 33a | DASHBOARD_ENTRANCE 딜레이 인라인 금지 | PASS/FAIL | animationDelay 인라인 위치 |
| 33b | DASHBOARD_MOTION transition 토큰 | PASS/FAIL | 인라인 transition-colors 위치 |
| 33c | prefers-reduced-motion 존재    | PASS/FAIL | 미디어 쿼리 누락 |
| 33d | @source inline() 커버          | PASS/FAIL | 지시어 누락 |
| 34  | WAI-ARIA grid 3단계            | PASS/FAIL | role="row"/"gridcell" 누락 위치 |
| 35  | CHECKOUT_ITEM_ROW_TOKENS satisfies | PASS/FAIL | satisfies 미존재 또는 zone key 누락 |
| 36  | WORKFLOW_PANEL_TOKENS satisfies + type export | PASS/FAIL | satisfies 누락 또는 타입 미export |
| 37  | ANIMATION_PRESETS 인라인 우회 금지 | PASS/FAIL | motion-safe+motion-reduce 페어 인라인 위치 |
| 38  | AlertBanner severity→ARIA role 분기 | PASS/FAIL | 정적 role 하드코딩 위치 |
| 39  | getPageContainerClasses() 빈 호출 금지 | PASS/FAIL | variant 미지정 위치 |
| 40  | hover-inline 버튼 토큰 경유    | PASS/FAIL | raw text-green-*/text-red-* 위치 |
| 41  | 단일 tablist + contents 패턴   | PASS/FAIL | tablist 2+ 발견 위치 |
| 42  | NEXT_STEP_PANEL_TOKENS 토큰 체인 | PASS/FAIL | re-export 누락 또는 인라인 variant 위치 |
| 43  | dynamic() loading skeleton 커버리지 | PASS/FAIL | generic Skeleton 위치 |
| 44  | SURFACE_INLINE_ACTION_TOKENS 4-way | PASS/FAIL | 변수 누락 또는 atom 외부 사용 위치 |
| 45a | KPI grid 토큰 + alertRing 적용 | PASS/FAIL | raw grid/col-span 또는 dead alertRing |
| 45b | SIDEBAR_ROW_TOKENS 토큰 우회 금지 | PASS/FAIL | 인라인 위치/크기 위치 |
| 46  | Button base cva outline 패턴   | PASS/FAIL | ring-offset 재도입 위치 |
| 47  | compact 컨테이너 elevation 금지 | PASS/FAIL | 금지 클래스 포함 위치 |
| 48  | ConnectionBanner kind→role 동적 분기 | PASS/FAIL | 정적 role 하드코딩 위치 |
| 49  | Dialog ARIA 4종 세트           | PASS/FAIL | 누락 항목 위치 |
| 50  | nav list <ul role="list"> + <li> | PASS/FAIL | <div> 렌더 또는 role="list" 누락 위치 |
| 51  | text-[10px] → MICRO_TYPO.badge | PASS/FAIL | arbitrary size 위치 |
| 52  | CharsCounter 호출자 강제       | PASS/FAIL | 인라인 분기/매직 넘버 위치 |
| 53  | design-token 파일 내 `bg-brand-* text-white` 직접 조합 금지 | PASS/FAIL | `getSemanticSolidBgClasses()` 미경유 위치 |
| 54  | mono 헬퍼 `.text-mono`/`.text-mono-base` utility 경유 | PASS/FAIL | `font-mono tabular-nums` 인라인 헬퍼 위치 |
| 55  | brand-color-* oklch SSOT — hsl wrapper 0 + color-mix(in oklch) alpha | PASS/FAIL | hsl(var(--brand-color-*)) 잔존 위치 |
```

## Step 54: mono 헬퍼는 `.text-mono` 또는 `.text-mono-base` utility 경유

> 도입: 2026-05-13 qr-visual-redesign-followups-g4-g12 라운드 #3 (commit `d6b7cc8e`). 갭 1 SSOT 확장.

**검증 명령**:

```bash
# brand.ts 의 mono 헬퍼 (3종) 가 .text-mono / .text-mono-base utility 경유 사용
# font-mono tabular-nums 인라인 합성 0건 (utility-first 단방향 SSOT)
grep -nE "'[^']*font-mono[^']*tabular-nums[^']*'" apps/frontend/lib/design-tokens/brand.ts
# 기대: 0 (헬퍼 본문에서 인라인 합성 없음, .text-mono 또는 .text-mono-base 만 사용)

# .text-mono / .text-mono-base utility 정의 globals.css 존재
grep -cE "^\s*\.text-mono(-base)?\s*\{" apps/frontend/styles/globals.css
# 기대: ≥ 2 (.text-mono 13px size primitive + .text-mono-base size-less primitive)

# 호출부에서 size override 금지 (헬퍼는 자체 size 결정)
grep -rn "text-xs.*getManagementNumberClasses\|getManagementNumberClasses.*text-xs\|text-sm.*getManagementNumberClasses" apps/frontend/components --include="*.tsx"
# 기대: 0 (호출부 size override 금지)
```

**PASS**:
- brand.ts mono 헬퍼 본문에서 `font-mono tabular-nums` 인라인 합성 0건 (utility 경유)
- globals.css `.text-mono` (13px) + `.text-mono-base` (size-less) 동시 정의

**FAIL**:
- 신규 mono 헬퍼가 `'font-mono tabular-nums ...'` 인라인 정의 (utility SSOT 우회)
- 호출부가 헬퍼 + size 동시 명시 (e.g. `text-xs ${getManagementNumberClasses()}`)

**Why**: utility-first SSOT — Tailwind `font-mono` + `tabular-nums` 반복 정의는 의미적 진입점에서 일관성 깸. `.text-mono-base` 가 size-less primitive, `.text-mono` 가 13px size variant.


## Step 55: brand-color-* oklch SSOT — hsl wrapper 0건 + color-mix(in oklch) alpha 합성

> 도입: 2026-05-13 qr-visual-redesign-followups-g4-g12 라운드 #3 (commit `d6b7cc8e`). 갭 2/7 SSOT 확장.

**검증 명령**:

```bash
# (1) brand-color-* 정의 oklch 형식 (light + dark 각각 14)
grep -cE "^\s*--brand-color-(ok|success|warning|critical|info|neutral|purple|repair|temporary|progress|archive|urgent|mute|site-suw|site-uiw|site-pyt):\s*oklch\(" apps/frontend/styles/globals.css
# 기대: ≥ 28 (14 light + 14 dark)

# (2) hsl(var(--brand-color-*)) wrapper 잔존 0 (전체 design-tokens + globals.css)
grep -rn "hsl(var(--brand-color-" apps/frontend/lib/design-tokens apps/frontend/styles
# 기대: 0 (모든 사용처 var(...) 직접 또는 color-mix(in oklch, ...) 경유)

# (3) alpha 합성은 color-mix(in oklch) 패턴
grep -rn "color-mix(in oklch" apps/frontend/styles/globals.css | wc -l
# 기대: ≥ 1 (alpha 합성 SSOT)
```

**PASS**:
- brand-color-* 14개 oklch 형식 정의 (light + dark)
- `hsl(var(--brand-color-*))` wrapper 0건 (전체 design-tokens + globals.css)
- alpha 합성은 `color-mix(in oklch, var(--brand-color-X) NN%, transparent)` 경유

**FAIL**:
- 신규 brand-color-* 가 HSL 형식 정의 (`--brand-color-new: 120 50% 50%;`)
- `hsl(var(--brand-color-*))` wrapper 잔존 (oklch 값을 HSL로 wrap 시 invalid CSS)
- alpha 합성을 `hsl(var(--brand-color-X) / 0.NN)` 패턴 사용 (oklch + hsl mix 충돌)

**예외 인정**:
- BRAND_COLORS_HEX (brand.ts) — hex 값 유지 (브라우저 폴백 + 컴포넌트 raw 사용 용)
- `--brand-urgent-weak` / `--brand-mute-weak` 등 soft tint variant도 oklch 형식 (정합성)

**Why**: CSS Color 4 oklch perceptually uniform 색공간 — design system 정확도 + WCAG AA. `hsl()` wrapper는 oklch 값을 wrap 시 invalid → 빌드 실패 또는 silent 색상 깨짐. `color-mix(in oklch)` 가 alpha 합성의 정합 SSOT.

**How to apply** (신규 brand-color-* 추가 시):
1. `brand.ts` BRAND_COLORS_HEX 에 hex 추가
2. hex → oklch 변환 (CSS Color 4 표준 알고리즘 또는 docs/design/oklch-migration-*.md 변환 표)
3. `globals.css` `:root` + `.dark` 양쪽에 `--brand-color-{key}: oklch(L C h);` 추가
4. `@theme inline` block에 `--color-brand-{key}: var(--brand-color-{key});` alias 추가 (hsl() wrapper 금지)
5. alpha 합성 필요 시 `color-mix(in oklch, var(--brand-color-{key}) NN%, transparent)` 패턴 사용

```css
/* ✅ CORRECT */
--brand-color-ok: oklch(0.696 0.149 162.5);
--color-brand-ok: var(--brand-color-ok);
--surface-inline-action-ok-bg: color-mix(in oklch, var(--brand-color-ok) 10%, transparent);

/* ❌ WRONG */
--brand-color-ok: 160 84% 39%;  /* HSL legacy */
--color-brand-ok: hsl(var(--brand-color-ok));  /* hsl wrapper */
--surface-inline-action-ok-bg: hsl(var(--brand-color-ok) / 0.10);  /* hsl alpha */
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **shadcn/ui 컴포넌트** (`components/ui/`) — 서드파티 생성 코드
2. **design-tokens 내부 파일** — Layer 간 상호 참조는 아키텍처상 필수. 단, `bg-brand-* text-white` 조합 직접 사용은 Step 53 위반 — `getSemanticSolidBgClasses()` 경유 필수
3. **SkipLink** — 모든 포커스에 반응해야 하므로 `focus:` 의도적 사용
4. **장식용 요소** — 순수 장식 요소의 크기 하드코딩
5. **유틸리티 함수 import** — `toTailwindSize`, `toTailwindGap`은 Layer 3에서 `../utils` (Layer 1.5) 경유 import 허용. `../primitives` 직접 import는 불허 (2026-04-26 utils.ts 분리 이후)
6. **ANIMATION_PRESETS / TRANSITION_PRESETS import** — motion.ts에서 Layer 3 직접 import 허용
7. **`getNotificationBadgeClasses()` 내부 urgency 분기** — notification.ts 내부 Visual Feedback System 구현 코드
8. **calibration-status.ts** — 3개 컴포넌트 중복 로직 통합 SSOT
9. **not-found.tsx / error.tsx** — 비정상 상태 표시, 독립 디자인
10. **SETTINGS_PAGE_HEADER_TOKENS** — 아이콘+border-b 포함 독립 헤더 디자인
11. **`page-layout.ts`의 Layer 3 내부 import** — cross-component SSOT 참조
