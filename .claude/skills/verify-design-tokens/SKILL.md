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

**검사 대상 (78-1 추가, 2026-04-21):**

| CSS 변수 | globals.css 기대값 | primitives.ts SSOT |
|---|---|---|
| `--text-2xs` | `0.625rem` (10px) | `TYPOGRAPHY_PRIMITIVES['2xs'].mobile === 10` |
| `--spacing-hairline` | `3px` | `WIDTH_PRIMITIVES.hairline === 3` |
| `--spacing-pagination` | `30px` | `SIZE_PRIMITIVES.pagination === 30` |

```bash
# globals.css에서 3개 변수 값 추출
grep -E "(--text-2xs|--spacing-hairline|--spacing-pagination)" \
  apps/frontend/styles/globals.css

# primitives.ts에서 대응 상수 값 확인
grep -E "('2xs'|hairline|pagination)" \
  apps/frontend/lib/design-tokens/primitives.ts
```

**PASS:** 각 CSS 변수 값이 primitives.ts 숫자와 단위 변환 후 일치. **FAIL:** 불일치 시 primitives.ts를 SSOT로 간주하고 globals.css 값을 수정.

**추가 신규 변수 체크:** `--text-2xs` / `--spacing-hairline` / `--spacing-pagination` 이외에
78-2+ 세션에서 추가된 `@theme` 변수가 있으면 대응 primitives 상수와 동기화 검사 범위를 확장할 것.

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
