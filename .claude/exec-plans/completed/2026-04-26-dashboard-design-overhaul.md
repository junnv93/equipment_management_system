# exec-plan: dashboard-design-overhaul

> **Slug**: `dashboard-design-overhaul`
> **Date**: 2026-04-26
> **Mode**: harness Mode 2 (Planner → Generator → Evaluator)
> **Branch policy**: main 직접 작업, pre-push hook 게이트
> **Phase 0**: 완료 (plan + contract 작성). **Phase 1~7**: 다음 세션 진행.

---

## AP 목록 요약

| AP | 한 줄 요약 | 리뷰 매핑 |
|---|---|---|
| AP-01 | DASHBOARD_GRID `lg:` → `xl:` 브레이크포인트 + sub-grid 신규 키 | §03-Critical P0 |
| AP-02 | AlertBanner stacked variant + countPill 확장 | §05-Critical |
| AP-03 | Hero bar h-2 + 임계 눈금 + 부적합 alertBorder 3중 강화 | §02-Critical/Warning |
| AP-04 | UTILIZATION_THRESHOLDS SSOT + computeUtilizationState ±2% hysteresis | §02-Warning ADD-02 |
| AP-05 | QuickAction 아이콘 16px + 터치 타겟 36px + iconBgClass 제거 | §06-Critical ADD-07 |
| AP-06 | system_admin 사이드바 grid-rows 동적 계산 | §03-Warning §04-Warning |
| AP-07 | quality_manager row3ThreeCol + test_engineer 1-col 풀폭 | §04-Critical/Warning |
| AP-08 | DASHBOARD_ENTRANCE 토큰화 + prefers-reduced-motion 글로벌 | §01-Warning ADD-04/08 |
| AP-09 | resolveDashboardRoleConfig 헬퍼 — server/client role 중복 제거 | ADD-01 |
| AP-10 | i18n parity + FOCUS_TOKENS + bundle-baseline + 5-role e2e | ADD-06/09/10/11/14 |
| AP-11 | AlertBanner info severity 4-state (upcoming 3일 이내) | §05-table |
| AP-12 | useCountUp hook — KPI 숫자 count-up 애니메이션 | §02-Warning |
| AP-13 | MyActivityCard 신규 — test_engineer Row3 (클라이언트 필터, 백엔드 0) | §04-Warning |
| AP-14 | AlertBanner trailingAction slot — Lab/Tech Mgr 승인 버튼 | §06-callout |
| AP-15 | DashboardLayout 5 Row 컴포넌트 추출 (DashboardClient 167 → ~60 라인) | ADD 신규 |
| AP-16 | below-the-fold 위젯 8개 next/dynamic (First Load JS -15~30KB) | ADD-12 |
| AP-17 | Visual regression baseline 60장 (5 role × 4 vp × 3 mode) | ADD 신규 |
| GUARD-1 | DASHBOARD_ROLE_CONFIG ↔ ROLE_PERMISSIONS sync 빌드 스크립트 | ADD 신규 |
| GUARD-2 | CSS :root ↔ .dark brand 변수 정합성 빌드 스크립트 | ADD 신규 |

---

## Generator 제약 (전 Phase 공통)

1. **exec-plan에 명시된 36개 파일만 변경** — 주변 코드 개선/리팩토링 금지
2. **brand token `dark:` 명시 금지** — CSS 변수 자동 전환 신뢰
3. **동적 보간 클래스 금지** — `text-brand-${key}` 패턴 → `getSemanticContainerTextClasses()` 경유
4. **inline style의 animationDelay 0건** — DASHBOARD_ENTRANCE.stagger 토큰으로 교체
5. **`any` 타입 0건, `eslint-disable` 0건**
6. **각 Phase 종료 시 `pnpm tsc --noEmit` 통과 필수**

---

## Phase 1 · SSOT 토큰 + 헬퍼 (leaf-first)

> 목표: 모든 컴포넌트가 import할 SSOT 기반 구축. 컴포넌트 파일은 건드리지 않음.

### Step 1.1 — AP-04: UTILIZATION_THRESHOLDS + utilization-state.ts

