# 대시보드 개선안 v1 — 아키텍처 리뷰 보고서

**작성일**: 2026-04-28  
**검토 범위**: 대시보드 개선안 v1 (인스코프 파일 전체)  
**최종 판정**: **SHOULD-FIX** (Critical 1건, Warning 3건, Info 2건)

---

## 요약 판정표

| 영역 | 상태 | 발견 사항 요약 |
|---|---|---|
| A. Cross-layer SSOT 코히어런스 | ⚠ SHOULD-FIX | CalibrationPlan status 하드코딩 (SSOT 우회) |
| B. 캐시 전략 | ⚠ SHOULD-FIX | `getCheckoutsByScope` 캐시 누락 |
| C. 성능 | ✅ OK | dynamic + Skeleton + ErrorBoundary + useMemo 안정성 모두 양호 |
| D. 보안 | ✅ OK | 서버사이드 userId 추출, RoleGate UI-only 분리 정확 |
| E. 워크플로 일관성 | ⚠ SHOULD-FIX | CheckoutCard 비제어 모드 부호 역전 버그 |
| F. 안티패턴 | ✅ OK | setQueryData 없음, 하드코딩 색상 없음, 로컬 enum 재정의 없음 |

---

## 발견된 이슈 (심각도순)

---

### [Warning] A-1: `getQualityReviewPending` — CalibrationPlanStatus 하드코딩 (SSOT 우회)

- **파일**: `apps/backend/src/modules/dashboard/dashboard.service.ts:824,847`
- **문제**: `calibrationPlans.status='pending_review'`, `['draft', 'pending_review']` 를 문자열 리터럴로 직접 사용.  
  `CalibrationPlanStatusValues.PENDING_REVIEW`, `CalibrationPlanStatusValues.DRAFT` 를 export 하는 SSOT enum이 `@equipment-management/schemas`에 존재하지만 import 하지 않음.
- **영향**: 교정계획서 상태 enum 값이 리팩토링되면 대시보드 집계 쿼리만 업데이트가 누락된 채로 silent break.
- **수정안**: 
  ```typescript
  import { CalibrationPlanStatusValues } from '@equipment-management/schemas';
  // ...
  .where(eq(schema.calibrationPlans.status, CalibrationPlanStatusValues.PENDING_REVIEW));
  // ...
  notInArray(schema.calibrationPlans.status, [
    CalibrationPlanStatusValues.DRAFT,
    CalibrationPlanStatusValues.PENDING_REVIEW,
  ])
  ```
- **참고**: 동일 파일의 다른 메서드는 `CheckoutStatusEnum.enum.checked_out`, `ESVal.NON_CONFORMING` 등 SSOT enum을 올바르게 사용하고 있어 일관성 위반임.

---

### [Warning] B-1: `getCheckoutsByScope` — 서비스 레이어 캐시 누락

- **파일**: `apps/backend/src/modules/dashboard/dashboard.service.ts:623~706`
- **문제**: 4개 신규 서비스 메서드 중 `getSystemHealth`, `getQualityReviewPending`, `getMyQuickSummary`는 모두 `cacheService.getOrSet(cacheKey, ..., CACHE_TTL.SHORT)` 패턴을 사용하나, `getCheckoutsByScope`만 캐시가 없음.  
  `scope+userId+teamId+site` 파라미터 조합으로 3개의 DB 쿼리(upcoming + overdue count + pending count)를 항상 실행함.
