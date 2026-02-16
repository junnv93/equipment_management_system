---
name: verify-design-tokens
description: Design Token 3-Layer 아키텍처 준수 여부를 검증합니다. 컴포넌트 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 컴포넌트명]'
---

# Design Token 3-Layer 아키텍처 검증

## Purpose

Design Token System v2의 3계층 아키텍처(Primitives → Semantic → Components)가 올바르게 준수되는지 검증합니다:

1. **transition-all 금지** — `transition-all` 대신 `getTransitionClasses()` 또는 specific property transitions 사용
2. **focus-visible 우선** — `focus:ring`, `focus:outline` 대신 `focus-visible:` 사용
3. **Layer 3 함수 import 경로** — `@/lib/design-tokens`에서 import (내부 파일 직접 import 금지)
4. **마이그레이션된 컴포넌트 토큰 사용** — 마이그레이션된 컴포넌트가 여전히 토큰을 사용하는지
5. **새 컴포넌트 토큰 아키텍처** — Layer 3 컴포넌트 파일이 Layer 2(semantic)만 참조하는지
6. **getTransitionClasses 속성 지정** — `getTransitionClasses` 호출 시 properties 배열 필수

## When to Run

- 새로운 컴포넌트를 추가한 후
- 기존 컴포넌트의 스타일을 수정한 후
- design-tokens 시스템을 변경한 후
- 마이그레이션된 컴포넌트를 수정한 후
- PR 전 최종 점검 시

## Related Files

| File                                                                | Purpose                                |
| ------------------------------------------------------------------- | -------------------------------------- |
| `apps/frontend/lib/design-tokens/index.ts`                          | Public API (Layer 1-3 export)          |
| `apps/frontend/lib/design-tokens/primitives.ts`                     | Layer 1 원시값                         |
| `apps/frontend/lib/design-tokens/semantic.ts`                       | Layer 2 의미론적 토큰                  |
| `apps/frontend/lib/design-tokens/motion.ts`                         | Motion 유틸리티 (getTransitionClasses) |
| `apps/frontend/lib/design-tokens/components/header.ts`              | Layer 3 Header 토큰                    |
| `apps/frontend/lib/design-tokens/components/notification.ts`        | Layer 3 Notification 토큰              |
| `apps/frontend/lib/design-tokens/components/auth.ts`                | Layer 3 Auth 토큰                      |
| `apps/frontend/lib/design-tokens/components/dashboard.ts`           | Layer 3 Dashboard 토큰                 |
| `apps/frontend/lib/design-tokens/README.md`                         | Design Token 시스템 문서               |
| `apps/frontend/components/layout/ThemeToggle.tsx`                   | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/layout/UserProfileDropdown.tsx`           | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/layout/DashboardShell.tsx`                | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/notifications/notifications-dropdown.tsx` | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/layout/MobileNav.tsx`                     | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/auth/LoginForm.tsx`                       | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/auth/LoginPageContent.tsx`                | 마이그레이션된 컴포넌트                |
| `apps/frontend/components/dashboard/StatsCard.tsx`                  | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/WelcomeHeader.tsx`              | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/PendingApprovalCard.tsx`        | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/QuickActionButtons.tsx`         | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/RecentActivities.tsx`           | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/CalibrationSchedule.tsx`        | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/TeamEquipmentStats.tsx`         | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/EquipmentStatusChart.tsx`       | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/EquipmentSummary.tsx`           | Dashboard 컴포넌트 (토큰 미적용)       |
| `apps/frontend/components/dashboard/CalibrationList.tsx`            | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/OverdueCheckoutsList.tsx`       | 마이그레이션된 컴포넌트 (Dashboard)    |
| `apps/frontend/components/dashboard/DashboardClient.tsx`            | 마이그레이션된 컴포넌트 (Dashboard)    |

## Workflow

### Step 1: transition-all 금지

`transition-all` 사용을 탐지합니다. Specific property transitions 또는 `getTransitionClasses()` 사용이 권장됩니다.

```bash
# transition-all 사용 탐지 (면제: shadcn/ui)
grep -rn "transition-all" apps/frontend/components --include="*.tsx" --include="*.ts" | grep -v "apps/frontend/components/ui/"
```

**PASS 기준:** 0개 결과 (shadcn/ui 제외 모든 컴포넌트에서 transition-all 미사용).

**FAIL 기준:** transition-all 발견 시 다음으로 변경 필요:

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

### Step 2: focus-visible 우선

`focus:ring`, `focus:outline` 대신 `focus-visible:` 사용을 확인합니다.

```bash
# focus: 사용 탐지 (면제: shadcn/ui, SkipLink)
grep -rn "focus:ring\|focus:outline" apps/frontend/components --include="*.tsx" | grep -v "apps/frontend/components/ui/\|SkipLink"
```

**PASS 기준:** shadcn/ui와 SkipLink를 제외한 모든 컴포넌트에서 `focus-visible:` 사용.

**FAIL 기준:** `focus:ring` 또는 `focus:outline` 발견 시 다음으로 변경 필요:

```tsx
// ❌ WRONG
className="focus:ring-2 focus:ring-primary"

