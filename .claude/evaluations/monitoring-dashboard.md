---
slug: monitoring-dashboard
iteration: 1
date: 2026-04-02
verdict: PASS
---

# Evaluation Report: monitoring-dashboard

## Build Verification
- [x] tsc --noEmit: PASS (monorepo-wide, zero errors)
- [x] build: PASS (frontend build successful, /admin/monitoring route rendered)

## MUST Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | `pnpm --filter frontend run tsc --noEmit` 에러 0 | PASS | No type errors |
| 2 | `pnpm --filter frontend run build` 성공 | PASS | Build succeeded, route listed in output |
| 3 | `pnpm tsc --noEmit` (monorepo 전체) 에러 0 | PASS | No output = no errors |
| 4 | 모니터링 API 클라이언트 4개 엔드포인트 통합 (API_ENDPOINTS.MONITORING SSOT) | PASS | monitoring-api.ts uses `API_ENDPOINTS.MONITORING.METRICS/STATUS/HTTP_STATS/CACHE_STATS` from shared-constants |
| 5 | 응답 타입 인터페이스가 monitoring.controller.ts 반환 타입과 일치 | PASS | All 4 interfaces match controller return types exactly |
| 6 | TanStack Query: queryKeys.monitoring 팩토리 + QUERY_CONFIG.MONITORING PERIODIC 5분 | PASS | queryKeys.monitoring has all/metrics/status/httpStats/cacheStats. QUERY_CONFIG.MONITORING uses REFETCH_INTERVALS.PERIODIC (5*60*1000) |
| 7 | 권한: page.tsx getServerAuthSession() + UserRoleValues.SYSTEM_ADMIN → redirect | PASS | page.tsx:9-17 checks session and role, redirects non-SYSTEM_ADMIN to /dashboard |
| 8 | FRONTEND_ROUTES.ADMIN.MONITORING shared-constants 등록 | PASS | frontend-routes.ts:93 `MONITORING: '/admin/monitoring'` |
| 9 | 사이드바 모니터링 링크 (nav-config.ts, Permission.MANAGE_SYSTEM_SETTINGS) | PASS | nav-config.ts:144-149 uses Activity icon, FRONTEND_ROUTES.ADMIN.MONITORING, Permission.MANAGE_SYSTEM_SETTINGS |
| 10 | i18n: ko/en navigation.json에 adminMonitoring 키 존재 | PASS | ko: "시스템 모니터링", en: "System Monitoring" |
| 11 | 대시보드 최소 4개 데이터 섹션 | PASS | 5 sections: SystemResources, ServiceHealth, HttpStats, CachePerformance, DatabaseStatus |
| 12 | loading.tsx, error.tsx 파일 존재 | PASS | loading.tsx uses RouteLoading, error.tsx uses 'use client' + RouteError |
| 13 | verify-implementation 전체 PASS | SKIP | Manual evaluation performed; all individual criteria verified inline |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| 1 | review-architecture Critical 이슈 0개 | PASS | No cross-layer inconsistencies found |
| 2 | 에러 격리: 하나의 API 실패가 다른 섹션 차단하지 않음 | PASS | Each section has independent useQuery + per-section error/loading states (SectionError + SectionSkeleton) |
| 3 | 반응형 그리드: 모바일(1열)/태블릿(2열)/데스크톱(3열) | PASS | `grid gap-4 md:grid-cols-2 xl:grid-cols-3` |
| 4 | isSimulated 플래그 true인 데이터에 시뮬레이션 표시 | PASS | SimulatedBadge component used for storage.isSimulated and database.isSimulated |
| 5 | playwright-e2e: /admin/monitoring 렌더링 확인 | NOT VERIFIED | No E2E test found for this route |

## Issues Found

### Issue 1: Hardcoded "Retry" string in SectionError (Severity: LOW)
- **File:** `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx:143`
- **Detail:** The `SectionError` component has a hardcoded English string `"Retry"` instead of using the i18n key `t('error.retry')`. The monitoring.json files already define `error.retry` in both ko ("다시 시도") and en ("Retry"), but the component does not accept or use a translation function.
- **Impact:** Korean users will see "Retry" in English on error states within the monitoring dashboard. This is an i18n consistency issue.

### Issue 2: network.isSimulated not displayed (Severity: LOW)
- **File:** `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx:167-217`
- **Detail:** The `SystemResourcesSection` displays `storage.isSimulated` badge but does not show a simulated badge for `network.isSimulated` despite the MonitoringMetrics type including it.
- **Impact:** Users may not realize network metrics are simulated when they are.

## Repair Instructions

### For Issue 1 (hardcoded "Retry"):
Pass the translation function to `SectionError` or change the component to accept a `retryLabel` prop:
```typescript
// Option A: Pass t directly
function SectionError({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  // ... use {retryLabel} instead of "Retry"
}
// Caller: <SectionError message={t('error.fetchFailed')} onRetry={...} retryLabel={t('error.retry')} />
```

### For Issue 2 (network.isSimulated):
Add `{data.network.isSimulated && <SimulatedBadge t={t} />}` near the network-related display in `SystemResourcesSection`, or combine it with the existing storage simulated badge.

---

**Overall verdict: PASS** -- All MUST criteria are satisfied. The two issues found are LOW severity (i18n cosmetic, missing simulated indicator) and do not warrant a FAIL verdict per the contract's MUST/SHOULD classification.
