# 본 세션 아키텍처 리뷰 보고서

**리뷰 기준 커밋**: `d6dc8df6` → HEAD (27 commits)  
**리뷰 일시**: 2026-04-28  
**커버리지**: AP-01~07, F1~F3 전 영역

---

## 요약 판정표

| 영역 | 상태 | 발견 사항 |
|---|---|---|
| A. Cross-layer SSOT 코히어런스 | ⚠ | DashboardScope 타입 이름 충돌, `DashboardCheckoutScope` deprecated alias 잔존 |
| B. 캐시 전략 | ⚠ | systemHealth: backend TTL 30s vs frontend 5min polling — 최대 4.5분 stale 가능 |
| C. 성능 | ✅ | bundle max 137kB / 250kB 임계값 이내. dead code -698줄 제거 완료 |
| D. 보안 | ✅ | scope 권한 가드 정확, server-side userId 추출 준수, `ring-[#0078D4]` 1건 한정 |
| E. 워크플로 일관성 | ✅ | stepper descriptor:undefined fallback 안정, dead import 0건 |
| F. 안티패턴 | ⚠ | `DDAY_TONE_RULE` 예외 파일 누락 가능성, AzureAdButton hex ring 1건 |

---

## 발견된 이슈 (심각도순)

### [Warning] systemHealth 캐시 TTL vs 폴링 주기 불일치

- **파일**: `apps/backend/src/modules/dashboard/dashboard.service.ts:744`, `apps/frontend/components/dashboard/DashboardClient.tsx:169`
- **문제**: backend `getSystemHealth()`는 `CACHE_TTL.SHORT (30s)` 캐시를 사용하고 frontend는 `QUERY_CONFIG.MONITORING (refetchInterval=5min)`으로 폴링한다. 최초 응답이 backend 캐시에 저장된 직후 frontend가 5분 후 재요청해도 backend는 최대 30s이내 만료된 캐시를 반환한다. 결과적으로 실제 데이터 신선도는 5분이 아닌 최대 5분 30초가 될 수 있어 큰 문제는 아니지만, `storagePct`나 `activeUsers` 같은 실시간성이 중요한 지표를 5분 주기로 얻겠다는 의도 대비 backend 캐시 TTL(30s)이 매우 짧아 매 5분 폴링마다 사실상 uncached DB hit를 유발한다.
- **영향**: `pg_database_size()` + audit log COUNT 쿼리가 5분마다 1회 실행 (SYSTEM_ADMIN 전용이라 볼륨은 낮음). 부하 영향 최소화를 위해 backend TTL을 폴링 주기에 맞추는 것이 이상적.
- **수정안**: backend `getSystemHealth()` TTL을 `CACHE_TTL.SHORT → CACHE_TTL.MEDIUM(5m)`으로 변경하거나, 또는 현재 30s TTL을 유지하고 이를 의도적인 "30초 단위 fresh"로 문서화.
- **참고 패턴**: `getCheckoutsByScope` MONITORING 설계와 동일한 TTL 결정 패턴.

---

### [Warning] `DashboardScope` 타입명 충돌 — 동명 타입 2개 공존

- **파일**: `packages/shared-constants/src/dashboard-scope.ts:18`, `apps/frontend/lib/utils/dashboard-scope.ts:29`
- **문제**: `shared-constants`의 `DashboardScope`는 `'me' | 'team' | 'lab' | 'all'` union (API scope enum)이고, frontend `dashboard-scope.ts`의 `DashboardScope`는 `{ teamId?: string; site?: string; ... }` 객체 타입 (UI scope 컨텍스트)이다. 두 타입이 동일한 이름 `DashboardScope`를 사용하므로 미래 파일에서 잘못된 쪽을 import할 수 있는 조용한 버그 위험이 있다.
- **영향**: `query-config.ts`가 `type DashboardScope` from `shared-constants`를 올바르게 import하고, `DashboardClient.tsx`는 `dashboard-scope.ts`의 객체 타입을 올바르게 사용하지만, 두 타입이 같은 이름이므로 IDE 자동완성이나 글로벌 검색에서 혼동 가능.
- **수정안**: frontend util의 타입명을 `DashboardScopeContext` 또는 `DashboardScopeParams`로 변경하여 `shared-constants` enum alias와 구분. (breaking change 방지를 위해 구타입 deprecated alias 가능)
- **현재 영향도**: 컴파일 에러는 없음. 잠재적 혼동 위험.