// ✅ CORRECT
className="focus-visible:ring-2 focus-visible:ring-primary"

// ✅ CORRECT - Design Token 사용
className={FOCUS_TOKENS.classes.default}
```

### Step 3: Layer 3 함수 import 경로

컴포넌트가 design-tokens를 사용할 때 내부 파일을 직접 import하지 않는지 확인합니다.

```bash
# 내부 파일 직접 import 탐지 (면제: design-tokens 내부 파일)
grep -rn "from '.*design-tokens/primitives'\|from '.*design-tokens/semantic'" apps/frontend/components --include="*.tsx" --include="*.ts"
```

**PASS 기준:** 0개 결과 (모든 컴포넌트가 `@/lib/design-tokens`에서 import).

**FAIL 기준:** primitives 또는 semantic 직접 import 발견 시 다음으로 변경 필요:

```tsx
// ❌ WRONG - 내부 파일 직접 import
import { SIZE_PRIMITIVES } from '@/lib/design-tokens/primitives';
import { INTERACTIVE_TOKENS } from '@/lib/design-tokens/semantic';

// ✅ CORRECT - Public API 사용
import { getHeaderButtonClasses, getHeaderSizeClasses } from '@/lib/design-tokens';
```

### Step 4: 마이그레이션된 컴포넌트 토큰 사용

마이그레이션된 19개 컴포넌트가 여전히 design-tokens를 import하는지 확인합니다.

```bash
# 마이그레이션된 컴포넌트의 design-tokens import 확인
files=(
  "apps/frontend/components/layout/ThemeToggle.tsx"
  "apps/frontend/components/layout/UserProfileDropdown.tsx"
  "apps/frontend/components/layout/DashboardShell.tsx"
  "apps/frontend/components/notifications/notifications-dropdown.tsx"
  "apps/frontend/components/layout/MobileNav.tsx"
  "apps/frontend/components/auth/LoginForm.tsx"
  "apps/frontend/components/auth/LoginPageContent.tsx"
  "apps/frontend/components/dashboard/StatsCard.tsx"
  "apps/frontend/components/dashboard/WelcomeHeader.tsx"
  "apps/frontend/components/dashboard/PendingApprovalCard.tsx"
  "apps/frontend/components/dashboard/QuickActionButtons.tsx"
  "apps/frontend/components/dashboard/RecentActivities.tsx"
  "apps/frontend/components/dashboard/CalibrationSchedule.tsx"
  "apps/frontend/components/dashboard/TeamEquipmentStats.tsx"
  "apps/frontend/components/dashboard/EquipmentStatusChart.tsx"
  "apps/frontend/components/dashboard/EquipmentSummary.tsx"
  "apps/frontend/components/dashboard/CalibrationList.tsx"
  "apps/frontend/components/dashboard/OverdueCheckoutsList.tsx"
  "apps/frontend/components/dashboard/DashboardClient.tsx"
)

for f in "${files[@]}"; do
  if [ -f "$f" ]; then
    if grep -q "from '@/lib/design-tokens'" "$f"; then
      echo "OK: $f"
    else
      echo "MISSING: $f (design-tokens import 없음)"
    fi
  else
    echo "NOT FOUND: $f"
  fi
