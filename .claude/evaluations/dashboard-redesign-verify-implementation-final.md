# 대시보드 리디자인 통합 검증 보고서

**일시**: 2026-04-28  
**범위**: 이번 세션 신규/수정 파일 (dashboard redesign)  
**검증 스킬**: verify-ssot, -hardcoding, -design-tokens, -i18n, -frontend-state, -nextjs, -cas, -auth, -zod, -cache-events, -security, -sql-safety, -implementation

---

## 총괄 요약

| 심각도 | 건수 |
|--------|------|
| P0 (즉시 수정 필요 — 기능 버그 / 보안) | 1 |
| P1 (아키텍처 SSOT 위반 / 의미론 오류) | 4 |
| P2 (권고 — 토큰 일관성 / 매직넘버) | 5 |
| PASS | 9개 스킬 |

---

## 스킬별 결과

### 1. verify-ssot — **PASS** (경미한 경고 1건)

- **PASS**: 모든 enum(`UserRole`, `EquipmentStatus`, `CheckoutStatus`)이 `@equipment-management/schemas`에서 import.
- **PASS**: `Permission`, `API_ENDPOINTS`, `FRONTEND_ROUTES`가 `@equipment-management/shared-constants`에서 import.
- **PASS**: `DDAY_THRESHOLDS`, `UTILIZATION_GAUGE_THRESHOLDS`, `DISTRIBUTION_BAR_THRESHOLDS`, `SYSTEM_HEALTH_THRESHOLDS`, `REVIEW_PROCESSING_RATE_THRESHOLDS`가 `packages/shared-constants/src/dashboard-thresholds.ts` SSOT에서 import.
- **PASS**: `dday-tone.ts`가 직접 임계값을 정의하지 않고 shared-constants를 경유.
- **PASS**: `UserRoleEnum.safeParse()` 사용 (use-effective-role.ts) — 스키마 SSOT 준수.
- ⚠️ **INFO**: `RoleGate.tsx`가 `useEffectiveRole().effectiveRole`과 roles 배열을 직접 비교하는 패턴. `hasRole()` 금지 규칙 위반은 아니고 UI-only 게이트이므로 허용.

---

### 2. verify-hardcoding — **FAIL (P1 × 2, P2 × 2)**

#### P1-H1: `getMyQuickSummary` 30일 하드코딩
- **파일**: `apps/backend/src/modules/dashboard/dashboard.service.ts:915-916`
- **내용**: `future30.setDate(today.getDate() + 30)` — 동일 파일의 다른 메서드(`getCheckoutsByScope` line 632, `getUpcomingCalibrations` line 357)는 `CALIBRATION_THRESHOLDS.WARNING_DAYS`를 사용.
- **권장 fix**: `today.getDate() + CALIBRATION_THRESHOLDS.WARNING_DAYS`로 교체.

#### P1-H2: `getQualityReviewPending` + `getRecentActivities` 7일 하드코딩
- **파일**: `apps/backend/src/modules/dashboard/dashboard.service.ts:815`, `:444`
- **내용**: `weekStart.setDate(now.getDate() - 7)`, `sevenDaysAgo.setDate(...getDate() - 7)` — 7일 윈도우 상수가 shared-constants에 없음.
- **권장 fix**: `packages/shared-constants/src/dashboard-thresholds.ts`에 `QUALITY_REVIEW_PROCESSING_WINDOW_DAYS = 7` 추가, 두 곳에서 참조.

#### P2-H3: `CalibrationDdayList` minH 매직넘버
- **파일**: `apps/frontend/components/dashboard/CalibrationDdayList.tsx:63`
- **내용**: `const minH = 280;` — 디자인 토큰 시스템 외부 인라인 픽셀값.
- **권장 fix**: `DASHBOARD_DDAY_COMPACT_TOKENS`에 `minH: 280` 추가하거나 CSS 변수화.

#### P2-H4: `CalibrationDdayList` > 8 뷰올 임계값
- **파일**: `apps/frontend/components/dashboard/CalibrationDdayList.tsx:177`
- **내용**: `(overdueCount > 8 || upcomingCount > 8)` — `DISPLAY_LIMITS.calibrationDday`(= 8)와 동일값이지만 SSOT 참조 아님.
- **권장 fix**: `DISPLAY_LIMITS.calibrationDday`로 교체.

---

### 3. verify-design-tokens — **FAIL (P1 × 1, P2 × 1)**

