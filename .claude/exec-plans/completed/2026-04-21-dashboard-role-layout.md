# Exec Plan: dashboard-role-layout

**날짜**: 2026-04-21
**슬러그**: dashboard-role-layout
**모드**: Mode 2 (Full — SSOT 구조 변경 + 신규 컴포넌트)
**소스**: 5개 역할 대시보드 디자인 리뷰

---

## Scope

5개 역할 대시보드의 시각적 품질을 **Config-Driven SSOT 확장**으로 해결.

| # | 이슈 | 역할 | 해결 메커니즘 |
|---|------|------|---------------|
| 1 | 1개 카드 수직 불균형 (AP-01) | 품질책임자 | `pendingApprovalLayoutHint: 'single-focus'` + heroCard variant |
| 2 | 8개 균등 카드 Card Soup | 기술책임자 | `approvalCategoryPriorities` + `'prioritized-grid'` |
| 3 | ghost 빈 컬럼 + Row 3 낭비 | 시스템관리자 | `showPendingApprovals: false` + `sidebarWidgets: ['systemHealth', ...]` |
| 4 | QuickAction primary 이미 처리됨 | 시험실무자 | 확인만 (L289-290 이미 primary 지정됨) |
| 5 | 승인 카드 중요도 동일 (AP-01) | 시험소장 | `approvalCategoryPriorities: { plan_final: 'hero', ... }` |

**범위 외**: Row 0-2 (Welcome, AlertBanner, KPI), 색상 팔레트, 신규 백엔드 API.

---

## 실제 ApprovalCategory 키 (packages/shared-constants/src/approval-categories.ts)

- technical_manager: `outgoing, incoming, equipment, calibration, inspection, nonconformity, disposal_review, software_validation` (8개)
- quality_manager: `plan_review` (1개)
- lab_manager: `disposal_final, plan_final, incoming` (3개)
- test_engineer / system_admin: [] (0개)

---

## Architecture Decision

`ControlCenterConfig`에 **3개 신규 필드** 추가, **2개 boolean 필드** 제거:

```typescript
// 신규 타입
export type ApprovalCategoryPriority = 'hero' | 'default' | 'compact';
export type SidebarWidget = 'teamDistribution' | 'miniCalendar' | 'systemHealth';
export type PendingApprovalLayoutHint = 'single-focus' | 'prioritized-grid' | 'grid';

// ControlCenterConfig 신규 필드
pendingApprovalLayoutHint: PendingApprovalLayoutHint;
approvalCategoryPriorities: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>;
sidebarWidgets: readonly SidebarWidget[];

// 제거
// showTeamDistribution: boolean;   ← sidebarWidgets로 통합
// showMiniCalendar: boolean;       ← sidebarWidgets로 통합
```

컴포넌트에 역할 리터럴('quality_manager' 등) **참조 0건** — config-driven only.

---

## 역할별 신규 설정값

| 역할 | pendingApprovalLayoutHint | approvalCategoryPriorities | sidebarWidgets |
|------|--------------------------|---------------------------|----------------|
| test_engineer | `'grid'` | `{}` | `['miniCalendar']` |
| technical_manager | `'prioritized-grid'` | `{ outgoing: 'hero', incoming: 'hero', software_validation: 'compact' }` | `['teamDistribution', 'miniCalendar']` |
| quality_manager | `'single-focus'` | `{ plan_review: 'hero' }` | `['miniCalendar']` |
| lab_manager | `'prioritized-grid'` | `{ plan_final: 'hero', disposal_final: 'default', incoming: 'default' }` | `['teamDistribution', 'miniCalendar']` |
| system_admin | `'grid'` | `{}` | `['systemHealth', 'teamDistribution', 'miniCalendar']` |

추가 수정: `system_admin.showPendingApprovals: false` (현재 true → ghost 컬럼 버그)

---

## 파일 목록

