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

**PASS:** `focus:ring`/`focus:outline`/`focus:bg`/`focus:text` 0개. **FAIL:** `focus-visible:` 변경.

> `focus:text-destructive` (DropdownMenuItem destructive 아이템)도 탐지 대상 — Step 32의 MENU_ITEM_TOKENS 처방과 함께 적용.

**상세:** [references/step-details.md](references/step-details.md) Step 2

### Step 3: Layer 3 함수 import 경로 + barrel 직접 서브패스 금지 (2026-04-26 강화)

컴포넌트가 design-tokens 내부 파일을 직접 서브패스로 import하지 않는지 확인.

**금지 패턴:**
- `@/lib/design-tokens/form-field-tokens` 등 서브패스 직접 import
- `@/lib/design-tokens/components/<name>` 직접 import
- `@/lib/design-tokens/semantic`, `@/lib/design-tokens/brand` 등 직접 import

모든 소비처는 반드시 `@/lib/design-tokens` barrel(index.ts) 경유.

```bash
# 서브패스 직접 import 탐지 (0건 기대)
grep -rn "from '@/lib/design-tokens/[^']*'" \
  apps/frontend/components/ apps/frontend/hooks/ apps/frontend/app/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "__tests__\|\.spec\."
# 결과: 0건 (PASS)
```

**PASS:** 0건. **FAIL:** 서브패스 직접 import 존재 → barrel 경유로 수정 + index.ts에 re-export 추가.

**상세:** [references/step-details.md](references/step-details.md) Step 3

### Step 4: 마이그레이션된 컴포넌트 토큰 사용

60개 마이그레이션 컴포넌트에서 design-tokens import 존재 확인.

**PASS:** 모든 컴포넌트에 import. **FAIL:** 토큰 미사용 → 재마이그레이션.

**상세:** [references/step-details.md](references/step-details.md) Step 4

### Step 5: Layer 3 컴포넌트 토큰 아키텍처 + barrel export

Layer 3 파일이 Layer 2만 참조하는지 + index.ts barrel export 확인.

**PASS:** primitives 직접 참조 0개. `toTailwindSize`/`toTailwindGap`은 `../utils` (Layer 1.5)에서만 import — `../primitives` 직접 import FAIL (2026-04-26 utils.ts Layer 1.5 분리 이후). **FAIL:** semantic 경유로 변경 또는 primitives 직접 import 잔존.

**상세:** [references/step-details.md](references/step-details.md) Step 5, 5b

### Step 6: TRANSITION_PRESETS + getTransitionClasses 속성 지정 + 하드코딩 트랜지션

- **6a:** Layer 3에서 `getTransitionClasses` 런타임 호출 0개 → TRANSITION_PRESETS 사용
- **6b:** `getTransitionClasses` 호출 시 properties 배열 필수
- **6c:** `components/ui/` 외부에서 하드코딩 transition 클래스 0개
- **6d:** `index * \d+` raw 스태거 딜레이 0개 → `getStaggerDelay(index, type)` SSOT 함수 사용

**상세:** [references/step-details.md](references/step-details.md) Step 6

### Step 7: Architecture v3 Visual Feedback + 한국어 label 잔존

- **7a:** Architecture v3 배지 패턴 — `getNotificationBadgeClasses(count)` 경유 확인, 직접 urgency 클래스 인라인 0개
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
- `CHECKOUT_HEADER_TOKENS`, `CHECKOUT_SUB_HEADER_TOKENS` — spread 위임 패턴으로 실제 사용됨 (중복 제거용)
- `CHECKOUT_HEADER_TOKENS`, `CHECKOUT_SUB_HEADER_TOKENS` — spread 위임 패턴으로 실제 사용됨

**FAIL 기준:** dead token ≥ 5개 시 FAIL (0~4개는 INFO 레벨). 즉각 삭제보다 tech-debt-tracker 등록 권고.

**상세:** [references/step-details.md](references/step-details.md) Step 13

### Step 14: Collapsible/Disclosure button WCAG 2.1 패턴 (2026-04-21 추가, 2026-04-27 탐지 강화)

`button[aria-expanded]`는 WCAG 2.1 Disclosure 패턴 상 반드시 `aria-controls`와 쌍을 이루어야 한다.
`aria-controls` 값은 열고/닫는 콘텐츠 영역의 `id`와 일치해야 한다.

이번 세션(78차2)에서 `NCDetailClient.tsx`의 `CollapsibleSection`에 `contentId` prop + `aria-controls={contentId}` + `id={contentId}` 패턴이 도입됨.
2026-04-27 세션: `DashboardShell.tsx` 사이드바 토글 `<Button>`에 `aria-controls="desktop-sidebar"` + `<aside id="desktop-sidebar">` 패턴 추가.

```bash
# aria-expanded는 있지만 aria-controls가 없는 button/Button 탐지
# <button>(HTML) + <Button>(shadcn/ui React 컴포넌트) 모두 검사
grep -rn "aria-expanded" apps/frontend/components apps/frontend/app \
  --include="*.tsx" -l | while read f; do
  node -e "
    const fs = require('fs');
    const content = fs.readFileSync('$f', 'utf-8');
    const lines = content.split('\n');
    lines.forEach((line, i) => {
      if (line.includes('aria-expanded') && !line.includes('aria-controls')) {
        // 앞뒤 4줄(멀티라인 props 대응) 포함해서 button 컨텍스트 확인
        const ctx = lines.slice(Math.max(0,i-4), i+5).join(' ');
        const hasButton = ctx.includes('<button') || ctx.includes('<Button');
        if (hasButton && !ctx.includes('aria-controls')) {
          console.log('$f:' + (i+1) + ': aria-expanded without aria-controls');
        }
      }
    });
  " 2>/dev/null
done
```

```bash
# aria-controls 값과 id 일치 확인 — 모든 컴포넌트 대상
# aria-controls가 있는 파일에서 참조 id가 동일 파일(또는 관련 파일)에 존재하는지 확인
grep -rn "aria-controls" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" \
  | grep -v "shadcn\|node_modules\|/ui/" \
  | grep -oP 'aria-controls=["\x27]\K[^"\']+' \
  | sort -u
# 추출된 id 목록이 컴포넌트에 id= 속성으로 존재해야 함
# 주요 검사: "desktop-sidebar" → DashboardShell.tsx <aside id="desktop-sidebar">
# 주요 검사: "nc-*" → NCDetailClient.tsx CollapsibleSection id={contentId}
grep -rn 'id="desktop-sidebar"' apps/frontend/components/ --include="*.tsx"
# → 1건: DashboardShell.tsx <aside id="desktop-sidebar"> (PASS)
```

**PASS:** `aria-expanded`가 있는 모든 button/Button에 `aria-controls` 존재. 값이 같은 파일 내 `id` 속성과 일치.
**FAIL:** `aria-expanded` 단독 사용 → `contentId` prop 또는 인라인 `aria-controls` 추가.

**올바른 패턴:**
```tsx
// ✅ shadcn/ui <Button> 컴포넌트 — aria-controls 명시
<Button
  aria-expanded={!isCollapsed}
  aria-controls="desktop-sidebar"   // ← 제어 대상 id 참조
  onClick={toggleSidebar}
/>
<aside id="desktop-sidebar" ...>    // ← 제어 대상 요소
  ...
</aside>

// ✅ CollapsibleSection prop 패턴
<CollapsibleSection
  contentId="nc-findings"           // ← prop → aria-controls={contentId}
>
  <div id="nc-findings">...</div>   // ← 제어 대상 요소
</CollapsibleSection>
```

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
- CSS 변수가 아닌 **Tailwind 커스텀 색상**(`ul-midnight`, `ul-fog`, `ul-white` 등)과 brand CSS 변수의 조합 — 라이트/다크 모드에서 **완전히 다른 색상 계열**을 써야 하는 경우.
  예: `'text-ul-midnight dark:text-brand-info'`, `'data-[state=active]:bg-ul-midnight dark:data-[state=active]:bg-brand-info'`
  판별 기준: 라이트 모드 값이 `ul-*` 같은 non-CSS-var 커스텀 색상이고 다크 모드 값이 brand CSS 변수로 **대체**되는 경우.
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

### Step 25: CSS 변수 주입 토큰 fallback 필수 (2026-04-24 추가)

**원칙:** 디자인 토큰이 `shadow-[...var(--custom-var)]` / `bg-[var(--custom-bg)]` 같이 컴포넌트-런타임에서 주입받는 CSS 변수를 포함할 때, **fallback 값 필수** (`,transparent` / `,initial` 등).

**이유:**
- 호출부에서 `style={{'--custom-var': '...'}}` 주입을 잊으면 브라우저가 CSS 변수를 `initial`로 해석 → 원치 않는 시각 효과.
- 예: `shadow-[0_4px_14px_-6px_var(--callout-hero-shadow)]` → 변수 미주입 시 shadow가 `0 4px 14px -6px initial` → **invalid** → shadow 렌더링 안 됨.
- 원칙: CSS 변수 주입 토큰은 반드시 fallback을 명시해 "주입 누락 시 보이지 않음"보다 "주입 누락 시 안전한 기본값" 제공.

**FAIL 조건:**
- `lib/design-tokens/**`에서 `var(--[a-z-]+)` 패턴이 있지만 `var(--name, <fallback>)` 형태가 아닌 경우.
- 단, `background: var(--bg)` 처럼 CSS 속성 전체가 변수에 의존할 때 (일반적으로 이미 선언된 semantic 변수)는 예외.

**탐지 명령어:**
```bash
# CSS 변수 주입 중 fallback 없는 것 탐지
grep -rn 'var(--[a-z-]\+\s*)' apps/frontend/lib/design-tokens/ | grep -v 'var(--[a-z-]\+\s*,'
```
결과가 0건이어야 PASS. 단, `:root` / `.dark` / `@theme` 등 변수 **선언** 위치는 예외 (declared에는 fallback 없음이 정상).

**Exceptions:**
- `--tw-*` 유틸리티 변수 (Tailwind 내부 변수, fallback 금지 이유 있음)
- `:root`, `.dark`, `@theme` 블록 내 **선언** 위치

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `CALLOUT_TOKENS.size.hero`의 `--callout-hero-shadow` 패턴이 원형

### Step 26: 사전 생성 룩업 토큰 + `satisfies Record<K, string>` 가드 (2026-04-24 추가)

**원칙:** variant별 클래스 문자열이 유한 집합(CalloutVariant / NCGuidanceKey 등)이면 **모듈 초기화 시 사전 생성**된 `Record<K, string>`으로 선언. 함수 호출마다 `string concat`하는 패턴 금지.

**이유:**
- React reconciliation에서 동일 className이 매 렌더마다 새 문자열 참조를 가지면 child memoization 깨짐 가능.
- 매 호출 concat은 CPU + 메모리 할당 낭비 (수백~수천 행 리스트에서 뚜렷).
- `satisfies Record<K, string>` 가드가 key 누락을 컴파일 에러로 잡아줌 (예: 새 variant 추가 시 누락 방지).

