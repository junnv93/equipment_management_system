# Tech Debt Tracker

## 형식
- [ ] {이슈} — {파일:라인} — {등록일}

---

## 미완료 항목

- [ ] Frontend/Backend Dockerfile hardening 검증 — 해결 in progress: 2026-04-08 — deps 통합/USER node/HEALTHCHECK/lockfile-only 레이어/tini ENTRYPOINT 적용 완료 (`apps/backend/docker/Dockerfile`, `apps/frontend/Dockerfile`). Dev 환경에서 `docker compose build` 미실행 (테스트 회귀 0). 다음 빌드 시 캐시 hit 율 확인 + standalone server.js 경로 검증 필요 — 2026-04-08

- [x] reports filter ALL 센티널 통일 — 해결: 2026-04-08 — `ALL_SENTINEL = '_all'` 상수를 `reports-filter-utils.ts` 에서 export 하고 `ReportsContent.tsx` 가 import 하여 단일 SSOT 통일. UI Select sentinel 과 URL strip 로직이 동일 상수 참조
- [x] reports `customDateRange` KST 하루 밀림 — 해결: 2026-04-08 — `new Date('yyyy-MM-dd')` (UTC) → `parseISO()` (로컬 자정) 전환. DatePicker 표시 정합성 확보
- [x] `audit.ts` audit action label record `access_denied` 키 누락 — 해결: 2026-04-08 — `AUDIT_ACTION_BADGE_TOKENS` + `AUDIT_TIMELINE_DOT_COLORS` 둘 다에 critical/red 색상으로 추가. tsc 차단 해소
- [x] reports-filter-utils 단위 테스트 추가 — 해결: 2026-04-08 — 19 케이스 (default / 필드 파싱 / 폴백 / ALL_SENTINEL strip / Record 입력 / round-trip / countActiveReportsFilters) 추가, `apps/frontend/lib/utils/__tests__/reports-filter-utils.test.ts`
- [x] 0006 마이그레이션 USING 캐스트 운영 사전 검증 가드 — 해결: 2026-04-08 — hotfix 0008 forward-only 가 cast 후 컬럼을 보호하지 못함을 발견 → `drizzle/manual/20260408_pre_0006_uuid_cast_guard.sql` 사전 가드 + `DRIZZLE_MIGRATIONS.md §6` 운영 절차/체크리스트/CI 가드 스니펫 신설. 정규식 기반 비-UUID 값 NULL backfill, 멱등, RAISE NOTICE 감사 추적
- [x] `SiteScopeInterceptor` 의 `bypassRoles` 레거시 모드가 `request.dataScope`/`request.enforcedScope` attach 를 하지 않음 — 해결: 2026-04-08 — `fix/site-scope-legacy-attach`. 레거시 두 분기(bypass match / 일반 site 강제) 모두 policy 모드와 동일한 shape 으로 `dataScope` + `enforcedScope` attach. bypass → `{type:'all'}`, 일반 → `{type:'site', site:user.site}`. decorator JSDoc "두 모드 모두 항상 attach" 계약 준수, `@CurrentScope()` 소비자가 모드 무관하게 안전. 기존 spec 2건에 attach 검증 추가, 528 tests PASS
- [ ] `failLoud` 전면 전환 roadmap — 현재 35개 기존 `@SiteScoped` 사용처가 silent override(cross-site 시도를 거부 대신 user.site 로 재작성)이라 IDOR probing 탐지 불가. 도메인별로 frontend 가 명시적 site/teamId 를 보내는지 확인하며 점진 전환 (OWASP IDOR fail-loud 원칙) — 2026-04-08 (review-architecture finding)
- [ ] `audit_logs.entityId` UUID NOT NULL 제약 완화 검토 — 현재 `audit.interceptor.logAccessDeniedAsync` 가 non-UUID param(form export `formNumber` 등) 경로를 `logger.warn` fallback 처리 → forensic 데이터가 구조화 audit_logs 가 아닌 로그 파일로만 남아 SQL 분석 불가. nullable 또는 sentinel UUID + path-based extraction 도입 검토 — `apps/backend/src/common/interceptors/audit.interceptor.ts:155-163` — 2026-04-08 (review-architecture finding)
- [~] CAS 충돌 캐시 무효화 훅 점진적 채택 — 부분 해결: 2026-04-08 (commits f8ad419b + `refactor/cas-hook-remaining`). 11개 후보 중 8개 마이그레이션 완료(cables/test-software/calibration-factors/calibration/intermediate-inspections/software-validations + equipment + checkouts), 26+ try/catch boilerplate 제거. equipment 는 compound key (`{uuid}` + `{uuid, includeTeam: true}`) 두 키 모두 invalidate, checkouts 는 단순 detail key. 남은 3개는 아키텍처 제약으로 적용 불가/보류: (1) self-inspections — try/catch 부재 + 캐시 인프라 부재 (NEW behavior 의사결정); (2) calibration-plans — `casVersion` 별도 컬럼 사용으로 `updateWithVersion` 적용 불가 (custom CAS 이미 hook 패턴 유사); (3) disposal — disposalRequests + equipment 멀티-테이블 동시 update 로 `updateWithVersion` 단일 테이블 제약 위반. 셋 다 베이스 클래스 확장 없이는 통합 불가 → 별도 roadmap — 2026-04-08
- [ ] Export UI 다운로드 동선 미검증 양식 — wf-19b/20b/21 spec이 모두 `page.request.get` API-only. 사용자 클릭 → `waitForEvent('download')` → 한국어 filename UTF-8 → 다운로드 토스트/에러 피드백 spec 부재. UL-QP-18-04/06/07/09/11 등 미작성 양식 추가 시 동일 함정 위험. verify-e2e Step 5b 가드 등재됨 (35차) — `apps/frontend/tests/e2e/workflows/wf-{19b,20b,21}-*.spec.ts` — 2026-04-08
- [x] Form export 5 보조 exporter team-scope 경계 미강제 — 해결: 2026-04-08 — intermediate/self/checkout/equipment-import 4곳에 `filter.teamId` WHERE/post-check 추가, software validation은 site-only 리소스라 team scope에서 SCOPE_RESOURCE_MISMATCH 403 reject. `enforceReportScope` team branch도 `params.site` pass-through 제거해 site-only 리소스 우회 차단
- [x] 프론트엔드 `hasRole()` → `can(Permission.X)` 전면 마이그레이션 — 해결: 2026-04-08 — 10개 파일 (checkouts/tabs, checkout detail, calibration approval/history, checkout/location/maintenance/incident history tabs, attachments, teams) 일괄 치환 + `useAuth().hasRole` 제거. 백엔드 @RequirePermissions와 단일 SSOT 공유. Side fix: CalibrationHistoryTab가 TM도 허용하도록 backend 정책과 정렬 (기존 `[TE]`는 TM이 교정 등록 불가 버그)
- [x] `checkout-scope.util.ts` 패턴을 다른 도메인에도 적용 검토 — 해결: 2026-04-08 (commit b0804812). 분석 결과 도메인 특수 3-case OR (rental requester / lender / non-rental equipment) 자체는 일반화 대상 아니나, 그 위에 얹힌 정책 상태기계 (all/site/team→fallback/none) 가 신규 `buildScopePredicate` (commit 8d7c8971) 와 1:1 중복이라 drift 위험. `dispatchScopePredicate` 신규 discriminated union 함수로 정책 상태기계 SSOT 통합, `buildCheckoutScopeFromResolved` 와 `buildScopePredicate` 둘 다 그 위에 얇게 재구현. 두 외부 contract (`{deny, condition}` vs `SQL | undefined`) 완전 보존, 528 tests PASS — 2026-04-08
- [x] `approvals.service.ts buildScopeCondition` 콜백 시그니처 leaky abstraction — 해결: 2026-04-08 (commits 8d7c8971 + b0804812). private helper 가 `common/scope/scope-sql-builder.ts:buildScopePredicate` 로 SSOT 승격되었고, `(value) => SQL` 콜백 시그니처가 단일 컬럼 비교만 지원하는 제약은 의도적 설계로 명문화됨. purpose-aware 도메인 특수 케이스(checkout 의 rental 3-case OR)는 `dispatchScopePredicate` discriminated union 위에서 `buildCheckoutScopeForUser` 가 직접 처리하도록 분리. 두 계층 분리로 leaky abstraction 해소
- [x] `reports.service.ts:scopeToEquipmentConditions` 새 SSOT 에 대해 drift — 해결: 2026-04-08 — `dispatchScopePredicate` 위임 호출로 마이그레이션. join 컬럼 결정만 reports 가 제공(`equipment.site` / `equipment.teamId`)하고 정책 분기(all/site/team→site fallback/none) 는 `common/scope/scope-sql-builder.ts` SSOT 가 책임. 부수 정렬: team scope에 teamId 누락 + site 존재 시 site 폴백 (기존 reports 는 FALSE → 더 관대한 SiteScopeInterceptor 정책과 정렬). 528 tests PASS, 32 reports tests PASS. 11곳 호출처는 시그니처 보존되어 무수정. 차단: 없음 (drift 차단 + drift — 같은 4-case 정책 상태기계(`all`/`site`/`team`/`none` + `sql\`FALSE\``) 를 사전 SSOT 승격(8d7c8971) 직전에 인라인 구현. `buildScopePredicate(policy, userCtx, { site, team })` 호출로 마이그레이션하여 SSOT 통합 권장. 단, 본 함수는 `ResolvedDataScope` 를 인자로 받으므로 호출자 측에서 `userCtx + policy` 로 한 단계 올리거나 dispatchScopePredicate 의 resolved 변형을 추가하는 옵션 검토 — `apps/backend/src/modules/reports/reports.service.ts:102` — 2026-04-08 (review-architecture finding)
- [ ] checkout inbound rental list/action 미세 비대칭 — list의 rental requester OR-branch는 우리가 빌려오는 건을 노출하지만, `enforceScopeFromData`는 rental을 lender 기준으로만 검증해 inbound rental "승인"은 여전히 403. 의도적 디자인(borrower 가시성)이지만 outgoing 탭 라우팅에서 inbound가 섞이지 않도록 frontend 확인 필요 — `checkouts.service.ts enforceScopeFromData` + `checkout-scope.util.ts` — 2026-04-08
- [ ] `checkouts.service.spec.ts` SQL-shape 회귀 unit 테스트 부재 — 현 mock 인프라가 SQL 조건 검증 미지원, e2e(TC-08)만 커버. checkout-scope.util 단위 테스트는 병렬 세션이 작성 중 (`__tests__/checkout-scope.util.spec.ts`) — 2026-04-08
- [x] `@AuditLog` interceptor가 ForbiddenException 경로에서도 감사 로그 남기도록 — 해결: 2026-04-08 — `chore/audit-access-denied`. 아키텍처 수준 SSOT 우선 접근:
  1. `AUDIT_ACTION_VALUES`에 `'access_denied'` 추가 (DB는 varchar(50)이라 마이그레이션 불필요) + label/color/i18n(en,ko) 동시 갱신
  2. `AuditInterceptor.auditResponse` 의 `tap.error` 핸들러 활성화: `HttpException` status `FORBIDDEN`만 캐치 (5xx/404 등 운영 노이즈 회피)
  3. `logAccessDeniedAsync` — entityId는 `params.uuid|id|entityId` UUID 형식만 추출(audit_logs.entity_id NOT NULL 충족), 추출 불가 시 `logger.warn` fallback (form export 등 string param 경로)
  4. forensic 정보 보존: userId/userSite/userTeamId/IP/sanitized requestBody/query/path
  5. fire-and-forget — 원본 에러 전파에 영향 없음, 로깅 실패 swallow
  6. 단일 interceptor 변경으로 모든 `@AuditLog` 엔드포인트(reports/equipment/checkouts/calibration/...) 자동 적용 — cross-site probing 시도가 audit_logs 에 통합 기록
  7. 4건 unit test 추가 (`audit.interceptor.spec.ts`): forbidden+UUID, forbidden+non-UUID fallback, NotFound 무시, 성공 경로 회귀
- [x] `SiteScopeInterceptor` ↔ `enforceReportScope` 통합 — 해결: 2026-04-08 — `refactor/scope-enforcer-ssot`. 하나의 정책 엔진으로 수렴:
  1. 신규 SSOT helper `apps/backend/src/common/scope/scope-enforcer.ts` — `enforceScope(params, scope)` 4-case 정책 (none/team/site/all) 단일 정의
  2. `enforceReportScope` 를 wrapper 로 변환 — 내부에서 `enforceScope` 위임. 기존 13건 spec 회귀 0
  3. `SiteScopeInterceptor` policy 모드를 `enforceScope` 로 위임. cross-site/cross-team mismatch 시 자동 ForbiddenException → audit interceptor 의 `access_denied` 경로와 자동 통합 (cross-site probing 추적). silent enforcement (params 미지정 시 주입) 는 backward compat 유지
  4. teamId 누락 폴백 (계정 설정 불완전) → site 강등 정책은 인터셉터 외곽에서 보존
  5. 새 helper unit test 13건 추가 (`scope-enforcer.spec.ts`) — 4 scope type × 모든 경계 케이스
  6. **Phase 2 (호출 진입점 통합)**: `@SiteScoped` 데코레이터에 `failLoud?: boolean` 옵션 추가. 인터셉터가 모든 모드에서 `req.dataScope` (raw `ResolvedDataScope`) + `req.enforcedScope` (검증된 `{site?, teamId?}`) 를 attach. silent 모드는 `req.query` mutate (backward compat), failLoud 모드는 mutation 생략하고 attach 만 수행
  7. 신규 parameter decorator `@CurrentScope()` / `@CurrentEnforcedScope()` — controller 가 `req` 파싱 없이 typed 값 직접 받음. 누락 시 fail-fast 500
  8. `reports.controller.exportFormTemplate` — `_resolveReportScope` helper 호출 제거, `@SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })` + `@CurrentEnforcedScope()` 로 대체
  9. `form-template-export.service.exportForm` 시그니처 단순화: `(formNumber, params, filter: EnforcedReportFilter)`. service 는 enforcement / scope resolution 책임 완전 제거
  10. 인터셉터 spec 4건 추가 (silent attach / failLoud attach / cross-site reject / type=all attach), 백엔드 515 PASS (회귀 0)
  11. 두 시스템이 정책 SSOT + 진입점 단일화 → drift 방지, 향후 새 enforcement 소비자는 데코레이터 한 줄 + parameter decorator 만 사용
- [x] `reports.controller._resolveReportScope` 12곳 마이그레이션 + helper 제거 — 해결: 2026-04-08 — `refactor/reports-controller-scope-migration`. 12개 stat/export 라우트(5 stat + 7 file export)에 `@SiteScoped({ policy: REPORT_DATA_SCOPE, failLoud: true })` + `@CurrentScope() scope: ResolvedDataScope` 일괄 적용. failLoud 선택 이유: query mutation 0 (Zod pipe 충돌 회피) + scope=none 즉시 403 (보안 일관성). `_resolveReportScope` private helper 완전 제거. audit-logs 라우트는 `AUDIT_LOG_SCOPE` + 'none'시 빈 보고서 fallback 정책 때문에 인라인 유지 (의도적 예외)
- [x] `enforceReportScope` wrapper 함수 + spec + 파일 통째로 삭제 — 해결: 2026-04-08 — 사용처 0 확인 (form-template-export 가 직접 `EnforcedScope` 사용). `report-scope-enforcement.ts` + spec + 빈 디렉토리 통째 삭제. `EnforcedReportFilter` 타입 alias 도 제거하고 form-template-export.service 의 9곳을 `EnforcedScope` 직접 사용으로 교체 — 진정한 단일 타입 SSOT (`common/scope/scope-enforcer.ts`)
- [x] WF-25 spec assertion 본 경로 활성화 — 해결: 2026-04-08 — 검증 결과 이미 완료 상태였음 (tracker 미체크): (1) `notifications.seed.ts`가 TE Suwon → spectrum analyzer (`available`) calibration_due 알림 1건을 deterministic 시딩, (2) verify-seed-integrity 3-way 삼각형 충족 (seed-test-new.ts insert + Phase 0 truncate + verification.ts checkCount), (3) D-day 배지 soft assertion이 spec 69-72 라인에 `getByLabel(/^교정 상태:/)` 패턴으로 존재. 두 skip 조건(alert 부재 / 비-checkoutable)이 시드로 사전 차단되어 본 경로가 항상 실행됨
- [x] WF-35 spec: `page.locator('textarea').first()` → `getByRole('textbox')` 대체 — 해결: 2026-04-08 — `chore/wf-35-spec-cleanup`. 접근성 친화적 role-based locator로 치환, `fillAndSave` 시그니처도 `ReturnType<Page['getByRole']>`로 정렬
- [x] WF-35 spec: `waitForTimeout(1_500)` → polling 기반 refetch 대기로 결정성 향상 — 해결: 2026-04-08 — `pageB.waitForResponse`로 GET `/api/non-conformances/:id` 200 응답을 결정적으로 대기. URL은 `API_ENDPOINTS.NON_CONFORMANCES.GET(NC_ID)` SSOT에서 가져와 하드코딩 제거. `endsWith` 매칭으로 page navigation document 요청과 충돌 방지
- [x] `shared-test-data.ts` frontend URL 폴백 SSOT 통합 — 해결: 2026-04-08 — 신규 `FRONTEND_URL` 상수 추가 대신 기존 `BASE_URLS.FRONTEND` 재사용 (최소 코드 원칙). spec 의 인라인 `process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'` 폴백 제거
- [x] 백엔드 NC Redis detail 캐시가 `updateWithVersion` 409 실패 경로에서도 무효화 — 해결: 2026-04-08 — `refactor/cas-conflict-cache-hook`. 단편 수정이 아닌 아키텍처 수준 SSOT 통합:
  1. `VersionedBaseService` 에 `onVersionConflict(id)` 훅 추가 — 13개 서브클래스 공유. `updateWithVersion` 이 ConflictException throw 직전에 자동 호출, 훅 실패 외곽 보호로 원본 409 가리지 않음
  2. NC 서비스 — 5곳(update/close/rejectCorrection/remove/linkRepair/markCorrected) try/catch boilerplate 제거 + `onVersionConflict` override 추가 (`detail` 캐시 삭제 단일 정책). `ConflictException` import 제거
  3. equipment-imports 서비스 — `requestReturn` 등 try/catch 누락된 CAS 경로 발견 (cross-cutting bug). override 추가로 approve/reject/cancel/receive 등 모든 `updateWithVersion` 경로가 자동 invalidation. 4곳 try/catch boilerplate 제거. `onReturnCompleted` 의 raw `tx.update` 경로는 hook 우회라 기존 catch 유지
  4. 다른 11개 서브클래스(checkout/calibration/calibration-plans/calibration-factors/equipment/disposal/software-validations/intermediate-inspections/cables/test-software/self-inspections)는 default no-op 으로 backward compatible — 점진적 채택 가능
  5. 5건 unit test 추가 (`versioned-base.service.spec.ts`): 성공/NotFound/409+hook/hook 실패 외곽 보호/default no-op 회귀
- [ ] CAS 충돌 캐시 무효화 훅 점진적 채택 — checkouts/calibration/calibration-plans/calibration-factors/equipment/disposal 등 11개 서브클래스가 여전히 메서드별 try/catch boilerplate 사용. 각 도메인의 cache invalidation 정책을 `onVersionConflict` override 로 일괄 이전 검토. 단순 복사 금지, 도메인별 캐시 키/스코프 차이 검토 후 — 2026-04-08
- [x] toast helper 미적용 e2e spec follow-up migration — 해결: 2026-04-08 (commit e2f0326f) — 라인별 분류 결과 9/10이 false positive (배지/상태/목록), `equipment-form-errors.spec.ts:202/270/431` 3건만 실제 토스트 (CreateEquipmentContent catch에서 destructive toast 항상 호출)이라 `expectToastVisible`로 마이그레이션. `disposal-review-tech-manager.spec.ts:40`은 regex `/검토|승인|완료/i`가 너무 광범위해 별도 조사 필요 — 보류
- [x] `disposal-review-tech-manager.spec.ts:40` root-cause 조사 — 해결: 2026-04-08 — `DisposalReviewDialog.tsx:60-70` 의 onSuccess 가 `disposal.json reviewDialog.toasts.approveTitle = "검토 완료"` 를 토스트로 띄움을 확인. 광범위 regex 의도는 토스트 매칭이었음. `expectToastVisible(page, '검토 완료')` 로 명시적 마이그레이션
- [x] form-templates-ui.spec.ts beforeAll 시드 race condition — 해결: 2026-04-07 — `fix/form-templates-seed-race` — create 409 시 replace 폴백 재시도
- [x] Mobile Chrome viewport에서 sticky header가 form-templates 테이블 row 액션 가로챔 — 해결: 2026-04-07 — TC-UI-04/05에서 `scrollIntoView({block: 'center'})`로 버튼을 화면 중앙 배치 후 클릭 (Playwright 기본 `scrollIntoViewIfNeeded`는 'nearest'라 sticky header 아래에 걸림)

- [x] team-filtering E2E 테스트 재작성 (URL param 기반) — 해결: 2026-04-05 — 4파일 skip → 1파일 URL param 기반으로 통합
- [x] 대시보드 탭 testIgnore 패턴 정리 — 해결: 2026-04-05 — `**/overdue-auto-nc/**`로 수정

- [x] 날짜 검증 메시지 하드코딩 → VM.date.invalidYMD — 해결: 2026-04-05 — create/update-validation.dto.ts 4곳 교체
- [x] countActiveFilters 함수 누락 — 해결: 2026-04-05 — software-filter-utils.ts에 추가
- [x] ApiTestSoftwareFilters 인터페이스 미정의 — 해결: 2026-04-05 — 불필요 (toApiFilters가 TestSoftwareQuery 반환)
- [x] SoftwareValidationsController @SiteScoped 미적용 — 해결: 2026-04-05 — @SiteScoped + 사이트 스코프 필터링 추가
- [x] QUERY_CONFIG TEST_SOFTWARE_DETAIL 분리 필요 — 해결: 2026-04-05 — TEST_SOFTWARE_DETAIL strategy 추가
- [x] 유효성확인 첨부파일 UI (ValidationAttachments 컴포넌트) — 해결: 2026-04-05 — ValidationDetailContent.tsx에 인라인 구현
- [x] 프론트엔드 권한 게이팅 미적용 (소프트웨어 페이지) — 해결: 2026-04-05 — software/layout.tsx 서버사이드 권한 체크
- [x] 백엔드 문서 업로드/삭제 시 부모 validation status=draft 검증 미적용 — 해결: 2026-04-05 — document.service.ts ensureValidationIsDraft()

---

## 완료 항목

- [x] getPendingChecks 엔드포인트 Zod validation pipe 누락 — 해결: 2026-04-02 — `pending-checks-query.dto.ts` 생성

- [x] EventEmitter2 emit 페이로드 검증 누락 — 해결: 2026-04-02 — `fix/tech-debt-test-assertions`
- [x] ReportExportService CSV 포맷 `buffer.length > 0` 단언 누락 — 해결: 2026-04-02 — `fix/tech-debt-test-assertions`
- [x] EquipmentForm.tsx `isManager: _isManager` 미사용 destructuring 정리 — 해결: 2026-04-02 — PR #66
- [x] E2E 테스트 주석에서 `isManager()` 참조를 permission 기반으로 업데이트 — 해결: 2026-04-02 — PR #66
- [x] `isManager`/`isAdmin` 함수 use-auth.ts에서 제거 — 해결: 2026-04-02 — `refactor/remove-unused-role-checks`
- [x] equipment.json(en/ko) `softwareHistory.*` 레거시 i18n 키 블록 제거 — 해결: 2026-04-05
- [x] E2E 테스트 payload stale softwareVersion — 이전 커밋에서 이미 정리됨 확인: 2026-04-05