| Phase | 파일 | 변경 유형 |
|-------|------|---------|
| 1 | `apps/frontend/lib/config/dashboard-config.ts` | 수정 (타입 + config) |
| 2 | `apps/frontend/lib/design-tokens/components/dashboard.ts` | 수정 (토큰 추가) |
| 3 | `apps/frontend/lib/utils/approval-count-utils.ts` | 수정 (priority 필드) |
| 3 | `apps/frontend/components/dashboard/PendingApprovalCard.tsx` | 수정 (3-mode 렌더) |
| 4 | `apps/frontend/components/dashboard/SystemHealthCard.tsx` | **신규** |
| 4 | `apps/frontend/messages/ko.json` | 수정 (신규 i18n 키) |
| 4 | `apps/frontend/messages/en.json` | 수정 (신규 i18n 키) |
| 5 | `apps/frontend/components/dashboard/DashboardClient.tsx` | 수정 (sidebarWidgets) |
| 6 | `apps/frontend/tests/e2e/features/dashboard/comprehensive/widget-visibility.spec.ts` | 수정 (TC-05 추가) |

---

## Phase 1 — SSOT 타입 및 Config 확장

**파일**: `apps/frontend/lib/config/dashboard-config.ts`

**목표**:
- `ApprovalCategoryPriority`, `SidebarWidget`, `PendingApprovalLayoutHint` 타입 export
- `ControlCenterConfig`에 3개 신규 필드 추가, `showTeamDistribution`/`showMiniCalendar` 제거
- 5개 역할 config 전체 업데이트 (위 표 기준)
- `system_admin.showPendingApprovals: false` 수정

**중요**: `ApprovalCategory` 타입은 `@equipment-management/schemas`에서 import.

**검증**: `pnpm --filter frontend run tsc --noEmit` → DashboardClient.tsx 타입 오류 발생 예상 (Phase 5에서 해결)

---

## Phase 2 — 디자인 토큰 확장

**파일**: `apps/frontend/lib/design-tokens/components/dashboard.ts`

**목표**: priority 기반 카드 variant + SystemHealth 토큰 신규 섹션.

**추가할 내용**:

```typescript
// 섹션 8: DASHBOARD_PENDING_APPROVAL_TOKENS
export const DASHBOARD_PENDING_APPROVAL_TOKENS = {
  // single-focus: 1개 카테고리 풀폭 히어로 카드
  heroCard: `group w-full bg-card border-2 border-border rounded-xl p-8 flex flex-col items-center text-center gap-4 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 ${TRANSITION_PRESETS.fastBgTransformShadow}`,
  heroIconContainer: `h-16 w-16 rounded-2xl flex items-center justify-center ${TRANSITION_PRESETS.fastBgTransform}`,
  heroIcon: 'h-8 w-8',
  heroLabel: 'text-base font-semibold text-foreground',
  heroCount: 'font-mono tabular-nums font-bold text-5xl tracking-tight',
  heroCountActive: 'text-brand-critical',
  heroCountEmpty: 'text-muted-foreground',
  heroDescription: 'text-sm text-muted-foreground',
  // prioritized-grid: priority별 col-span
  priorityHeroColSpan: 'col-span-2',
  priorityDefaultColSpan: 'col-span-1',
  priorityCompactColSpan: 'col-span-1',
  priorityHeroCard: `group bg-card border-2 border-border rounded-lg p-5 flex flex-col items-center text-center hover:border-primary/30 hover:shadow-md hover:scale-[1.01] ${TRANSITION_PRESETS.fastBgTransformShadow}`,
  priorityDefaultCard: `group bg-card border border-border rounded-lg p-4 flex flex-col items-center text-center hover:shadow-sm hover:scale-[1.01] ${TRANSITION_PRESETS.fastBgTransformShadow}`,
  priorityCompactCard: `group bg-card border border-border rounded-lg p-3 flex flex-col items-center text-center hover:shadow-sm ${TRANSITION_PRESETS.fastBgTransform}`,
  priorityHeroIcon: 'h-7 w-7',
  priorityDefaultIcon: 'h-6 w-6',
  priorityCompactIcon: 'h-5 w-5',
  // gridLayouts: layoutHint별 그리드 클래스
  gridLayouts: {
    'single-focus': 'grid grid-cols-1',
    'prioritized-grid': 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
    'grid': 'grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4',
  } as const,
} as const;

// 섹션 9: DASHBOARD_SYSTEM_HEALTH_TOKENS
export const DASHBOARD_SYSTEM_HEALTH_TOKENS = {
  container: 'bg-card border border-border rounded-lg p-4 flex flex-col gap-3',
  header: 'flex items-center justify-between',
  title: 'text-sm font-semibold text-foreground',
  statusGrid: 'grid grid-cols-2 gap-2',
  statusItem: 'flex flex-col gap-0.5',
  statusLabel: 'text-xs text-muted-foreground',
  statusValue: 'font-mono tabular-nums font-semibold text-sm',
  statusOk: 'text-brand-ok',
  statusWarning: 'text-brand-warning',
  statusCritical: 'text-brand-critical',
  statusNeutral: 'text-foreground',
} as const;
```