**FAIL 조건:**
- `lib/design-tokens/**/*.ts`에서 variant 인자를 받는 함수가 `[... ${getSemanticX(key)} ...].join(' ')` 또는 `template literal` 형태로 매 호출 생성하면서 인자가 유한 closed-set (CalloutVariant 등)일 때.
- 사전 생성 Record에 `as const satisfies Record<Key, Value>` 가드 누락.

**탐지 명령어:**
```bash
# variant 인자를 받는 함수가 유한 집합일 때 사전 생성 없는지 확인
grep -rn 'Variant\|CalloutVariant\|RoleChipKey\|ConfirmPreviewTone' apps/frontend/lib/design-tokens/ | \
  grep -v 'satisfies Record\|type\|interface\|import\|export type' | head -20

# satisfies 가드 누락 확인 — Record<...>만 있고 satisfies 없는 정의
grep -rn 'Record<.*>\s*=' apps/frontend/lib/design-tokens/ | grep -v 'satisfies\|interface\|type '
```

**권장 패턴:**
```ts
// ❌ 매 호출 concat
primarySolid: (v: CalloutVariant): string =>
  [`base-classes`, getSemanticSolidBgClasses(v)].join(' '),

// ✅ 사전 생성 O(1) 룩업
const PRIMARY_SOLID_CLASSES = {
  info: `base-classes ${getSemanticSolidBgClasses('info')}`,
  warning: `base-classes ${getSemanticSolidBgClasses('warning')}`,
  // ... 5 variant 전부
} as const satisfies Record<CalloutVariant, string>;

primarySolid: (v: CalloutVariant): string => PRIMARY_SOLID_CLASSES[v],
```