- **영향**: 동일 사용자가 대시보드를 반복 접근하거나, 여러 사용자가 같은 scope를 조회할 때 캐시 없이 매번 DB hit. 특히 `scope='team'`/`'all'` 처럼 공유 범위는 캐시 효율이 크다.
- **수정안**: 
  ```typescript
  const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}checkoutsByScope:${scope}:${userId}:${teamId ?? 'none'}:${site ?? 'none'}`;
  return this.cacheService.getOrSet(cacheKey, async () => { ... }, CACHE_TTL.SHORT);
  ```
  `scope='all'`/`'lab'`은 userId 없이 teamId/site만으로 키 구성해도 충분 (userId는 `scope='me'` 전용).
- **참고**: `CacheInvalidationHelper.invalidateAllDashboard()`가 `dashboard:*` 패턴으로 이 키도 자동 무효화하므로 일관성 문제 없음.

---

### [Warning] E-1: `CheckoutCard` 비제어 모드 — `daysUntilDue` 부호 이중 역전 버그

- **파일**: `apps/frontend/components/dashboard/cards/CheckoutCard.tsx:85~86,198`
- **문제**: 비제어(uncontrolled) 모드에서 `DashboardCheckoutScopeDto.daysUntilDue`를 `UpcomingCheckoutReturn.daysUntilReturn`으로 변환할 때 `-item.daysUntilDue`로 저장(line 86)하고, 렌더 시 `<DDayTag days={-item.daysUntilReturn}`(line 198)으로 다시 부호를 뒤집어 원래 양수값으로 복원됨.
  - 백엔드: `daysUntilDue = (expectedDate - today) / ms` → 양수 = 남은 일수
  - `DDayTag`: `days > 0` = overdue, `days < 0` = 남은 일수
  - 결과: 비제어 모드에서는 "남은 5일" 항목이 DDayTag에 `+5`로 전달 → overdue 표시(빨간 D+5)
- **코드 내 주석 오류**: line 85 주석 "backend daysUntilDue 부호 = 음수면 남은 일수 / 양수면 초과"는 실제 서비스 계산과 반대.
- **영향**: 현재는 DashboardRow3 `three-col-test-engineer` 레이아웃에서 항상 제어 모드로 사용되므로 즉각 버그는 없으나, 비제어 모드로 재사용 시 silent UI bug 발생.
- **수정안**: 
  ```typescript
  // 비제어 모드 매핑: daysUntilDue(양수=남은 일수) → daysUntilReturn(음수=남은 일수)
  daysUntilReturn: -item.daysUntilDue,  // 현재 코드 유지
  // ...
  // 렌더 시 부호 이중 역전 제거
  <DDayTag days={item.daysUntilReturn} size="sm" />  // -(-x) 제거
  ```
  또는 `DashboardCheckoutScopeDto.daysUntilDue` DTO 문서에 부호 규약을 명확히 일치시키고 변환 로직을 제거.

---

### [Info] A-2: `quality-review-pending` 권한 데코레이터 — 의미론적 불일치

- **파일**: `apps/backend/src/modules/dashboard/dashboard.controller.ts:411`
- **문제**: `@RequirePermissions(Permission.VIEW_EQUIPMENT)`를 사용하지만, 이 엔드포인트는 `calibration_plans` 테이블을 조회하므로 `Permission.VIEW_CALIBRATIONS`가 더 의미론적으로 정확함.
- **영향**: `QUALITY_MANAGER`가 `VIEW_EQUIPMENT`와 `VIEW_CALIBRATIONS`를 모두 보유하므로 실제 동작은 정상. 그러나 RBAC 리뷰 시 혼동 유발.
- **수정안**: `@RequirePermissions(Permission.VIEW_CALIBRATIONS)`로 변경. 동일 엔드포인트의 역할 기반 ForbiddenException 체크(QUALITY_MANAGER/LAB_MANAGER/SYSTEM_ADMIN)는 이 권한 데코레이터와 중복되지 않으므로 유지.

---

### [Info] B-2: 프론트엔드 대시보드 `QUERY_CONFIG.DASHBOARD` — NORMAL 전략 (refetch interval 없음)

- **파일**: `apps/frontend/lib/api/query-config.ts:164`
- **문제**: `QUERY_CONFIG.DASHBOARD = REFETCH_STRATEGIES.NORMAL`이므로 자동 폴링이 없음. `systemHealth`, `checkouts`, `qualityReviewPending`, `myQuickSummary` 4개 신규 쿼리가 모두 이를 상속.
  - `systemHealth`는 DB 응답시간·스토리지를 모니터링 목적으로 노출하는데, 자동 갱신 없이 탭 포커스 시에만 갱신됨.
  - 기존 `QUERY_CONFIG.MONITORING`은 `REFETCH_INTERVALS.PERIODIC(5분)`을 사용함.
- **영향**: 현재는 쓰기 전용 비교적 낮은 영향이나, `SystemHealthCard`를 화면에 보고도 수동 포커스 전까지 30s 이상 stale 상태 유지 가능.
- **권고**: 수용 가능한 수준이나, `systemHealth`만 MONITORING 전략으로 격상하는 것을 추후 검토 대상으로 tech-debt-tracker에 기록.

---

## 섹션별 상세 판정

### A. Cross-layer SSOT 코히어런스

| 항목 | 판정 | 상세 |
|---|---|---|
| dashboard-thresholds.ts → dday-tone.ts 동기화 | ✅ PASS | `DDAY_THRESHOLDS`, `UTILIZATION_GAUGE_THRESHOLDS`, `DISTRIBUTION_BAR_THRESHOLDS`, `SYSTEM_HEALTH_THRESHOLDS`, `SYSTEM_HEALTH_OVERALL_THRESHOLDS` 모두 shared-constants에서 import |
| 백엔드 overallStatus 계산 → shared-constants SSOT | ✅ PASS | `dashboard.service.ts:778~783`이 `SYSTEM_HEALTH_OVERALL_THRESHOLDS` import 후 동일 로직 사용 |
| DTO ↔ 프론트엔드 타입 필드 패리티 | ✅ PASS | `SystemHealthMetrics`, `DashboardCheckoutsScope`, `QualityReviewPending`, `MyQuickSummary` 모두 필드명 일치 |
| API_ENDPOINTS 동기화 | ✅ PASS | `CHECKOUTS`, `SYSTEM_HEALTH`, `QUALITY_REVIEW_PENDING`, `ME_QUICK_SUMMARY` 4개 신규 상수 모두 shared-constants에 정의 |
| CalibrationPlan status SSOT | ⚠ FAIL | `'pending_review'`, `'draft'` 문자열 리터럴 직접 사용 (A-1 참조) |

**섹션 A 판정: SHOULD-FIX** (A-1)

---

### B. 캐시 전략

| 항목 | 판정 | 상세 |
|---|---|---|
| 신규 백엔드 엔드포인트 캐시 적용 | ⚠ PARTIAL | `getSystemHealth`(✅), `getQualityReviewPending`(✅), `getMyQuickSummary`(✅), `getCheckoutsByScope`(❌ 미적용) |
| `CACHE_TTL.SHORT` 사용 일관성 | ✅ PASS | 적용된 3개 모두 CACHE_TTL.SHORT 사용 |
| 프론트엔드 queryKeys factory 패턴 | ✅ PASS | `systemHealth()`, `checkouts(scope, teamId)`, `qualityReviewPending()`, `myQuickSummary()` 모두 factory 함수 패턴 |
| 캐시 무효화 연동 | ✅ PASS | `cache-event.registry.ts`가 체크아웃/교정/장비 이벤트에 `invalidateAllDashboard()` 연결 완료. `dashboard:*` 패턴이 신규 캐시 키도 커버함 |
| inline array queryKey 금지 | ✅ PASS | 모든 4개 신규 쿼리가 `queryKeys.dashboard.*()` factory 사용 |

**섹션 B 판정: SHOULD-FIX** (B-1)

---

### C. 성능

| 항목 | 판정 | 상세 |
|---|---|---|
| `useQuery` enabled 역할 게이팅 | ✅ PASS | `systemHealth`(SYSTEM_ADMIN), `myCheckouts`(TEST_ENGINEER), `reviewPendingData`(QUALITY_MANAGER), `myQuickSummaryData`(TEST_ENGINEER) 모두 정확한 role guard |
| `dynamic()` + Skeleton CLS 방지 | ✅ PASS | Row3/Row4 모든 카드 dynamic import + 카드 구조와 동일한 Skeleton height/layout |
| ErrorBoundary per-card | ✅ PASS | 모든 신규 카드(`CheckoutCard`, `ReviewPendingHero`, `SystemHealthCard`, `MyQuickSummaryCard`) DashboardCardErrorBoundary 래핑 |
| `useMemo` 의존성 안정성 | ✅ PASS | `upcomingCalibrations`, `equipmentStatusStats`를 `useMemo`로 안정화. `?? []`/`?? {}` identity 문제 주석으로 명시됨 |
| `myQuickSummary` fallback useMemo | ✅ PASS | `[userRole, myQuickSummaryData, upcomingCalibrations, equipmentStatusStats, pendingCheckoutRequests]` 의존성 모두 안정 |

**섹션 C 판정: PASS**

---

### D. 보안

| 항목 | 판정 | 상세 |
|---|---|---|
| 서버사이드 userId 추출 | ✅ PASS | `getMyQuickSummary`는 `req.user.userId` 사용. `getCheckoutsByScope`도 `req.user.userId`. body.userId 신뢰 없음 |
| RoleGate UI-only 선언 | ✅ PASS | `RoleGate.tsx` JSDoc에 "API 권한 가드는 백엔드 RequirePermissions 데코레이터가 actualRole 기준으로 별도 처리" 명시 |
| `?simulateRole=` 백엔드 우회 불가 | ✅ PASS | `useEffectiveRole`은 클라이언트 UI 렌더 전용. 백엔드 JWT 토큰의 실제 role은 변경 불가. SYSTEM_ADMIN 아닌 사용자의 simulateRole 쿼리는 무시됨 |
| scope 권한 가드 완전성 | ✅ PASS | `scope='team'`: TECHNICAL_MANAGER/QUALITY_MANAGER/LAB_MANAGER/SYSTEM_ADMIN, `scope='lab'`: LAB_MANAGER/SYSTEM_ADMIN, `scope='all'`: SYSTEM_ADMIN. 계층적 체계 |
| `process.env` 클라이언트 사용 | ✅ PASS | `process.env.DASHBOARD_STORAGE_CAPACITY_BYTES`는 백엔드 서비스에서만 사용 (NestJS 서버 환경). 프론트엔드 클라이언트 컴포넌트에는 없음 |

**섹션 D 판정: PASS**

---

### E. 워크플로 일관성

| 항목 | 판정 | 상세 |
|---|---|---|
| `CheckoutCard` dual-mode `isControlled` 플래그 | ⚠ PARTIAL | 플래그 자체(`upcomingProp !== undefined && overdueProp !== undefined`)는 논리적으로 정확. 비제어 모드 daysUntilDue 부호 이중 역전 버그 있음 (E-1) |
| `EmptyState` 3 variant 소비자 일관성 | ✅ PASS | `neutral`(활동 없음), `success`(기한 초과 없음), `error`(ErrorBoundary fallback) 역할 분리 명확. `role="status"`/`role="alert"` ARIA 자동 결정 패턴 올바름 |
| Skeleton ↔ 실제 카드 구조 대응 | ✅ PASS | `CheckoutCardSkeleton`은 header + tabs + 5-row list로 실제 CheckoutCard와 동일 구조. `ReviewPendingHeroSkeleton`도 icon+info+cta+stats grid 대응 |
| `getCheckoutsByScope` scope별 테이블 join 일관성 | ✅ PASS | `scope='me'`: requesterId 필터, `scope='team'`: teamId 필터(equipment 테이블), `scope='lab'`: site 필터(equipment 테이블), `scope='all'`: 필터 없음. 컨트롤러↔서비스 일치 |
| audit_logs timestamp vs createdAt 필드 혼용 | ✅ PASS | `timestamp`(비즈니스 시각, activity 조회)와 `createdAt`(시스템 삽입 시각, 5분 활성 사용자/24h 에러)는 의도적 분리. 스키마에 두 필드 모두 존재 |

**섹션 E 판정: SHOULD-FIX** (E-1)

---

### F. 안티패턴

| 항목 | 판정 | 상세 |
|---|---|---|
| `setQueryData` 사용 | ✅ PASS | dashboard 컴포넌트 전체 미사용 확인 |
| `text-red-*` 등 Tailwind raw color 하드코딩 | ✅ PASS | 신규 cards/atoms 모두 `brand-*` semantic token 사용. `ReviewPendingHero`의 `bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300` (line 81)은 아이콘 배경 장식용으로 허용 가능 범위이나 brand token 추가 후 이전 권고 |
| 로컬 enum 재정의 | ✅ PASS | `UserRoleValues`, `UserRoleEnum` 모두 `@equipment-management/schemas`에서 import |
| 클라이언트 컴포넌트의 `process.env` | ✅ PASS | 프론트엔드 전체 미사용 |
| `eslint-disable` 정당성 | ✅ PASS | `use-online-status.ts:53` eslint-disable-next-line react-hooks/exhaustive-deps — useEffect 마운트 1회 실행 의도(이벤트 기반 상태 갱신), 주석으로 명시됨. 정당한 예외 |

**섹션 F 판정: PASS**

---

## Top 5 아키텍처 권고사항 (우선순위순)

### 1. [P1] CalibrationPlan status 하드코딩 제거
`dashboard.service.ts:824,847`의 `'pending_review'`, `'draft'` 문자열을 `CalibrationPlanStatusValues.PENDING_REVIEW`/`CalibrationPlanStatusValues.DRAFT`로 교체. 동일 서비스의 다른 모든 enum 값(`CheckoutStatusEnum.enum.checked_out`, `ESVal.NON_CONFORMING`)이 SSOT를 따르는데 CalibrationPlan만 예외 상태임. 1줄 import 추가 + 2개 리터럴 교체로 해결.

### 2. [P1] `getCheckoutsByScope` 캐시 추가
매 호출마다 DB 3-way 쿼리 실행. 다른 신규 메서드와 동일하게 `cacheService.getOrSet(cacheKey, ..., CACHE_TTL.SHORT)` 패턴 적용. cache key: `dashboard:checkoutsByScope:{scope}:{userId_if_me}:{teamId}:{site}`. `invalidateAllDashboard()` 패턴이 자동 커버.

### 3. [P2] `CheckoutCard` 비제어 모드 daysUntilDue 부호 일치
현재는 대시보드에서만 사용되어 제어 모드로 동작하므로 즉각 버그 없음. 그러나 컴포넌트 재사용 시 잠재적 silent bug. 비제어 모드 매핑의 `-item.daysUntilDue` 또는 DDayTag 전달 `{-item.daysUntilReturn}`을 한쪽으로 통일하고 주석의 부호 설명 교정.

### 4. [P2] `quality-review-pending` 권한 데코레이터 교정
`@RequirePermissions(Permission.VIEW_EQUIPMENT)` → `@RequirePermissions(Permission.VIEW_CALIBRATIONS)`. 동작 변경 없지만 RBAC 감사 추적 정확성 향상.

### 5. [P3] `ReviewPendingHero` 아이콘 색상 brand token 이전
`bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300` 하드코딩. `brand-purple` 시맨틱 토큰이 없다면 추가하거나, `DDAY_TONE_CLASSES.soon`(파랑) 또는 신규 `purple` 카테고리로 design-token 확장 권고.

---

## 아키텍처 강점 (양호 사항)

1. **3-Layer 임계값 SSOT 완성도**: `dashboard-thresholds.ts` → `dday-tone.ts` → 컴포넌트의 전파 체계가 일관. 백엔드 `SYSTEM_HEALTH_OVERALL_THRESHOLDS` 동일 값 import로 frontend/backend 계산 일치 보장.

2. **캐시 무효화 이벤트 연동**: `cache-event.registry.ts`의 체크아웃/교정/장비 이벤트가 모두 `invalidateAllDashboard()`로 연결. 신규 캐시 키가 `dashboard:*` 패턴 내에 위치하므로 자동 무효화 적용.

3. **역할 격리 useQuery enabled gating**: 5개 신규 useQuery 중 4개가 역할 기반 `enabled` 조건을 가져 필요 없는 역할에서 불필요한 API 호출 0건.

4. **DashboardCardErrorBoundary 일관 적용**: Row3/Row4 모든 카드가 독립적 ErrorBoundary로 감싸져 단일 카드 렌더 실패가 전체 페이지를 무너뜨리지 않음.

5. **RoleGate/SimulationBanner 보안 분리**: `useEffectiveRole`이 SYSTEM_ADMIN만 시뮬 가능하도록 guard하고, JSDoc에 "UI-only" 명시. 백엔드는 항상 JWT actualRole 기준 판정.

---

*리뷰어: review-architecture skill (claude-sonnet-4-6)*  
*검토 파일 수: 35개 (신규 20 + 수정 15)*