#### P1-DT1: `PriorityRow.tsx` / `ReviewPendingHero.tsx` raw `purple-*` 클래스
- **파일**: `apps/frontend/components/dashboard/atoms/PriorityRow.tsx:29, 81`, `apps/frontend/components/dashboard/cards/ReviewPendingHero.tsx:81`
- **내용**:
  ```
  purple: 'text-purple-600 dark:text-purple-400'  // PriorityRow.tsx:29
  bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300  // ReviewPendingHero.tsx:81
  ```
  - `brand-purple`이 CSS 변수(`--color-brand-purple`)와 `brand.ts` 토큰으로 정의되어 있음에도 raw Tailwind `purple-*` 사용.
  - `dark:bg-brand-*` 금지 규칙은 피했으나, raw `dark:bg-purple-*`도 CSS 변수 자동전환 체계 외부.
- **권장 fix**: `text-purple-600 dark:text-purple-400` → `text-brand-purple`, `bg-purple-100 dark:bg-purple-950/40` → `bg-brand-purple/10`.

#### P2-DT2: transition 완전성
- **파일**: 신규 atom/card 컴포넌트 전체
- **PASS**: `transition-all` 미사용. `motion-safe:transition-colors` 패턴 올바르게 적용됨.
- **PASS**: `focus-visible:` 사용 (`SimulationBanner.tsx:37`).
- **INFO**: `focus-visible:` 없는 인터랙티브 요소 일부 (Link들). 필수 여부는 tabindex 정책에 따름.

---

### 4. verify-i18n — **FAIL (P0 × 1)**

#### P0-I18N1: `CheckoutCard.tsx` — "upcoming" 탭 빈 상태에 잘못된 i18n 키 사용
- **파일**: `apps/frontend/components/dashboard/cards/CheckoutCard.tsx:204-208`
- **내용**:
  ```tsx
  // activeTab === 'upcoming' 블록 (반납 예정 없음을 보여야 하는 탭)
  <EmptyState
    variant="success"
    title={t('overdueEmptyTitle')}  // ← "기한 초과 없음" / "No overdue checkouts"
    role="status"
  />
  ```
  `overdueEmptyTitle` = `"기한 초과 없음"` (KO) / `"No overdue checkouts"` (EN).  
  **upcoming 탭(반납 예정)에서 "기한 초과 없음" 메시지가 표시됨** — 의미론적으로 잘못된 텍스트.
- **권장 fix**:
  1. `dashboard.json` ko/en에 `upcomingEmptyTitle` 키 추가 ("반납 예정 없음" / "No upcoming returns").
  2. `CheckoutCard.tsx:206`을 `t('upcomingEmptyTitle')`로 교체.

#### P2-I18N2: `en.dashboard.welcome.suffix` 빈 문자열
- **파일**: `apps/frontend/messages/en/dashboard.json` (welcome.suffix)
- **내용**: 영문 번역 값이 `""` (빈 문자열). KO에는 정의됨.
- **권장 fix**: 영문 번역 작성 또는 의도적 공백이면 주석 처리.

#### PASS:
- ko/en 키 쌍 완전 일치 (365개 = 365개).
- 신규 네임스페이스 8개(`ddayTag`, `priorityRow`, `checkoutCard`, `reviewPendingHero`, `myQuickSummary`, `offline`, `simulation`, `cardError`) ko/en 양쪽 존재.
- JSX text node 한글 하드코딩 없음 — 모두 `t()` 경유.

---

### 5. verify-frontend-state — **PASS**

- **PASS**: `useState`가 서버 상태(API 데이터 배열/객체)를 직접 관리하는 패턴 없음.
- **PASS**: `setQueryData` 호출 없음.
- **PASS**: 모든 API 데이터는 `useQuery` + `queryKeys.dashboard.*` 팩토리 사용.
- **PASS**: `CheckoutCard.tsx`의 `useState<'upcoming' | 'overdue'>` — 서버 데이터가 아닌 UI 탭 상태 (허용).
- **PASS**: `QUERY_CONFIG.DASHBOARD` 프리셋 사용 (staleTime/gcTime 인라인 없음).
- **PASS**: `DashboardRow3.tsx`, `DashboardRow4.tsx`에서 `next/dynamic` + skeleton 코드 스플리팅 적용.

---

### 6. verify-nextjs — **PASS (N/A mostly)**