**Exceptions:**
- 매핑이 `string → semantic key → classes` 같은 2단계 함수 합성이고 실제 유한 집합이 10+ 이상으로 커서 사전 생성이 파일을 비대하게 할 때는 예외적으로 function 허용. 이 경우 `useMemo` 등으로 호출부 캐싱 권장.

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `ROLE_CHIP_CLASSES` (5 variant), `CONFIRM_PREVIEW_CARD_CLASSES` (3 tone)
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_GUIDANCE_CTA_PRIMARY_SOLID` (5 variant)
- 모두 2026-04-24 Phase 1.1 self-audit에서 function → Record 사전 생성으로 마이그레이션됨

### Step 27: NC compact dot 클래스 — `getNCWorkflowCompactDotClasses` SSOT 경유 필수 (2026-04-24 추가)

**원칙:** NC 워크플로우 compact 모드의 dot 상태 클래스는 `NC_WORKFLOW_TOKENS.compactDot.*` 직접 접근 금지. `getNCWorkflowCompactDotClasses(stepIdx, currentIdx, isLongOverdue)` 유틸 함수만 허용.

**이유:**
- `compactDot`은 5 상태(completed/current/currentCritical/pending)를 가지며, `isLongOverdue + NC_OPEN_STEP_INDEX + NC_TERMINAL_STEP_INDEX` 조합 분기가 내장됨.
- 직접 접근 시 분기 로직이 컴포넌트에 중복 → overdue/terminal 조건 누락 버그 발생 용이.
- full 모드의 `getNCWorkflowNodeClasses` / `getNCWorkflowLabelClasses` / `getNCWorkflowConnectorClasses`와 동일 SSOT 설계 (2026-04-24 Phase 3 도입).

**FAIL 조건:**
- `apps/frontend/components/**`에서 `NC_WORKFLOW_TOKENS.compactDot.` 직접 접근.
- `getNCWorkflowCompactDotClasses`가 `apps/frontend/lib/design-tokens/index.ts`에 미등록.

**탐지 명령어:**
```bash
# 컴포넌트 파일에서 compactDot 직접 접근 탐지
grep -rn "NC_WORKFLOW_TOKENS\.compactDot\." \
  apps/frontend/components/ --include="*.tsx" --include="*.ts"
# 기대: 0건 (PASS)

# index.ts re-export 확인
grep -n "getNCWorkflowCompactDotClasses" apps/frontend/lib/design-tokens/index.ts
# 기대: 1건 (PASS)
```

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_WORKFLOW_TOKENS.compactDot.*` + `getNCWorkflowCompactDotClasses` 정의
- `apps/frontend/components/non-conformances/NCDetailClient.tsx` — 유일한 compact dot 사용처 (2026-04-24 Phase 3)

### Step 28: 컴포넌트 JSX 인라인 brand 리터럴 탐지 (2026-04-24 추가)

**원칙:** NC Phase 4 verify-implementation에서 발견 — 컴포넌트 JSX `className`에서 `bg-brand-*`/`text-brand-*`/`border-brand-*` 색상 클래스를 design-token 경유 없이 직접 문자열 리터럴로 사용 금지.

**허용 패턴:**
- design-token 파일(`lib/design-tokens/**`) 내부에서 사용 — Layer 3 정의 레이어
- `cn(tokenClass, ...)` 조합으로 token 기반 동적 결합
- `getSemanticSolidBgClasses()` / `getSemanticContainerTextClasses()` 등 semantic 헬퍼 경유 후 token에 저장

**금지 패턴:**
```tsx
// ❌ WRONG — JSX className에 brand 리터럴 직접 사용
<div className="bg-brand-ok text-white hover:brightness-110">
<strong className="text-brand-ok">

// ✅ CORRECT — token 경유
<div className={NC_DIALOG_TOKENS.repairSubmit}>
<strong className={NC_DIALOG_TOKENS.changeSummaryModified}>
```

**탐지 명령어:**
```bash
# 컴포넌트 파일에서 className 내 brand 색상 직접 사용 탐지
grep -rn 'className="[^"]*\(bg-brand-\|text-brand-\|border-brand-\)' \
  apps/frontend/components/ --include="*.tsx" | \
  grep -v "design-tokens\|// " | head -20
# 기대: 0건 (PASS) — 모든 brand 리터럴은 design-token 경유

# 템플릿 리터럴 형식도 탐지
grep -rn 'className={`[^`]*\(bg-brand-\|text-brand-\|border-brand-\)' \
  apps/frontend/components/ --include="*.tsx" | \
  grep -v "design-tokens\|// " | head -20
```

**PASS:** 0건 (설계 의도에 따라 CN 조합에서 token 미등록 항목이 없어야 함).
**FAIL:** 직접 리터럴 발견 → 해당 token을 `non-conformance.ts` 또는 적절한 Layer 3 파일에 추가 후 경유.

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_DIALOG_TOKENS` (Phase 4 추가)
- `apps/frontend/lib/design-tokens/components/non-conformance.ts` — `NC_BANNER_TOKENS.detailCardLink` (hover variant)

### Step 29: 크로스 도메인 공유 색상 SSOT + tabBadge alert 토큰 + `satisfies` 강제 (2026-04-26 추가, Sprint 2.4)

**원칙 1 — 크로스 도메인 공유 색상은 `semantic.ts` 배치 필수:**
`checkout.ts` ↔ `notification.ts` 등 서로 다른 도메인 컴포넌트 토큰 파일 간 직접 import 금지.
공유 색상 값은 반드시 `semantic.ts`에 이름 있는 상수(`ALERT_TAB_BADGE_COLOR` 등)로 정의 후 각 도메인 파일에서 참조한다.

**원칙 2 — `tabBadge` alert 상태는 `ALERT_TAB_BADGE_COLOR` SSOT 경유:**
`bg-destructive text-destructive-foreground` raw 리터럴을 컴포넌트 파일 또는 Layer 3 토큰 파일에 직접 인라인 금지.
`CHECKOUT_TAB_BADGE_TOKENS.alert` 및 `NOTIFICATION_LIST_FILTER_TOKENS.tabBadge` 모두 `ALERT_TAB_BADGE_COLOR`를 경유해야 한다.

**원칙 3 — `CHECKOUT_TAB_BADGE_TOKENS`의 `as const satisfies` 강제:**
`CHECKOUT_TAB_BADGE_TOKENS`는 `as const satisfies { base: string; active: string; inactive: string; alert: string }` 제약이 필수.
새 variant(`alert` 등) 추가 시 TypeScript가 컴파일 타임에 누락을 탐지한다.

**탐지 — 원칙 1: 도메인 간 직접 import 금지:**
```bash
# checkout.ts → notification.ts 직접 import (또는 역방향) 탐지
grep -n "from.*notification\|from.*checkout" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  apps/frontend/lib/design-tokens/components/notification.ts
# → 0건 (도메인 파일은 semantic.ts만 참조)
```

**탐지 — 원칙 2: raw `bg-destructive text-destructive-foreground` 인라인 금지:**

검사 대상은 **온전한 `bg-destructive text-destructive-foreground` 문자열 조합** (tabBadge 경보 패턴)에 한정된다.
`bg-destructive/5`, `bg-destructive/10` 등 투명도 변형은 에러 상태 배경으로 허용.

```bash
# Layer 3 컴포넌트 토큰 파일에서 raw bg-destructive text-destructive-foreground 조합 탐지
grep -rn "bg-destructive text-destructive-foreground\|bg-destructive.*text-destructive-foreground" \
  apps/frontend/lib/design-tokens/components/ --include="*.ts" \
  | grep -v "ALERT_TAB_BADGE_COLOR"
# → 0건 (ALERT_TAB_BADGE_COLOR 경유)

# 컴포넌트/페이지에서 rounded-full + bg-destructive text-destructive-foreground 조합 탐지
# (탭 배지 패턴에 특화 — shadcn/ui button/badge/toast, 일반 에러 배경 제외)
grep -rn "rounded-full.*bg-destructive text-destructive-foreground\|bg-destructive text-destructive-foreground.*rounded-full\|rounded-full.*bg-destructive.*text-destructive-foreground" \
  apps/frontend/components/ apps/frontend/app/ --include="*.tsx" --include="*.ts" \
  | grep -v "CHECKOUT_TAB_BADGE_TOKENS\|ALERT_TAB_BADGE_COLOR\|components/ui/\|// "
# → 0건 (CHECKOUT_TAB_BADGE_TOKENS.alert 경유)
```

**예외 (허용):**
- `components/ui/` (shadcn/ui) 내 destructive variant — button, badge, toast 등 shadcn 자체 컴포넌트
- `bg-destructive/5`, `bg-destructive/10`, `border-destructive` 등 투명도 변형 및 단독 사용 — 에러/경고 배경
- `VisualTableEditor.tsx:242` — 점검 결과 편집기의 고정 위치(`absolute -top-1 -right-1`) 에러 indicator. tabBadge 패턴이 아닌 독립 badge로 기존 허용 (`inspections/` 도메인, ALERT_TAB_BADGE_COLOR 적용 시 레이아웃 깨짐)
- 탭 배지가 아닌 고정 위치 소형 badge 인라인 (`absolute`/`fixed` 조합) — 단, 신규 추가 시 `ALERT_TAB_BADGE_COLOR` 경유 권장

**탐지 — 원칙 3: `as const satisfies` 제약 존재 확인:**
```bash
# CHECKOUT_TAB_BADGE_TOKENS에 satisfies 제약 존재 확인
grep -A 6 "^export const CHECKOUT_TAB_BADGE_TOKENS" \
  apps/frontend/lib/design-tokens/components/checkout.ts
# → 마지막 줄: } as const satisfies { base: string; active: string; inactive: string; alert: string };

# ALERT_TAB_BADGE_COLOR가 semantic.ts에 정의되고 index.ts에서 re-export되는지 확인
grep -n "ALERT_TAB_BADGE_COLOR" \
  apps/frontend/lib/design-tokens/semantic.ts \
  apps/frontend/lib/design-tokens/index.ts
# → semantic.ts: 1건 (정의), index.ts: 1건 (re-export)
```

**PASS:** 도메인 간 직접 import 0건, raw `bg-destructive` 인라인 0건, `satisfies` 제약 존재, `ALERT_TAB_BADGE_COLOR` 두 곳 모두 정의.
**FAIL:**
- 도메인 간 직접 import 발견 → `semantic.ts`에 공유 상수로 승격 후 각 도메인 파일에서 참조
- raw `bg-destructive text-destructive-foreground` 인라인 → `ALERT_TAB_BADGE_COLOR` 경유로 교체
- `satisfies` 미존재 → `as const satisfies { base: string; active: string; inactive: string; alert: string }` 추가

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `ALERT_TAB_BADGE_COLOR` 정의 위치 (크로스 도메인 공유 SSOT)
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `CHECKOUT_TAB_BADGE_TOKENS` (satisfies 제약)
- `apps/frontend/lib/design-tokens/components/notification.ts` — `NOTIFICATION_LIST_FILTER_TOKENS.tabBadge` (`ALERT_TAB_BADGE_COLOR` 경유)
- `apps/frontend/lib/design-tokens/index.ts` — `ALERT_TAB_BADGE_COLOR` barrel re-export
- `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx` — `CHECKOUT_TAB_BADGE_TOKENS.alert` 소비처

### Step 30: FOCUS_TOKENS.ringCurrent — 스테퍼 현재 단계 링 하드코딩 탐지 (2026-04-26 추가)

`semantic.ts`의 `FOCUS_TOKENS.ringCurrent`가 "현재 단계(current step)" 강조 링의 SSOT.
`ring-2 ring-brand-info ring-offset-2`를 컴포넌트에서 직접 조합하면 brand 색상 변경 시 drift 발생.

**탐지:**
```bash
# 현재 단계 링 클래스 인라인 직접 조합 탐지 — focus-visible: prefix 없는 패턴만 (의도적 키보드 포커스 링 제외)
grep -rn "ring-2.*ring-brand-info\|ring-brand-info.*ring-2" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "design-tokens\|focus-visible:\|// \|node_modules"
```

**PASS:** 0건 (`FOCUS_TOKENS.ringCurrent` 경유). **FAIL:** 인라인 ring 조합 발견 시 `FOCUS_TOKENS.ringCurrent`로 교체.

**예외:** `focus-visible:ring-2 focus-visible:ring-brand-info` — 키보드 포커스 링 (접근성 목적, `FOCUS_TOKENS.classes.*` 경유 권장이나 인라인 허용).

**배경:** Sprint 2.6(2026-04-26)에서 스테퍼 `current.node` 클래스가 `FOCUS_TOKENS.ringCurrent`로 통일.
`focus-visible:` prefix 없음 — `FOCUS_TOKENS.classes.*`와 혼용 주의.

**관련 파일:**
- `apps/frontend/lib/design-tokens/semantic.ts` — `FOCUS_TOKENS.ringCurrent` 정의 (최상위, `classes` 블록 외부)
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `CHECKOUT_STEPPER_TOKENS` 소비처

### Step 31: callout/aside 요소 `role="alert"` 금지 — `role="status"` 강제 (2026-04-26 추가)

**원칙:** `role="alert"`는 스크린리더가 포커스 위치를 무시하고 즉시 읽음 (assertive). 상태 변경 안내용 callout에 이를 사용하면 페이지 포커스 이동 + 라이브 리전 이중 읽기가 발생한다. (실측: NC R1a GuidanceCallout 개선, 2026-04-26)

**규칙:**
- 상태 안내 callout/banner(`<aside>`, 안내 패널): `role="status"` + `aria-live="polite"` 필수
- `role="alert"`: AlertDialog 파괴적 작업 확인(삭제 confirm) 전용

```bash
# callout/aside 컴포넌트에 role="alert" 직접 사용 탐지
grep -rn 'role="alert"' \
  apps/frontend/components/non-conformances \
  apps/frontend/components/checkouts \
  apps/frontend/components/approvals \
  --include="*.tsx" \
  | grep -v "AlertDialog\|AlertDialogContent\|// \|node_modules"
```

**PASS:** 0건 (callout은 모두 `role="status"` 사용). **FAIL:** callout/안내 패널에서 `role="alert"` 발견 시 `role="status"` + `aria-live="polite"` 로 교체.

**예외:**
- `<AlertDialog>`, `<AlertDialogContent>` 컴포넌트 내부 — Radix UI 구조상 허용
- 즉각적 에러 알림(form 제출 실패, 네트워크 오류 등) — `role="alert"` 허용 (`aria-live="assertive"` 포함)
- `AlertBanner.tsx` — severity-conditional role 패턴 (Step 38): `critical/warning → role="alert"`, `info/none → role="status"`. 정적 callout이 아닌 동적 알림 배너 전용 허용.

**배경:** `GuidanceCallout`이 조건부 `role="alert"/"status"` → 항상 `role="status"` 로 통일. 페이지 진입 시 h2 포커스 + aria-live 이중 읽기 제거.

### Step 32: MENU_ITEM_TOKENS.destructive SSOT — DropdownMenuItem 파괴적 액션 하드코딩 금지 (2026-04-27 추가)

**원칙:** DropdownMenuItem의 destructive 액션(삭제·반려 등)에 사용하는 `text-destructive focus-visible:text-destructive` 패턴은 `MENU_ITEM_TOKENS.destructive` SSOT를 경유해야 한다. 리터럴 직접 사용 시 `focus:` → `focus-visible:` 전환 누락 버그가 도메인별로 반복 발생한다. (실측: 3개 도메인 4파일 동일 버그, 2026-04-27)

**규칙:**
- `DropdownMenuItem` destructive 아이템에는 반드시 `className={MENU_ITEM_TOKENS.destructive}` 사용
- `text-destructive focus:text-destructive` / `text-destructive focus-visible:text-destructive` 리터럴 직접 사용 금지
- `MENU_ITEM_TOKENS`는 `lib/design-tokens/semantic.ts` (Layer 2) 단일 정의 — 로컬 재정의 금지

```bash
# DropdownMenuItem destructive 리터럴 하드코딩 탐지
grep -rn "\"text-destructive focus[^\"]*text-destructive\"\|'text-destructive focus[^']*text-destructive'" \
  apps/frontend/components/ \
  --include="*.tsx" \
  | grep -v "components/ui/\|node_modules"
```

```bash
# MENU_ITEM_TOKENS 로컬 재정의 탐지 (semantic.ts 이외 정의 금지)
grep -rn "MENU_ITEM_TOKENS\s*=" \
  apps/frontend/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "semantic\.ts\|node_modules"
```

**PASS:** 첫 번째 명령어 0 hit, 두 번째 명령어 0 hit. **FAIL:** 리터럴 직접 사용 또는 로컬 재정의 발견 → `MENU_ITEM_TOKENS.destructive` import + 교체.

**예외:**
- `components/ui/` (shadcn/ui) — 서드파티 생성 코드
- `toast.tsx`의 `group-[.destructive]:focus:ring-destructive` — Tailwind group modifier 패턴, 별개 맥락

**상세:** [references/step-details.md](references/step-details.md) Step 32

### Step 34: WAI-ARIA grid 패턴 — `role="grid" > role="row" > role="gridcell"` 3단계 일관성 (2026-04-27 추가)

`CheckoutGroupCard`처럼 비표준 div 기반 그리드(`display: grid`)를 테이블처럼 탐색해야 하는 컴포넌트는
WAI-ARIA 명세의 `grid → row → gridcell` 3단계 역할 계층을 반드시 준수해야 한다.
`role="grid"` 만 선언하고 자식에 `role="row"` / `role="gridcell"` 이 없으면
스크린리더가 셀 탐색 키(`←/→/↑/↓`)를 올바르게 처리하지 못한다.

```bash
# role="grid"가 있는 컴포넌트에서 role="row" 미사용 탐지
grep -rln "role=\"grid\"" apps/frontend/components/ --include="*.tsx" \
  | grep -v "ui/" \
  | while read f; do
      if ! grep -q 'role="row"' "$f"; then
        echo "MISSING role=row in: $f"
      fi
    done

# role="grid"가 있는 컴포넌트에서 role="gridcell" 미사용 탐지
grep -rln "role=\"grid\"" apps/frontend/components/ --include="*.tsx" \
  | grep -v "ui/" \
  | while read f; do
      if ! grep -q 'role="gridcell"' "$f"; then
        echo "MISSING role=gridcell in: $f"
      fi
    done
```

**PASS:** `role="grid"` 선언 컴포넌트 모두 `role="row"` + `role="gridcell"` 동시 존재.
**FAIL:** 3단계 중 하나라도 누락 → 부모부터 순서대로 `role="grid" > role="row" > role="gridcell"` 추가.

**예외:**
- shadcn/ui의 `<Table>` 컴포넌트 — HTML 네이티브 `<table>/<tr>/<td>` 사용, 별도 `role` 불필요
- `EquipmentTable.tsx` — HTML `<Table>` 내부에 `role="grid"` 추가 + `role="row"/"gridcell"` 명시 패턴 (이미 적용)

**관련 파일:**
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — Sprint 4.2 도입, div-based grid + ARIA 3단계
- `apps/frontend/components/equipment/EquipmentTable.tsx` — 기존 참고 구현

### Step 35: `CHECKOUT_ITEM_ROW_TOKENS` zone key `satisfies { ... [key: string]: unknown }` 강제 (2026-04-27 추가)

Sprint 4.2에서 도입된 `CHECKOUT_ITEM_ROW_TOKENS`는 4-zone grid의 핵심 키(`grid`, `zoneStatus`, `zoneIdentity`, `zoneAction`, `miniProgressTooltipButton`)가 반드시 존재함을 컴파일 타임에 강제한다.

`as const satisfies { grid: string; zoneStatus: string; zoneIdentity: string; zoneAction: string; miniProgressTooltipButton: string; [key: string]: unknown }` 제약이 이 역할을 한다.
`[key: string]: unknown` 인덱스 시그니처가 없으면 `purposeBar`, `container` 등 추가 키를 가진 넓은 객체에 `satisfies`가 거부되므로 필수다.

```bash
# CHECKOUT_ITEM_ROW_TOKENS satisfies 제약 존재 확인
grep -A 8 "^} as const satisfies" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep -B1 "zoneStatus\|zoneIdentity\|zoneAction\|miniProgressTooltipButton"
# 기대: zone key가 포함된 satisfies 블록 존재

# [key: string]: unknown 인덱스 시그니처 존재 확인 (넓은 객체 허용용)
grep -A 10 "CHECKOUT_ITEM_ROW_TOKENS" \
  apps/frontend/lib/design-tokens/components/checkout.ts \
  | grep "\[key: string\]: unknown"
# 기대: 1건 (PASS)
```

**PASS:** `satisfies { grid: string; zoneStatus: string; zoneIdentity: string; zoneAction: string; miniProgressTooltipButton: string; [key: string]: unknown }` 제약 존재.
**FAIL:** `satisfies` 없음 → zone key 삭제/오타 시 컴파일 에러 미발생 → 런타임 undefined 접근 위험.

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `CHECKOUT_ITEM_ROW_TOKENS` 정의 (Sprint 4.2 신규 zone keys)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — zone key 소비처 (`CHECKOUT_ITEM_ROW_TOKENS.zoneStatus` 등)

### Step 36: `WORKFLOW_PANEL_TOKENS.variant` + `.actor` `satisfies Record` 완전성 + `WorkflowPanelActorVariant` 타입 (2026-04-27 추가)

Sprint 4.1에서 `WORKFLOW_PANEL_TOKENS`에 `variant` / `actor` 두 서브트리가 추가됨:
- `variant`: `compact | hero` 2-way → `satisfies Record<'compact' | 'hero', { container: string; heading: string; actionButton: string }>` 강제
- `actor`: `requester | approver | receiver` 3-way → `satisfies Record<'requester' | 'approver' | 'receiver', { border: string; icon: string; accent: string }>` 강제

이 `satisfies` 가드가 없으면 새 actor/variant 추가 시 누락을 TypeScript가 잡지 못한다.
또한 `WorkflowPanelActorVariant = keyof typeof WORKFLOW_PANEL_TOKENS.actor` 타입이 export되어야 한다.

```bash
# variant satisfies 확인 (2-way)
grep -A 4 "} satisfies Record<" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  | grep "'compact' | 'hero'"
# 기대: 1건 (PASS)

# actor satisfies 확인 — ActorVariant SSOT 경유 (schemas import)
grep "satisfies Record<ActorVariant" apps/frontend/lib/design-tokens/components/workflow-panel.ts
# 기대: 1건 (PASS) — 인라인 리터럴 'requester'|'approver'|'receiver' 대신 ActorVariant 사용

# WorkflowPanelActorVariant 타입 export 확인
grep -n "WorkflowPanelActorVariant" \
  apps/frontend/lib/design-tokens/components/workflow-panel.ts
# 기대: export type WorkflowPanelActorVariant = keyof ... (PASS)

# index.ts barrel re-export 확인
grep -n "workflow-panel\|WorkflowPanelActorVariant" \
  apps/frontend/lib/design-tokens/index.ts
# 기대: workflow-panel 파일 re-export + WorkflowPanelActorVariant 포함
```

**PASS:** variant satisfies 1건 + `satisfies Record<ActorVariant>` 1건 + `WorkflowPanelActorVariant` export + index.ts barrel re-export.
**FAIL:**
- `satisfies` 누락 → 새 variant/actor 추가 시 TypeScript 미탐지
- `ActorVariant` 대신 inline 리터럴 `'requester' | 'approver' | 'receiver'` 사용 → schemas SSOT 연결 끊김 (ActorVariant 확장 시 미탐지)
- `WorkflowPanelActorVariant` 미export → 소비처가 직접 union 리터럴 재정의 (SSOT 위반)
- index.ts barrel 누락 → 소비처가 직접 서브패스 import (Step 3 위반)

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — `WORKFLOW_PANEL_TOKENS.variant`, `WORKFLOW_PANEL_TOKENS.actor`, `WorkflowPanelActorVariant`
- `apps/frontend/lib/design-tokens/index.ts` — barrel re-export
- `apps/frontend/components/shared/NextStepPanel.tsx` — actor/variant 소비처, `resolveActorVariant()` 내부 사용

### Step 33: DASHBOARD_ENTRANCE/DASHBOARD_MOTION 토큰 + globals.css prefers-reduced-motion (2026-04-27 추가)

**33a: DASHBOARD_ENTRANCE 스태거 딜레이 인라인 금지**

대시보드 Row 단위 섹션 스태거는 `DASHBOARD_ENTRANCE.stagger.*`와 `DASHBOARD_ENTRANCE.stagger.*Delay` 명명 토큰을 경유해야 한다.
`style={{ animationDelay: 'Xms' }}` 인라인 또는 `animationDelay` 리터럴 직접 할당은 금지.
(Step 15의 `getStaggerFadeInStyle(index, ...)` 패턴은 per-item stagger용; 이 Step은 섹션 Row 레벨 토큰 검사)

```bash
# DashboardClient에서 animationDelay 인라인 직접 사용 탐지
grep -rn "animationDelay\s*:" \
  apps/frontend/components/dashboard/ \
  --include="*.tsx" --include="*.ts" \
  | grep -v "getStaggerFadeInStyle\|getDashboardStaggerDelay\|DASHBOARD_ENTRANCE\|node_modules"
```

**PASS:** 0 hit. **FAIL:** `animationDelay: 'Xms'` 인라인 → `E.stagger.*Delay` 토큰으로 교체.

**예외:**
- `getDashboardStaggerDelay(i, 'grid'|'list')` — per-item stagger 헬퍼 경유 (getStaggerFadeInStyle과 동등). Row 섹션 레벨 토큰 규칙과 다른 스코프.

**33b: DASHBOARD_MOTION transition 토큰 경유 강제**

대시보드 컴포넌트에서 `transition-colors`/`transition-opacity`/`transition-shadow` 인라인 리터럴은 `DASHBOARD_MOTION.*` 토큰을 경유해야 한다.
`text-muted-foreground hover:text-foreground transition-colors`는 `DASHBOARD_MOTION.textColor`로 교체.

```bash
# DashboardClient 및 대시보드 컴포넌트에서 transition-colors 인라인 사용 탐지
grep -rn '"[^"]*transition-colors[^"]*"' \
  apps/frontend/components/dashboard/ \
  --include="*.tsx" \
  | grep -v "DASHBOARD_MOTION\|node_modules\|className={cn"
```

**PASS:** 0 hit. **FAIL:** 인라인 `transition-colors` → `DASHBOARD_MOTION.textColor` (또는 `.listItem`, `.cardHover`) 교체.

**33c: globals.css @media (prefers-reduced-motion) 존재 확인**

접근성 기준(WCAG 2.3.3 Animation from Interactions)에 따라 `globals.css`에 `prefers-reduced-motion` 미디어 쿼리 오버라이드가 존재해야 한다.

```bash
# globals.css에 reduced-motion 미디어 쿼리 존재 확인
grep -c "prefers-reduced-motion" \
  apps/frontend/styles/globals.css
```

**PASS:** 1 이상. **FAIL:** 0 → globals.css에 `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; ... } }` 추가.

**33d: @source inline() — animation-delay arbitrary 값 JIT 감지**

Tailwind v4에서 JS/TS 파일에 동적 생성되는 arbitrary class(예: `animation-delay-[Xms]`)는 `@source inline(...)` 지시어로 스캔 대상에 포함해야 한다. 이 지시어가 없으면 프로덕션 빌드에서 해당 클래스가 purge된다.

```bash
# globals.css에 @source inline 존재 확인
grep -c "@source inline" apps/frontend/styles/globals.css
```

**PASS:** 1 이상 (DASHBOARD_ENTRANCE 딜레이 arbitrary 값 커버). **FAIL:** 0 → `@source inline("...")` 추가.

**Related Files:**
- `apps/frontend/lib/design-tokens/components/dashboard.ts` — `DASHBOARD_ENTRANCE`, `DASHBOARD_MOTION` 정의
- `apps/frontend/styles/globals.css` — `@source inline()`, `@media (prefers-reduced-motion)` 위치
- `apps/frontend/components/dashboard/DashboardClient.tsx` — 소비처 (Row별 토큰 사용)

---

### Step 37: Layer 3 토큰 파일 내 ANIMATION_PRESETS 인라인 우회 금지 (2026-04-27 추가)

Layer 3 컴포넌트 토큰 파일(`lib/design-tokens/components/*.ts`)에서
`motion-safe:animate-*` / `motion-reduce:animate-*` 클래스 문자열을 직접 인라인으로 사용하는 경우
`motion.ts`의 `ANIMATION_PRESETS` 상수를 경유해야 한다.

**규칙 근거:**
- `ANIMATION_PRESETS.pulse` = `'motion-safe:animate-pulse motion-reduce:animate-none'`
- `ANIMATION_PRESETS.pulseSoft` = `'motion-safe:animate-pulse-soft motion-reduce:animate-none'`
이 값들은 `motion.ts`가 SSOT이며, Layer 3 파일이 인라인 문자열을 복제하면
motion.ts 변경 시 동기화 실패가 발생한다.

```bash
# Layer 3 토큰 파일에서 motion-safe + motion-reduce 페어 인라인 탐지
# (ANIMATION_PRESETS.pulse / .pulseSoft 가 제공하는 완전한 쌍 패턴)
grep -rn "motion-safe:animate-.*motion-reduce:animate-none" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts" \
  | grep -v "ANIMATION_PRESETS\|node_modules"
# 결과: 0건 → PASS
# hit 발생 시: ANIMATION_PRESETS에 동일 값 있으면 교체 필수
# 예: motion-safe:animate-pulse motion-reduce:animate-none → ANIMATION_PRESETS.pulse
# 예: motion-safe:animate-pulse-soft motion-reduce:animate-none → ANIMATION_PRESETS.pulseSoft
```

**PASS:** `motion-safe:animate-* motion-reduce:animate-none` 페어 문자열이 Layer 3 파일에서 0건 (ANIMATION_PRESETS 경유).
**FAIL:** 페어 패턴 인라인 발견 → `ANIMATION_PRESETS.pulse` 또는 `.pulseSoft`로 교체.

**예외:**
- `motion.ts` 자체 — ANIMATION_PRESETS 정의 파일이므로 직접 문자열 사용 허용.
- Layer 1(primitives), Layer 2(semantic) — motion.ts와 동급이면 허용. Layer 3(components)만 대상.
- 단독 `motion-safe:animate-fade-in-up` 등 커스텀 keyframe — `motion-reduce:animate-none` 쌍이 아닌 접근성 prefix 단독 사용은 허용. ANIMATION_PRESETS 정의 대상이 아님.
- Tailwind `@keyframes` 정의 또는 JSDoc 주석 내 예시 코드 — 런타임 클래스 아님.

**Related Files:**
- `apps/frontend/lib/design-tokens/motion.ts` — `ANIMATION_PRESETS` SSOT 정의
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — urgency.critical pulseSoft 소비처

---

### Step 38: AlertBanner severity → ARIA role 분기 패턴 준수 (2026-04-27 추가)

`AlertBanner.tsx`는 severity에 따라 `role="alert"` (assertive) 또는 `role="status"` (polite)를 동적으로 선택한다.
WCAG SC 4.1.3 Status Messages: 긴급 상태(critical/warning)는 assertive, 정보성(info/none)은 polite.

**규칙:**
```
severity === 'critical' | 'warning' → role="alert"   (스크린리더 즉시 읽기, assertive)
severity === 'info'     | 'none'    → role="status"   (스크린리더 순서 읽기, polite)
```

```bash
# AlertBanner에 정적 role="status" 고정(severity 분기 미적용) 탐지
grep -n 'role="status"' apps/frontend/components/dashboard/AlertBanner.tsx \
  | grep -v "ariaRole\|severity"
# 결과: 0건 → 조건부 분기 사용 중 (PASS)
# role이 인라인 정적 문자열이면 severity-conditional 패턴으로 교체 필요

# 분기 로직 존재 여부 확인
grep -n "ariaRole\|severity.*alert\|alert.*severity" \
  apps/frontend/components/dashboard/AlertBanner.tsx | head -5
```

**PASS:** `const ariaRole = severity === 'info' || severity === 'none' ? 'status' : 'alert'` 형태의 분기 존재.
**FAIL:** 정적 `role="status"` 또는 `role="alert"` 하드코딩 → severity 기반 조건부 분기로 교체.

**예외:**
- Step 31의 GuidanceCallout, NCGuidanceCallout 등 정적 안내 패널 — 항상 `role="status"` 유지 (이 Step 대상 아님).

**배경:** 대시보드 AlertBanner가 `role="status"` 고정 → critical 경보도 스크린리더가 순서 읽기로 처리하는 접근성 버그 발견. severity 분기 패턴으로 수정 (2026-04-27).

**Related Files:**
- `apps/frontend/components/dashboard/AlertBanner.tsx` — severity-conditional ariaRole 소비처

---

### Step 39: `getPageContainerClasses()` variant 필수 인수 — 빈 호출 금지 (2026-04-27 추가)

`getPageContainerClasses()`를 인수 없이 호출하면 variant가 `undefined`로 처리되어
`PAGE_MAX_WIDTH`에서 잘못된 너비를 반환한다. 모든 호출 시 명시적 variant 인수가 필수다.

**PageContainerVariant 선택 규칙 (SSOT: `lib/design-tokens/components/page-layout.ts`):**

| variant | max-width | 사용 도메인 |
|---|---|---|
| `list` | container 1400px | 목록/검색 페이지 |
| `detail` | max-w-4xl (896px) | 단일 엔티티 집중 상세 |
| `wide` | max-w-5xl (1024px) | 다단계 폼 / 복합 상세 |
| `dashboard` | max-w-7xl (1280px) | KPI+탭 포함 대시보드형 상세 |
| `form` | max-w-2xl (672px) | 단순 입력 폼 |
| `centered` | container 1400px | 중앙정렬 전체폭 |

```bash
# 빈 인수 호출 탐지 (0건 기대)
grep -rn "getPageContainerClasses()" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "getPageContainerClasses('.*')\|getPageContainerClasses(\".*\")"

# 실제 빈 호출 탐지 (variant 인수 없이 ')' 로 닫히는 패턴)
grep -rn "getPageContainerClasses()" \
  apps/frontend \
  --include="*.tsx" --include="*.ts"
```

**PASS:** 0건 (모든 호출에 variant 인수 존재). **FAIL:** 빈 호출 → variant 명시.

**올바른 패턴:**
```tsx
// ❌ variant 미지정 — 너비 결정 불가
<div className={getPageContainerClasses()}>

// ✅ variant 명시 — SSOT 너비 보장
<div className={getPageContainerClasses('wide')}>
<div className={getPageContainerClasses('detail', 'space-y-6')}>
```

**배경:** 세션에서 `CreateCalibrationPlanContent.tsx`, `CreateCheckoutContent.tsx`의 `getPageContainerClasses()` 빈 호출을 `getPageContainerClasses('wide')`로 교정하면서 이 규칙이 확립됨. 2026-04-27.

**예외:**
- `page-layout.ts` 자체 — variant 타입 정의 파일.
- 함수 시그니처 재정의 없는 테스트 목(mock) — 테스트 파일에서 타입 확인 목적으로만 사용 시 면제.

---

### Step 40: hover-inline 버튼 — `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon/rejectIcon` 토큰 경유 필수 (2026-04-27 추가)

테이블 행 hover 시 표시되는 인라인 승인/반려 아이콘 버튼은 `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon`/`rejectIcon` 토큰을 경유해야 한다.
`text-green-*`, `text-emerald-*`, `text-red-*` 등 원시 Tailwind color class를 직접 사용하면 dark mode 전환과 브랜드 색상 변경 시 일관성이 깨진다.

**패턴: `group` + `group-hover:inline-flex` + 토큰 경유**

```tsx
// ❌ 하드코딩 color — 브랜드/다크모드 변경 시 불일치
<Button className="hidden group-hover:inline-flex text-green-600 hover:bg-green-100">

// ✅ 토큰 경유 — CSS 변수 자동 전환
<Button className={cn(
  'hidden group-hover:inline-flex',
  APPROVAL_ACTION_BUTTON_TOKENS.approveIcon  // 'text-brand-ok hover:bg-brand-ok/10'
)}>
```

```bash
# hover-inline 버튼에서 토큰 미경유 raw color class 탐지
grep -n "group-hover:inline-flex\|group-hover:flex" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "APPROVAL_ACTION_BUTTON_TOKENS\|approveIcon\|rejectIcon\|MENU_ITEM_TOKENS"

# raw color class 직접 사용 탐지 (group-hover 버튼 컨텍스트)
grep -n "text-green-\|text-emerald-\|hover:bg-green-\|hover:bg-emerald-" \
  apps/frontend/components/**/*.tsx 2>/dev/null \
  | grep -v "//\|design-tokens"