---

### [Warning] `AzureAdButton` focus ring에 raw hex 잔존

- **파일**: `apps/frontend/components/auth/AzureAdButton.tsx:44`
- **문제**: `ring-[#0078D4]/50` hardcoded hex가 className에 사용됨. `AUTH_LAYOUT_TOKENS.microsoft.bg` (`#0078D4`)가 이미 design token으로 정의되어 있으나 focus ring에는 동일 색상이 raw hex로 사용됨.
- **영향**: `no-restricted-syntax HEX_COLOR_RULE`이 `components/auth/` 파일에 적용된다. ESLint에서 에러가 발생할 수 있으나, 현재 `**/lib/brand-assets/**` 블록만 exempt이고 `**/components/auth/**`는 exempt 아님. 실제로 lint 통과 여부 불확실.
- **수정안**: `ring-[#0078D4]/50` → `ring-[var(--color-ms-blue)]/50` 또는 design token CSS variable 기반 클래스로 대체, 또는 `AUTH_LAYOUT_TOKENS`에 `focusRing` 토큰 추가.

---

### [Warning] `DDAY_TONE_RULE` 적용 범위 vs `dday-tone.ts` 예외 누락

- **파일**: `apps/frontend/eslint.config.mjs:39-44`, `apps/frontend/lib/design-tokens/components/dday-tone.ts`
- **문제**: `DDAY_TONE_RULE` 주석에 "허용 예외: design-tokens/components/dday-tone.ts (정의 자체)"라고 명시되어 있으나, 실제 ESLint ignore 블록의 `files` 패턴에 `dday-tone.ts`가 포함되어 있다 (`**/lib/design-tokens/**/*.{ts,tsx}`). 현재는 동작하지만, `dday-tone.ts`의 실제 값들 (`'overdue'`, `'urgent'`, `'soon'`, `'normal'`)은 선택자 `Literal[value=/(text|bg|border|ring)-(overdue|urgent|soon|normal)\b/]`에 매칭되지 않는다 — 이 파일의 값은 CSS 클래스가 아니라 타입 문자열이기 때문이다. 따라서 실제 규칙 위반은 없지만 주석 설명이 부정확하게 독자를 혼동시킨다.
- **영향**: 기능적 문제 없음. 문서 혼동.
- **수정안**: 주석을 "dday-tone.ts의 `DDAY_TONE_CLASSES`처럼 CSS 클래스 리터럴이 포함된 design-tokens 파일 전체가 `**/lib/design-tokens/**` glob으로 exempt"로 정확하게 업데이트.

---

### [Info] `DashboardCheckoutScope` deprecated alias — 소비처 확인 권장

- **파일**: `apps/frontend/lib/api/dashboard-api.ts:147-148`
- **문제**: `/** @deprecated */ export type DashboardCheckoutScope = DashboardScope;` 별칭이 잔존. 세션 내 cleanup이 예고된 항목이나 실제 소비처 제거 여부 미검증.
- **수정안**: 다음 세션에서 `DashboardCheckoutScope` 참조처 grep 후 잔존 0건이면 삭제.

---

### [Info] `getCheckoutsByScope` scope='all' — teamId/site 모두 undefined 경로

- **파일**: `apps/backend/src/modules/dashboard/dashboard.controller.ts:384-389`
- **문제**: `scope='all'` 시 controller는 `teamId: undefined, site: undefined`를 service에 전달한다. service의 `getCheckoutsByScope`에서 `scope='all'`이지만 teamId/site 필터가 없어 DB에서 전사 데이터를 조회한다. 이는 의도된 동작이지만, cache key가 단순히 `'all'`로 고정되어 있어 추후 SYSTEM_ADMIN 간 사이트 필터 드릴다운을 추가하면 캐시 오염 가능.
- **현재 영향**: 없음 (SYSTEM_ADMIN만 접근 가능, 단일 전사 조회 의도적).

---

