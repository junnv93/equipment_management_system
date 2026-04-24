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
| `apps/frontend/lib/design-tokens/components/checkout-icons.ts` | Lucide 아이콘 SSOT — CHECKOUT_ICON_MAP (status/action/emptyState/urgency/locked) |
| `apps/frontend/styles/globals.css` | Brand CSS 변수 + easing CSS 변수 + Tailwind v4 `@theme`/`@theme inline` 토큰 |
| `apps/frontend/postcss.config.js` | Tailwind v4 PostCSS 플러그인 (`@tailwindcss/postcss` 단일) |
| `apps/frontend/package.json` | Tailwind v4 의존성 (`tailwindcss`, `@tailwindcss/postcss`, `tw-animate-css`) |
| 마이그레이션된 컴포넌트 70여 개 | [references/migrated-components.md](references/migrated-components.md) 참조 |

## Workflow

### Step 1: transition-all 금지

shadcn/ui 제외 모든 컴포넌트에서 `transition-all` 미사용 확인.

**PASS:** 0개 결과. **FAIL:** `transition-all` → `transition-colors` 또는 `getTransitionClasses()` 변경.

**상세:** [references/step-details.md](references/step-details.md) Step 1

### Step 2: focus-visible 우선

shadcn/ui와 SkipLink 제외 모든 컴포넌트에서 `focus-visible:` 사용 확인.

**PASS:** `focus:ring`/`focus:outline` 0개. **FAIL:** `focus-visible:` 변경.

**상세:** [references/step-details.md](references/step-details.md) Step 2

### Step 3: Layer 3 함수 import 경로

컴포넌트가 design-tokens 내부 파일을 직접 import하지 않는지 확인.

**PASS:** primitives/semantic 직접 import 0개. **FAIL:** `@/lib/design-tokens` Public API 사용.

**상세:** [references/step-details.md](references/step-details.md) Step 3

### Step 4: 마이그레이션된 컴포넌트 토큰 사용

60개 마이그레이션 컴포넌트에서 design-tokens import 존재 확인.

**PASS:** 모든 컴포넌트에 import. **FAIL:** 토큰 미사용 → 재마이그레이션.

**상세:** [references/step-details.md](references/step-details.md) Step 4

### Step 5: Layer 3 컴포넌트 토큰 아키텍처 + barrel export

Layer 3 파일이 Layer 2만 참조하는지 + index.ts barrel export 확인.

**PASS:** primitives 직접 참조 0개 (유틸리티 함수 제외). **FAIL:** semantic 경유로 변경.

**상세:** [references/step-details.md](references/step-details.md) Step 5, 5b

### Step 6: TRANSITION_PRESETS + getTransitionClasses 속성 지정 + 하드코딩 트랜지션

- **6a:** Layer 3에서 `getTransitionClasses` 런타임 호출 0개 → TRANSITION_PRESETS 사용
- **6b:** `getTransitionClasses` 호출 시 properties 배열 필수
- **6c:** `components/ui/` 외부에서 하드코딩 transition 클래스 0개
- **6d:** `index * \d+` raw 스태거 딜레이 0개 → `getStaggerDelay(index, type)` SSOT 함수 사용

**상세:** [references/step-details.md](references/step-details.md) Step 6

### Step 7: Architecture v3 Visual Feedback + 한국어 label 잔존

- **7a:** deprecated `NOTIFICATION_BADGE_VARIANTS` 직접 사용 0개
- **7b:** count/time/status 기반 Urgency 함수 사용 확인
- **7c:** Design Token에 한국어 `label` 필드 잔존 0개 (→ `labelKey` 사용)

**상세:** [references/step-details.md](references/step-details.md) Step 7

### Step 8: 페이지 헤더 타이포그래피 SSOT

- **8a:** h1 하드코딩 0개 → `PAGE_HEADER_TOKENS.title` 사용
- **8b:** 부제목 하드코딩 0개 → 토큰 subtitle 사용
- **8c:** 페이지 제목에 아이콘 미포함 (설정 페이지 면제)
- **8d:** 모듈별 헤더 토큰이 `...PAGE_HEADER_TOKENS` spread

**상세:** [references/step-details.md](references/step-details.md) Step 8

### Step 9: EASING_CSS_VARS 3자 동기화

globals.css / primitives.ts / motion.ts 3곳의 easing 수가 동일한지 (현재 7개).

**PASS:** 3개 수 동일. **FAIL:** drift → 누락된 곳에 easing 추가.

**상세:** [references/step-details.md](references/step-details.md) Step 9

### Step 10: Tailwind v4 호환성