```

**PASS:** 0건 (모든 hover-inline 버튼이 토큰 경유). **FAIL:** raw color class → 해당 토큰으로 교체.

**배경:** `ApprovalRow.tsx` AP-05에서 `group` + `hidden group-hover:inline-flex` + `APPROVAL_ACTION_BUTTON_TOKENS.approveIcon/rejectIcon` 패턴 확립. 2026-04-27.

---

### Step 41: 단일 `role="tablist"` + `className="contents"` ARIA tablist 패턴 (2026-04-27 추가)

여러 섹션으로 나뉜 탭 목록을 렌더링할 때, `role="tablist"`는 **반드시 단일 wrapper에만** 적용해야 한다.
`map()` 내부에서 각 섹션마다 `role="tablist"`를 생성하면 ARIA 트리에 N개의 독립 tablist가 생겨 스크린리더가 탭 관계를 파악하지 못한다.

**올바른 패턴: CSS `display: contents` + `role="presentation"` 분리자/라벨**

```tsx
// ❌ N개 tablist — 스크린리더 탭 관계 파악 불가
{sections.map(section => (
  <div key={section} role="tablist">
    {tabs.map(tab => <button role="tab">)}
  </div>
))}

// ✅ 단일 tablist — contents wrapper로 시각/ARIA 분리
<div role="tablist" aria-orientation="vertical">
  {sections.map((section, i) => (
    <div key={section} className="contents">           {/* CSS display:contents — ARIA 투명 */}
      {i > 0 && <div className={tokens.divider} role="presentation" />}  {/* 분리자 */}
      <div className={tokens.sectionLabel} role="presentation">          {/* 라벨 */}
        {sectionName}
      </div>
      {tabs.map(tab => <button role="tab" aria-selected={isActive}>)}
    </div>
  ))}
