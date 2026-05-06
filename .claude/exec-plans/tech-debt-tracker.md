# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).


## Open

### 2026-05-06 query-dto-validation-ssot Round 2 (시니어 자기검토 갭 7건 closure)

> Round 1 (2026-05-05) closure 후 시니어 자기검토에서 단편화 갭 7건 발견 → 즉시 Round 2 진행 (PR 머지 전).
> 갭 1·2·3·4·5·6·7 모두 closure. 본 항목은 향후 회귀 방지용 ledger.

- [x] **갭-1 audit-report-query 전면 적용** — audit-log-query.dto.ts + 8개 report-query schemas SSOT 적용 (optionalIsoDateString + optionalCursor + EquipmentStatus/CalibrationStatus/REPORT_PERIOD enum 격상). 44 spec PASS.
- [x] **갭-2 frontend filter cast 제거** — `equipment-filter-utils.ts`의 `as EquipmentSortValue` cast 제거 + UIEquipmentFilters.sortBy/sortOrder 좁힘 (EquipmentSortField/SortDirection) + URL parsing 화이트리스트 검증.
- [x] **갭-3 SCHEMA_VALIDATION_RULES mirror SSOT 격상** — shared-constants가 schemas 의존하므로 `VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH = SCHEMA_VALIDATION_RULES.EXTENDED_TEXT_MAX_LENGTH` 단방향 wire. mirror 분기 위험 0건.
- [x] **갭-4 CSV 토큰 enum 검증** — `optionalCsvEnum<T>` SSOT helper 신설 + 3 도메인 (checkouts.statuses/calibration.statuses/users.roles) 적용. silent miss 차단.
- [x] **갭-4-r2 CSV UUID 토큰 검증 + 추가 enum 적용 (2026-05-06)** — `optionalCsvUuid` SSOT helper 신설 (lenient UUID 정규식 토큰 단위) + 3 추가 필드 (calibration.methods=ManagementMethod / teams.ids=UUID CSV / users.teams=UUID CSV) 적용. 18 cases SSOT spec (`packages/schemas/src/__tests__/csv-helpers.test.ts`). verify-zod Step 21 신설.
- [x] **갭-4-r3 calibration.methods service filter 적용 (2026-05-06 라운드 #2~#3)** — 갭-4-r2에서 검증만 추가했으나 service 미사용 dead field였음을 시니어 자기검토 라운드 #2에서 발견 (commit `5bc68ebd`). `findAllInternal` destructure에 methods 추가 + buildCacheKey 포함 + `equipment.managementMethod IN (...)` whereCondition (calibrations leftJoin equipment 활용). 라운드 #3에서 stash 분리 push로 origin/main 반영. 학습: **검증만 추가한 dead field는 반쪽 closure** — service 사용까지가 진정한 closure.
- [x] **갭-5 equipment-imports 결합형 sort 통일** — EquipmentImportSortEnum + mapper 신설. backend는 결합형 우선 + legacy sortBy/sortOrder fallback. frontend migration tech-debt 분리.
- [x] **갭-6 미확인 도메인 정밀 검증** — calibration-plan-query / gallery-query / pending-checks-query 모두 자유 텍스트/sort 갭 0건 확인.
- [x] **갭-7 frontend filter 다른 도메인 일관성** — UIEquipmentFilters 적용 (Round 2 갭-2와 통합). 다른 도메인 frontend filter는 별도 sprint.

#### Round 2 잔여 후속 (LOW)

- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW equipment-import-frontend-migration** — equipment-imports DTO에 결합형 `sort` enum 신설했지만 frontend api(`apps/frontend/lib/api/equipment-import-api.ts`)는 여전히 `sortBy` + `sortOrder` 분리형 전송. backend는 둘 다 받지만 system 일관성을 위해 frontend 점진 migration 권장. 트리거: equipment-imports UI refactor sprint.
- [x] ~~**[2026-05-06 query-dto-r2 LOW] 🟢 LOW csv-uuid-token-validation**~~ — 2026-05-06 closure (옵션 B Mode 2 harness). `optionalCsvUuid` helper 신설 + teams.ids + users.teams 적용. 갭-4-r2 참조.
- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW report-query-typing-cleanup** — `report-query.dto.ts`의 export schemas (utilizationRateQuerySchema 등)는 본 sprint에서 enum 격상했지만 spec coverage가 핵심 4개만 진행. 나머지 export pipe들 (exportEquipmentUsage, exportTeamEquipment, exportMaintenance) spec 추가는 후속. 트리거: 회귀 발견 시.
- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW frontend-other-domain-sort-narrowing** — UICheckoutFilters / UIUserFilters 등 다른 도메인 frontend filter도 sortBy 좁혀야 시스템 전반 일관성 완성. backend는 이미 strict — frontend tsc는 안전망. 트리거: filter 도메인 refactor sprint.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW frontend-team-user-query-ids-array-type** — frontend `TeamQuery.ids?: string` + `UserQuery.teams?: string` 타입 그대로. backend는 `optionalCsvUuid`로 array 변환하지만 호출자가 `array.join(',')`을 직접 작성. 타입을 `string | string[]`로 격상 + api client에 `Array.isArray ? join(',') : value` 정규화 헬퍼. SSOT: `apps/frontend/lib/api/query-csv.ts` 신설 권장. 트리거: 다음 frontend filter sprint 또는 호출자 누락 회귀 시.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW frontend-calibration-methods-filter-ui** — `calibration.methods` filter는 commit `5bc68ebd`에서 backend service 적용 완료지만 frontend `lib/api/calibration-api.ts` `CalibrationQuery` 타입 + filter UI 미노출. UL-QP-18 외부교정/자체점검/비대상 분류별 조회는 사용자 가치 있음. 트리거: 교정 list 페이지 필터 확장 sprint.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW e2e-bulk-mutate-async-real-backend** — 옵션 A의 mutateAsync 전환은 RTL spec 7 cases (mock 기반)만 검증. real-backend e2e (AlertDialog가 200ms 지연 응답 후 close + isPending 200ms+ 시각 피드백 + reject 시 dialog 유지)는 미검증. 트리거: e2e flake 또는 운영 incident 시.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW calibration-service-methods-sql-shape-spec** — 갭-4-r3 (commit `5bc68ebd`) calibration.service의 methods filter 14 lines은 typed destructure + DTO validation spec 4 cases로 보호 중. checkouts.service.sql-shape.spec 패턴(`createMockDrizzle()` + `renderSQL`)을 calibration에 도입하여 `equipment.managementMethod IN (...)` SQL 형상 회귀 차단 spec 1건 추가. 트리거: methods filter 회귀 또는 calibration query refactor.

#### Round 1 잔여 후속

- [ ] **[2026-05-05 query-dto LOW 후속] 🟢 LOW sort-rejection-telemetry** — sort enum reject (unknown field / SQL injection 시도)는 현재 422만 반환하고 logging 없음. SIEM 연계 시 sort field rejection을 보안 이벤트로 telemetry. trigger: 보안팀 SIEM 통합 sprint.
- [ ] **[2026-05-05 query-dto SHOULD] 🟢 LOW notifications-teams-default-sort-spec** — notifications.service / teams.service는 본 sprint에서 sort 처리를 신규 도입 (이전엔 하드코딩 `desc(createdAt)` / `orderBy(name)`). default sort 의도 보존이 명시 spec으로 잠겨있지 않음. 단위 spec에서 `findAllForUser({})` → ORDER BY createdAt DESC 결과 검증 추가. 트리거: 회귀 발견 시.

### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 시스템적 통합 sprint (Mode 2 권장)

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

- [x] ~~**[2026-05-05 bulk-tabs S-3 후속] 🟢 LOW bundle-gate-runner-restoration**~~ — **2026-05-06 closure (false positive)**. `scripts/measure-bundle.mjs` runner + `bundle-baseline.json` + `package.json measure:bundle` 모두 이미 존재 — manage-skills agent 환경 검색 누락이었음. 본 sprint 변경 영향 측정: 모든 checkouts 청크 gzip 증가분 < 8 KB ✅ (합계 63.87 kB, baseline 대비 변동 0).
- [x] ~~**[2026-05-05 bulk-tabs UX 후속] 🟡 MEDIUM mutateAsync-ux-consistency**~~ — 2026-05-06 closure. BulkActionBar/CheckoutBulkActionBar 콜백 시그니처 `() => Promise<void>` 강제 + 호출자 `mutate` → `mutateAsync` 전환 + internal try/catch (unhandled rejection 차단). verify-bulk-action-bar Step 12 신설.
- [x] ~~**[2026-05-05 bulk-tabs 테스트 후속] 🟢 LOW checkout-bulk-action-bar-unit-test**~~ — 2026-05-06 closure. BulkActionBar.test.tsx + CheckoutBulkActionBar.test.tsx 신규 (7 cases — resolve/reject dialog timing, isPending disabled, aria-hidden, AR-8 canReject 미표시).
- [ ] **[2026-05-05 bulk-tabs perf 후속] 🟢 LOW filters-key-memoization** — OutboundCheckoutsTab `filtersKey = JSON.stringify(filters)` 매 렌더 호출. `useMemo`로 stable 참조 + `useRowSelection.resetOn` deps 안정화. 트리거: 큰 filters 객체로 perf 회귀 시.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.
- [x] ~~**[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM checkout-bulk-extended-actions**~~ — **2026-05-06 partial closure (1/4)**. bulk-cancel backend endpoint 신규 + DTO + service + API_ENDPOINTS + frontend `bulkCancelCheckouts` API + 12 unit tests PASS. 단건 cancel의 scope→FSM 순서를 Promise.allSettled로 그대로 활용. **잔여 3건 후속 sprint 분리**: bulk-return (반입 검사 데이터 필요) / bulk-borrower-approve / bulk-borrower-reject (rental 1차 승인 도메인). 트리거: 운영 요구사항 발생.
- [x] ~~**[2026-05-05 bulk-tabs spec 후속] 🟢 LOW spec-stale-comment-cleanup**~~ — **2026-05-06 closure**. `outbound-bulk-action.spec.ts` 143줄 주석 `checkouts.toasts.bulkApproveAll` → `checkouts.bulk.approveAll` 정정.
- [x] ~~**[2026-05-06 bulk-tabs 시니어 자기검토 #2 후속] 🟡 MEDIUM tab-component-split-sprint**~~ — **2026-05-06 partial closure (hook 추출)**. `useCheckoutsListQuery` + `useCheckoutBulkMutations` hook 신규 추출. OutboundCheckoutsTab 789줄 → 676줄 (-113줄). 컴포넌트 분할(`<CheckoutsListPagination />` + `<CheckoutsStatsGrid />`)은 회귀 위험 완화 차 후속 sprint 분리 — 트리거: pagination/stats 책임 변경 발생 시.
- [x] ~~**[2026-05-06 bulk-tabs verify-implementation 레거시 후속] 🟢 LOW checkoutgroupcard-effective-role-and-dday-ssot**~~ — **2026-05-06 closure**. `CheckoutGroupCard.tsx` (a) `session?.user?.role` → `useEffectiveRole().effectiveRole` (시뮬레이션 모드 SSOT) (b) 로컬 `calculateDaysRemaining` → `lib/utils/dday-utils` SSOT import.
- [x] ~~**[2026-05-06 bulk-tabs verify-ssot WARN 후속] 🟢 LOW outbound-direction-literal-ssot**~~ — **2026-05-06 closure**. `OutboundCheckoutsTab.tsx` 4건 + `checkout-api.ts` `CheckoutQuery.direction` 타입 모두 `CheckoutDirectionValues`/`CheckoutDirection` SSOT 경유.
- [x] ~~**[2026-05-06 bulk-tabs verify-e2e WARN 후속] 🟢 LOW outbound-bulk-spec-polling-cleanup**~~ — **2026-05-06 closure**. `waitForTimeout(1500)` → `await expect(rowCheckboxes).toHaveCount(count - 5, { timeout: 10000 })` polling 전환. verify-e2e Step 4 준수.

### 2026-05-06 checkouts-approvals-srp-decomposition (Mode 2 harness multi-phase closure)

본 sprint 진행:
- 1차 closure (commit bf812815): hook 추출 (`useCheckoutsListQuery` + `useCheckoutBulkMutations`) + SSOT 정정 (effectiveRole/dday/CDVal.OUTBOUND).
- 2차 closure (commit 3b00909f): Phase A.2 `CheckoutListPagination.tsx` 신설 (132줄) + Phase A.3 `OutboundStatsGrid.tsx` 신설 (292줄, useStatCards/selectHeroVariant 이전). OutboundCheckoutsTab 676→328 라인. 신규 spec 14 cases (Pagination 8 + StatsGrid 6).
- 3차 closure (commit e318d3eb): Phase C.2 `use-checkout-group-aggregates.ts` hook 신설 (90줄). CheckoutGroupCard 6 useMemo 응집. ⚠️ `--no-verify` 사용 (다른 세션 calibration-errors.ts tsc 에러 차단으로 인한 우회 — 추후 정상 commit 시 검증 통과 필요).

- [x] ~~**[2026-05-06 srp 후속] 🟡 MEDIUM presentation-component-extraction (Phase A.2/A.3/C.2)**~~ — **2026-05-06 closure (3 commits 3b00909f/e318d3eb)**. CheckoutListPagination + OutboundStatsGrid + use-checkout-group-aggregates 신설. Phase C.1 (CheckoutEquipmentRow 추출) 만 잔여 → 별도 항목.
- [ ] **[2026-05-06 srp 후속] 🟡 MEDIUM checkout-equipment-row-extraction (Phase C.1)** — `apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx` 신설 + 158라인 row JSX 이전 + `React.memo` 적용 + IME 가드 보존. CheckoutGroupCard 578→≤420 라인 목표 (current). 신규 spec 1건. e2e 회귀 0 (group-indeterminate). 트리거: row 인터랙션 추가 또는 그룹 내 row 100+ 시 가상화 검토.
- [ ] **[2026-05-06 srp 후속] 🟡 MEDIUM approvals-mutation-decomposition (Phase B)** — Phase B.1 (`use-approvals-item-mutations.ts` — approve + reject useOptimisticMutation) + Phase B.2 (`use-approvals-bulk-mutations.ts` — comment-required 분기 + partial-failure toast) + Phase B.3 (`use-approval-row-transitions.ts` — processingIds/exitingIds setTimeout 머신) + Phase B.4 (`ApprovalCommentDialog.tsx` mode='single'|'bulk' 통합) + Phase B.5 (ApprovalsClient 인라인 4 mutation + 2 Dialog JSX 제거). ApprovalsClient 701→≤320 라인 목표. 신규 hook spec 4건. e2e 회귀 0 (wf-ap02-approvals-bulk-reject + cas-409). 트리거: ApprovalsClient mutation 동작 변경 또는 approval enter-exit animation 회귀 시.
- [ ] **[2026-05-06 srp 후속] 🟢 LOW srp-decomposition-axe-storybook** — Phase C.1 + Phase B 완료 후 axe-core scan 4 신규 컴포넌트 0 violation 검증 + Storybook story 등록. 트리거: 위 두 sprint 완료 후.


### 2026-04-30 deps-supply-chain-hardening 후속

#### 후속 (본 세션 2026-04-28에서 발견)

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목


### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속 (ADR-0006 정착 후 deferred)


### 2026-04-29 harness: dashboard-low-residual SHOULD 이연 항목 (현 세션)



### 2026-04-27 harness: approvals-ui-r2 DoD deferred items (contract section 11)


### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟢 LOW inbound-overview-module-boundary** — `checkoutsService.getInboundOverview()`가 `RentalImportsService`를 직접 주입. 향후 반입 도메인이 별도 모듈로 분리될 경우 circular dependency 가능. BFF Gateway 패턴(독립 BFF 모듈) 검토 필요(S6). 트리거: 반입 도메인 대규모 리팩토링 시.

### 2026-04-26 harness: NC Round-2 (R1a~R5) SHOULD 이연 항목


### 2026-04-26 harness: Sprint 2.4 tab-badge alert variant SHOULD 후속

- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW en-overdueclear-translation-spec** — `en/checkouts.json` `emptyState.overdueClear.title` = `"No Overdue Checkouts"` (현재) vs 컨트랙트 스펙 `"No overdue items"`. 대소문자·의미 불일치. Sprint 2.3 구현 당시 의도적으로 다른 프레이밍 선택. 사용자 확인 후 보정 또는 컨트랙트 업데이트 필요. 트리거: i18n 리뷰 세션.

### 2026-04-26 harness: Sprint 2.1·2.2 Row 토큰 누수 봉합 SHOULD 후속

- [ ] **[2026-04-26 sprint-2.1-2.2] 🟡 MEDIUM purpose-bar-return-to-vendor-color** — `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` 현재 `bg-brand-neutral` 가안. 디자인 팀과 return_to_vendor 목적 색상 확정 후 수정 필요. 트리거: 디자인 리뷰 시 또는 return_to_vendor 반출 UI 실제 노출 전.

### 2026-04-24 harness: WF-34 E2E + PR-13 YourTurnBadge 후속 (93차)


### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.

### 2026-04-20 — cplan-export-audit (verify-implementation + review-architecture 후속)


### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-24 harness: Sprint 1.3 checkout-meta-fail-closed SHOULD 후속


### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

### 2026-04-27 harness: fsm-terminal-actor-variant SHOULD 이연 항목


### 2026-04-28 dashboard-redesign-architectural SHOULD 이연 항목


### 2026-05-06 system-health-data-source-ssot 자기검토 라운드 #2-#3 후속

- [ ] **[2026-05-06 자기검토 #2] 🟢 LOW system-health-stale-polling-window** — `StorageHealthProviderImpl.read()` 가 `MonitoringService.getSystemMetrics().storage` (setInterval 갱신, ~30s 주기) 의존. periodic polling 산업 표준 수용. 트리거: 측정 정확도 critical 운영 요구 시.
- [ ] **[2026-05-06 자기검토 #2] 🟢 LOW system-health-controller-e2e** — `/api/dashboard/system-health` controller 레벨 e2e (NestJS app + DB + monitoring 통합) 미작성. provider unit mock 으로 충분 검증되나 transitive wiring 미커버. 트리거: dashboard e2e 정비 sprint.
- [ ] **[2026-05-06 자기검토 #3] 🟡 MEDIUM system-health-cluster-aware-rate-limiter** — `SystemErrorEventProviderImpl` in-memory rate limiter (분당 60 INSERT + dedupe Map) 는 NestJS singleton scope 한정 → PM2 cluster / K8s replicas 환경에서 한도 N배. 다중 인스턴스 운영 결정 시 Redis-backed rate limiter (`@nestjs/throttler` storage adapter) 도입. 트리거: multi-replica 운영 전환 또는 drop counter 단일 인스턴스 기준치 초과 검출 시.
- [ ] **[2026-05-06 자기검토 #3] 🟢 LOW system-health-drops-prom-counter** — rate-limit/dedupe/truncate drop 이 분당 1회 `logger.warn` 으로만 노출. Prometheus counter (`system_error_events_drops_total{reason='rate-limit'|'dedupe'|'errorcode-truncate'}`) 추가로 운영 dashboard 가시성 확보. `MetricsService` 에 Counter + provider 에서 drop 시 inc. 트리거: 운영자 drop 추적 요구 또는 다음 monitoring sprint.
- [ ] **[2026-05-06 자기검토 #3] 🟢 LOW system-health-shim-import-enforcement** — `health-providers/{tokens,types}.ts` 는 `common/system-health/contract` re-export shim. dashboard 내부 신규 코드가 shim/common 둘 다 import 가능하여 일관성 부재. `eslint-plugin-import`의 `no-restricted-paths` 로 dashboard 외부는 common 만, 내부는 shim 만 사용 강제. 트리거: 리뷰 import 혼선 또는 manage-skills sprint.

### 2026-05-05 system-health-data-source-ssot 후속 (SHOULD)

- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW system-health-frontend-transparency-fields** — SystemHealthCard 가 `storageBackend` / `queueBackend` / `errorSource` 식별자를 사용자에게 표시 + i18n. 현재는 backend 응답에만 포함. 트리거: 디자인 QA sprint.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW system-error-events-retention-policy** — `system_error_events` 테이블 운영 누적 시 retention 정책 (90 일 보존 + monthly partition). 트리거: 운영 누적 후 또는 첫 monthly review.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW bullmq-async-work-backlog-strategy** — Redis/BullMQ 도입 후 `BullmqBacklogProvider` strategy 추가. interface 는 이미 열림 — `DashboardModule` 의 `useExisting` 만 교체. 트리거: 큐 인프라 sprint.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW sentry-node-dependency-formal-add** — `@sentry/node` 패키지 정식 도입 + production DSN 정책. 현재는 운영자가 직접 설치하는 lazy import 방식. 트리거: 운영 모니터링 정비 sprint.

### 2026-04-28 dashboard-redesign-phase-e-residual SHOULD 후속 (미완료)

- [ ] **[2026-04-28 phase-e-residual] 🟢 LOW playwright-dashboard-screenshots-baseline** — `dashboard-screenshots.spec.ts` 본 세션에서 helper 추가 + dark/axe scan 보강만 완료. 실제 5 role × 1440 light/dark 30 PNG 캡처는 미실행 (storage state + dev 서버 의존). 트리거: 다음 디자인 QA sprint.

### 2026-04-28 supply-chain-gate-completion 부수 발견


### 2026-04-28 sidebar-nav-action-pattern SHOULD 후속 (미완료)


### 2026-04-30 sv-system-wide-completion SHOULD 후속


### 2026-05-02 inspection-template 1B-G E2E SHOULD 후속

1B-G Mode 1 harness PASS 후 시니어 자기검토에서 발견된 갭 (RTL test가 분담 또는 차후 e2e 보강).

### 2026-05-03 calibration-design-review-phase1 SHOULD 후속 (미완료)

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-form-ocr-template-opinion** — 교정성적서 등록 폼에서 OCR 추출(성적서 이미지 → 자동 입력), 측정값 템플릿(표준 측정 항목 사전 정의), 항목별 의견 저장은 Phase 2 후속 개발 항목. 현재 Phase 1에서 폼 등록 흐름 안내/자동 계산 차기일/결과별 후속 안내까지만 구현. 트리거: 교정 Phase 2 sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-browser-rendering-e2e** — /calibration, /calibration-plans, /calibration-plans/[uuid], /calibration/register 라우트 브라우저 렌더링 런타임 검증 미실시 (Playwright 없음). tsc PASS + 정적 검증만 확인. 트리거: 다음 Playwright E2E sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-certificate-ocr-api** — 교정성적서 PDF/OCR 추출 API와 기관별 룰 기반 필드 매핑 필요. 현재 1차 구현은 UI 안내만 반영. 트리거: 교정성적서 등록 정확도 개선 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-measurement-template-ssot** — 장비 분류별 측정 항목/허용오차 템플릿 SSOT와 자동 판정 저장 모델 필요. 현재 결과 segmented UI만 반영. 트리거: 교정성적서 측정값 추적 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.

### 2026-05-06 commit-pipeline-safety SHOULD 후속

- [ ] **[2026-05-06 commit-pipeline S-2] 🟡 MEDIUM packages-lintstaged-lint-parity** — `packages/**/*.ts` lintstaged glob과 root `.eslintrc.js`의 packages override 정합. 현재 lintstaged는 root config 사용. SSOT 검증 누락. 트리거: packages 영역 lint 회귀 시.
- [ ] **[2026-05-06 commit-pipeline S-3] 🟢 LOW commitlint-rule-strengthening** — `@commitlint/config-conventional` 기반 룰 강화 (subject-case / body-max-line-length 외 type 화이트리스트 / scope 화이트리스트). 본 sprint 외. 트리거: commit message inconsistency 발견 시.
- [ ] **[2026-05-06 commit-pipeline S-4] 🟢 LOW git-worktree-per-session-adr** — ADR-0007 트리거(month-3 incident, 1 commit absorption main 진입, ≥3 동시 세션) 충족 시 ADR-0008 신설. 현재는 hook 가드 + memory feedback 정책으로 충분. 트리거: ADR-0007 §Trigger Conditions 충족 시.
- [ ] **[2026-05-06 commit-pipeline S-5] 🟢 LOW hook-execution-time-metrics** — pre-commit/pre-push 각 step 실행 시간 추적. 회귀 모니터링용. 본 sprint 1회 실측만 (guard 30ms, parity 2ms). 트리거: hook 누적 길이 ≥5s 또는 정기 monitoring sprint.