**변경 파일**:
- `apps/frontend/lib/config/dashboard-config.ts` (M, 라인 추가)
- `apps/frontend/lib/utils/utilization-state.ts` (C, 신규)
- `apps/frontend/lib/utils/__tests__/utilization-state.test.ts` (C, 신규)

**`dashboard-config.ts` 변경**:
```typescript
// 기존 UTILIZATION_HIGH = 70 / UTILIZATION_MEDIUM = 40 위치 이전, SSOT export 추가
export const UTILIZATION_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 40,
  HYSTERESIS: 2,
} as const;
```

**`utilization-state.ts` 신규**:
```typescript
import { UTILIZATION_THRESHOLDS } from '@/lib/config/dashboard-config';
export type UtilizationState = 'good' | 'warning' | 'danger';
export function computeUtilizationState(pct: number, prev?: UtilizationState): UtilizationState {
  const { HIGH, MEDIUM, HYSTERESIS } = UTILIZATION_THRESHOLDS;
  if (prev === 'good') return pct >= HIGH - HYSTERESIS ? 'good' : pct >= MEDIUM ? 'warning' : 'danger';
  if (prev === 'warning') return pct >= HIGH + HYSTERESIS ? 'good' : pct >= MEDIUM - HYSTERESIS ? 'warning' : 'danger';
  if (prev === 'danger') return pct >= HIGH ? 'good' : pct >= MEDIUM + HYSTERESIS ? 'warning' : 'danger';
  return pct >= HIGH ? 'good' : pct >= MEDIUM ? 'warning' : 'danger';
}
```

**단위 테스트 커버리지**: 경계값 67/68/69/70/71/72 + ±2%p hysteresis 4 branch

### Step 1.2 — AP-09: dashboard-role.ts 헬퍼

**변경 파일**:
- `apps/frontend/lib/utils/dashboard-role.ts` (C, 신규)
- `apps/frontend/lib/utils/__tests__/dashboard-role.test.ts` (C, 신규)

**`dashboard-role.ts` 신규**:
```typescript
import { DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE } from '@/lib/config/dashboard-config';
import type { DashboardRoleConfig } from '@/lib/config/dashboard-config';
export function resolveDashboardRoleConfig(
  rawRole: string | null | undefined
): { role: string; config: DashboardRoleConfig } {
  const role = rawRole?.toLowerCase() || DEFAULT_ROLE;
  const config = DASHBOARD_ROLE_CONFIG[role] ?? DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
  return { role, config };
}
```

**단위 테스트**: null/undefined/대문자/소문자/unknown role fallback 검증

### Step 1.3 — AP-12: use-count-up.ts + use-prefers-reduced-motion.ts

**변경 파일**:
- `apps/frontend/lib/utils/use-prefers-reduced-motion.ts` (C, 신규 — 미존재 시)
- `apps/frontend/lib/utils/use-count-up.ts` (C, 신규)
- `apps/frontend/lib/utils/__tests__/use-count-up.test.ts` (C, 신규)

**`use-count-up.ts`**: easeOutCubic RAF 루프, reducedMotion 시 즉시 target 반영
**단위 테스트**: target/duration/precision/reducedMotion 4 branch

### Step 1.4 — AP-08: DASHBOARD_ENTRANCE 토큰 확장

**변경 파일**: `apps/frontend/lib/design-tokens/components/dashboard.ts` (M, 라인 822-833 확장)

```typescript
export const DASHBOARD_ENTRANCE = {
  rowSpacing: {
    welcomeToAlert: 'mt-5',
    alertToKpi: 'mt-5',
    kpiToRow3: 'mb-6',
    row3ToRow4: 'mb-6',
  },
  stagger: {
    welcome: 'motion-safe:animate-fade-in-up',
    welcomeDelay: '[animation-delay:0ms]',
    alert: 'motion-safe:animate-slide-left',
    alertDelay: 'motion-reduce:[animation-delay:0ms] [animation-delay:80ms]',
    kpi: 'motion-safe:animate-scale-in-subtle',
    kpiDelay: 'motion-reduce:[animation-delay:0ms] [animation-delay:160ms]',
    row3: 'motion-safe:animate-fade-in-up',
    row3Delay: 'motion-reduce:[animation-delay:0ms] [animation-delay:240ms]',
    row4: 'motion-safe:animate-fade-in',
    row4Delay: 'motion-reduce:[animation-delay:0ms] [animation-delay:320ms]',
  },
} as const;
```