</div>
```

```bash
# 복수 tablist 탐지 (map 내부 role="tablist")
grep -n 'role="tablist"' apps/frontend/components/**/*.tsx 2>/dev/null \
  | awk -F: '{file=$1; line=$2} {print file}' | sort | uniq -d
# → 동일 파일에 2+ tablist가 있으면 map 내부 중복 의심

# className="contents" 없이 tablist 하위 래퍼 탐지
grep -n 'role="tablist"' apps/frontend/components/**/*.tsx 2>/dev/null
```

**PASS:** 컴포넌트 당 `role="tablist"` 1건. **FAIL:** 같은 파일 2+ tablist → 단일 wrapper로 통합.

**배경:** `ApprovalCategorySidebar.tsx` AP-04에서 `className="contents"` + `role="presentation"` 패턴으로 WAI-ARIA Tabs 패턴 준수. 2026-04-27.

**예외:**
- 완전히 독립된 별개의 tab UI가 한 컴포넌트에 존재하는 경우 (예: 상단/하단 별개 탭) — 의도적 복수 tablist 허용. 주석 필수.

### Step 42: NEXT_STEP_PANEL_TOKENS 토큰 체인 — workflow-panel.ts → index re-export → NextStepPanel.tsx 소비 (2026-04-28 추가)

`NextStepPanel.tsx`(FSM 다음 단계 안내 패널)가 `workflow-panel.ts`의 `NEXT_STEP_PANEL_TOKENS`를 통해 container variant·urgency 색상을 일관 적용하는지 검증.

**배경:** PR-4 Step 토큰 분리에서 NextStepPanel 전용 토큰을 `workflow-panel.ts`에 격리. variant=`hero`/`floating`/`compact`/`inline`별 container 클래스, urgency(`info`/`warning`/`alert`/`success`)별 색상이 토큰 SSOT 경유 — 컴포넌트 인라인 클래스 0건이어야 함.

**탐지 — index re-export:**
```bash
# index.ts에서 NEXT_STEP_PANEL_TOKENS / NextStepPanelUrgency / NextStepPanelContainer re-export 확인
grep -n "NEXT_STEP_PANEL_TOKENS\|NextStepPanelUrgency\|NextStepPanelContainer\|workflow-panel" \
  apps/frontend/lib/design-tokens/index.ts
```

**탐지 — 소비처 SSOT 경유:**
```bash
# NextStepPanel.tsx에서 design-tokens index 경유 import 확인
grep -n "design-tokens\|NEXT_STEP_PANEL_TOKENS" \
  apps/frontend/components/shared/NextStepPanel.tsx

# NextStepPanel.tsx에서 container variant 인라인 클래스 하드코딩 탐지
grep -n "rounded-\|border-\|bg-\|p-[0-9]" \
  apps/frontend/components/shared/NextStepPanel.tsx | grep -v "NEXT_STEP_PANEL_TOKENS\|//\|/\*"
```

**탐지 — workflow-panel.ts satisfies 가드:**
```bash
# NEXT_STEP_PANEL_TOKENS 정의에 satisfies 강제 + Urgency/Container 타입 export
grep -n "satisfies Record\|export type NextStepPanel\|NEXT_STEP_PANEL_TOKENS = {" \
  apps/frontend/lib/design-tokens/components/workflow-panel.ts
