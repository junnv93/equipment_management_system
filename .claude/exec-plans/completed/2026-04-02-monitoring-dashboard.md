# 시스템 모니터링 대시보드 구현 계획

## 메타
- 생성: 2026-04-02
- 모드: Mode 2 (Full Harness)
- 예상 변경: 10개 파일 (신규 5 + 수정 5)

## 설계 철학
시스템 관리자(system_admin)가 서버 상태를 실시간으로 파악할 수 있는 모니터링 대시보드를 구축한다.
기존 백엔드 6개 엔드포인트 중 4개(metrics, status, http-stats, cache-stats)를 개별 쿼리로 통합하며,
REFETCH_INTERVALS.PERIODIC (5분 주기) 자동 갱신을 적용한다.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| 데이터 갱신 전략 | PERIODIC (5분 폴링) | REFETCH_INTERVALS.PERIODIC이 "모니터링" 용도로 정의됨 (query-config.ts:39) |
| 페이지 권한 게이트 | UserRoleValues.SYSTEM_ADMIN 직접 비교 | 사용자 명시 요청: system_admin만 접근. data-migration 페이지와 동일 패턴 |
| 사이드바 권한 | Permission.MANAGE_SYSTEM_SETTINGS | system_admin 전용 Permission (data-migration과 동일) |
| 페이지 구조 | Server Component (page.tsx) + Client Component | data-migration 패턴: SSR에서 role check → redirect, 클라이언트에서 TanStack Query 폴링 |
| API 클라이언트 | 단일 monitoringApi 클래스 | dashboard-api.ts 패턴 준수 |
| 엔드포인트 선택 | metrics + status + http-stats + cache-stats | diagnostics는 중복 데이터. 개별 엔드포인트가 세밀한 로딩/에러 격리 제공 |

## Phase 1: Shared Constants & API Layer

**목표:** 모니터링 API 호출 인프라 구축

| 파일 | 작업 | 목적 |
|------|------|------|
| `packages/shared-constants/src/frontend-routes.ts` | 수정 | ADMIN.MONITORING: '/admin/monitoring' 추가 |
| `apps/frontend/lib/api/monitoring-api.ts` | 신규 | MonitoringApi 클래스 — 4개 엔드포인트 + 응답 타입 (controller 반환타입 기준) |
| `apps/frontend/lib/api/query-config.ts` | 수정 | queryKeys.monitoring 팩토리 + QUERY_CONFIG.MONITORING (PERIODIC 전략) |

**검증:** `pnpm --filter frontend run tsc --noEmit` 에러 0

## Phase 2: Dashboard Page & Route

**목표:** /admin/monitoring 라우트와 페이지 셸 구성

| 파일 | 작업 | 목적 |
|------|------|------|
| `apps/frontend/app/(dashboard)/admin/monitoring/page.tsx` | 신규 | Server Component — getServerAuthSession() + SYSTEM_ADMIN role check → redirect |
| `apps/frontend/app/(dashboard)/admin/monitoring/loading.tsx` | 신규 | RouteLoading variant="cards" (모니터링 카드 스켈레톤) |
| `apps/frontend/app/(dashboard)/admin/monitoring/error.tsx` | 신규 | RouteError 패턴 ('use client') |

**검증:** `pnpm --filter frontend run tsc --noEmit` 에러 0

## Phase 3: Dashboard Components

**목표:** 모니터링 데이터를 시각화하는 클라이언트 컴포넌트

| 파일 | 작업 | 목적 |
|------|------|------|
| `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx` | 신규 | 'use client' — 4개 쿼리 병렬 호출, 5개 섹션 (시스템 리소스, 서비스 건강, HTTP 통계, 캐시 성능, DB 상태), shadcn/ui Card 기반 그리드 |

**검증:** `pnpm --filter frontend run build` 성공

## Phase 4: Navigation & i18n

**목표:** 사이드바 모니터링 링크 + 국제화 키

| 파일 | 작업 | 목적 |
|------|------|------|
| `apps/frontend/lib/navigation/nav-config.ts` | 수정 | 시스템 섹션에 모니터링 아이템 (Activity 아이콘, MANAGE_SYSTEM_SETTINGS Permission) |
| `apps/frontend/messages/ko/navigation.json` | 수정 | "adminMonitoring": "시스템 모니터링" |
| `apps/frontend/messages/en/navigation.json` | 수정 | "adminMonitoring": "System Monitoring" |

**검증:** `pnpm --filter frontend run build` 성공

## 전체 변경 파일 요약

### 신규 (5)
1. `apps/frontend/lib/api/monitoring-api.ts`
2. `apps/frontend/app/(dashboard)/admin/monitoring/page.tsx`
3. `apps/frontend/app/(dashboard)/admin/monitoring/loading.tsx`
4. `apps/frontend/app/(dashboard)/admin/monitoring/error.tsx`
5. `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx`

### 수정 (5)
1. `packages/shared-constants/src/frontend-routes.ts`
2. `apps/frontend/lib/api/query-config.ts`
3. `apps/frontend/lib/navigation/nav-config.ts`
4. `apps/frontend/messages/ko/navigation.json`
5. `apps/frontend/messages/en/navigation.json`