### Step 1.5 — AP-01: DASHBOARD_GRID 확장

**변경 파일**: `apps/frontend/lib/config/dashboard-config.ts:103-127` (M)

```typescript
export const DASHBOARD_GRID = {
  kpi: 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-4',
  row3: 'grid grid-cols-1 xl:grid-cols-[2fr_1.5fr] gap-4 items-start',       // lg: → xl: (P0)
  row3ThreeCol: 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-[1.4fr_1.4fr_1.2fr] gap-4 items-start',
  bottomRow: 'grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4 items-stretch',  // lg: → xl:
  row3SubGrid: 'grid gap-4 grid-cols-1 md:grid-cols-2',       // ADD-03 SSOT
  row3SubGridSingle: 'grid gap-4 grid-cols-1',
  row3SingleCol: 'grid grid-cols-1 gap-4 items-stretch',      // test_engineer
  row3TwoColBalanced: 'grid grid-cols-1 xl:grid-cols-[2fr_1.5fr] gap-4 items-start',
  row3SeverityRow: 'flex items-center gap-3 px-3 py-2',
  // Gap-02: system_admin bottomRow 비율 — 리뷰 §04 Warning 명시 (P2)
  bottomRowAdmin: 'grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-stretch',
} as const;
```

### Step 1.6 — AP-02 + AP-11: DASHBOARD_ALERT_BANNER_TOKENS 확장

**변경 파일**: `apps/frontend/lib/design-tokens/components/dashboard.ts:516-540` (M)

추가 키:
- `stackedContainer: 'flex flex-col gap-1 rounded-lg border bg-card overflow-hidden shadow-sm'`
- `stackedRow: 'flex items-center gap-3 px-3 py-2 border-l-8 min-h-[44px]'`  // Gap-01: border-l-4→border-l-8 (리뷰 §01 Critical note), min-h-[44px] 유지
- `stackedRowCritical: 'border-l-brand-critical bg-brand-critical/5'`
- `stackedRowWarning: 'border-l-brand-warning bg-brand-warning/5'`
- `stackedRowInfo: 'border-l-brand-info bg-brand-info/5'`
- `stackedRowNone: ''`
- `countPill`, `countPillCritical`, `countPillWarning`, `countPillInfo`
- `allClearCompact: 'border-dashed border-brand-ok/30 py-1.5'`  // §05 Warning 3: h-32px compact
- `countCircle`: `h-6 w-6` → `min-w-[1.75rem] h-7 px-1.5`

### Step 1.7 — AP-03: DASHBOARD_KPI_TOKENS 확장

**변경 파일**: `apps/frontend/lib/design-tokens/components/dashboard.ts:306-343` (M)

변경:
- `heroBarTrack`: `'h-1.5 ...'` → `'relative h-2 ...'`
- `alertBorder`: `'border-brand-critical/30'` → `'border-brand-critical/40 bg-brand-critical/5 ring-1 ring-brand-critical/10'`

추가:
- `heroBarThreshold: 'absolute top-0 bottom-0 w-px'`
- `heroBarThresholdHigh: 'bg-white/50'`
- `heroBarThresholdMedium: 'bg-white/30'`
- `heroBarThresholdLabel: 'absolute -bottom-4 text-[9px] font-mono text-white/40 tabular-nums'`
- `heroMinH: 'min-h-[8.5rem]'`
- `primaryMinH: 'min-h-[7rem]'`

### Step 1.8 — AP-05: DASHBOARD_QUICK_ACTION_TOKENS 변경

**변경 파일**: `apps/frontend/lib/design-tokens/components/dashboard.ts:494-503` (M)

변경:
- `actionIcon`: `'h-3.5 w-3.5 flex-shrink-0'` → `'h-4 w-4 flex-shrink-0'`
- `action`: `py-1.5` → `py-2 min-h-[36px]` 추가
- `actionPrimary`: `font-semibold shadow-sm` 추가

FOCUS_TOKENS 적용 (import 후 cn() 합성):
- `primaryCard`, `heroCard`, `action`, `actionPrimary` — `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` 인라인 → `FOCUS_TOKENS.default`