v4 마이그레이션(2026-04, PR #180) 이후 다음 v3 잔재가 재도입되지 않았는지 확인.

- **10a: v4에서 제거된 opacity/decoration 유틸리티** — `bg-opacity-*`, `text-opacity-*`, `ring-opacity-*`, `border-opacity-*`, `decoration-slice`, `decoration-clone`. v4에서는 컴파일은 통과하지만 효과 없음(silent failure). 슬래시 표기법(`bg-foo/50`)으로 마이그레이션.
  - 탐지: `rg -n '\b(bg-opacity-|text-opacity-|ring-opacity-|border-opacity-|decoration-slice|decoration-clone)\b' apps/frontend --type ts --type tsx --type css`
  - **PASS:** 0 hits.
- **10b: 레거시 v3 파일/디렉티브 재도입 금지**
  - `apps/frontend/tailwind.config.{js,ts,cjs,mjs}` 파일 존재 금지 — v4는 CSS-first(`globals.css`의 `@theme`/`@theme inline`)
  - `globals.css`에 `@tailwind base|components|utilities` 디렉티브 금지 — `@import 'tailwindcss'` 사용
  - 탐지: `ls apps/frontend/tailwind.config.* 2>/dev/null` (없어야 PASS), `rg -n '^@tailwind\s+(base|components|utilities)' apps/frontend/styles` (0 hits)
- **10c: tailwindcss-animate 재도입 금지** — v3 전용. v4에서는 `tw-animate-css`(`globals.css`에서 `@import 'tw-animate-css'`)
  - 탐지: `grep -n tailwindcss-animate apps/frontend/package.json` (없어야 PASS)
- **10d: PostCSS 플러그인 단일성** — `postcss.config.js`는 `@tailwindcss/postcss`만 사용. v3 `tailwindcss` 플러그인 또는 별도 `autoprefixer`(v4 내장) 금지.
  - 탐지: `grep -nE "(^|[^@])tailwindcss['\"]?:|autoprefixer" apps/frontend/postcss.config.js` (0 hits)

**PASS:** 위 4개 모두 통과. **FAIL:** 해당 패턴 제거 또는 v4 동등물로 교체.

**상세:** [references/step-details.md](references/step-details.md) Step 10

### Step 12: globals.css @theme ↔ primitives.ts 3-way 동기화

Tailwind v4 CSS-first 아키텍처에서 `globals.css @theme` 블록의 CSS 변수 값이
`primitives.ts` 숫자 상수와 일치해야 한다.
불일치 시 `MICRO_TYPO.badge = 'text-2xs'` 같은 named utility가 primitives 값과 **조용히 어긋난다**.

**검사 대상 (78-1 추가, 2026-04-21 / 78-7 stepDot / 78-8 xs-tight+sm-tight 추가 / 79차 sm-wide 추가):**

| CSS 변수 | globals.css 기대값 | primitives.ts SSOT |
|---|---|---|
| `--text-2xs` | `0.625rem` (10px) | `TYPOGRAPHY_PRIMITIVES['2xs'].mobile === 10` |
| `--text-xs-tight` | `0.6875rem` (11px) | `TYPOGRAPHY_PRIMITIVES['xs-tight'].mobile === 11` |
| `--text-sm-tight` | `0.8125rem` (13px) | `TYPOGRAPHY_PRIMITIVES['sm-tight'].mobile === 13` |
| `--text-sm-wide` | `0.9375rem` (15px) | `TYPOGRAPHY_PRIMITIVES['sm-wide'].mobile === 15` |
| `--spacing-hairline` | `3px` | `WIDTH_PRIMITIVES.hairline === 3` |
| `--spacing-pagination` | `30px` | `SIZE_PRIMITIVES.pagination === 30` |
| `--spacing-step-dot` | `18px` | `WIDTH_PRIMITIVES.stepDot === 18` |

```bash
# globals.css에서 7개 변수 값 추출
grep -E "(--text-2xs|--text-xs-tight|--text-sm-tight|--text-sm-wide|--spacing-hairline|--spacing-pagination|--spacing-step-dot)" \
  apps/frontend/styles/globals.css

# primitives.ts에서 대응 상수 값 확인
grep -E "('2xs'|'xs-tight'|'sm-tight'|'sm-wide'|hairline|pagination|stepDot)" \
  apps/frontend/lib/design-tokens/primitives.ts
```

**PASS:** 각 CSS 변수 값이 primitives.ts 숫자와 단위 변환 후 일치. **FAIL:** 불일치 시 primitives.ts를 SSOT로 간주하고 globals.css 값을 수정.

**추가 신규 변수 체크:** 위 4개 외에 신규 세션에서 `@theme`에 추가된 변수가 있으면 대응 primitives 상수와 동기화 검사 범위를 이 테이블에 추가할 것.

**MICRO_TYPO ↔ @theme 변수명 일치 검사 (3-way 마지막 단계):**
`semantic.ts`의 `MICRO_TYPO` 값이 `globals.css @theme`에 등록된 변수명을 올바르게 참조하는지 확인.

```bash
# MICRO_TYPO 토큰 값 확인 (text-2xs, text-xs-tight, text-sm-tight, text-sm-wide 등)
grep -A 15 "^export const MICRO_TYPO" apps/frontend/lib/design-tokens/semantic.ts

# @theme에 해당 변수들이 등록되어 있는지 확인
grep -E "(--text-2xs|--text-xs-tight|--text-sm-tight|--text-sm-wide)" apps/frontend/styles/globals.css
```

**PASS:** `MICRO_TYPO`의 모든 값이 `@theme`에 대응하는 CSS 변수로 존재. **FAIL:** semantic.ts 값 오타 또는 globals.css 미등록 → `@theme` 추가.

현재 `MICRO_TYPO` 멤버 (79차 기준):
- `badge`, `label` → `text-2xs` (--text-2xs, 10px)
- `caption` → `text-xs` (Tailwind 기본, 12px)
- `meta` → `text-xs-tight` (--text-xs-tight, 11px)
- `detail` → `text-sm-tight` (--text-sm-tight, 13px)
- `siteTitle` → `text-sm-wide` (--text-sm-wide, 15px) — **79차 신규**

**PASS:** 모든 변수 일치. **FAIL:** 불일치 → primitives.ts 숫자 또는 globals.css 값 수정.

**상세:** [references/step-details.md](references/step-details.md) Step 12

### Step 11: Enum ↔ Token Record N-way 동기화

`@equipment-management/schemas` 의 status/role/action enum 값이 추가/제거되면
`Record<Enum, string>` 형태의 모든 토큰 맵에 동시 반영되어야 한다. 누락 시
TypeScript 가 잡지만(필수 속성 에러), `Record<string, ...>` 로 약타입화된 보조 맵
(예: `AUDIT_TIMELINE_DOT_COLORS: Record<string, string>`) 은 silent drift 발생.

**대상 패턴:**
- `AUDIT_ACTION_*`: enum `AuditAction` ↔ `AUDIT_ACTION_BADGE_TOKENS` (strict) +
  `AUDIT_TIMELINE_DOT_COLORS` (loose) + i18n `audit.actionLabels.*`
- `EquipmentStatus` ↔ `EQUIPMENT_STATUS_BADGE_TOKENS` + i18n `equipment.statusLabels.*`
- `CheckoutStatus` ↔ `CHECKOUT_STATUS_BADGE_TOKENS` (loose) — TypeScript 미탐지, grep 필수 (85차 차입: borrower_approved 누락으로 배지 미렌더링 발생)
- `CalibrationStatus`, `NCStatus` 등 동일 패턴
- `SOFTWARE_AVAILABILITY_VALUES` ↔ `SOFTWARE_AVAILABILITY_BADGE_TOKENS` (loose `Record<string, string>`) — 신규 상태 추가 시 TypeScript 미탐지
- `SoftwareValidationRequired`(boolean flag, `true/false` 키) ↔ `SOFTWARE_VALIDATION_REQUIRED_BADGE_TOKENS` (loose) — `yes`/`no` 2개 키만 허용

**탐지 (예시 — audit):**
```bash
# enum 키 목록
node -e "console.log(Object.keys(require('@equipment-management/schemas').AuditAction || {}).join('\n'))" \
  | sort > /tmp/enum.txt
# loose record 키 추출
rg -oP "^\s+([a-z_]+):" apps/frontend/lib/design-tokens/components/audit.ts \
  | sed 's/[: ]//g' | sort -u > /tmp/tokens.txt
diff /tmp/enum.txt /tmp/tokens.txt
```

**탐지 — CHECKOUT_STATUS_BADGE_TOKENS 완전성 (15개 상태, `as const` 배열이므로 node require 불가):**
```bash
# CHECKOUT_STATUS_VALUES 배열 추출
grep -oP "'[a-z_]+'" packages/schemas/src/enums/checkout.ts \
  | head -15 | tr -d "'" | sort > /tmp/checkout_enum.txt

# CHECKOUT_STATUS_BADGE_TOKENS 키 추출
awk '/^export const CHECKOUT_STATUS_BADGE_TOKENS/,/^} as const/' \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep -oP '^\s+([a-z_]+):' | tr -d ': ' | sort > /tmp/checkout_tokens.txt

diff /tmp/checkout_enum.txt /tmp/checkout_tokens.txt
```
**PASS:** diff 출력 없음. **FAIL:** 누락된 상태 키 → `CHECKOUT_STATUS_BADGE_TOKENS`에 적절한 brand 색상 클래스로 추가.

**PASS:** enum 값 ⊆ 모든 N개 record 키. **FAIL:** 누락된 키를 모든 loose record
+ i18n 양 언어에 동시 추가. 단순 키 추가 후 의미상 색상/라벨 대응 검토 필수
(예: `access_denied` → critical/red 가 일관).

**상세:** [references/step-details.md](references/step-details.md) Step 11

### Step 12: 워크플로우 상태 인덱스 하드코딩 금지

도메인 워크플로우 상태 인덱스가 배열에서 파생(SSOT)되지 않고 직접 숫자로 하드코딩되면,
스텝 추가/제거 시 인덱스 불일치 버그 발생.

**올바른 패턴 (non-conformance.ts 기준):**
```typescript
// ✅ SSOT — 배열에서 파생
export const NC_STATUS_STEP_INDEX = Object.fromEntries(
  NC_WORKFLOW_STEPS.map((status, index) => [status, index])
) as Record<NonConformanceStatus, number>;
export const NC_OPEN_STEP_INDEX = NC_STATUS_STEP_INDEX['open'];
export const NC_CORRECTED_STEP_INDEX = NC_STATUS_STEP_INDEX['corrected'];
export const NC_TERMINAL_STEP_INDEX = NC_WORKFLOW_STEPS.length - 1;

// ❌ WRONG — 하드코딩
const NC_STATUS_STEP_INDEX = { open: 0, corrected: 1, closed: 2 };
if (currentStepIndex === 1) ...  // magic number
```

**탐지:**
```bash
# Record<string, number>에 상태명 + 숫자 인덱스 하드코딩 패턴
grep -n "open: 0\|corrected: 1\|closed: 2\|in_use: 0\|returned: 1" \
  apps/frontend/lib/design-tokens/components/*.ts
# 함수 내 currentStepIndex === [0-9] 하드코딩
grep -n "currentStepIndex === [0-9]" apps/frontend/lib/design-tokens/components/*.ts
```

**PASS:** 0 hits. **FAIL:** 해당 도메인 `*_STATUS_STEP_INDEX` 상수를 `Object.fromEntries(STEPS.map(...))` 파생으로 교체.

**상세:** [references/step-details.md](references/step-details.md) Step 12

### Step 13: Dead Token 탐지

`components/*.ts`에 `export const *_TOKENS`로 정의되었지만 컴포넌트/페이지에서 **0회** 사용되는
dead token은 리팩토링 후 정리되지 않은 누적 엔트로피다. 23%가 dead token이면 개발자가 어느 토큰을
써야 하는지 혼란해지고 인라인 하드코딩 재발로 이어진다.

**탐지:**
```bash
for token in $(grep -rh "^export const [A-Z_]*TOKENS\b" \
  apps/frontend/lib/design-tokens/components/ | \
  sed -E 's/.*export const ([A-Z_]+TOKENS).*/\1/'); do
  count=$(grep -rl "\b${token}\b" apps/frontend --include="*.tsx" --include="*.ts" \
    | grep -v "lib/design-tokens\|node_modules" | wc -l)
  [ "$count" -eq 0 ] && echo "DEAD: $token"
done
```

**PASS (INFO):** dead token 0개. **INFO:** dead token 목록 출력 후 삭제 또는 사용처 추가 검토 권고.

**예외:**
- `@deprecated` 주석이 달린 하위 호환 re-export (`EQUIPMENT_EMPTY_STATE_TOKENS` 등) — 마이그레이션 완료 전까지 유예
- `CHECKOUT_HEADER_TOKENS`, `CHECKOUT_SUB_HEADER_TOKENS` — spread 위임 패턴으로 실제 사용됨

**FAIL 기준:** dead token ≥ 5개 시 FAIL (0~4개는 INFO 레벨). 즉각 삭제보다 tech-debt-tracker 등록 권고.

**상세:** [references/step-details.md](references/step-details.md) Step 13

### Step 14: Collapsible/Disclosure button WCAG 2.1 패턴 (2026-04-21 추가)

`button[aria-expanded]`는 WCAG 2.1 Disclosure 패턴 상 반드시 `aria-controls`와 쌍을 이루어야 한다.
`aria-controls` 값은 열고/닫는 콘텐츠 영역의 `id`와 일치해야 한다.

이번 세션(78차2)에서 `NCDetailClient.tsx`의 `CollapsibleSection`에 `contentId` prop + `aria-controls={contentId}` + `id={contentId}` 패턴이 도입되었다.

```bash
# aria-expanded는 있지만 aria-controls가 없는 button 탐지
grep -rn "aria-expanded" apps/frontend/components apps/frontend/app \
  --include="*.tsx" -l | while read f; do
  # 같은 파일에서 aria-controls가 없는 button[aria-expanded] 패턴
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$f', 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('aria-expanded') && !line.includes('aria-controls')) {
        // 앞뒤 2줄 포함해서 button 컨텍스트 확인
        const ctx = lines.slice(Math.max(0,i-2), i+3).join(' ');
        if (ctx.includes('<button') && !ctx.includes('aria-controls')) {
          console.log('$f:' + (i+1) + ': aria-expanded without aria-controls');
        }
      }
    });
  " 2>/dev/null
done

# aria-controls 값과 id 일치 확인 (NCDetailClient.tsx 기준)
grep -n "aria-controls\|contentId\|id=\"nc-" \
  apps/frontend/components/non-conformances/NCDetailClient.tsx
```

**PASS:** `aria-expanded`가 있는 모든 button에 `aria-controls` 존재. 값이 동일 파일 내 `id` 속성과 일치.
**FAIL:** `aria-expanded` 단독 사용 → `contentId` prop 또는 인라인 `aria-controls` 추가.

**예외:** `aria-expanded`가 외부 라이브러리(shadcn/ui Accordion, Collapsible)에서 관리되는 경우 — 라이브러리가 `aria-controls`를 자동 주입하므로 제외.

**상세:** [references/step-details.md](references/step-details.md) Step 14

### Step 15: `staggerFadeInItem` + `getStaggerFadeInStyle` SSOT 패턴 (2026-04-22 추가)

페이지 섹션 단위 stagger 애니메이션은 `ANIMATION_PRESETS.staggerFadeInItem` (className) +
`getStaggerFadeInStyle(index, type)` (인라인 스타일) 조합을 SSOT로 사용한다.
`index * N` raw 계산 또는 `animationDelay: '${index * 100}ms'` 형태 하드코딩 금지.

`NC_SPACING_TOKENS.detail.*` 서브 키(`statusGroup`, `contextGroup`, `statusToContextGap` 등)는
섹션 간격 리듬의 SSOT다. 페이지 레이아웃 래퍼에 `space-y-N` 또는 `mt-N` 직접 하드코딩 금지.

**탐지:**
```bash
# 섹션 stagger에 raw index 곱셈 사용 탐지
grep -rn "animationDelay.*index\s*\*\|style.*index\s*\*.*ms" \
  apps/frontend/components --include="*.tsx" \
  | grep -v "getStaggerFadeInStyle\|node_modules"

# NC_SPACING_TOKENS.detail 우회 — 상세 페이지 wrapper에 space-y 직접 하드코딩
grep -rn "NCDetailClient\|nc-detail" apps/frontend/components/non-conformances \
  --include="*.tsx" -l | xargs grep -n "space-y-[0-9]\|mt-[0-9]" \
  | grep -v "NC_SPACING_TOKENS\|getSectionRhythm\|node_modules"
```

**ctaKind discriminated union 타입 SSOT 검사:**

`NCGuidanceEntry.ctaKind`는 `'primary' | 'repairLink' | 'calibrationLink' | 'none'` discriminated union.
이전 `'link'` 리터럴은 제거됨. GuidanceCallout.tsx에서 조건부 렌더링이 exhaustive한지 확인.

```bash
# 구 'link' ctaKind 리터럴 잔재 탐지 (완전 제거 확인)
grep -rn "ctaKind.*['\"]link['\"]" \
  apps/frontend/components apps/frontend/lib/design-tokens \
  --include="*.tsx" --include="*.ts"

# GuidanceCallout에서 ctaKind 분기가 4가지 값을 모두 처리하는지 확인
grep -n "ctaKind" apps/frontend/components/non-conformances/GuidanceCallout.tsx
```

**PASS:** raw index 곱셈 0건, `'link'` ctaKind 잔재 0건.
**FAIL:** 위반 발견 시 `getStaggerFadeInStyle(index, 'section')` 또는 `NC_SPACING_TOKENS.detail.*` SSOT 사용.

**Related Files:**
- `apps/frontend/lib/design-tokens/motion.ts` — `ANIMATION_PRESETS.staggerFadeInItem`, `getStaggerFadeInStyle`
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_SPACING_TOKENS.detail.*`, `NCGuidanceEntry.ctaKind`
- `apps/frontend/lib/non-conformances/guidance.ts` — `deriveGuidance()` 순수 함수 (비즈니스 로직)
- `apps/frontend/components/non-conformances/GuidanceCallout.tsx` — ctaKind 분기 소비처

**상세:** [references/step-details.md](references/step-details.md) Step 15

### Step 16: SPACING_RHYTHM_TOKENS 축 분리 필드 + Record 타입 narrowing (2026-04-22 추가)

**16a: SPACING_RHYTHM_TOKENS 축 분리 필드 — `.replace()` 안티패턴 금지**

Layer 2 `SPACING_RHYTHM_TOKENS`의 밀도(density) 값에서 x/y 축 padding을 분리할 때
`.replace('p', 'px')` 문자열 조작은 금지된다. 각 density에 `paddingX`/`paddingY` 필드를 명시적으로 선언해야 한다.

```bash
# .replace('p', 'px') 패턴 탐지 (Tailwind padding 조작)
grep -rn "\.replace('p',\s*'px')\|\.replace(\"p\",\s*\"px\")" \
  apps/frontend --include="*.ts" --include="*.tsx"
# → 0건 (SPACING_RHYTHM_TOKENS.tight.paddingX 직접 참조)

# SPACING_RHYTHM_TOKENS paddingX/paddingY 필드 존재 확인
grep -n "paddingX\|paddingY" apps/frontend/lib/design-tokens/semantic.ts
# → 각 density(tight/comfortable/relaxed/spacious)에 paddingX, paddingY 존재
```

**PASS:** `.replace('p', 'px')` 0건, semantic.ts에 paddingX/paddingY 필드 존재.
**FAIL:** 문자열 조작 발견 → `SPACING_RHYTHM_TOKENS.<density>.paddingX` 직접 참조로 교체.

**16b: N×M 조합 타입을 실제 도달 가능 키로 좁히는 패턴 (NCGuidanceKeyReachable)**

상태(N개) × 역할(M개) = N×M 전체 조합 타입을 `Record` 키로 쓰면, 실제 도달 불가능한 조합에 대해
dead entry를 채워야 한다. 대신 실제 FSM이 반환하는 키만으로 구성된 **Reachable 타입**을 별도 정의해야 한다.

```bash
# NCGuidanceKeyReachable 타입이 non-conformance.ts에 정의되어 있는지 확인
grep -n "NCGuidanceKeyReachable" \
  apps/frontend/lib/design-tokens/components/non-conformance.ts
# → export type NCGuidanceKeyReachable = ... (도달 가능한 11개 키)

# NC_WORKFLOW_GUIDANCE_TOKENS가 NCGuidanceKeyReachable로 좁혀져 있는지 확인
grep -n "Record<NCGuidanceKey" \
  apps/frontend/lib/design-tokens/components/non-conformance.ts
# → 0건 (NCGuidanceKeyReachable로 교체됨)

# resolveNCGuidanceKey 반환 타입이 NCGuidanceKeyReachable인지 확인
grep -n "NCGuidanceKeyReachable" apps/frontend/lib/non-conformances/guidance.ts
grep -n "NCGuidanceKeyReachable" apps/frontend/components/non-conformances/GuidanceCallout.tsx
```

**PASS:** `Record<NCGuidanceKey, ...>` 0건, `resolveNCGuidanceKey`/`GuidanceCallout` props가 `NCGuidanceKeyReachable` 사용.
**FAIL:** 도달 불가 조합에 dead entry 존재 → `NCGuidanceKeyReachable` 타입 도입 + `Record` 좁힘.

**Related Files:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `SPACING_RHYTHM_TOKENS` (paddingX/paddingY SSOT)
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NCGuidanceKeyReachable`, `NC_WORKFLOW_GUIDANCE_TOKENS`
- `apps/frontend/lib/non-conformances/guidance.ts` — `deriveGuidance()` 반환 타입
- `apps/frontend/components/non-conformances/GuidanceCallout.tsx` — `guidanceKey: NCGuidanceKeyReachable`

**상세:** [references/step-details.md](references/step-details.md) Step 16

### Step 17: hex 색상 직접 하드코딩 감지 (AP-01·AP-04)

**대상**: `apps/frontend/components/checkouts/**/*.{ts,tsx}`

```bash
node scripts/self-audit.mjs --all 2>&1 | grep "⑨ hex"
```

**PASS**: 출력 없음 (위반 0건)
**FAIL**: `[⑨ hex 색상]` 항목 출력 → `BRAND_CLASS_MATRIX` 또는 Tailwind semantic token으로 교체

**예외**: JSDoc `/* */` 주석, `:root{}` CSS 변수 정의 블록 내 hex는 자동 제외됨

### Step 18: UI 파생 상태 값 객체 `satisfies` 제약 + barrel export (2026-04-22 추가)

DB에 저장되지 않는 UI 전용 상태(`IntermediateCheckStatusKey` 등)를 dot-notation으로 접근하는
`*StatusValues` 상수는 반드시 `as const satisfies Record<string, *Key>` 제약을 사용해야 한다.
이 제약은 토큰 맵(`*_TOKENS`)에 새 키가 추가될 때 Values 객체도 강제 업데이트되도록 보장한다.

**올바른 패턴 (ISVal 기준):**
```typescript
// ✅ SSOT — satisfies로 양방향 동기화 강제
export type IntermediateCheckStatusKey = keyof typeof INTERMEDIATE_CHECK_STATUS_TOKENS;
export const IntermediateCheckStatusValues = {
  OVERDUE: 'overdue',
  TODAY: 'today',
  UPCOMING: 'upcoming',
  FUTURE: 'future',
} as const satisfies Record<string, IntermediateCheckStatusKey>;

// 컴포넌트에서 ISVal 별칭 사용
import { IntermediateCheckStatusValues as ISVal } from '@/lib/design-tokens';
if (status === ISVal.OVERDUE) { ... }  // ✅ 리터럴 직접 비교 금지
```

**탐지:**
```bash
# satisfies 제약 없는 *StatusValues 탐지
grep -rn "export const.*StatusValues" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts" \
  | grep -v "satisfies"

# index.ts barrel에 누락된 StatusValues export 탐지
grep -oP "export const \K\w+StatusValues" \
  apps/frontend/lib/design-tokens/components/*.ts 2>/dev/null \
  | while read name; do
    grep -q "$name" apps/frontend/lib/design-tokens/index.ts \
      || echo "MISSING barrel: $name"
  done
```

**PASS:** 모든 `*StatusValues`에 `satisfies` 제약 존재 + 모두 `index.ts` barrel export.
**FAIL:** `satisfies` 미사용 → `as const satisfies Record<string, *Key>` 추가. barrel 누락 → `index.ts`에 export 추가.

**현재 등록된 패턴 (2026-04-22 기준):**
- `IntermediateCheckStatusValues` (ISVal) — `components/software.ts:343` — UI 파생 (중간점검 표시 상태)

**주의:** DB 저장 enum의 Values 객체 (`CheckoutStatusValues`, `EquipmentStatusValues` 등)는
`packages/schemas/`에서 관리하며 이 Step의 검사 대상이 아님. Design-tokens layer 전용 Step.

### Step 19: ring-dashed + ring-1 조합 안티패턴 (2026-04-24 추가)

Tailwind의 `ring-1`은 `box-shadow` 기반이라 `border-style: dashed`를 지원하지 않는다.
`ring-dashed` 커스텀 유틸리티와 `ring-1`을 같이 쓸 때 solid `box-shadow`가 outline 위에 겹쳐
점선 링이 무효화된다. 이 무효화(`--tw-ring-shadow: 0 0 #0000`)는 반드시 `globals.css`의
`@layer utilities > .ring-dashed` 정의 내에서만 처리하고, 컴포넌트 인라인 스타일로 처리 금지.

**올바른 패턴:**
```css
/* globals.css @layer utilities */
.ring-dashed {
  --tw-ring-shadow: 0 0 #0000;  /* solid ring 무효화 */
  outline: calc(var(--tw-ring-width, 1px)) dashed var(--tw-ring-color, currentColor);
  outline-offset: calc(var(--tw-ring-offset-width, 0px) + 1px);
}
```

```bash
# 컴포넌트에서 --tw-ring-shadow 인라인 override 탐지 (globals.css 외)
grep -rn "\-\-tw-ring-shadow" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" --include="*.css"
# → 0건 (globals.css @layer utilities 전용)

# ring-dashed가 globals.css @layer utilities 내에서만 정의되는지 확인
grep -n "ring-dashed" apps/frontend/styles/globals.css
# → @layer utilities 블록 내 1건만 존재
```

**PASS:** 컴포넌트에서 `--tw-ring-shadow` 인라인 재정의 0건. **FAIL:** 컴포넌트/page에서 `--tw-ring-shadow` 직접 override → `globals.css @layer utilities .ring-dashed` 정의로 이전.

**상세:** [references/step-details.md](references/step-details.md) Step 19

### Step 20: BRAND_CLASS_MATRIX 신규 색상 추가 — 3곳 동시 갱신 (2026-04-24 추가)

`BRAND_COLORS_HEX`에 새 색상 키를 추가할 때 아래 3곳이 반드시 **동시에** 갱신되어야 한다.
하나라도 누락되면 Tailwind 클래스 미존재(`text-brand-xxx is not a valid Tailwind class`) 또는
타입 에러(`satisfies` 위반)가 발생한다.

| 위치 | 추가 내용 | 위반 유형 |
|---|---|---|
| `brand.ts` `BRAND_COLORS_HEX` | `key: '#hexvalue'` | 기준점(SSOT 원본) |
| `brand.ts` `BRAND_CLASS_MATRIX` | 8개 변형 `BrandClassSet` 전체 | TypeScript `satisfies` 에러 |
| `globals.css` `:root` / `.dark` | `--brand-color-<key>` HSL 채널값 (2곳) | Tailwind 클래스 런타임 오작동 |

**탐지:**
```bash
# BRAND_COLORS_HEX 키 목록 추출
node -e "
  const { BRAND_COLORS_HEX } = require('./apps/frontend/lib/design-tokens/brand.ts');
" 2>/dev/null || \
grep -oP "^\s+\K\w+(?=: '#)" apps/frontend/lib/design-tokens/brand.ts | head -20

# BRAND_CLASS_MATRIX 키와 BRAND_COLORS_HEX 키 일치 여부
# (satisfies Record<SemanticColorKey, BrandClassSet>이 있으면 tsc가 자동 검증)
grep -c "satisfies Record<SemanticColorKey, BrandClassSet>" \
  apps/frontend/lib/design-tokens/brand.ts
# → 1건 (satisfies 제약 존재)

# globals.css :root와 .dark 양쪽에 --brand-color-<key> 존재 확인
# 현재 BRAND_COLORS_HEX 키: ok/warning/critical/info/neutral/purple/repair/temporary/progress/archive
for key in ok warning critical info neutral purple repair temporary progress archive; do
  count=$(grep -c "\-\-brand-color-${key}" apps/frontend/styles/globals.css)
  [ "$count" -lt 2 ] && echo "MISSING or single-occurrence: --brand-color-${key} (found: ${count})"
done
```

**PASS:** `BRAND_CLASS_MATRIX`에 `satisfies Record<SemanticColorKey, BrandClassSet>` 존재 + 모든 `BRAND_COLORS_HEX` 키가 `globals.css` `:root`/`.dark` 양쪽에 정의됨. **FAIL:** `satisfies` 미존재 또는 CSS 변수 누락 → 3곳 동시 갱신.

**예외:** `BRAND_COLORS_HEX` 자체가 hex 참조값이므로 CSS 변수와 hex 값이 동일 색상을 표현해야 함. 다크모드 밝기 보정은 `.dark` 블록에서만 허용.

**상세:** [references/step-details.md](references/step-details.md) Step 20

### Step 21: design-token 파일 내 dark: prefix in brand token 금지 (2026-04-24 추가)

`apps/frontend/lib/design-tokens/components/*.ts` 파일 내 brand 토큰 정의에서
`dark:bg-brand-*`, `dark:text-brand-*`, `dark:border-brand-*` 패턴 사용 금지.

**근거:** brand CSS 변수(예: `--color-brand-ok`)는 `globals.css`의 `:root`와 `.dark` 블록에서
각각 다른 HSL 값으로 정의된다. Tailwind `bg-brand-ok` 클래스는 이 CSS 변수를 참조하므로
다크모드에서 자동으로 전환된다. `dark:bg-brand-ok`를 중복 선언하면 의도치 않게 고정 색상이
적용되어 정상 전환이 방해된다.

```bash
# design-token components 파일 내 dark:bg-brand-*, dark:text-brand-*, dark:border-brand-* 탐지
grep -rn "dark:bg-brand-\|dark:text-brand-\|dark:border-brand-" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts"
# → 0건 (단, 예외 파일 제외)
```

**PASS:** 0건. **FAIL:** `dark:bg-brand-*` 등 발견 → `dark:` prefix 제거 (CSS 변수가 자동 전환).

**예외 (허용):**
- `dark:text-ul-midnight`, `dark:text-ul-fog` 등 CSS 변수가 아닌 **Tailwind 커스텀 색상**과 brand 색상의 조합 (예: `equipment.ts`의 `'text-ul-midnight dark:text-brand-info'`)
- `dark:border-brand-*` — CSS 변수 기반이지만 투명도(opacity modifier) 없이 고정값으로 필요한 경우

**상세:** [references/step-details.md](references/step-details.md) Step 21

### Step 22: CALLOUT_TOKENS text-brand-${} 동적 보간 금지 (2026-04-24 추가)

`design-tokens/components/*.ts` 파일 내에서 템플릿 리터럴로 brand 클래스를 동적 보간하는 패턴
(`text-brand-${key}`, `bg-brand-${key}`) 은 Tailwind의 JIT 퍼지(purge) 단계에서 클래스가
정적으로 감지되지 않아 빌드에서 제거될 수 있다. 반드시 `getSemanticContainerTextClasses(key)`
같은 헬퍼 함수를 경유해야 한다.

```typescript
// ❌ 금지 — 동적 보간 (Tailwind purge에서 삭제될 수 있음)
const textClass = `text-brand-${colorKey}`;

// ✅ 허용 — 헬퍼 경유 (brand.ts 함수가 static 클래스 반환)
const textClass = getSemanticContainerTextClasses(colorKey);
```

```bash
# design-token 파일 내 text-brand-${} / bg-brand-${} 동적 보간 탐지
grep -rn "text-brand-\${\|bg-brand-\${\|border-brand-\${" \
  apps/frontend/lib/design-tokens/ \
  --include="*.ts"
# → 0건

# 컴포넌트/훅 파일에서도 동일 패턴 탐지
grep -rn "text-brand-\${\|bg-brand-\${\|border-brand-\${" \
  apps/frontend/components apps/frontend/app apps/frontend/hooks \
  --include="*.tsx" --include="*.ts"
# → 0건
```

**PASS:** 동적 보간 0건. **FAIL:** 발견 시 `getSemanticContainerTextClasses(key)` 또는 정적 토큰 맵으로 교체.

**예외:** `globals.css`나 CSS 모듈 내 CSS 변수 참조 (`var(--brand-color-${...})`)는 CSS 빌드 단계에서 처리되므로 해당 없음.

**Related Files:**
- `apps/frontend/lib/design-tokens/brand.ts` — `getSemanticContainerTextClasses`, `getSemanticBadgeClasses` 등 헬퍼
- `apps/frontend/lib/design-tokens/components/checkout-icons.ts` — Lucide 아이콘 SSOT (이 파일은 아이콘만 포함, brand 클래스 없음)

**상세:** [references/step-details.md](references/step-details.md) Step 22

### Step 14b: `requestAnimationFrame` + ref focus transfer null guard (2026-04-21 추가)

배너/모달 닫기 후 WCAG 2.1 SC 2.4.3 포커스 이전 패턴에서 null guard 누락 시 런타임 에러.

```bash
# requestAnimationFrame 내 focus 호출 위치 확인
grep -n "requestAnimationFrame" apps/frontend/components/**/*.tsx apps/frontend/app/**/*.tsx 2>/dev/null
```

각 결과에서 내부 `.focus()` 호출 앞에 `?.` optional chaining 또는 `if (el)` null guard 존재 여부 확인.

**PASS:** 모든 `rAF` 내 focus 호출에 null guard 존재. **FAIL:** `el.focus()` bare 호출 → `el?.focus()` 또는 `if (el) el.focus()` 교체.

### Step 23: checkout-toast.ts / checkout-your-turn.ts 신규 컴포넌트 토큰 커버리지 (2026-04-24 추가)

PR-18/PR-13에서 추가된 두 컴포넌트 토큰 파일이 design-tokens Layer 3 구조 및 index re-export 규칙을 준수하는지 검증.

**탐지 — checkout-toast.ts 컴포넌트 토큰:**
```bash
# CHECKOUT_TOAST_TOKENS index 경유 re-export 확인
grep -n "checkout-toast\|CHECKOUT_TOAST_TOKENS\|CheckoutToastSeverity" \
  apps/frontend/lib/design-tokens/index.ts

# duration 값 인라인 하드코딩 탐지 (CHECKOUT_TOAST_TOKENS 미경유)
grep -rn "duration: 4000\|duration: 6000\|duration: 8000" \
  apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts"
```

**탐지 — checkout-your-turn.ts 컴포넌트 토큰:**
```bash
# CHECKOUT_YOUR_TURN_BADGE_TOKENS index 경유 re-export 확인
grep -n "checkout-your-turn\|CHECKOUT_YOUR_TURN_BADGE_TOKENS\|YourTurnBadgeUrgency" \
  apps/frontend/lib/design-tokens/index.ts

# YourTurnBadge에서 design-tokens index 경유 import 확인
grep -n "design-tokens" apps/frontend/components/checkouts/YourTurnBadge.tsx
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 두 토큰 파일 모두 re-export 확인
- `notifyCheckoutAction` 호출처에서 duration 숫자 인라인 하드코딩 0건
- `YourTurnBadge.tsx`에서 `@/lib/design-tokens` index 경유 import 확인

**FAIL 기준:**
- index.ts re-export 누락 → 추가 필요
- `duration: 4000` 등 숫자 인라인 → `CHECKOUT_TOAST_TOKENS.duration.success` 경유로 전환
- 컴포넌트에서 토큰 파일 직접 경로 import → index 경유로 수정

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/checkout-toast.ts` — toast duration SSOT
- `apps/frontend/lib/design-tokens/components/checkout-your-turn.ts` — badge urgency tokens
- `apps/frontend/lib/checkouts/toast-templates.ts` — CHECKOUT_TOAST_TOKENS 소비처

### Step 24: checkout-loading-skeleton.ts 로딩 스켈레톤 토큰 커버리지 (2026-04-24 추가)

PR-19에서 추가된 `checkout-loading-skeleton.ts` 토큰 파일과 스켈레톤 컴포넌트들이 SSOT 패턴을 준수하는지 검증.

**탐지 — CHECKOUT_LOADING_SKELETON_TOKENS index re-export:**
```bash
# index.ts에서 checkout-loading-skeleton 재export 확인
grep -n "checkout-loading-skeleton\|CHECKOUT_LOADING_SKELETON_TOKENS" \
  apps/frontend/lib/design-tokens/index.ts
```

**탐지 — 스켈레톤 컴포넌트의 SSOT 경유 여부:**
```bash
# HeroKPISkeleton, NextStepPanelSkeleton, CheckoutGroupCardSkeleton 등이
# @/lib/design-tokens에서 CHECKOUT_LOADING_SKELETON_TOKENS import 확인
grep -rn "CHECKOUT_LOADING_SKELETON_TOKENS" \
  apps/frontend/components/checkouts/ apps/frontend/app/ --include="*.tsx"

# 스켈레톤 컴포넌트에서 직접 bg-muted/bg-primary 하드코딩 탐지 (토큰 미경유)
grep -rn "animate-pulse" apps/frontend/components/checkouts/ --include="*.tsx" \
  | grep -v "CHECKOUT_LOADING_SKELETON_TOKENS"
```

**탐지 — motion-reduce:animate-none 접근성 패턴 + spinner 금지:**
```bash
# CHECKOUT_LOADING_SKELETON_TOKENS.base 정의에 motion-reduce:animate-none 포함 확인
grep -n "motion-reduce" apps/frontend/lib/design-tokens/components/checkout-loading-skeleton.ts

# Spinner(animate-spin) 직접 사용 탐지 — 스켈레톤 컴포넌트에서 금지
grep -rn "animate-spin" apps/frontend/components/checkouts/ --include="*.tsx"
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 `CHECKOUT_LOADING_SKELETON_TOKENS` re-export 확인
- `HeroKPISkeleton`, `NextStepPanelSkeleton`, `CheckoutGroupCardSkeleton` 3개 컴포넌트 모두 토큰 SSOT 경유
- `CHECKOUT_LOADING_SKELETON_TOKENS.base`에 `motion-reduce:animate-none` 접근성 클래스 포함
- 스켈레톤 컴포넌트에서 `animate-spin` (spinner) 미사용

**FAIL 기준:**
- index.ts re-export 누락
- 스켈레톤 컴포넌트에서 `animate-pulse` 직접 인라인 → `CHECKOUT_LOADING_SKELETON_TOKENS.base` 경유로 전환
- `animate-spin` 사용 → 스켈레톤 패턴(`animate-pulse`)으로 교체

**INFO 기준 (FAIL 아님):**
- `CheckoutListSkeleton`이 shadcn `<Skeleton>` 직접 사용하는 것 — 기존 컴포넌트이며 tech-debt으로 관리 중 (pr-19)

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/checkout-loading-skeleton.ts` — 로딩 스켈레톤 SSOT
- `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` — hasHero prop 분기
- `apps/frontend/components/checkouts/NextStepPanelSkeleton.tsx`
- `apps/frontend/components/checkouts/CheckoutGroupCardSkeleton.tsx`

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
| 6d  | 스태거 딜레이 SSOT             | PASS/FAIL | `index * N` raw 계산 위치      |
| 6b  | getTransitionClasses 속성 지정 | PASS/FAIL | properties 미지정 호출 위치    |
| 6c  | 컴포넌트 하드코딩 트랜지션     | PASS/FAIL | TRANSITION_PRESETS 미사용 위치 |
| 7   | Architecture v3 패턴           | PASS/INFO | Deprecated 패턴, Urgency 함수  |
| 8a  | h1 하드코딩 탐지               | PASS/FAIL | 토큰 미사용 h1 위치            |
| 8b  | 부제목 하드코딩 탐지           | PASS/FAIL | text-muted-foreground 하드코딩 |
| 8c  | 페이지 제목 아이콘 일관성      | PASS/FAIL | h1 내 아이콘 포함 페이지       |
| 8d  | 헤더 토큰 SSOT 참조            | PASS/FAIL | spread 누락 모듈               |
| 9   | Easing 3자 동기화              | PASS/FAIL | globals/primitives/motion 수 불일치 |
| 10a | v4 제거 유틸리티(`*-opacity-*`, `decoration-slice/clone`) 0 hits | PASS/FAIL | 발견 위치 |
| 10b | 레거시 `tailwind.config.*` / `@tailwind` 디렉티브 0 hits | PASS/FAIL | 발견 파일 |
| 10c | `tailwindcss-animate` 재도입 0 hits | PASS/FAIL | package.json 위치 |
| 10d | `postcss.config.js` 단일 `@tailwindcss/postcss` 플러그인 | PASS/FAIL | 위반 플러그인 |
| 12  | @theme CSS 변수 ↔ primitives.ts 3-way 동기화 | PASS/FAIL | 불일치 변수 목록 |
| 13  | Dead Token 탐지 (0 usage exports) | PASS/INFO/FAIL | dead token 목록 |
| 14  | Collapsible button: aria-expanded + aria-controls 쌍 | PASS/FAIL | aria-controls 누락 button 위치 |
| 15  | staggerFadeInItem SSOT + NC_SPACING_TOKENS.detail 우회 금지 | PASS/FAIL | raw index 곱셈 또는 `'link'` ctaKind 잔재 위치 |
| 16a | SPACING_RHYTHM_TOKENS `.replace()` 안티패턴 금지 | PASS/FAIL | `.replace('p','px')` 발견 위치 |
| 16b | NCGuidanceKeyReachable narrowing (Record 타입 좁힘) | PASS/FAIL | `Record<NCGuidanceKey,...>` 잔재 또는 dead entry 존재 |
| 17  | hex 색상 하드코딩 감지 (checkouts/**) | PASS/FAIL | `[⑨ hex 색상]` 위반 위치 목록 |
| 18  | UI 파생 `*StatusValues` `satisfies` 제약 + barrel export | PASS/FAIL | satisfies 미사용 또는 index.ts 누락 위치 |
| 19  | ring-dashed `--tw-ring-shadow` 인라인 override 금지 | PASS/FAIL | 컴포넌트에서 `--tw-ring-shadow` 직접 재정의 위치 |
| 20  | BRAND_CLASS_MATRIX 신규 색상 3곳 동시 갱신 | PASS/FAIL | `satisfies` 미존재 또는 globals.css CSS 변수 누락 위치 |
| 21  | design-token 파일 내 `dark:bg-brand-*` / `dark:text-brand-*` 금지 | PASS/FAIL | brand CSS 변수 대상 dark: prefix 사용 위치 (허용 예외 제외) |
| 22  | CALLOUT `text-brand-${}` 동적 보간 금지 | PASS/FAIL | `text-brand-${key}` 동적 보간 발견 위치 |
| 23  | checkout-toast/your-turn 토큰 index re-export + 소비처 SSOT 경유 | PASS/FAIL | index.ts 누락 또는 duration 인라인 숫자 위치 |
| 24  | checkout-loading-skeleton 토큰 SSOT + motion-reduce 접근성 + spinner 금지 | PASS/FAIL/INFO | index.ts 누락, animate-pulse 인라인, animate-spin 발견 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **shadcn/ui 컴포넌트** (`components/ui/`) — 서드파티 생성 코드
2. **design-tokens 내부 파일** — Layer 간 상호 참조는 아키텍처상 필수
3. **SkipLink** — 모든 포커스에 반응해야 하므로 `focus:` 의도적 사용
4. **장식용 요소** — 순수 장식 요소의 크기 하드코딩
5. **유틸리티 함수 import** — `toTailwindSize`, `toTailwindGap`은 Layer 3에서 직접 import 허용
6. **ANIMATION_PRESETS / TRANSITION_PRESETS import** — motion.ts에서 Layer 3 직접 import 허용
7. **notification.ts의 NOTIFICATION_BADGE_VARIANTS** — 호환성 export 유지, 컴포넌트 직접 사용 금지
8. **calibration-status.ts** — 3개 컴포넌트 중복 로직 통합 SSOT
9. **not-found.tsx / error.tsx** — 비정상 상태 표시, 독립 디자인
10. **SETTINGS_PAGE_HEADER_TOKENS** — 아이콘+border-b 포함 독립 헤더 디자인
11. **`page-layout.ts`의 Layer 3 내부 import** — cross-component SSOT 참조