**기존 토큰 삭제/변경 없음**.

---

## Phase 3 — PendingApprovalCard priority-aware 렌더링

**파일**: `apps/frontend/lib/utils/approval-count-utils.ts`
- `DashboardApprovalCategory`에 `priority: ApprovalCategoryPriority` 필드 추가
- `getDashboardApprovalCategories` 4번째 파라미터 `priorities?: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>` 추가
- 각 카테고리 `priority: priorities?.[tab] ?? 'default'` 주입

**파일**: `apps/frontend/components/dashboard/PendingApprovalCard.tsx`

**목표**: 3가지 layoutHint 모드 구현.

```
props 추가:
  layoutHint?: PendingApprovalLayoutHint  // 기본 'grid'
  priorities?: Partial<Record<ApprovalCategory, ApprovalCategoryPriority>>  // 기본 {}
```

**3가지 렌더 분기**:

1. `single-focus` + 카테고리 1개:
   - `DASHBOARD_PENDING_APPROVAL_TOKENS.heroCard`로 풀폭 히어로 카드 렌더
   - 큰 아이콘(h-8 w-8), 5xl count, description 포함
   - 기존 `getDashboardApprovalCategories(role, ...)` 대신 `getDashboardApprovalCategories(role, ..., priorities)` 호출

2. `prioritized-grid`:
   - `gridLayouts['prioritized-grid']` 그리드 클래스
   - 각 카테고리 카드에 `data-priority={category.priority}` attribute (E2E hook)
   - priority==='hero' → `priorityHeroCard` + `col-span-2` + h-7 아이콘
   - priority==='default' → `priorityDefaultCard` + h-6 아이콘
   - priority==='compact' → `priorityCompactCard` + h-5 아이콘 + 텍스트 생략

3. `grid` (기존 동작 완전 보존):
   - 기존 코드 그대로 유지 (기본 경로)

**역할 리터럴 참조 0건 검증**: `grep -E "'(quality_manager|technical_manager|test_engineer|lab_manager|system_admin)'" PendingApprovalCard.tsx` → 0

---

## Phase 4 — SystemHealthCard 신규 컴포넌트 + i18n

**파일**: `apps/frontend/components/dashboard/SystemHealthCard.tsx`

**목표**: 시스템관리자 Row 4 우측 첫 번째 위젯.

**데이터 소스**: `DashboardAggregate` (이미 패치된 aggregate 쿼리 재사용, props로 전달받음)
- `summary.totalEquipment` → 전체 장비
- `summary.activeCheckouts` → 반출 중
- `equipmentStatusStats.calibration_overdue` → 교정 기한 초과
- `equipmentStatusStats.non_conforming` → 부적합
- `recentActivities.length` → 최근 7일 활동

```typescript
interface SystemHealthCardProps {
  summary?: DashboardSummary;
  equipmentStatusStats?: Record<string, number>;
  recentActivities?: RecentActivity[];
  loading?: boolean;
}
```

- 신규 API 호출 0건
- `DASHBOARD_SYSTEM_HEALTH_TOKENS` 100% 사용
- `role="region"`, `aria-label={t('dashboard.systemHealth.ariaLabel')}`
- loading → Skeleton (DASHBOARD_MOTION.listItem)
- i18n: `dashboard.systemHealth.{title, ariaLabel, totalEquipment, activeCheckouts, calibrationOverdue, nonConforming, recentActivity, healthy, issues}` (ko/en 양쪽)

---

## Phase 5 — DashboardClient 통합

**파일**: `apps/frontend/components/dashboard/DashboardClient.tsx`