### Step 1.9 — AP-07 + AP-13 + AP-14: DASHBOARD_ROLE_CONFIG 확장

**변경 파일**: `apps/frontend/lib/config/dashboard-config.ts:346-521` (M)

ControlCenter 인터페이스에 추가:
```typescript
interface ControlCenter {
  // 기존 필드...
  row3Layout?: 'default' | 'three-col-action-first' | 'single-col-stretch' | 'two-col-balanced';
  showMyActivity?: boolean;
  alertBannerTrailingAction?: 'approval' | 'createCheckout' | null;
}
```

role별 변경:
- `quality_manager`: `row3Layout: 'three-col-action-first'` 추가
- `test_engineer`: `row3Layout: 'single-col-stretch'`, `showMyActivity: true` 추가
- `lab_manager`: `alertBannerTrailingAction: 'approval'` 추가
- `technical_manager`: `alertBannerTrailingAction: 'approval'` 추가
- `system_admin`: `bottomRowTemplate: 'admin'` 추가 (Gap-02 — 리뷰 §04 Warning: bottomRowAdmin [1.5fr_1fr])

DASHBOARD_GRID에 추가 (Step 1.5에 포함되었으나 명시):
- `bottomRowAdmin: 'grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 items-stretch'`

DashboardConfig 인터페이스에 추가:
- `bottomRowTemplate?: 'default' | 'admin'`

DashboardClient.tsx에서 `bottomRowTemplate === 'admin'` 시 `DASHBOARD_GRID.bottomRowAdmin` 사용

**Gap-03 SSOT**: `ALERT_BANNER_STACKED_THRESHOLD`를 이 Step(dashboard-config.ts)에서 export:
```typescript
export const ALERT_BANNER_STACKED_THRESHOLD = 10;  // totalCount ≥ 10 → stacked variant
```
AlertBanner.tsx Step 2.3에서는 이 값을 import하여 사용 (`import { ALERT_BANNER_STACKED_THRESHOLD } from '@/lib/config/dashboard-config'`)

**Phase 1 종료 검증**: `pnpm tsc --noEmit` → 0 error

---

## Phase 2 · 컴포넌트 적용

> 목표: Phase 1 SSOT를 실제 컴포넌트에 연결. 각 파일 독립적으로 수정.

### Step 2.1 — DashboardClient.tsx

**변경 파일**: `apps/frontend/components/dashboard/DashboardClient.tsx` (M)

변경 사항 (라인 기준):
- `126-128`: `resolveDashboardRoleConfig(session?.user?.role)` 헬퍼 사용 (ADD-01)
- `196`: `lg:flex-row` → `xl:flex-row xl:items-end`
- `196,209,220,252,282,327`: `style={{animationDelay: 'Xms'}}` 6개 → `E.stagger.*Delay` 토큰 (`cn()` 클래스)
- `209`: `mt-6` → `E.rowSpacing.welcomeToAlert`
- `294-299`: `'grid grid-cols-1 md:grid-cols-2'` 인라인 → `DASHBOARD_GRID.row3SubGrid` / `row3SubGridSingle` 분기
- `334-350`: 사이드바 `flex-col` → `gridTemplateRows` 동적: `sidebarCount <= 1 ? '1fr' : repeat(n-1, auto) 1fr`
- bottomRow 래퍼: `controlCenter.bottomRowTemplate === 'admin' ? DASHBOARD_GRID.bottomRowAdmin : DASHBOARD_GRID.bottomRow` (Gap-02)
- `209` 하단: `trailingAction` 분기 (`controlCenter.alertBannerTrailingAction === 'approval'` → APPROVALS.PENDING Link)
- AP-16: below-the-fold 8개 컴포넌트 `next/dynamic` 변환 (ssr: true, Skeleton fallback)
- AP-15: DashboardRow0~4 합성으로 교체 (Phase 4에서 진행 — 이 Step에서는 Row 분할 없이 하나씩 적용 후 추후 추출)

> **AP-15 주의**: DashboardRow* 추출은 AP-01~14 안정화 후 진행 (Phase 4). 이 Step에서 DashboardClient 라인 수를 줄이되 Row* 파일 분리는 Phase 4에서.

