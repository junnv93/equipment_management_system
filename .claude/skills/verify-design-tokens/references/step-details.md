# Design Token 검증 — Step 상세

## Step 1: transition-all 금지

```bash
grep -rn "transition-all" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" \
  | grep -v "apps/frontend/components/ui/\|no transition-all\|transition-all 금지\|transition-all 대신"
```

```tsx
// ❌ WRONG
className="transition-all hover:bg-muted"

// ✅ CORRECT - specific properties
className="transition-colors hover:bg-muted"

// ✅ CORRECT - getTransitionClasses
className={cn(
  getTransitionClasses('fast', ['background-color']),
  "hover:bg-muted"
)}
```

## Step 2: focus-visible 우선

```bash
grep -rn "focus:ring\|focus:outline\|focus:bg\|focus:text" apps/frontend/components apps/frontend/app --include="*.tsx" \
  | grep -v "apps/frontend/components/ui/\|SkipLink"
```

```tsx
// ❌ WRONG
className="focus:ring-2 focus:ring-primary"

// ✅ CORRECT
className="focus-visible:ring-2 focus-visible:ring-primary"

// ✅ CORRECT - Design Token 사용
className={FOCUS_TOKENS.classes.default}
```

## Step 3: Layer 3 함수 import 경로

```bash
grep -rn "from '.*design-tokens/primitives'\|from '.*design-tokens/semantic'" apps/frontend/components --include="*.tsx" --include="*.ts"
```

```tsx
// ❌ WRONG - 내부 파일 직접 import
import { SIZE_PRIMITIVES } from '@/lib/design-tokens/primitives';

// ✅ CORRECT - Public API 사용
import { getHeaderButtonClasses, getHeaderSizeClasses } from '@/lib/design-tokens';
```

## Step 4: 마이그레이션된 컴포넌트 토큰 사용

```bash
bash .claude/skills/verify-design-tokens/scripts/check-migrated.sh
```

전체 목록: [migrated-components.md](migrated-components.md) 참조.

## Step 5: Layer 3 컴포넌트 토큰 아키텍처

```bash
grep -rn "from '../primitives'" apps/frontend/lib/design-tokens/components/ --include="*.ts"
```

```typescript
// ❌ WRONG - Layer 3에서 Layer 1 직접 참조
import { SIZE_PRIMITIVES } from '../primitives';

// ✅ CORRECT - Layer 3에서 Layer 2만 참조
import { INTERACTIVE_TOKENS } from '../semantic';
```

면제: `toTailwindSize`, `toTailwindGap` 유틸리티 함수 import 허용.

## Step 5b: Layer 3 컴포넌트 토큰 barrel export 확인

```bash
for f in apps/frontend/lib/design-tokens/components/*.ts; do
  basename=$(basename "$f" .ts)
  if ! grep -q "from './components/$basename'" apps/frontend/lib/design-tokens/index.ts; then
    echo "NOT EXPORTED: $f"
  fi
done
```

## Step 6: TRANSITION_PRESETS 우선 + getTransitionClasses 속성 지정

### 6a: Layer 3에서 getTransitionClasses 잔여 호출

```bash
grep -rn "getTransitionClasses(" apps/frontend/lib/design-tokens/components/ --include="*.ts" \
  | grep -v "//\|*\|SSOT:"
```

```typescript
// ❌ WRONG - Layer 3에서 런타임 호출
import { getTransitionClasses } from '../motion';
const hover = getTransitionClasses('fast', ['box-shadow', 'transform']);

// ✅ CORRECT - 사전 계산된 프리셋 참조
import { TRANSITION_PRESETS } from '../motion';
const hover = TRANSITION_PRESETS.fastShadowTransform;
```

네이밍 규칙: `{speed}{Properties}` — `fastBg`, `fastBgColor`, `instantBg`, `moderateOpacity` 등.

### 6b: getTransitionClasses 속성 지정 (motion.ts 외부)

```bash
grep -rn "getTransitionClasses(\s*['\"]" apps/frontend/components apps/frontend/lib/design-tokens --include="*.tsx" --include="*.ts" \
  | grep -v "motion.ts"
```

### 6c: 컴포넌트 레벨 하드코딩 트랜지션

```bash
grep -rn "transition-colors\|transition-opacity\|transition-shadow\|transition-transform" \
  apps/frontend/components apps/frontend/app --include="*.tsx" \
  | grep -v "apps/frontend/components/ui/\|TRANSITION_PRESETS\|// \|design-tokens"
```

```bash
grep -rn "motion-safe:transition-" apps/frontend/components apps/frontend/app --include="*.tsx" \
  | grep -v "apps/frontend/components/ui/\|TRANSITION_PRESETS\|// \|design-tokens"
```

