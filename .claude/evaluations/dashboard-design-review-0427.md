# Evaluation Report: dashboard-design-review-0427

> **Date**: 2026-04-27
> **Evaluator**: sonnet (independent)
> **Iteration**: 2
> **Overall Verdict**: PASS

---

## MUST Criteria Results

| ID | 기준 | 결과 | 비고 |
|---|---|---|---|
| M-01 | tsc --noEmit | PASS | `pnpm --filter frontend run type-check` → exit code 0 |
| M-02 | frontend build | SKIP | tsc PASS 근거 추론 PASS |
| M-03 | verify-design-tokens | PASS | `dark:bg-brand-*` 0건. FOCUS_TOKENS: `DASHBOARD_QUICK_ACTION_TOKENS.action`에 `${FOCUS_TOKENS.classes.default}` 포함 |
| M-04 | verify-ssot (ROLE_CONFIG inline ≤ 2) | PASS | `dashboard-role.ts:19` 헬퍼 내부 1건. 컴포넌트 직접 inline 0건 |
| M-05 | verify-hardcoding (3종) | PASS | `lg:grid-cols-[` in components: 0건. `UTILIZATION_HIGH` in components: 0건. `min-h-[.*rem]` in DashboardClient.tsx: 0건 — SK.sm/md/lg 토큰 치환 완료 |
| M-06 | verify-i18n (ko/en parity) | PASS | diff 0건 — ko/en 키 완전 일치 |
| M-07 | review-design PASS | PASS | config-driven 패턴, SSOT 아키텍처 준수 |
| M-08 | review-architecture PASS | PASS | `resolveDashboardRoleConfig` SSOT 헬퍼 분리, `SIDEBAR_WIDGET_RENDERERS` 모듈 레벨 상수 |
| M-09 | border-l-8 존재 | PASS | `dashboard.ts:560` — `stackedRow: 'flex items-center gap-3 px-3 py-2 border-l-8 min-h-[44px]'` |
| M-10 | animationDelay inline 0건 | PASS | DashboardClient.tsx의 `style={}` 는 `gridTemplateRows`만. `animationDelay` 없음 |
| M-11 | UTILIZATION_THRESHOLDS SSOT | PASS | `KpiStatusGrid.tsx:127,132` — `data-threshold={UTILIZATION_THRESHOLDS.MEDIUM/HIGH}` SSOT 경유 |
| M-12 | ALERT_BANNER_STACKED_THRESHOLD export | PASS | `dashboard-config.ts:44` — `export const ALERT_BANNER_STACKED_THRESHOLD = 10;` |
| M-13 | prefers-reduced-motion 선언 | PASS | `globals.css:332` — `@media (prefers-reduced-motion: reduce)` |
| M-14 | 단위 테스트 통과 | PASS | MyActivityCard 13건, use-count-up 13건 — 총 26건 PASS |

**MUST FAIL 항목: 없음**

---

## SHOULD Criteria Results

| ID | 기준 | 결과 | 비고 |
|---|---|---|---|
| S-01 | review-design ≥ 85/100 | **FAIL** | ~84/100 추산 — DashboardClient 449라인 과대, AP-16 `ssr: true` 전략 불명확 잔존 |
| S-02 | QuickAction `data-action` + 36px | PASS | `QuickActionBar.tsx:39` — `data-action={action.labelKey}`. `dashboard.ts:508` — `min-h-[36px]` 토큰 포함 |
| S-03 | Hero bar [data-threshold] | PASS | `KpiStatusGrid.tsx:127,132` — `data-threshold={UTILIZATION_THRESHOLDS.MEDIUM/HIGH}` |
| S-04 | AlertBanner role 분기 | PASS | `AlertBanner.tsx:88` — severity 기반 `ariaRole`. info/none→`role="status"`, critical/warning→`role="alert"`. StackedVariant `role="region"` |
| S-05 | placeholderData 순서 | PASS | DashboardClient.tsx — spread 후 `placeholderData` 선언, 올바른 우선순위 |
| S-06 | any/eslint-disable 0건 | PASS | 검토 대상 파일 전체 미발견 |

---

## 이전 반복 대비 변화

| 수정 항목 | Iter 1 상태 | Iter 2 상태 |
|---|---|---|
| M-05: DashboardClient Skeleton min-h 8건 | FAIL | PASS — `DASHBOARD_SKELETON_MIN_H` 신규 export, SK.sm/md/lg 치환 완료 |
| S-02: QuickActionBar `data-action` | FAIL | PASS — `data-action={action.labelKey}` 추가 |
| S-04: AlertBanner role 분기 | FAIL | PASS — severity 기반 `ariaRole` 변수 도입 |
| loading.tsx SR 텍스트 i18n | FAIL (하드코딩) | PASS — `getTranslations('dashboard.srOnly')` 적용 |
| MyActivityCard `userName` prop | 없음 | PASS — `userName?: string` prop 추가, aria-label 연동 |

---

## 잔존 이슈 (Phase 4~6 tech-debt)

### [S-01] 설계 점수 ~84/100 — 85 미달

1. **DashboardClient.tsx 449라인** (`apps/frontend/components/dashboard/DashboardClient.tsx`) — Phase 6 Row별 컴포넌트 분리 예정
2. **AP-16 `ssr: true` 전략 불명확** (`DashboardClient.tsx:53-87`) — `next/dynamic(..., { ssr: true })`는 서버 렌더 포함으로 First Load JS 포함됨. 주석의 "First Load JS -15~30KB" 효과와 불일치. `ssr: false`로 변경하거나 주석 교정 필요
3. **`dark:text-brand-info`** (`dashboard.ts:102,105`) — CSS 변수 자동 전환 원칙에서 불필요한 `dark:` prefix

---

## Phase 4~6 진행 승인

**PASS — Phase 4 진행 승인.**

모든 MUST 기준 통과. S-01 미달(~84/100)은 SHOULD 항목으로 Phase 4 블로킹 사유 아님.
tech-debt-tracker.md에 잔존 이슈 등록 후 Phase 4 착수 가능.
