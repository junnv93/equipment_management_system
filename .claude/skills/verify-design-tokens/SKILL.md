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
| `apps/frontend/lib/design-tokens/components/*.ts` | Layer 3 컴포넌트 토큰 (20+개 파일) |
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
- `CheckoutStatus`, `CalibrationStatus`, `NCStatus` 등 동일 패턴
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

### Step 14b: `requestAnimationFrame` + ref focus transfer null guard (2026-04-21 추가)

배너/모달 닫기 후 WCAG 2.1 SC 2.4.3 포커스 이전 패턴에서 null guard 누락 시 런타임 에러.

```bash
# requestAnimationFrame 내 focus 호출 위치 확인
grep -n "requestAnimationFrame" apps/frontend/components/**/*.tsx apps/frontend/app/**/*.tsx 2>/dev/null
```

각 결과에서 내부 `.focus()` 호출 앞에 `?.` optional chaining 또는 `if (el)` null guard 존재 여부 확인.

**PASS:** 모든 `rAF` 내 focus 호출에 null guard 존재. **FAIL:** `el.focus()` bare 호출 → `el?.focus()` 또는 `if (el) el.focus()` 교체.

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
