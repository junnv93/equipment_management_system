# Motion / Transition / Animation — verify-design-tokens references

> 2026-05-03 verify-design-tokens 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> transition-all 금지 / TRANSITION_PRESETS / stagger / reduced-motion / ANIMATION_PRESETS 인라인 우회 / dynamic() skeleton.

---

## Step 1: transition-all 금지

shadcn/ui 제외 모든 컴포넌트에서 `transition-all` 미사용 확인.

```bash
grep -rn "transition-all" apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
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

**PASS:** 0개 결과. **FAIL:** `transition-all` → `transition-colors` 또는 `getTransitionClasses()` 변경.

---

## Step 6: TRANSITION_PRESETS + getTransitionClasses 속성 지정 + 하드코딩 트랜지션

### 6a: Layer 3에서 getTransitionClasses 런타임 호출 금지

Layer 3에서 `getTransitionClasses` 런타임 호출 0개 → TRANSITION_PRESETS 사용.

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

### 6b: getTransitionClasses 호출 시 properties 배열 필수

```bash
grep -rn "getTransitionClasses(\s*['\"]" apps/frontend/components apps/frontend/lib/design-tokens \
  --include="*.tsx" --include="*.ts" \
  | grep -v "motion.ts"
```

**PASS:** properties 배열 없이 speed 문자열만 전달하는 호출 0건.

### 6c: `components/ui/` 외부에서 하드코딩 transition 클래스 0개

```bash
grep -rn "transition-colors\|transition-opacity\|transition-shadow\|transition-transform" \
  apps/frontend/components apps/frontend/app --include="*.tsx" \
  | grep -v "apps/frontend/components/ui/\|TRANSITION_PRESETS\|// \|design-tokens"

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

### 6d: `index * N` raw 스태거 딜레이 0개 → `getStaggerDelay(index, type)` SSOT 함수 사용

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

---

## Step 15: `staggerFadeInItem` + `getStaggerFadeInStyle` SSOT 패턴

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

---

## Step 33: DASHBOARD_ENTRANCE/DASHBOARD_MOTION 토큰 + globals.css prefers-reduced-motion

### 33a: DASHBOARD_ENTRANCE 스태거 딜레이 인라인 금지

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

### 33b: DASHBOARD_MOTION transition 토큰 경유 강제

대시보드 컴포넌트에서 `transition-colors`/`transition-opacity`/`transition-shadow` 인라인 리터럴은 `DASHBOARD_MOTION.*` 토큰을 경유해야 한다.

```bash
# DashboardClient 및 대시보드 컴포넌트에서 transition-colors 인라인 사용 탐지
grep -rn '"[^"]*transition-colors[^"]*"' \
  apps/frontend/components/dashboard/ \
  --include="*.tsx" \
  | grep -v "DASHBOARD_MOTION\|node_modules\|className={cn"
```

**PASS:** 0 hit. **FAIL:** 인라인 `transition-colors` → `DASHBOARD_MOTION.textColor` (또는 `.listItem`, `.cardHover`) 교체.

### 33c: globals.css @media (prefers-reduced-motion) 존재 확인

접근성 기준(WCAG 2.3.3)에 따라 `globals.css`에 `prefers-reduced-motion` 미디어 쿼리 오버라이드가 존재해야 한다.

```bash
grep -c "prefers-reduced-motion" apps/frontend/styles/globals.css
```

**PASS:** 1 이상. **FAIL:** 0 → `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; ... } }` 추가.

### 33d: @source inline() — animation-delay arbitrary 값 JIT 감지

Tailwind v4에서 JS/TS 파일에 동적 생성되는 arbitrary class(예: `animation-delay-[Xms]`)는 `@source inline(...)` 지시어로 스캔 대상에 포함해야 한다.

```bash
grep -c "@source inline" apps/frontend/styles/globals.css
```

**PASS:** 1 이상. **FAIL:** 0 → `@source inline("...")` 추가.