### Step 2.2 — KpiStatusGrid.tsx

**변경 파일**: `apps/frontend/components/dashboard/KpiStatusGrid.tsx` (M)

변경 사항:
- `80-81`: `const UTILIZATION_HIGH = 70; UTILIZATION_MEDIUM = 40` → `import { UTILIZATION_THRESHOLDS }` + `useRef<UtilizationState>` for prev 추적
- `138-146`: 3-state ternary → `computeUtilizationState(utilizationPct, prevStateRef.current)`
- `100,132,160,188`: `min-h-[8.5rem]` / `min-h-[7rem]` 인라인 → `T.heroMinH` / `T.primaryMinH`
- Hero bar: `h-1.5` → `h-2` (토큰), threshold 눈금 `<span>` 2개 추가 (`data-threshold="40"`, `data-threshold="70"`), `role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={utilizationPct}`
- 부적합 카드: `T.alertBorder` (border+bg+ring) + `animate-in fade-in-50 duration-300`
- `useCountUp` 적용: `animatedTotal`, `animatedPct`, `animatedActive`, `animatedNonConforming`

### Step 2.3 — AlertBanner.tsx

**변경 파일**: `apps/frontend/components/dashboard/AlertBanner.tsx` (M)

변경 사항:
- Props에 `variant?: 'auto' | 'inline' | 'stacked'` (default `'auto'`), `trailingAction?: React.ReactNode` 추가
- `STACKED_THRESHOLD = 10` (dashboard-config.ts에서 import 또는 상수 선언)
- severity 4-state: `critical > warning > info > none` (AP-11 info 추가)
  - info: overdue 0 + upcoming calibration/checkout > 0
- auto 모드: `totalCount >= STACKED_THRESHOLD` → stacked
- stacked: `<div role="region" aria-label={t('alertBanner.ariaLabelStacked', { count })}>` + severity별 row
- inline: `<div role="alert">` (단일 severity)
- allClear: `role="status"` + `allClearCompact` 토큰
- countPill: `min-w-[1.75rem] h-7 px-1.5` (99+ 오버플로 방지)
- trailingAction slot: inline 모드 우측 / stacked 모드 별도 row

### Step 2.4 — QuickActionBar.tsx

**변경 파일**: `apps/frontend/components/dashboard/QuickActionBar.tsx` (M)

변경 사항:
- `iconBgClass` prop 제거 (dead prop — Option A)
- `dashboard-config.ts` 9 actions의 `iconBgClass` 필드 + `QuickActionItem` 타입에서 제거
- min-h-[36px] 토큰 반영 확인 (AP-05에서 이미 토큰 변경)

### Step 2.5 — MyActivityCard.tsx (신규)

**변경 파일**: `apps/frontend/components/dashboard/MyActivityCard.tsx` (C, 신규)

```typescript
interface MyActivityCardProps {
  userId: string;
  recentActivities: ActivityItem[];
  myCheckouts: Checkout[];
  myCalibrationRequests: CalibrationPlan[];
}
// 클라이언트 useMemo 필터: actorId === userId, 최대 5개
// section aria-label={t('myActivity.ariaLabel', { name })}, 빈 상태 role="status"
// i18n: t('myActivity.*') 사용
```

**단위 테스트**: `MyActivityCard.test.tsx` — userId 필터, 빈 상태, kind별 라벨

### Step 2.6 — loading.tsx

**변경 파일**: `apps/frontend/app/(dashboard)/loading.tsx` (M)

- `min-h-[8.5rem]` / `min-h-[7rem]` 인라인 → `DASHBOARD_KPI_TOKENS.heroMinH` / `primaryMinH` import

### Step 2.7 — page.tsx (ADD-01 server-side)

**변경 파일**: `apps/frontend/app/(dashboard)/page.tsx` (M, 라인 43-44)

```diff
- const userRole = session.user.role?.toLowerCase() || DEFAULT_ROLE;
- const roleConfig = DASHBOARD_ROLE_CONFIG[userRole] || DASHBOARD_ROLE_CONFIG[DEFAULT_ROLE];
+ const { role: userRole, config: roleConfig } = resolveDashboardRoleConfig(session.user.role);
```