```tsx
// ❌ WRONG — 하드코딩
className="transition-colors duration-200 hover:bg-muted"

// ✅ CORRECT — TRANSITION_PRESETS 사용
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
className={cn(TRANSITION_PRESETS.fastBg, "hover:bg-muted")}
```

### 6d: 스태거 딜레이 SSOT

리스트 행에 `animationDelay`를 `index * N` raw 계산으로 하드코딩하면
딜레이 값이 motion.ts SSOT에서 분리됨. `getStaggerDelay(index, type)` 사용 필수.

```bash
# animationDelay에 raw 곱셈 패턴 탐지
grep -rn "animationDelay.*index \*\|index \*.*ms" \
  apps/frontend/components apps/frontend/app --include="*.tsx"
```

```tsx
// ❌ WRONG — raw 계산
style={{ animationDelay: `${index * NC_STAGGER_DELAY_MS}ms` }}
style={{ animationDelay: `${index * 60}ms` }}

// ✅ CORRECT — SSOT 함수 사용
import { getStaggerDelay, ANIMATION_PRESETS } from '@/lib/design-tokens';
className={cn(ANIMATION_PRESETS.slideUpFade, 'motion-safe:duration-200')}
style={{ animationDelay: getStaggerDelay(index, 'list') }}
```

**PASS:** 0 hits.

## Step 12: 워크플로우 상태 인덱스 하드코딩 금지

도메인 컴포넌트 토큰에서 상태 → 인덱스 매핑을 숫자로 직접 하드코딩하면
스텝 추가/제거 시 불일치 버그 발생. 배열에서 `Object.fromEntries` 파생 필수.

```bash
# Record에 상태명 + 숫자 인덱스 직접 할당 패턴
grep -n "open: 0\|corrected: 1\|closed: 2\|in_use: 0\|returned: 1\|pending: 0" \
  apps/frontend/lib/design-tokens/components/*.ts

# 함수 내 currentStepIndex === 숫자 하드코딩
grep -n "currentStepIndex === [0-9]" apps/frontend/lib/design-tokens/components/*.ts
```

```typescript
// ❌ WRONG — 하드코딩 인덱스
export const NC_STATUS_STEP_INDEX: Record<string, number> = {
  open: 0,
  corrected: 1,
  closed: 2,
};
if (currentStepIndex === 1) return label.currentInfo;

// ✅ CORRECT — 배열 SSOT에서 파생
export const NC_STATUS_STEP_INDEX = Object.fromEntries(
  NC_WORKFLOW_STEPS.map((status, index) => [status, index])
) as Record<NonConformanceStatus, number>;
export const NC_CORRECTED_STEP_INDEX = NC_STATUS_STEP_INDEX['corrected'];
if (currentStepIndex === NC_CORRECTED_STEP_INDEX) return label.currentInfo;
```

**PASS:** 두 탐지 명령 모두 0 hits.

## Step 7: Architecture v3 Visual Feedback System

### 7a: Architecture v3 배지 패턴

```bash
# getNotificationBadgeClasses 사용 확인 (notification 관련 컴포넌트)
grep -rn "getNotificationBadgeClasses\|getCountBasedUrgency" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "node_modules\|// "
```

```tsx
// ❌ WRONG - urgency 클래스 인라인 직접 조합
<Badge className="bg-red-500 text-white font-bold">{count}</Badge>

// ✅ CORRECT - Architecture v3 위임 패턴
<Badge className={getNotificationBadgeClasses(count)}>{count}</Badge>
```

> `NOTIFICATION_BADGE_VARIANTS` / `getNotificationBadgeVariant`는 2026-04-26에 완전 삭제됨 (소비처 0건 확인 후).
> tsc 컴파일 오류가 재도입 방지 회귀 보호 역할. grep 탐지 불필요.

### 7b: Urgency 함수 사용

3가지 Urgency 계산 함수:
- `getCountBasedUrgency(count)` — 알림/승인 개수 기반
- `getTimeBasedUrgency(daysUntilDue)` — 기한 기반
- `getStatusBasedUrgency(status)` — 시스템 상태 기반

### 7c: includeAnimation 파라미터

권장: `includeAnimation=false`로 시각적 피로도 감소. pulse는 emergency만.

## Step 7c(bis): Design Token 한국어 label 필드 잔존

Grep 도구로 탐지: `pattern: "label: '"`, `path: apps/frontend/lib/design-tokens/components/`, `glob: "*.ts"` 후 한국어 문자열 포함 여부 수동 확인.

면제: CSS 클래스 문자열인 `label` 필드 (예: `label: 'text-xs text-muted-foreground'`).

## Step 8: 페이지 헤더 타이포그래피 SSOT

### 8a: h1 하드코딩

```bash
grep -rn '<h1 className="text-' apps/frontend/app --include="*.tsx" \
  | grep -v "not-found\|error\|components/ui/"
```