done
```

**PASS 기준:** 모든 마이그레이션된 19개 컴포넌트에서 design-tokens import가 존재.

**FAIL 기준:** design-tokens import가 없거나 하드코딩된 값 사용 시 재마이그레이션 필요.

### Step 5: Layer 3 컴포넌트 토큰 아키텍처

Layer 3 컴포넌트 파일(`design-tokens/components/`)이 Layer 2(semantic)만 참조하는지 확인합니다.

```bash
# Layer 3 파일에서 primitives 직접 참조 탐지
grep -rn "from '../primitives'" apps/frontend/lib/design-tokens/components/ --include="*.ts"
```

**PASS 기준:** 0개 결과 또는 `toTailwindSize`, `toTailwindGap` 유틸리티 함수 import만 허용.

**FAIL 기준:** Layer 1(primitives)을 직접 참조하는 경우 다음으로 변경 필요:

```typescript
// ❌ WRONG - Layer 3에서 Layer 1 직접 참조
import { SIZE_PRIMITIVES } from '../primitives';

export const BUTTON_TOKENS = {
  height: SIZE_PRIMITIVES.touch.minimal,
};

// ✅ CORRECT - Layer 3에서 Layer 2만 참조
import { INTERACTIVE_TOKENS } from '../semantic';

export const BUTTON_TOKENS = {
  height: INTERACTIVE_TOKENS.size.standard,
};
```

**면제:** `toTailwindSize`, `toTailwindGap` 유틸리티 함수는 primitives에 정의되어 있으므로 Layer 3에서 직접 import 허용:

```typescript
// ✅ CORRECT - 유틸리티 함수 import
import { toTailwindSize } from '../primitives';
```

### Step 6: getTransitionClasses 속성 지정

`getTransitionClasses` 호출 시 properties 배열을 명시하는지 확인합니다.

```bash
# properties 미지정 탐지 (speed만 전달)
grep -rn "getTransitionClasses(\s*['\"]" apps/frontend/components apps/frontend/lib/design-tokens --include="*.tsx" --include="*.ts"
```

**PASS 기준:** 0개 결과 (모든 `getTransitionClasses` 호출에 properties 배열 포함).

**FAIL 기준:** properties 미지정 발견 시 다음으로 변경 필요:

```tsx
// ❌ WRONG - properties 미지정 (기본값에 의존)
getTransitionClasses('fast');

// ✅ CORRECT - properties 명시
getTransitionClasses('fast', ['background-color', 'transform']);
```

## Output Format

```markdown
| #   | 검사                           | 상태      | 상세                 |
| --- | ------------------------------ | --------- | -------------------- |
| 1   | transition-all 금지            | PASS/FAIL | 위반 위치 목록       |
| 2   | focus-visible 우선             | PASS/FAIL | 위반 위치 목록       |
| 3   | Layer 3 함수 import 경로       | PASS/FAIL | 위반 import 목록     |
| 4   | 마이그레이션된 컴포넌트 토큰   | PASS/FAIL | 토큰 미사용 컴포넌트 |
| 5   | Layer 3 컴포넌트 토큰 아키텍처 | PASS/FAIL | 위반 참조 목록       |
| 6   | getTransitionClasses 속성 지정 | PASS/FAIL | 위반 호출 목록       |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **shadcn/ui 컴포넌트** (`components/ui/`) — 서드파티 생성 코드, 독자적 패턴 사용. `transition-all`, `focus:` 등 허용
2. **design-tokens 내부 파일** — Layer 간 상호 참조는 아키텍처상 필수 (primitives ↔ semantic ↔ components)
3. **SkipLink** — 키보드 전용이 아닌 모든 포커스에 반응해야 하므로 `focus:` 의도적 사용
4. **장식용 요소** — interactive 요소가 아닌 순수 장식 요소의 크기 하드코딩 (예: LoginPageContent의 장식 아이콘 `h-64 w-64`)
5. **유틸리티 함수 import** — `toTailwindSize`, `toTailwindGap`은 primitives에 정의되어 있어 Layer 3에서 직접 import 필요
6. **ANIMATION_PRESETS import** — `motion.ts`에 정의된 애니메이션 프리셋은 Layer 3에서 직접 import 허용