- **N/A**: 이번 세션은 page.tsx/layout.tsx 미수정. 신규 컴포넌트는 모두 클라이언트 컴포넌트 (`'use client'`).
- **PASS**: `useActionState` 미사용 (form submission 없는 대시보드 카드들).
- **PASS**: `proxy.ts` 미수정 — 검증 범위 외.
- **INFO**: `DashboardClient.tsx`가 `useSearchParams()`를 사용 — `Suspense` 경계 내 사용이 보장되어야 하나, 기존 패턴과 일관성 있음.

---

### 7. verify-cas — **N/A**

- 이번 세션 변경 파일에서 CAS/optimistic locking 패턴 없음. 대시보드는 read-only 뷰. 스킵.

---

### 8. verify-auth — **PASS**

- **PASS**: 모든 새 엔드포인트(`checkouts`, `system-health`, `quality-review-pending`, `me/quick-summary`)에 `@Req() req: AuthenticatedRequest` + `req.user.userId`/`req.user.roles?.[0]` 서버사이드 추출.
- **PASS**: body에서 userId 수신 없음.
- **PASS**: 모든 엔드포인트에 `@RequirePermissions(Permission.VIEW_*)` 적용.
- **PASS**: scope별 권한 가드 — `team`/`lab`/`all` scope는 역할 계층에 맞게 `ForbiddenException` 발생.
- **INFO**: `@AuditLog` 데코레이터 없음 — dashboard는 read-only이므로 감사 로그 불필요(허용).

---

### 9. verify-zod — **PASS (주의 1건)**

- **PASS**: `dashboard-response.dto.ts`가 class-validator 데코레이터(`@IsString` 등) 미사용.
- **PASS**: 응답 DTO는 `@ApiProperty` + class only — ZodValidationPipe 불필요.
- **INFO**: 새 query 파라미터 `scope`(문자열 enum)에 ZodValidationPipe 없음. 그러나 컨트롤러에서 `if (scope === 'team')` 등 명시적 분기 처리하므로 기능적 위험은 낮음. 강타입화 권고(P2).

---

### 10. verify-cache-events — **PASS**

- **PASS**: `dashboard.service.ts` 신규 메서드들이 `emitAsync` 미사용 (read-only).
- **PASS**: `getSystemHealth`, `getQualityReviewPending`, `getMyQuickSummary`는 `cacheService.getOrSet()` 패턴으로 캐시 TTL 관리.
- **PASS**: `CACHE_KEY_PREFIXES.DASHBOARD` SSOT 사용 (인라인 문자열 prefix 없음).
- **INFO**: `CACHE_TTL.SHORT` 상수 사용 — shared-constants SSOT 준수.

---

### 11. verify-security — **PASS**

- **PASS**: `@Public()` 남용 없음 — 모든 dashboard 엔드포인트는 인증 필요.
- **PASS**: `XSS` 위험 없음 — `dangerouslySetInnerHTML`/`innerHTML` 미사용.
- **PASS**: Drizzle ORM 파라미터화 쿼리 사용 — SQL Injection 없음.
- **INFO**: `getSystemHealth()`의 `process.env.DASHBOARD_STORAGE_CAPACITY_BYTES` — 직접 env 접근이지만 백엔드 서비스에서는 ConfigService 패턴이 강제되지 않으므로 P2 수준.

---

### 12. verify-sql-safety — **PASS**

- **PASS**: `LIKE`/`ILIKE` 검색 없음 — 대시보드는 집계 쿼리만 사용.
- **PASS**: N+1 없음 — 개별 쿼리 3개 병렬/순차 실행 (COUNT + 목록 + scope 조건부).
- **PASS**: `DASHBOARD_ITEM_LIMIT` SSOT 사용 (`.limit(DASHBOARD_ITEM_LIMIT)`).
- **PASS**: `CheckoutStatusEnum.enum.*` — schemas SSOT enum 비교.
- **INFO**: `getMyQuickSummary` 내 `future30.setDate(today.getDate() + 30)` — P1-H1에서 기록.

---

### 13. verify-implementation — 종합

위 12개 스킬 결과를 통합함. 아래 Quick Wins와 Architectural Concerns 참조.

---

## 위반 심각도별 요약

### P0 — 즉시 수정 (기능 버그)

| ID | 위치 | 내용 |
|----|------|------|
| P0-I18N1 | `CheckoutCard.tsx:206` | "upcoming" 탭 빈 상태에 `overdueEmptyTitle` 키 사용 → 사용자에게 "기한 초과 없음" 잘못 표시 |