**Phase 2 종료 검증**: `pnpm --filter frontend run build`

---

## Phase 3 · i18n + 글로벌 a11y

### Step 3.1 — messages/{ko,en}/dashboard.json

**변경 파일**: `apps/frontend/messages/ko/dashboard.json`, `apps/frontend/messages/en/dashboard.json` (M)

추가 키 (ko, en 동기):
```json
"alertBanner": {
  "ariaLabel": "긴급 조치 요약",
  "ariaLabelStacked": "{count}건의 조치 필요 항목",
  "allClear": "조치 필요 항목이 없습니다",
  "actionRequired": "즉시 조치가 필요한 항목이 있습니다",
  "overdueCalibrations": "교정 초과 {count}건",
  "overdueCheckouts": "반출 초과 {count}건",
  "nonConforming": "부적합 {count}건",
  "view": "보기",
  "stacked": {
    "criticalHeader": "치명적 — 즉시 조치",
    "warningHeader": "경고 — 24시간 내 조치",
    "infoHeader": "예정 — 3일 이내"
  },
  "info": {
    "upcomingCalibrations": "교정 예정 {count}건",
    "upcomingCheckoutReturns": "반납 예정 {count}건"
  }
},
"myActivity": {
  "title": "내 최근 활동",
  "ariaLabel": "{name}님의 최근 활동",
  "empty": "최근 활동이 없습니다",
  "kind": {
    "activity": "활동",
    "checkout": "반출",
    "calibrationPlan": "교정 요청"
  },
  "viewAll": "전체 활동 보기"
}
```

**검증**: `diff <(jq -r 'paths(scalars)|join(".")' messages/ko/dashboard.json|sort) <(jq -r 'paths(scalars)|join(".")' messages/en/dashboard.json|sort)` → 0건

### Step 3.2 — globals.css

**변경 파일**: `apps/frontend/styles/globals.css` (M)

추가:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Tailwind v4 safelist (motion-reduce: arbitrary values JIT 보장):
```css
@source inline("motion-reduce:[animation-delay:0ms] [animation-delay:0ms] [animation-delay:80ms] [animation-delay:160ms] [animation-delay:240ms] [animation-delay:320ms]");
```

**Phase 3 종료 검증**: i18n parity 0건 + DevTools dark/light 수동 확인

---

## Phase 4 · E2E + Bundle + Visual Regression

### Step 4.1 — auth-role-access.spec.ts (5 role 완성)

**변경 파일**: `apps/frontend/tests/e2e/features/dashboard/auth-role-access.spec.ts` (M)

추가 시나리오:
- `1.4 quality_manager`: 3컬럼 layout 존재 + AlertBanner 가시
- `1.5 system_admin`: 3 widget 가시 (`[data-widget="systemHealth/teamDistribution/miniCalendar"]`) + overflow 미발생

### Step 4.2 — alert-kpi.spec.ts TC-14 + TC-15

**변경 파일**: `apps/frontend/tests/e2e/features/dashboard/comprehensive/alert-kpi.spec.ts` (M)

- `TC-14`: mock totalCount=15 → stacked 모드 DOM (`role="region"`, 3 row, `min-w-[1.75rem]` countPill)
- `TC-15`: mock overdue=0, upcoming=5 → info severity DOM

### Step 4.3 — responsive.spec.ts

**변경 파일**: `apps/frontend/tests/e2e/features/dashboard/responsive.spec.ts` (M)

viewport 4개 추가: 1024 / 1280 / 1440 / 1920 — row3 스택/컬럼 전환 검증

### Step 4.4 — 단위 테스트 추가

**변경 파일**:
- `apps/frontend/components/dashboard/__tests__/AlertBanner.test.tsx` (C, 신규)
  - variant 전환 (auto/inline/stacked), threshold 경계, countPill 99+, trailingAction, info severity
- `apps/frontend/components/dashboard/__tests__/MyActivityCard.test.tsx` (C, 신규)
  - userId 필터, 빈 상태, kind별 라벨

### Step 4.5 — Bundle baseline 갱신