**목표**:
1. `showTeamDistribution`/`showMiniCalendar` boolean 분기 → `sidebarWidgets.map()` 패턴
2. `PendingApprovalCard`에 신규 props 전달

**구체적 변경**:

```typescript
// 모듈 레벨 상수 (리렌더 영향 없음)
const SIDEBAR_WIDGET_RENDERERS: Record<
  SidebarWidget,
  (props: SidebarWidgetRendererProps) => React.ReactNode
> = {
  teamDistribution: (p) => <TeamEquipmentDistribution ... />,
  miniCalendar: (p) => <MiniCalendar ... />,
  systemHealth: (p) => <SystemHealthCard ... />,
};

// Row 4 우측 렌더
{controlCenter.sidebarWidgets.length > 0 && (
  <div className="flex flex-col gap-4">
    {controlCenter.sidebarWidgets.map((w) => (
      <React.Fragment key={w}>{SIDEBAR_WIDGET_RENDERERS[w](sidebarProps)}</React.Fragment>
    ))}
  </div>
)}

// PendingApprovalCard 신규 props 전달
<PendingApprovalCard
  compact
  layoutHint={controlCenter.pendingApprovalLayoutHint}
  priorities={controlCenter.approvalCategoryPriorities}
/>
```

**Phase 1에서 발생한 tsc 오류 해소** (showTeamDistribution/showMiniCalendar 참조 제거).

---

## Phase 6 — E2E 테스트 업데이트

**파일**: `apps/frontend/tests/e2e/features/dashboard/comprehensive/widget-visibility.spec.ts`

**추가**: TC-05 (system_admin)
```typescript
test('TC-05: system_admin — SystemHealthCard 표시, 승인 대기 카드 미표시', async ({
  systemAdminPage: page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

  // SystemHealthCard 표시
  await expect(page.locator('[aria-label="시스템 상태 요약"]')).toBeVisible();

  // PendingApprovalCard 미표시 (system_admin 승인 워크플로우 없음)
  await expect(page.getByTestId('pending-approval-card')).not.toBeVisible();

  // 팀 분포 + 미니 달력 표시
  await expect(page.locator('[aria-label="팀별 장비 분포 바 차트"]')).toBeVisible();
  await expect(page.locator('[aria-label="미니 달력"]')).toBeVisible();
});
```

**fixture 확인 필요**: `systemAdminPage` fixture가 `auth.fixture.ts`에 존재하는지 확인 후 없으면 추가.

---

## Verification Commands

```bash
# Phase 1-5: 타입 체크
pnpm --filter frontend run tsc --noEmit

# 역할 리터럴 스캔 (0건이어야 함)
grep -nE "'(quality_manager|technical_manager|test_engineer|lab_manager|system_admin)'" \
  apps/frontend/components/dashboard/PendingApprovalCard.tsx \
  apps/frontend/components/dashboard/DashboardClient.tsx \
  apps/frontend/components/dashboard/SystemHealthCard.tsx

# Phase 5: sidebarWidgets.map 패턴 확인
grep -q "sidebarWidgets.*\.map\|SIDEBAR_WIDGET_RENDERERS" \
  apps/frontend/components/dashboard/DashboardClient.tsx

# Phase 6: E2E
cd apps/frontend && pnpm run test:e2e -- widget-visibility.spec.ts

# 신규 API 호출 없음
grep -nE "apiClient\.|useQuery(?!.*aggregate)" \
  apps/frontend/components/dashboard/SystemHealthCard.tsx
```

---

## 역할별 변경 영향

| 역할 | Row 3 변화 | Row 4 우측 변화 | 영향도 |
|------|-----------|---------------|--------|
| 시험실무자 | 변경 없음 | miniCalendar 단독 (동일) | 낮음 |
| 기술책임자 | 8개 → priority 계층 (outgoing/incoming hero) | 동일 | **높음** |
| 품질책임자 | 1개 → 풀폭 heroCard | 동일 | **높음** |
| 시험소장 | 3개 → plan_final hero 강조 | 동일 | 중간 |
| 시스템관리자 | ghost 컬럼 제거 | SystemHealth 신규 위젯 추가 | **높음** |