```

**PASS 기준:**
- `lib/design-tokens/index.ts`에서 `NEXT_STEP_PANEL_TOKENS`, `NextStepPanelUrgency`, `NextStepPanelContainer` 모두 re-export 확인
- `NextStepPanel.tsx`가 `@/lib/design-tokens` index 경유 import (직접 경로 `components/workflow-panel` 금지)
- `NextStepPanel.tsx`에서 variant별 container 클래스 인라인 하드코딩 0건 — `NEXT_STEP_PANEL_TOKENS.container[variant]` 경유
- `workflow-panel.ts`에서 `NEXT_STEP_PANEL_TOKENS` 정의에 `satisfies` 가드 (urgency / container 모두 4개 키 완전성 보장)

**FAIL 기준:**
- index.ts re-export 누락 → `lib/design-tokens/index.ts`에 추가 필요
- `NextStepPanel.tsx`에서 `rounded-xl border bg-blue-50/50 px-4 py-3` 같은 variant 인라인 클래스 → `NEXT_STEP_PANEL_TOKENS.container.hero` 등 토큰 경유로 전환
- `NEXT_STEP_PANEL_TOKENS` 정의에 `satisfies Record<NextStepPanelUrgency, string>` 등 가드 누락 → satisfies 추가
- `NextStepPanel.tsx`에서 직접 `from '@/lib/design-tokens/components/workflow-panel'` import → index 경유로 수정

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — `NEXT_STEP_PANEL_TOKENS` SSOT 정의
- `apps/frontend/lib/design-tokens/index.ts` — re-export 진입점
- `apps/frontend/components/shared/NextStepPanel.tsx` — 소비처 (variant + urgency 적용)
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — NextStepPanel `variant="compact"` 사용처 (group header + row zone 4)

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
| 14  | Collapsible/Disclosure button: aria-expanded + aria-controls 쌍 (`<button>`+`<Button>` 모두) | PASS/FAIL | aria-controls 누락 button/Button 위치 |
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
| 25  | CSS 변수 주입 토큰 fallback 필수 | PASS/FAIL | `var(--name)` fallback 누락 위치 (design-tokens 내부) |
| 26  | 사전 생성 룩업 토큰 + satisfies 가드 | PASS/FAIL | variant 함수 concat 패턴 또는 `Record<K>` satisfies 누락 위치 |
| 27  | NC compact dot SSOT (`getNCWorkflowCompactDotClasses`) | PASS/FAIL | compactDot 직접 접근 또는 index.ts 누락 위치 |
| 28  | 컴포넌트 JSX 인라인 brand 리터럴 금지 | PASS/FAIL | className에 bg-brand-*/text-brand-* 직접 사용 위치 |
| 29a | 크로스 도메인 공유 색상 semantic.ts 배치 (도메인 간 직접 import 금지) | PASS/FAIL | checkout.ts↔notification.ts 직접 import 위치 |
| 29b | tabBadge alert 상태 `ALERT_TAB_BADGE_COLOR` SSOT 경유 (raw bg-destructive 인라인 금지) | PASS/FAIL | raw 리터럴 또는 컴포넌트 직접 사용 위치 |
| 29c | `CHECKOUT_TAB_BADGE_TOKENS` `as const satisfies` 제약 + `ALERT_TAB_BADGE_COLOR` index re-export | PASS/FAIL | satisfies 미존재 또는 index.ts 누락 위치 |
| 30  | `FOCUS_TOKENS.ringCurrent` 스테퍼 현재 단계 링 하드코딩 탐지 | PASS/FAIL | raw ring-2 ring-brand-info 조합 위치 |
| 31  | callout/aside `role="alert"` 금지 — `role="status"` 강제 | PASS/FAIL | callout/안내 패널에서 role="alert" 위치 |
| 32  | `MENU_ITEM_TOKENS.destructive` SSOT — DropdownMenuItem 파괴적 액션 리터럴 금지 | PASS/FAIL | focus:text-destructive 또는 focus-visible:text-destructive 리터럴 위치 |
| 33a | `DASHBOARD_ENTRANCE` 스태거 딜레이 인라인 금지 | PASS/FAIL | animationDelay 인라인 사용 위치 |
| 33b | `DASHBOARD_MOTION` transition 토큰 경유 | PASS/FAIL | 대시보드 컴포넌트 transition-colors 인라인 위치 |
| 33c | `globals.css` prefers-reduced-motion 존재 | PASS/FAIL | 미디어 쿼리 누락 |
| 33d | `@source inline()` animation-delay arbitrary 커버 | PASS/FAIL | globals.css 지시어 누락 |
| 34  | WAI-ARIA grid 3단계: `role="grid" > row > gridcell` 일관성 | PASS/FAIL | role="row"/"gridcell" 누락 컴포넌트 |
| 35  | `CHECKOUT_ITEM_ROW_TOKENS` zone key `satisfies { ... [key: string]: unknown }` | PASS/FAIL | satisfies 미존재 또는 zone key 누락 위치 |
| 36  | `WORKFLOW_PANEL_TOKENS.variant/.actor` `satisfies Record` + `WorkflowPanelActorVariant` export | PASS/FAIL | satisfies 누락 또는 타입 미export 위치 |
| 37  | Layer 3 토큰 파일 내 ANIMATION_PRESETS 인라인 우회 금지 | PASS/FAIL | motion-safe+motion-reduce 페어 인라인 위치 |
| 38  | AlertBanner severity → ARIA role 분기 (critical/warning=alert, info/none=status) | PASS/FAIL | 정적 role 하드코딩 또는 분기 로직 누락 위치 |
| 39  | `getPageContainerClasses()` variant 필수 인수 — 빈 호출 금지 | PASS/FAIL | variant 미지정 빈 호출 위치 |
| 40  | hover-inline 버튼 `approveIcon`/`rejectIcon` 토큰 경유 | PASS/FAIL | raw text-green-*/text-red-* 직접 사용 위치 |
| 41  | 단일 `role="tablist"` + `className="contents"` ARIA tablist 패턴 | PASS/FAIL | 컴포넌트 당 tablist 2+ 발견 위치 |
| 42  | `NEXT_STEP_PANEL_TOKENS` 토큰 체인 (workflow-panel.ts → index → NextStepPanel.tsx) | PASS/FAIL | re-export 누락 / 인라인 variant 클래스 위치 |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **shadcn/ui 컴포넌트** (`components/ui/`) — 서드파티 생성 코드
2. **design-tokens 내부 파일** — Layer 간 상호 참조는 아키텍처상 필수
3. **SkipLink** — 모든 포커스에 반응해야 하므로 `focus:` 의도적 사용
4. **장식용 요소** — 순수 장식 요소의 크기 하드코딩
5. **유틸리티 함수 import** — `toTailwindSize`, `toTailwindGap`은 Layer 3에서 `../utils` (Layer 1.5) 경유 import 허용. `../primitives` 직접 import는 불허 (2026-04-26 utils.ts 분리 이후)
6. **ANIMATION_PRESETS / TRANSITION_PRESETS import** — motion.ts에서 Layer 3 직접 import 허용
7. **`getNotificationBadgeClasses()` 내부 urgency 분기** — notification.ts 내부 Visual Feedback System 구현 코드 (소비처가 아닌 SSOT 구현)
8. **calibration-status.ts** — 3개 컴포넌트 중복 로직 통합 SSOT
9. **not-found.tsx / error.tsx** — 비정상 상태 표시, 독립 디자인
10. **SETTINGS_PAGE_HEADER_TOKENS** — 아이콘+border-b 포함 독립 헤더 디자인
11. **`page-layout.ts`의 Layer 3 내부 import** — cross-component SSOT 참조

---

### Step 43: 대시보드 dynamic() loading skeleton 커버리지 (2026-04-28 추가)

**규칙**: `next/dynamic`으로 import한 대시보드 위젯의 `loading` 옵션은 **카드별 전용 Skeleton 컴포넌트**를 사용해야 한다. 제네릭 `<Skeleton className="..." />` 직접 사용 금지 — CLS(Cumulative Layout Shift) + 시각 일관성 깨짐.

**커버 대상**:
- `apps/frontend/components/dashboard/layout/DashboardRow{0..4}.tsx`의 `dynamic(...)` 호출
- 각 위젯에 매칭되는 `apps/frontend/components/dashboard/skeletons/*Skeleton.tsx` 존재

**검증 명령**:
```bash
# 1. dynamic() loading에 generic Skeleton 직접 사용 검색
grep -rn "loading: () =>" apps/frontend/components/dashboard/layout/ \
  | grep "<Skeleton " \
  | grep -v "Skeleton />"  # 명명된 *Skeleton 컴포넌트는 OK

# 2. skeleton 파일과 사용처 매핑 (선택)
ls apps/frontend/components/dashboard/skeletons/*.tsx
```

**PASS:** grep 결과 0줄 (모든 dynamic loading이 명명된 *Skeleton 컴포넌트 사용).
**FAIL:** generic `<Skeleton className=...>` 발견 → 전용 *Skeleton 컴포넌트 신규 + replace.

**Skeleton 컴포넌트 구조 요건**:
- `'use client'` + `useTranslations('dashboard.skeleton')`
- `role="status"`, `aria-busy="true"`, `aria-live="polite"` 속성 모두 적용
- `<span className="sr-only">{t('<name>')}</span>` SR-only 메시지 (i18n 키)
- 실제 카드와 **동일한 컨테이너 + 헤더 + 콘텐츠 골격**으로 layout shift 방지

**ErrorBoundary fallback 별도 규칙 (2026-04-28 보강)**:
- 카드 단위 ErrorBoundary fallback은 `EmptyState variant="error"` 경유. 인라인 div + role="alert" 직접 작성 금지.
- `getDerivedStateFromError`가 있는 ErrorBoundary 클래스는 화이트리스트(`DashboardCardErrorBoundary`, `GlobalErrorBoundary`, `RouteErrorBoundary`)에 한정. 그 외 컴포넌트가 직접 ErrorBoundary 구현 시 fallback이 EmptyState 미경유 가능 → 일관성 깨짐.

**검증 명령 (확장)**:
```bash
# 1. role="alert" 인라인 사용 — EmptyState/AlertBanner 외 위치
grep -rn 'role="alert"' apps/frontend/components/dashboard/
# 기대: EmptyState/AlertBanner 외 0건

# 2. ErrorBoundary 화이트리스트 외 직접 구현 탐지
grep -rEn "getDerivedStateFromError" apps/frontend/components --include='*.tsx' \
  | grep -vE "(DashboardCardErrorBoundary|GlobalErrorBoundary|RouteErrorBoundary)"
# 기대: 0건 (화이트리스트 외 직접 ErrorBoundary 클래스 작성 금지)
```

**발생 이력 (2026-04-28)**: DashboardRow4의 RecentActivities/TeamEquipmentDistribution/MiniCalendar dynamic loading이 generic `<Skeleton className={SK.lg}>` 사용 → 실제 카드 구조(탭+행/막대+달력 grid)와 layout 불일치로 CLS 발생. 3개 전용 Skeleton 신설로 해결. ErrorBoundary fallback 규칙은 `EmptyState variant="error"`로 표준화 — 인라인 alert div 분산 방지.

### Step 44: SURFACE_INLINE_ACTION_TOKENS 4-way 동기화 + label-ko/label-mono utility 사용 (2026-04-28 추가, REVIEW_RESULT.md §4.1·§4.4)

소프트 틴트 inline action 패턴(REVIEW_RESULT.md §4.1)과 한국어 줄바꿈 정책(§4.4)이 4계층에 정확히 동기화되어야 함. alpha를 utility 단계가 아닌 토큰 단계에서 고정하는 SSOT 강화.

**`SURFACE_INLINE_ACTION_TOKENS` 4-way sync (info/ok/warning/danger × bg/bg-hover/border/fg = 16 토큰)**:
1. `globals.css :root` 16개 CSS 변수 (`--surface-inline-action-{variant}-{slot}: hsl(var(--brand-color-X) / alpha)`) — Light alpha 고정.
2. `globals.css .dark` 16개 동일 변수 — Dark도 같은 alpha (brand-color-* 가 다크 변형 자동 제공).
3. `globals.css @theme inline` 16개 utility bridge (`--color-surface-inline-action-{variant}-{slot}: var(--surface-inline-action-{variant}-{slot})`) — Tailwind utility 노출.
4. `lib/design-tokens/semantic.ts SURFACE_INLINE_ACTION_TOKENS` (base + variant 4) — 컴포넌트 합성용 className SSOT.

**`label-ko` / `label-mono` utility**:
- `label-ko`: `word-break: keep-all + overflow-wrap: break-word + line-height: 1.45` — 한국어 어절 단위 줄바꿈.
- `label-mono`: `font-mono + white-space: nowrap + overflow: hidden + text-overflow: ellipsis + font-feature-settings: tnum` — 영문 vendor/관리번호 truncate.

```bash
# :root 16 변수 존재 (Light + Dark 합 ≥ 32)
grep -c "^\s*--surface-inline-action-" apps/frontend/styles/globals.css
# 기대: ≥ 32

# @theme inline bridge 16 변수
grep -c "^\s*--color-surface-inline-action-" apps/frontend/styles/globals.css
# 기대: 16

# semantic.ts SURFACE_INLINE_ACTION_TOKENS 정의
grep -n "SURFACE_INLINE_ACTION_TOKENS" apps/frontend/lib/design-tokens/semantic.ts
# 기대: export const + 4 variant (info/ok/warning/danger)

# barrel re-export
grep -n "SURFACE_INLINE_ACTION_TOKENS\|getSurfaceInlineActionClasses" apps/frontend/lib/design-tokens/index.ts
# 기대: 1건 이상

# label-ko / label-mono 정의
grep -n "@utility label-ko\|@utility label-mono" apps/frontend/styles/globals.css
# 기대: 양쪽 정의

# 한국어 라벨에 truncate 적용 — label-ko 우회 가능성
grep -rn "className=.*\btruncate\b" apps/frontend/components/checkouts/ | grep -v "label-mono\|managementNumber\|관리번호\|font-mono"
# 기대: 모든 결과 검토 — 한국어 라벨이면 label-ko로 교체 권장
```

**Phase 3 (2026-04-28 갱신) — atom 경유 강제 게이트**:

`bg-surface-inline-action-*` / `text-surface-inline-action-*` / `border-surface-inline-action-*` Tailwind utility는
`InlineActionButton` atom(`apps/frontend/components/ui/inline-action-button.tsx`) 외부에서 직접 className으로
사용 금지. 호출처는 항상 `<InlineActionButton variant={resolveInlineActionVariant({...})}>` 형태로 atom 경유.
SSOT 헬퍼 `resolveInlineActionVariant`는 `@equipment-management/shared-constants`(checkout-thresholds.ts)에 정의.

```bash
# 행 단위 inline action utility — atom 외부 직접 사용 0건 검증
grep -rn --include="*.tsx" --include="*.ts" \
  "\(bg\|text\|border\)-surface-inline-action-" \
  apps/frontend/components apps/frontend/app \
  | grep -v "components/ui/inline-action-button.tsx" \
  | grep -v "__tests__/" # 테스트는 className 검증 목적으로 토큰 명을 문자열 참조 가능
# 기대: 0 hits (atom 외부 production 호출처 0)

# resolveInlineActionVariant SSOT 사용 확인
grep -rn "resolveInlineActionVariant" apps/frontend/components apps/frontend/app
# 기대: 호출처 ≥ 1 (예: NextStepPanel.tsx)

# WORKFLOW_PANEL_TOKENS.variant.{compact,hero}.actionButton 잔존 호출 — 회귀 방지
grep -rn "WORKFLOW_PANEL_TOKENS\.variant\.\(compact\|hero\)\.actionButton" \
  apps/frontend packages/
# 기대: 0 hits (Phase 3에서 토큰 삭제됨)
```

**PASS:**
1. 16개 `--surface-inline-action-*` 변수 :root + .dark + @theme inline 3곳 동기화
2. `SURFACE_INLINE_ACTION_TOKENS.base + variant.{info|ok|warning|danger}` semantic 토큰 export + barrel re-export
3. `getSurfaceInlineActionClasses(variant)` 헬퍼 또는 base+variant 합성으로 컴포넌트 사용
4. `label-ko` (한국어 줄바꿈), `label-mono` (영문 truncate) utility 양쪽 정의
5. stepper 단계명/FSM 액션 라벨/상태 배지에 `label-ko` 적용, 관리번호(SUW-E0007 등)에 `label-mono` 적용
6. **(Phase 3)** `bg/text/border-surface-inline-action-*` 직접 className 호출은 `inline-action-button.tsx`(atom 정의)와 atom 테스트 외 0건 — atom 경유 강제
7. **(Phase 3 — 2026-04-28 보강)** `SURFACE_INLINE_ACTION_TOKENS.iconSize` 토큰 3점 동기화:
   - `semantic.ts` 정의 + atom 내부 소비(`<Loader2 className={cn(SURFACE_INLINE_ACTION_TOKENS.iconSize, 'animate-spin')}>`) + atom 외 직접 raw 사이즈(h-3 w-3 등) 0건
   - 검증: `grep -nE 'className.*"h-[0-9]|w-[0-9]"' apps/frontend/components/ui/inline-action-button.tsx` → 0 hits

**FAIL:**
- :root 또는 .dark 16개 누락 → 다크 모드 색상 불일치
- `@theme inline` bridge 누락 → Tailwind utility 미노출 (`bg-surface-inline-action-info-bg` 작동 안 함)
- semantic 토큰 정의 없이 `bg-brand-info/10` 같은 직접 utility 합성 → SSOT 분산
- `label-ko` 없이 한국어 라벨에 `truncate` 적용 → 1024px wrap 잘림 (REVIEW_RESULT.md P0-2 회귀)
- **(Phase 3)** atom 외부에서 raw `bg/text/border-surface-inline-action-*` 직접 사용 → variant 매핑 SSOT 우회, 회귀 위험

**관련 파일:**
- `apps/frontend/styles/globals.css` — `:root`/.dark/@theme inline + utility 정의
- `apps/frontend/lib/design-tokens/semantic.ts` — `SURFACE_INLINE_ACTION_TOKENS` export
- `apps/frontend/lib/design-tokens/index.ts` — barrel re-export
- `apps/frontend/components/ui/inline-action-button.tsx` — Phase 3 atom (P0-3 완료, 2026-04-28)
- `packages/shared-constants/src/checkout-thresholds.ts` — `resolveInlineActionVariant` 매핑 SSOT
- `apps/frontend/components/shared/NextStepPanel.tsx` — compact + hero variant 마이그레이션 호출처

---

### Step 45: KPI grid + hero `containerInGrid` + `alertRing` 토큰 적용 강제 (2026-04-28 추가, REVIEW_RESULT.md §P1-1)

반출 KPI 영역(`OutboundCheckoutsTab` + `HeroKPISkeleton`)은 grid className과 hero col-span을 모두 `CHECKOUT_STATS_GRID_TOKENS` / `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 토큰 경유해야 한다. hero alert 강조는 `CHECKOUT_STATS_VARIANTS.hero.alertRing` 토큰을 호스트 wrapper에 적용 — 토큰 정의 후 미사용은 dead token.

**왜 토큰 미경유가 위험한가**:
- raw `grid-cols-4 sm:grid-cols-6 lg:grid-cols-6` / `col-span-2` 호출처가 host와 skeleton 양쪽에 흩어지면, P1-1 grid 변경 시 두 곳을 동시에 수정해야 하며 누락 시 CLS(skeleton ↔ 실제 카드 사이즈 불일치)가 시각 회귀로 표면화.
- `alertRing` 토큰을 정의만 하고 적용하지 않으면 색상 단독 강조(아이콘 + 라벨)에 의존하게 되어 저시력/색맹 사용자가 hero "기한 초과" 카드를 인지 못함. 또한 dead token은 향후 디자인 시스템 정리 시 누가 쓰는지 추적이 필요.

```bash
# checkouts KPI 영역에서 raw grid/col-span 잔존 (FAIL 패턴)
grep -nE '\b(col-span|grid-cols)-\d' \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/components/checkouts/HeroKPISkeleton.tsx
# 기대: 0 hits (모두 getStatsGridClass / containerInGrid 토큰 경유)

# hero alertRing 토큰 정의 후 미사용 (dead token)
# alias 패턴(`heroTokens.alertRing` 등)도 포함 — 호출처가 const heroTokens = ... 형태일 때 false negative 방지
grep -rn "CHECKOUT_STATS_VARIANTS\.hero\.alertRing\|heroTokens\.alertRing" \
  apps/frontend/app apps/frontend/components
# 기대: ≥ 1 hit (host wrapper에서 isAlert 시 합성)

# Phase 4.5 신규 hero 토큰 — surfaceVariant / labelVariant / priorityBadge dead-token 검사
# (atom 또는 host 어디든 호출처 ≥ 1)
for token in "surfaceVariant" "labelVariant" "priorityBadge"; do
  hits=$(grep -rn "tokens\.${token}\|hero\.${token}\|heroTokens\.${token}" \
    apps/frontend/app apps/frontend/components | wc -l)
  echo "${token}: ${hits} hits (expected ≥ 1)"
done
# 기대: 각 토큰별 ≥ 1 hit (HeroKPI atom 또는 OutboundCheckoutsTab host 소비)

# raw ring-1 ring-brand-critical/N hero 외부 직접 사용 (FAIL 패턴) — checkouts 도메인 한정
# (dashboard PendingApprovalCard 등 다른 도메인은 별도 토큰 정합화 PR로 추적 — tech-debt-tracker)
grep -rn 'ring-1 ring-brand-critical' \
  'apps/frontend/app/(dashboard)/checkouts/' \
  apps/frontend/components/checkouts/ \
  | grep -v 'lib/design-tokens'
# 기대: 0 hits (호출처는 모두 토큰 변수 경유)

# host와 skeleton이 동일 grid 토큰 import 확인
grep -n "getStatsGridClass\|CHECKOUT_STATS_GRID_TOKENS" \
  'apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx' \
  apps/frontend/components/checkouts/HeroKPISkeleton.tsx
# 기대: 양쪽 모두 import + 호출 (grid SSOT 공유 강제)
```

**PASS:**
- `OutboundCheckoutsTab.tsx` + `HeroKPISkeleton.tsx`에서 raw `grid-cols-N` / `col-span-N` 0건
- 두 파일 모두 `getStatsGridClass(hasHero)` 호출 + hero 분기는 `CHECKOUT_STATS_VARIANTS.hero.containerInGrid` 사용
- hero `alertRing` 토큰이 host wrapper에 적용 (isAlert 분기 합성)
- raw `ring-1 ring-brand-critical/N` hero 외부 직접 사용 0건
- (Phase 4.5) `surfaceVariant`, `labelVariant`, `priorityBadge` 각 ≥ 1 호출처

**FAIL:**
- raw grid/col-span 잔존 → host와 skeleton grid 비동기 회귀 시 CLS
- `alertRing` 토큰 정의만 + 호출 0건 → dead token (저시력 강조 누락)
- raw `ring-*` 직접 합성 → 토큰 변경 시 회귀 위험
- (Phase 4.5) `surfaceVariant` / `labelVariant` / `priorityBadge` 정의만 + 호출 0건 → dead token (wireframe gradient/label/badge 시각 회귀)

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/checkout.ts` — `CHECKOUT_STATS_GRID_TOKENS`, `getStatsGridClass`, `CHECKOUT_STATS_VARIANTS.hero.containerInGrid`/`alertRing`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — host
- `apps/frontend/components/checkouts/HeroKPISkeleton.tsx` — skeleton (host와 동일 토큰 미러링)

**발생 이력 (2026-04-28)**: Phase 4 P1-1에서 `CHECKOUT_STATS_VARIANTS.hero.container` / `.alertRing` 토큰이 PR-7 단계에 정의되었으나 host에서 raw `col-span-2` + 미적용 상태로 잔존 — Phase 4 통합 마이그레이션으로 해소.

---

### Step 46: Button base cva `focus-visible:outline-*` 패턴 — ring-offset 회귀 방지 (2026-04-28 추가)

`apps/frontend/components/ui/button.tsx`의 base cva는 shadcn/ui 기본 패턴(`focus-visible:ring-2 ring-offset-2`)에서
outline 기반(`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`)으로 전환됨.
이 파일은 `components/ui/` 예외로 Step 2 탐지에서 제외되므로, 별도 게이트로 보호.

**왜 보호가 필요한가**:
- shadcn/ui CLI 업데이트 또는 다른 세션에서 button.tsx를 덮어쓰면 base cva가 shadcn 기본 패턴으로 원복 → 시스템 전체 focus indicator 정합성 깨짐.
- `SURFACE_INLINE_ACTION_TOKENS.base`도 `focus-visible:outline-*` 통일 — 두 곳이 동일 패턴이어야 inline action button과 일반 button의 focus 링 두께/색상이 일치.
- ring(box-shadow) 기반은 dashed/radius 조합과 충돌 — outline이 표준.

```bash
# button base cva에 ring-2 ring-offset-2 패턴 잔존 탐지 (FAIL 패턴)
grep -n "focus-visible:ring-2\|ring-offset-2\|focus-visible:ring-offset" \
  apps/frontend/components/ui/button.tsx
# 기대: 0 hits (outline 패턴으로 전환됨)

# 현재 button base cva에 outline 패턴 존재 확인 (PASS 양성 검증)
grep -n "focus-visible:outline-2.*outline-offset-2.*outline-ring" \
  apps/frontend/components/ui/button.tsx
# 기대: 1 hit (base cva string 내 존재)
```

**PASS:**
- `focus-visible:ring-2` / `ring-offset-2` / `focus-visible:ring-offset` 0건
- `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` 1건 이상

**FAIL:**
- `focus-visible:ring-2 ring-offset-2` 재도입 → 시스템 focus 링 불일치 (inline action button과 톤 차이 발생). outline 패턴으로 교체.

**예외:**
- `buttonVariants`의 개별 `variant` 문자열(outline variant, ghost variant 등) — base cva가 아닌 variant별 추가 스타일. base만 검사.
- `ring-offset-ul-midnight` 등 특수 목적 offset override (다른 파일에서 `asChild` 조합 시) — button.tsx 자체만 대상.

**관련 파일:**
- `apps/frontend/components/ui/button.tsx` — base cva (outline focus 전환 파일)
- `apps/frontend/lib/design-tokens/semantic.ts` — `SURFACE_INLINE_ACTION_TOKENS.base` (동일 패턴 SSOT)

**발생 이력 (2026-04-28)**: NextStepPanel compact 영역에서 button focus 링이 행 외곽으로 새는 glow를 만들었던 사건의 근본 수정 — base cva ring → outline 전환. 회귀 시 동일 시각 결함 재발 가능.

---

### Step 47: `compact` 컨테이너 토큰 — elevation/shadow/rounded/padding 0 원칙 (2026-04-28 추가)

**원칙:** `variant="compact"` (행 Zone 4 등 행 평면 통합) 컨테이너 토큰에는
`ELEVATION_TOKENS.*`, `shadow-*`, `rounded-*`, `p-N` (layout spacing이 아닌 surface padding) 이 포함되어서는 안 됨.
행 안 컴포넌트는 host row의 bounding box를 존중해야 하며, 독립 elevation을 만들면 행 평면이 깨지면서
"행 안에 사각형 glow"가 시각적으로 표면화.

**탐지 대상:** `workflow-panel.ts`의 `container.compact` 토큰 정의.
(향후 다른 도메인 토큰 파일에 `compact` 키 추가 시 동일 기준 적용)

```bash
# workflow-panel.ts container.compact 라인 추출 후 금지 클래스 검색
# word boundary(\b) 사용 — gap-0.5의 'p-0' substring false positive 방지
grep -nE "compact:\s*['\"\`]" apps/frontend/lib/design-tokens/components/workflow-panel.ts \
  | grep -E "\brounded-[a-z]|\bshadow-[a-z]|\bp-[0-9]|ELEVATION_TOKENS"
# 기대: 0 hits (layout-only: inline-flex flex-col gap-0.5 만 허용)

# 다른 Layer 3 파일에도 compact 키 확인 (일반화 대비)
grep -rnE "compact:.*ELEVATION_TOKENS|compact:.*\brounded-[a-z]|compact:.*\bshadow-[a-z]|compact:.*\bp-[0-9]" \
  apps/frontend/lib/design-tokens/components/ --include="*.ts"
# 기대: 0 hits

# container.compact 정의 라인의 실제 값 확인 (PASS 양성 검증)
grep -nE "compact:\s*['\"\`].*inline-flex|compact:\s*['\"\`].*flex-col" apps/frontend/lib/design-tokens/components/workflow-panel.ts
# 기대: 1 hit (현재 정의: 'inline-flex flex-col gap-0.5')
```

**PASS:**
- `container.compact` 토큰 값에 elevation/shadow/rounded/surface-padding 클래스 0건
- layout 전용 클래스(`inline-flex`, `flex-col`, `flex`, `items-*`, `gap-*`)만 포함
- 다른 도메인 토큰 파일에도 `compact:` 키에 금지 클래스 0건

**FAIL:**
- `container.compact`에 `ELEVATION_TOKENS.surface.*` 추가 → 행 평면 이탈 (시각 회귀: "행 안 사각형 glow")
- `rounded-*` 추가 → host row와 중첩 radius 발생
- `shadow-*` 직접 추가 → 행 안에서 부유 효과 (host elevation 무시)
- `p-N` (surface padding, `gap-`이 아닌 padding) 추가 → Zone 4 내부 공간 충돌

**예외:**
- `gap-*` (자식 요소 간 간격) — layout 목적, 허용
- `w-*` / `h-*` / `min-w-*` — 폭/높이 제약, 허용
- `overflow-*` / `text-*` / `font-*` — 텍스트 정책, 허용
- `WORKFLOW_PANEL_TOKENS.variant.compact.container`는 별도 토큰(미사용 dead 가능) — 본 Step 대상 아님. NextStepPanel이 실제 소비하는 `NEXT_STEP_PANEL_TOKENS.container.compact`가 대상.

**관련 파일:**
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — `NEXT_STEP_PANEL_TOKENS.container.compact` 정의
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — `NextStepPanel variant="compact"` 사용처
- `apps/frontend/components/shared/NextStepPanel.tsx` — compact container 소비처

**발생 이력 (2026-04-28)**: NextStepPanel compact가 padding/shadow를 가진 채 행 안에 들어가 "외곽 사각형 glow"로 표면화 → `inline-flex flex-col gap-0.5` layout-only 토큰으로 교체. 본 Step이 회귀 차단 게이트.

---

### Step 45: SIDEBAR_ROW_TOKENS Layer 3 — sibling-anchor 컴포넌트 토큰 우회 금지 (2026-04-28 추가)

**근거:** 사이드바 nav 행은 단일 anchor → "행 + 보조 액션" sibling anchor 패턴으로 진화. `NavRowWithSecondaryAction` Layer 3 컴포넌트가 SIDEBAR_ROW_TOKENS만 참조해야 시각/접근성/hover-group 일관성 보장. 인라인 className 도입 시 collapsedDot 위치/secondaryHitArea 24px/hoverGroup `group/sidebar-row` 패턴이 분산.

**검증:**

```bash
# 1) SIDEBAR_ROW_TOKENS 정의 + 5개 키 (container/secondaryHitArea/collapsedDot/primary/secondary)
grep -nE "SIDEBAR_ROW_TOKENS\s*=|container:|secondaryHitArea:|collapsedDot:" \
  apps/frontend/lib/design-tokens/components/sidebar.ts
# 기대: ≥ 4 hits

# 2) NavRowWithSecondaryAction 인라인 className 도입 0건
grep -E "(bg-|text-|border-|p-|m-|gap-|rounded-)" \
  apps/frontend/components/layout/NavRowWithSecondaryAction.tsx | \
  grep -vE "import|cn\(|getSidebar|SIDEBAR_|FOCUS_TOKENS|TRANSITION_PRESETS"
# 기대: 0 lines

# 3) index.ts barrel export 정합
grep -cE "SIDEBAR_ROW_TOKENS|getSidebarRowPrimaryClasses|getSidebarRowSecondaryClasses" \
  apps/frontend/lib/design-tokens/index.ts
# 기대: ≥ 3
```

**PASS:** SIDEBAR_ROW_TOKENS 5+ key 정의 + NavRowWithSecondaryAction 인라인 0건 + barrel export 3건.
**FAIL:** 컴포넌트 내 raw `'absolute top-0.5 right-0.5 w-2 h-2 rounded-full'` 같은 위치/크기 인라인.

**예외:** 검증/디버깅용 `data-*` 속성, `aria-*` 속성, focus/hover state class.

**발생 이력 (2026-04-28):** Iter 1 evaluation FAIL — `collapsedDot` 위치 인라인 → SIDEBAR_ROW_TOKENS.collapsedDot 토큰화 후 PASS.