```bash
pnpm --filter frontend run build
node scripts/measure-bundle.mjs --route=/dashboard --update-baseline
node scripts/check-bundle-size.mjs
```

**변경 파일**: `scripts/bundle-baseline.json` (M — 측정값 갱신, `routes: {}` → `routes: { "/dashboard": {...} }`)

### Step 4.6 — AP-17: visual-regression.spec.ts (baseline 수립)

**변경 파일**:
- `apps/frontend/tests/e2e/features/dashboard/visual-regression.spec.ts` (C, 신규)
- `apps/frontend/playwright.config.ts` (M — `expect.toHaveScreenshot.threshold`)
- `apps/frontend/tests/e2e/__screenshots__/dashboard/` (baseline 이미지 60장 commit)

```typescript
const ROLES = ['test_engineer', 'technical_manager', 'quality_manager', 'lab_manager', 'system_admin'] as const;
const VIEWPORTS = [
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'wide', width: 1920, height: 1080 },
] as const;
// 5 role × 4 viewport = 20 (light) + 20 (dark) + 20 (reduced-motion) = 60장
// 첫 실행: --update-snapshots 플래그 필수
```

**Phase 4 종료 검증**: `pnpm --filter frontend run test:e2e --grep "dashboard|alert-kpi|responsive|auth-role-access"` 통과

---

## Phase 5 · Build-time Guards

### Step 5.1 — GUARD-1: check-role-config-sync.mjs

**변경 파일**:
- `scripts/check-role-config-sync.mjs` (C, 신규)
- `package.json` root (M — `prebuild` 추가)

스크립트 로직:
- `DASHBOARD_ROLE_CONFIG` ↔ `ROLE_PERMISSIONS` ↔ `UserRoleValues` 3방향 동기 검증
- 누락 항목 있으면 `process.exit(1)`

**한계**: TypeScript import 시 `tsx` 또는 `vite-node` 필요. `package.json` devDependencies에 이미 존재 여부 확인 후 추가.

### Step 5.2 — GUARD-2: check-css-vars.mjs

**변경 파일**:
- `scripts/check-css-vars.mjs` (C, 신규)
- `package.json` root (M — `prebuild` 추가)

스크립트 로직: `apps/frontend/styles/globals.css` 파싱 → `:root` ↔ `.dark` brand 변수 대칭 검증

**Phase 5 종료 검증**: `node scripts/check-role-config-sync.mjs` + `node scripts/check-css-vars.mjs` 둘 다 exit 0

---

## Phase 6 · DashboardLayout 추출 (AP-15)

> AP-01~14 안정화 + Phase 4 E2E 모두 통과 후 진행 — rollback 비용 최소화.

**변경 파일**:
- `apps/frontend/components/dashboard/layout/DashboardRow0.tsx` (C, 신규) — Welcome + QuickActionBar
- `apps/frontend/components/dashboard/layout/DashboardRow1.tsx` (C, 신규) — AlertBanner
- `apps/frontend/components/dashboard/layout/DashboardRow2.tsx` (C, 신규) — KpiStatusGrid
- `apps/frontend/components/dashboard/layout/DashboardRow3.tsx` (C, 신규) — Calibration + Pending/Overdue/MyActivity
- `apps/frontend/components/dashboard/layout/DashboardRow4.tsx` (C, 신규) — RecentActivities + Sidebar
- `apps/frontend/components/dashboard/DashboardClient.tsx` (M — 합성으로 교체, 167 → ~60 라인)

**원칙**:
- Pure presentational — React Query 없음
- Props 인터페이스로 데이터 전달
- 기존 E2E가 그대로 통과해야 함

---

## Phase 7 · 자체 감사 + 커밋

```bash
# verify 스킬 일괄
/verify-design-tokens   # brand token dark: 0건
/verify-ssot            # DASHBOARD_ROLE_CONFIG 외부 ≤ 2
/verify-hardcoding      # lg:grid-cols-/UTILIZATION_HIGH=/min-h-인라인 0건
/verify-i18n            # ko/en parity 0건
/verify-implementation  # 13 verify-* 일괄
```