### P1 — 고우선 수정 (SSOT 위반 / 의미론 오류)

| ID | 위치 | 내용 |
|----|------|------|
| P1-H1 | `dashboard.service.ts:915` | `getMyQuickSummary` 30일 하드코딩 — `CALIBRATION_THRESHOLDS.WARNING_DAYS` SSOT 미사용 |
| P1-H2 | `dashboard.service.ts:815, 444` | 7일 윈도우 하드코딩 — shared-constants에 상수 미존재 |
| P1-DT1 | `PriorityRow.tsx:29,81`, `ReviewPendingHero.tsx:81` | raw `purple-*` 클래스 — `brand-purple` 토큰 우회 + `dark:` prefix 사용 |
| P1-H3 | `CalibrationDdayList.tsx:177` | `> 8` 매직넘버 — `DISPLAY_LIMITS.calibrationDday` SSOT 미사용 |

### P2 — 권고 사항

| ID | 위치 | 내용 |
|----|------|------|
| P2-H3 | `CalibrationDdayList.tsx:63` | `minH = 280` 인라인 픽셀값 — 디자인 토큰화 권고 |
| P2-I18N2 | `en/dashboard.json` | `welcome.suffix` 빈 문자열 |
| P2-Z1 | `dashboard.controller.ts` scope param | `scope` 쿼리 파라미터 Zod enum 검증 미적용 |
| P2-SEC1 | `dashboard.service.ts:752` | `process.env.DASHBOARD_STORAGE_CAPACITY_BYTES` 직접 접근 (ConfigService 패턴 권고) |
| P2-PAC | `PendingApprovalCard.tsx:263` | `HEAVY_MIN_COUNT = 5` 로컬 상수 — §A.8.1 참조 있으나 shared-constants 미등록 |

---

## Quick Wins (수술적 1-2줄 fix 가능)

1. **P0**: `CheckoutCard.tsx:206` → `t('overdueEmptyTitle')` → `t('upcomingEmptyTitle')` + i18n 키 추가
2. **P1-H1**: `dashboard.service.ts:916` → `+ 30` → `+ CALIBRATION_THRESHOLDS.WARNING_DAYS`
3. **P1-H3**: `CalibrationDdayList.tsx:177` → `> 8` → `> DISPLAY_LIMITS.calibrationDday`
4. **P2-I18N2**: `en/dashboard.json` `welcome.suffix` 번역 채우기

## Architectural Concerns (설계 변경 필요)

1. **P1-DT1**: `brand-purple` 토큰 정의 확장 — `ReviewPendingHero`의 icon 배경을 brand token으로 표현. 현재 `brand.ts`에 `bg-brand-purple/10`이 있으나 `ReviewPendingHero`가 이를 사용하지 않음.
2. **P1-H2**: `packages/shared-constants/src/dashboard-thresholds.ts`에 `QUALITY_REVIEW_PROCESSING_WINDOW_DAYS = 7` 추가 후 서비스 2곳 참조.
3. **P2-Z1**: `dashboard.controller.ts`의 `scope` 파라미터에 Zod `z.enum(['me', 'team', 'lab', 'all'])` 검증 파이프 추가.

---

## PASS 확인 항목 (이상 없음)

- ko/en i18n 키 쌍 완전 일치 (365/365)
- 신규 네임스페이스 8개 양측 존재
- design-token `transition-all` 미사용
- `focus-visible:` 패턴 적용
- `DDAY_THRESHOLDS` SSOT 전파 체계 (shared-constants → dday-tone.ts → DDayTag.tsx)
- `queryKeys.dashboard.*` 팩토리 모든 신규 API 커버리지
- `QUERY_CONFIG.DASHBOARD` 프리셋 사용
- `req.user.userId` 서버사이드 추출
- `@RequirePermissions` 모든 엔드포인트 적용
- scope 계층 권한 가드 (`ForbiddenException`)
- `DASHBOARD_ITEM_LIMIT`, `CALIBRATION_THRESHOLDS.WARNING_DAYS` SSOT 사용 (기존 메서드)
- `DashboardCardErrorBoundary` 카드 단위 에러 격리
- `useOnlineStatus`, `useEffectiveRole` hooks SSOT import 준수
- `dynamic()` + skeleton 코드 스플리팅 (`DashboardRow3.tsx`, `DashboardRow4.tsx`)
- SQL injection 위험 없음 (Drizzle ORM 파라미터화)
- XSS 위험 없음