### 8b: 부제목 하드코딩

```bash
grep -rn 'className="text-muted-foreground' apps/frontend/app --include="*.tsx" \
  | grep -v "not-found\|error\|components/ui/"
```

### 8c: 페이지 제목 아이콘 일관성

```bash
grep -B2 -A2 'className={.*HEADER_TOKENS.title}' apps/frontend/app --include="*.tsx" -rn \
  | grep -E "Icon|Shield|Bell|Clipboard|Calendar|AlertTriangle" \
  | grep -v "settings\|titleIcon"
```

### 8d: Layer 3 헤더 토큰 SSOT 참조

```bash
for f in apps/frontend/lib/design-tokens/components/{audit,non-conformance,calibration-plans,equipment,notification,reports,software,calibration-factors,document}.ts; do
  if grep -q "HEADER_TOKENS" "$f"; then
    if grep -q "\.\.\.PAGE_HEADER_TOKENS" "$f"; then
      echo "OK: $f"
    else
      echo "MISSING SPREAD: $f (PAGE_HEADER_TOKENS spread 없음)"
    fi
  fi
done
```

## Step 9: EASING_CSS_VARS 3자 동기화

```bash
GLOBALS_COUNT=$(grep -c "^\s*--ease-" apps/frontend/styles/globals.css)
PRIMITIVES_COUNT=$(grep -c "cubic-bezier(" apps/frontend/lib/design-tokens/primitives.ts)
MOTION_COUNT=$(grep -c "'var(--ease-" apps/frontend/lib/design-tokens/motion.ts)

echo "globals.css: $GLOBALS_COUNT, primitives.ts: $PRIMITIVES_COUNT, motion.ts: $MOTION_COUNT"

if [ "$GLOBALS_COUNT" -eq "$PRIMITIVES_COUNT" ] && [ "$PRIMITIVES_COUNT" -eq "$MOTION_COUNT" ]; then
  echo "PASS: 3자 동기화 일치 ($GLOBALS_COUNT개)"
else
  echo "FAIL: 수 불일치 — drift 발생"
fi
```

SSOT 체인: `primitives.ts` → `globals.css` → `motion.ts` (현재 7개).


## Step 10: Tailwind v4 호환성

v3 → v4 마이그레이션(2026-04, PR #180) 이후 v3 잔재 재도입 방지.

### 10a: v4에서 제거된 opacity/decoration 유틸리티

v4에서 컴파일은 통과하지만 효과 없음(silent failure). 슬래시 표기(`bg-foo/50`)로 마이그레이션.

```bash
rg -n '\b(bg-opacity-|text-opacity-|ring-opacity-|border-opacity-|decoration-slice|decoration-clone)\b' \
  apps/frontend --type-add 'tsx:*.tsx' --type ts --type tsx --type css
```

**PASS:** 0 hits. **FAIL:** 발견 위치를 슬래시 표기 또는 토큰 SSOT(`lib/design-tokens/visual-feedback.ts` 등)로 교체.

### 10b: 레거시 v3 파일/디렉티브 재도입 금지

v4는 CSS-first 설정. `tailwind.config.*` 파일과 `@tailwind base|components|utilities` 디렉티브는 v3 잔재.

```bash
ls apps/frontend/tailwind.config.* 2>/dev/null && echo "FAIL" || echo "PASS"
rg -n '^@tailwind\s+(base|components|utilities)' apps/frontend/styles
```

**PASS:** 두 명령 모두 0 hits. **FAIL:** config 삭제 후 토큰을 `globals.css`의 `@theme`/`@theme inline`으로 이전, 디렉티브를 `@import 'tailwindcss';`로 교체.

### 10c: tailwindcss-animate 재도입 금지

v3 전용. v4에서는 `tw-animate-css`를 `globals.css`에서 `@import 'tw-animate-css';`로 사용.

```bash
grep -n tailwindcss-animate apps/frontend/package.json && echo "FAIL" || echo "PASS"
```

**PASS:** 0 hits. **FAIL:** `tw-animate-css`로 교체.

### 10d: PostCSS 플러그인 단일성

`postcss.config.js`는 `@tailwindcss/postcss` 단일 플러그인만 사용. v3 `tailwindcss` 플러그인 또는 별도 `autoprefixer`(v4 내장) 금지.

```bash
grep -nE "(^|[^@])tailwindcss['\"]?\s*:|autoprefixer" apps/frontend/postcss.config.js && echo "FAIL" || echo "PASS"
grep -n '@tailwindcss/postcss' apps/frontend/postcss.config.js || echo "FAIL: missing v4 plugin"
```

**PASS:** 첫 명령 0 hits + 두 번째 명령 매치. **FAIL:** `postcss.config.js`를 `{ plugins: { '@tailwindcss/postcss': {} } }`로 교체.