자체 감사 7개 항목:
1. 하드코딩 URL: 0건
2. eslint-disable: 0건
3. `any` 타입: 0건
4. SSOT 우회 (DASHBOARD_GRID/ROLE_CONFIG/KPI_TOKENS/QUICK_ACTION_TOKENS/ALERT_BANNER_TOKENS 외부 inline): 0건
5. role 리터럴 (URVal 외): 0건
6. setQueryData: 0건
7. 접근성: role="meter"/role="region"/aria-live/FOCUS_TOKENS 명시 확인

커밋 완료 후:
```bash
mv .claude/exec-plans/active/2026-04-26-dashboard-design-overhaul.md \
   .claude/exec-plans/completed/2026-04-26-dashboard-design-overhaul.md
```

SHOULD 실패 항목 → `tech-debt-tracker.md` 추가

---

## 파일 목록 (36개)

| 파일 | 유형 | Phase |
|---|---|---|
| `apps/frontend/lib/config/dashboard-config.ts` | M | 1.1, 1.5, 1.9 |
| `apps/frontend/lib/utils/dashboard-role.ts` | C | 1.2 |
| `apps/frontend/lib/utils/utilization-state.ts` | C | 1.1 |
| `apps/frontend/lib/utils/use-count-up.ts` | C | 1.3 |
| `apps/frontend/lib/utils/use-prefers-reduced-motion.ts` | C | 1.3 |
| `apps/frontend/lib/design-tokens/components/dashboard.ts` | M | 1.4, 1.6, 1.7, 1.8 |
| `apps/frontend/components/dashboard/DashboardClient.tsx` | M | 2.1, 6 |
| `apps/frontend/components/dashboard/KpiStatusGrid.tsx` | M | 2.2 |
| `apps/frontend/components/dashboard/AlertBanner.tsx` | M | 2.3 |
| `apps/frontend/components/dashboard/QuickActionBar.tsx` | M | 2.4 |
| `apps/frontend/components/dashboard/MyActivityCard.tsx` | C | 2.5 |
| `apps/frontend/components/dashboard/layout/DashboardRow0.tsx` | C | 6 |
| `apps/frontend/components/dashboard/layout/DashboardRow1.tsx` | C | 6 |
| `apps/frontend/components/dashboard/layout/DashboardRow2.tsx` | C | 6 |
| `apps/frontend/components/dashboard/layout/DashboardRow3.tsx` | C | 6 |
| `apps/frontend/components/dashboard/layout/DashboardRow4.tsx` | C | 6 |
| `apps/frontend/app/(dashboard)/page.tsx` | M | 2.7 |
| `apps/frontend/app/(dashboard)/loading.tsx` | M | 2.6 |
| `apps/frontend/styles/globals.css` | M | 3.2 |
| `apps/frontend/messages/ko/dashboard.json` | M | 3.1 |
| `apps/frontend/messages/en/dashboard.json` | M | 3.1 |
| `apps/frontend/lib/utils/__tests__/utilization-state.test.ts` | C | 1.1 |
| `apps/frontend/lib/utils/__tests__/dashboard-role.test.ts` | C | 1.2 |
| `apps/frontend/lib/utils/__tests__/use-count-up.test.ts` | C | 1.3 |
| `apps/frontend/components/dashboard/__tests__/AlertBanner.test.tsx` | C | 4.4 |
| `apps/frontend/components/dashboard/__tests__/MyActivityCard.test.tsx` | C | 4.4 |
| `apps/frontend/tests/e2e/features/dashboard/auth-role-access.spec.ts` | M | 4.1 |
| `apps/frontend/tests/e2e/features/dashboard/comprehensive/alert-kpi.spec.ts` | M | 4.2 |
| `apps/frontend/tests/e2e/features/dashboard/responsive.spec.ts` | M | 4.3 |
| `apps/frontend/tests/e2e/features/dashboard/visual-regression.spec.ts` | C | 4.6 |
| `apps/frontend/tests/e2e/__screenshots__/dashboard/` | C (baseline) | 4.6 |
| `apps/frontend/playwright.config.ts` | M | 4.6 |
| `scripts/check-role-config-sync.mjs` | C | 5.1 |
| `scripts/check-css-vars.mjs` | C | 5.2 |
| `scripts/bundle-baseline.json` | M | 4.5 |
| `package.json` (root) | M | 5.1, 5.2 |