## Top N 권고사항

1. **[P1] systemHealth backend TTL 결정**: `CACHE_TTL.SHORT(30s)` vs `CACHE_TTL.MEDIUM(5min)` 중 polling intent와 일치하도록 명시적으로 선택. 현재 매 폴링 5분마다 pg_database_size() 실행됨.

2. **[P2] `DashboardScope` 타입 이름 충돌 해소**: `lib/utils/dashboard-scope.ts`의 인터페이스를 `DashboardScopeContext`로 rename. shared-constants enum과 동명 충돌은 미래 개발자 혼동의 조용한 위험.

3. **[P3] `AzureAdButton` hex focus ring 토큰화**: `AUTH_LAYOUT_TOKENS`에 `focusRing: 'ring-[#0078D4]/50'` 토큰 추가 또는 CSS 변수로 대체. ESLint 규칙과 일관성 유지.

4. **[P4] `DashboardCheckoutScope` deprecated alias 제거**: 세션 후 참조처 0건 확인 후 삭제.

---

## 아키텍처 강점

**1. DASHBOARD_SCOPES SSOT 완성도**  
BE controller → Zod ValidationPipe(targets:['query']) → service 메서드 시그니처 → FE dashboard-api → queryKeys 전 계층이 `@equipment-management/shared-constants`의 단일 `DASHBOARD_SCOPES` const를 경유. 하드코딩 `'me' | 'team' | 'lab' | 'all'` 인라인 union 0건.

**2. 4-tier D-day SSOT 마이그레이션 완전성**  
`getCheckoutDdayTier()` 함수가 `packages/shared-constants/src/checkout-thresholds.ts`에 단일 정의되고, frontend `dday-colors.ts`에서 직접 위임 (`return getCheckoutDdayTier(daysRemaining)`) — 로직 중복 0. 6-tier 잔존 0건 확인.

**3. 스코프별 권한 가드 설계**  
`getCheckoutsByScope` 컨트롤러: scope → 역할 체크 순서가 메모리 룰의 "scope → FSM → domain" 패턴 준수. `scope='team'` 가드에 QUALITY_MANAGER도 포함 (비즈니스 규칙 정확성 확인).

**4. F2 Dead Code 제거 품질**  
`CheckoutStatusStepper.tsx` + `WorkflowTimeline.tsx` (-698 lines) 삭제 후 dead import 잔존 0건. `ConditionCheckClient` + `ReturnCheckoutClient` 모두 `useCheckoutProgressSteps` + `CheckoutProgressStepper` 완전 마이그레이션.

**5. ZodValidationPipe targets:['query'] 메모리 룰 준수**  
`DashboardScopeValidationPipe = new ZodValidationPipe(dashboardScopeSchema, { targets: ['query'] })` — body 기본값으로 query param 오검증하는 버그 방지 패턴 정확 적용.

**6. ConfigService 경유 환경변수 (`DASHBOARD_STORAGE_CAPACITY_BYTES`)**  
process.env 직접 접근 대신 ConfigService + Zod coerce.number().positive().default() 체계로 env validation 통합. 테스트 가능성 보장.

**7. ESLint globstar 패턴 수정**  
`lib/design-tokens/**` → `**/lib/design-tokens/**`: lint-staged가 monorepo root cwd에서 실행될 때 상대 경로 매칭 실패를 근본 수정. 5개 file-level eslint-disable 완전 제거.

**8. self-inspections role 리터럴 → SSOT**  
`r === 'system_admin'` → `r === UserRoleValues.SYSTEM_ADMIN` 수술적 fix. 범위 밖 코드 불변.

---

## 최종 판정: PASS

핵심 SSOT 아키텍처 (DASHBOARD_SCOPES, 4-tier dday, ConfigService)가 BE/FE 전 계층에 일관 적용되었고, 보안 레이어(scope 권한 가드, server-side userId), 캐시 설계(userId 기반 me scope 격리), dead code 제거가 완료되었다.

발견된 Warning 3건 (systemHealth TTL, DashboardScope 타입명 충돌, AzureAdButton hex)은 프로덕션 버그가 아니며 다음 세션에서 순차 처리 가능한 수준이다.