**Related Files:**
- `apps/frontend/lib/design-tokens/components/dashboard.ts` — `DASHBOARD_ENTRANCE`, `DASHBOARD_MOTION` 정의
- `apps/frontend/styles/globals.css` — `@source inline()`, `@media (prefers-reduced-motion)` 위치
- `apps/frontend/components/dashboard/DashboardClient.tsx` — 소비처 (Row별 토큰 사용)

---

## Step 37: Layer 3 토큰 파일 내 ANIMATION_PRESETS 인라인 우회 금지

Layer 3 컴포넌트 토큰 파일(`lib/design-tokens/components/*.ts`)에서
`motion-safe:animate-*` / `motion-reduce:animate-*` 클래스 문자열을 직접 인라인으로 사용하는 경우
`motion.ts`의 `ANIMATION_PRESETS` 상수를 경유해야 한다.

**규칙 근거:**
- `ANIMATION_PRESETS.pulse` = `'motion-safe:animate-pulse motion-reduce:animate-none'`
- `ANIMATION_PRESETS.pulseSoft` = `'motion-safe:animate-pulse-soft motion-reduce:animate-none'`

이 값들은 `motion.ts`가 SSOT이며, Layer 3 파일이 인라인 문자열을 복제하면 motion.ts 변경 시 동기화 실패가 발생한다.

```bash
# Layer 3 토큰 파일에서 motion-safe + motion-reduce 페어 인라인 탐지
grep -rn "motion-safe:animate-.*motion-reduce:animate-none" \
  apps/frontend/lib/design-tokens/components/ \
  --include="*.ts" \
  | grep -v "ANIMATION_PRESETS\|node_modules"
# 결과: 0건 → PASS
# hit 발생 시: ANIMATION_PRESETS에 동일 값 있으면 교체 필수
# 예: motion-safe:animate-pulse motion-reduce:animate-none → ANIMATION_PRESETS.pulse
# 예: motion-safe:animate-pulse-soft motion-reduce:animate-none → ANIMATION_PRESETS.pulseSoft
```

**PASS:** `motion-safe:animate-* motion-reduce:animate-none` 페어 문자열이 Layer 3 파일에서 0건.
**FAIL:** 페어 패턴 인라인 발견 → `ANIMATION_PRESETS.pulse` 또는 `.pulseSoft`로 교체.

**예외:**
- `motion.ts` 자체 — ANIMATION_PRESETS 정의 파일이므로 직접 문자열 사용 허용.
- Layer 1(primitives), Layer 2(semantic) — motion.ts와 동급이면 허용. Layer 3(components)만 대상.
- 단독 `motion-safe:animate-fade-in-up` 등 커스텀 keyframe — `motion-reduce:animate-none` 쌍이 아닌 접근성 prefix 단독 사용은 허용.
- Tailwind `@keyframes` 정의 또는 JSDoc 주석 내 예시 코드.

**Related Files:**
- `apps/frontend/lib/design-tokens/motion.ts` — `ANIMATION_PRESETS` SSOT 정의
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — urgency.critical pulseSoft 소비처

---

## Step 43: 대시보드 dynamic() loading skeleton 커버리지

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
- `getDerivedStateFromError`가 있는 ErrorBoundary 클래스는 화이트리스트(`DashboardCardErrorBoundary`, `GlobalErrorBoundary`, `RouteErrorBoundary`)에 한정.

**검증 명령 (확장)**:
```bash
# 1. role="alert" 인라인 사용 — EmptyState/AlertBanner 외 위치
grep -rn 'role="alert"' apps/frontend/components/dashboard/
# 기대: EmptyState/AlertBanner 외 0건

# 2. ErrorBoundary 화이트리스트 외 직접 구현 탐지
grep -rEn "getDerivedStateFromError" apps/frontend/components --include='*.tsx' \
  | grep -vE "(DashboardCardErrorBoundary|GlobalErrorBoundary|RouteErrorBoundary)"
# 기대: 0건
```

**발생 이력 (2026-04-28)**: DashboardRow4의 RecentActivities/TeamEquipmentDistribution/MiniCalendar dynamic loading이 generic `<Skeleton className={SK.lg}>` 사용 → CLS 발생. 3개 전용 Skeleton 신설로 해결.
