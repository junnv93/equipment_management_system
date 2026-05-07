# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-07 calibration-cert-phase-a-architecture-closure (Mode 2 atomic, 신규)

> Phase A 사용자-facing 마감 후(commit `80e77488`까지) 시니어 자기 감사로 식별된 *시스템 전반 일관성* 갭 6건. example-prompts.md `🟡 calibration-cert-phase-a-architecture-closure` 섹션에 prompt 등재.

- [ ] **[2026-05-07 phase-a-arch 🔴 HIGH] equipment-calibration-history-sub-route** — `/equipment/[id]/calibration-history` 신규 sub-route. 다른 도메인 패턴(`repair-history` / `calibration-factors` / `non-conformance`) mirror. 트리거: 다음 sprint.
- [ ] **[2026-05-07 phase-a-arch 🔴 HIGH] filter-chip-shared-component** — `components/shared/FilterChip.tsx` 추출. CalibrationContent.tsx inline chip → 마이그레이션. checkouts/equipment 등 다른 도메인 재사용 가능. 트리거: 다음 sprint 또는 다른 도메인 동일 패턴 등장 시.
- [ ] **[2026-05-07 phase-a-arch 🟡 MEDIUM] filter-chip-design-token** — `lib/design-tokens/components/filter-chip.ts` 신규. BADGE/SEMANTIC 시스템 정합. 트리거: FilterChip 추출과 함께.
- [ ] **[2026-05-07 phase-a-arch 🟡 MEDIUM] equipment-detail-separate-fetch-for-chip** — chip이 `calibrationHistoryData.data[0]` 의존 → `useQuery(queryKeys.equipment.detail(id))` 분리. list 비어도 deterministic. 트리거: 위 sprint 안에서 함께.
- [ ] **[2026-05-07 phase-a-arch 🟢 LOW] calibration-certificate-extract-audit-entity-id** — `Could not extract entityId for extract calibration_certificate` warn closure. controller `entityIdPath` 또는 dry-run audit 처리. 트리거: 위 sprint 안에서 함께.
- [ ] **[2026-05-07 phase-a-arch 🟢 LOW] calibration-content-dialog-rtl-specs** — CalibrationContent.test.tsx (chip render + clear + filter 보존) + CalibrationRegisterDialog.test.tsx (managementNumber mismatch toast). 트리거: 위 sprint 안에서 함께.

### 2026-05-06 query-dto-validation-ssot 잔여 후속

> Round 1 (2026-05-05) + Round 2 (2026-05-06) closure 이력은 archive 참조 (`query-dto-r2-ssot-closure`).

#### Round 2 후속 (LOW)

- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW equipment-import-frontend-migration** — equipment-imports DTO에 결합형 `sort` enum 신설했지만 frontend api(`apps/frontend/lib/api/equipment-import-api.ts`)는 여전히 `sortBy` + `sortOrder` 분리형 전송. backend는 둘 다 받지만 system 일관성을 위해 frontend 점진 migration 권장. 트리거: equipment-imports UI refactor sprint.
- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW report-query-typing-cleanup** — `report-query.dto.ts`의 export schemas (utilizationRateQuerySchema 등)는 본 sprint에서 enum 격상했지만 spec coverage가 핵심 4개만 진행. 나머지 export pipe들 (exportEquipmentUsage, exportTeamEquipment, exportMaintenance) spec 추가는 후속. 트리거: 회귀 발견 시.
- [ ] **[2026-05-06 query-dto-r2 LOW] 🟢 LOW frontend-other-domain-sort-narrowing** — UICheckoutFilters / UIUserFilters 등 다른 도메인 frontend filter도 sortBy 좁혀야 시스템 전반 일관성 완성. backend는 이미 strict — frontend tsc는 안전망. 트리거: filter 도메인 refactor sprint.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW frontend-team-user-query-ids-array-type** — frontend `TeamQuery.ids?: string` + `UserQuery.teams?: string` 타입 그대로. backend는 `optionalCsvUuid`로 array 변환하지만 호출자가 `array.join(',')`을 직접 작성. 타입을 `string | string[]`로 격상 + api client에 `Array.isArray ? join(',') : value` 정규화 헬퍼. SSOT: `apps/frontend/lib/api/query-csv.ts` 신설 권장. 트리거: 다음 frontend filter sprint 또는 호출자 누락 회귀 시.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW frontend-calibration-methods-filter-ui** — `calibration.methods` filter는 commit `5bc68ebd`에서 backend service 적용 완료지만 frontend `lib/api/calibration-api.ts` `CalibrationQuery` 타입 + filter UI 미노출. UL-QP-18 외부교정/자체점검/비대상 분류별 조회는 사용자 가치 있음. 트리거: 교정 list 페이지 필터 확장 sprint.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW e2e-bulk-mutate-async-real-backend** — 옵션 A의 mutateAsync 전환은 RTL spec 7 cases (mock 기반)만 검증. real-backend e2e (AlertDialog가 200ms 지연 응답 후 close + isPending 200ms+ 시각 피드백 + reject 시 dialog 유지)는 미검증. 트리거: e2e flake 또는 운영 incident 시.
- [ ] **[2026-05-06 query-dto-r3 LOW] 🟢 LOW calibration-service-methods-sql-shape-spec** — 갭-4-r3 (commit `5bc68ebd`) calibration.service의 methods filter 14 lines은 typed destructure + DTO validation spec 4 cases로 보호 중. checkouts.service.sql-shape.spec 패턴(`createMockDrizzle()` + `renderSQL`)을 calibration에 도입하여 `equipment.managementMethod IN (...)` SQL 형상 회귀 차단 spec 1건 추가. 트리거: methods filter 회귀 또는 calibration query refactor.

#### Round 1 후속

- [ ] **[2026-05-05 query-dto LOW 후속] 🟢 LOW sort-rejection-telemetry** — sort enum reject (unknown field / SQL injection 시도)는 현재 422만 반환하고 logging 없음. SIEM 연계 시 sort field rejection을 보안 이벤트로 telemetry. trigger: 보안팀 SIEM 통합 sprint.
- [ ] **[2026-05-05 query-dto SHOULD] 🟢 LOW notifications-teams-default-sort-spec** — notifications.service / teams.service는 본 sprint에서 sort 처리를 신규 도입 (이전엔 하드코딩 `desc(createdAt)` / `orderBy(name)`). default sort 의도 보존이 명시 spec으로 잠겨있지 않음. 단위 spec에서 `findAllForUser({})` → ORDER BY createdAt DESC 결과 검증 추가. 트리거: 회귀 발견 시.

### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

> 2026-05-06 closure 9건은 archive 참조 (`bulk-selection-tabs-integration-closures`).

- [ ] **[2026-05-05 bulk-tabs perf 후속] 🟢 LOW filters-key-memoization** — OutboundCheckoutsTab `filtersKey = JSON.stringify(filters)` 매 렌더 호출. `useMemo`로 stable 참조 + `useRowSelection.resetOn` deps 안정화. 트리거: 큰 filters 객체로 perf 회귀 시.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.

### 2026-05-06 checkouts-approvals-srp-decomposition 잔여 후속

> 1차/2차 closure 이력은 archive 참조 (`checkouts-approvals-srp-decomposition-phase-a` + 1차 commit `bf812815`).
> 3차 (Phase C.2 commit `e318d3eb`)는 `--no-verify` 우회 — 다른 세션 calibration-errors.ts tsc 에러 차단 회피, 추후 정상 commit 시 검증 통과 필요.

- [ ] **[2026-05-06 srp 후속] 🟡 MEDIUM checkout-equipment-row-extraction (Phase C.1)** — `apps/frontend/components/checkouts/CheckoutEquipmentRow.tsx` 신설 + 158라인 row JSX 이전 + `React.memo` 적용 + IME 가드 보존. CheckoutGroupCard 578→≤420 라인 목표 (current). 신규 spec 1건. e2e 회귀 0 (group-indeterminate). 트리거: row 인터랙션 추가 또는 그룹 내 row 100+ 시 가상화 검토.
- [ ] **[2026-05-06 srp 후속] 🟡 MEDIUM approvals-mutation-decomposition (Phase B)** — Phase B.1 (`use-approvals-item-mutations.ts` — approve + reject useOptimisticMutation) + Phase B.2 (`use-approvals-bulk-mutations.ts` — comment-required 분기 + partial-failure toast) + Phase B.3 (`use-approval-row-transitions.ts` — processingIds/exitingIds setTimeout 머신) + Phase B.4 (`ApprovalCommentDialog.tsx` mode='single'|'bulk' 통합) + Phase B.5 (ApprovalsClient 인라인 4 mutation + 2 Dialog JSX 제거). ApprovalsClient 701→≤320 라인 목표. 신규 hook spec 4건. e2e 회귀 0 (wf-ap02-approvals-bulk-reject + cas-409). 트리거: ApprovalsClient mutation 동작 변경 또는 approval enter-exit animation 회귀 시.
- [ ] **[2026-05-06 srp 후속] 🟢 LOW srp-decomposition-axe-storybook** — Phase C.1 + Phase B 완료 후 axe-core scan 4 신규 컴포넌트 0 violation 검증 + Storybook story 등록. 트리거: 위 두 sprint 완료 후.

### 2026-04-26 harness: Sprint 3.1~3.2 BFF + queryKeys 계층 SHOULD 후속

- [ ] **[2026-04-26 sprint-3.1] 🟢 LOW inbound-overview-module-boundary** — `checkoutsService.getInboundOverview()`가 `RentalImportsService`를 직접 주입. 향후 반입 도메인이 별도 모듈로 분리될 경우 circular dependency 가능. BFF Gateway 패턴(독립 BFF 모듈) 검토 필요(S6). 트리거: 반입 도메인 대규모 리팩토링 시.

### 2026-04-26 harness: Sprint 2.4 tab-badge alert variant SHOULD 후속

- [ ] **[2026-04-26 sprint-2.4] 🟢 LOW en-overdueclear-translation-spec** — `en/checkouts.json` `emptyState.overdueClear.title` = `"No Overdue Checkouts"` (현재) vs 컨트랙트 스펙 `"No overdue items"`. 대소문자·의미 불일치. Sprint 2.3 구현 당시 의도적으로 다른 프레이밍 선택. 사용자 확인 후 보정 또는 컨트랙트 업데이트 필요. 트리거: i18n 리뷰 세션.

### 2026-04-26 harness: Sprint 2.1·2.2 Row 토큰 누수 봉합 SHOULD 후속

- [ ] **[2026-04-26 sprint-2.1-2.2] 🟡 MEDIUM purpose-bar-return-to-vendor-color** — `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` 현재 `bg-brand-neutral` 가안. 디자인 팀과 return_to_vendor 목적 색상 확정 후 수정 필요. 트리거: 디자인 리뷰 시 또는 return_to_vendor 반출 UI 실제 노출 전.

### 2026-04-17 harness: QR Phase 1-3 후속 정리

- [ ] **[2026-04-18 completion] 🟢 LOW 실제 브라우저 동선 수동 검증** — playwright-skill로 NC 사진 업로드 + handover QR 흐름 로컬 검증, CSP violation report 수집.
- [ ] **[2026-04-18 completion] 🟢 LOW Drizzle snapshot 재생성** — **OUT OF SCOPE (TTY required)** — `pnpm db:generate`는 Drizzle interactive prompt 입력 필요, non-TTY harness 환경에서 실행 불가. TTY 세션에서 수동 실행 필요.

### 2026-04-17 harness: arch-ci-gate-zod-pilot 후속 (ZodResponse 글로벌 승격)

- [ ] **[2026-04-17 arch-ci-gate-zod-pilot] ZodSerializerInterceptor 글로벌 승격** — 파일럿은 `checkouts.controller.ts` handover 2 메서드에 **메서드 단위** `@UseInterceptors(ZodSerializerInterceptor)`. **승격 조건**: (1) 파일럿 2주 무회귀, (2) `@ZodResponse` 적용 컨트롤러 3+ 개 확보, (3) 외부 OpenAPI 클라이언트/SDK 가 `<Name>` → `<Name>_Output` 접미사 변경 대응 완료. 모두 충족 시 `app.module.ts` 에 `{ provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor }` 등록하고 메서드 단위 등록 제거. 적용 세부 조건: `docs/references/backend-patterns.md` "ZodResponse 적용 조건" 참조.

### 2026-04-22 harness: checkout-lender-guard-p1p3 후속 (verify + review 결과)

- [ ] **[2026-04-22 p1p3] 🟢 LOW RENTAL reject_return 설계 갭 — FSM 명시적 결정 필요** — FSM `reject_return` 전이가 `purposes: CAL_REPAIR`만 허용, RENTAL 제외. RENTAL 반납 검사 실패 시 반려 불가한 도메인 갭. 의도적 설계라면 FSM 주석 추가 권장; RENTAL 반납 반려가 필요하다면 FSM에 rental 추가 + rejectReturn LENDER_TEAM_ONLY 복구 필요. 트리거: 렌탈 워크플로우 설계 검토 시.

### 2026-04-27 harness: dashboard-phase4-6 SHOULD 후속

- [ ] **[2026-04-27 dashboard-phase4-6] 🟢 LOW visual-regression-baseline** — Phase 4.6 스킵. `visual-regression.spec.ts` 미생성 — 5 role × 4 viewport × 3 mode = 60 baseline 스크린샷. 트리거: 디자인 QA Sprint 착수 시 `--update-snapshots`로 초기 캡처.

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

### 2026-05-03 calibration-design-review-phase1 SHOULD 후속 (미완료)

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-form-ocr-template-opinion** — 교정성적서 등록 폼에서 OCR 추출(성적서 이미지 → 자동 입력), 측정값 템플릿(표준 측정 항목 사전 정의), 항목별 의견 저장은 Phase 2 후속 개발 항목. 현재 Phase 1에서 폼 등록 흐름 안내/자동 계산 차기일/결과별 후속 안내까지만 구현. 트리거: 교정 Phase 2 sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟢 LOW calibration-browser-rendering-e2e** — /calibration, /calibration-plans, /calibration-plans/[uuid], /calibration/register 라우트 브라우저 렌더링 런타임 검증 미실시 (Playwright 없음). tsc PASS + 정적 검증만 확인. 트리거: 다음 Playwright E2E sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-measurement-template-ssot** — 장비 분류별 측정 항목/허용오차 템플릿 SSOT와 자동 판정 저장 모델 필요. 현재 결과 segmented UI만 반영. 트리거: 교정성적서 측정값 추적 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.

### 2026-05-06 commit-pipeline-safety SHOULD 후속

> **2026-05-06~07 closure sprint** (`commit-pipeline-safety-should-followups`): S-2/S-3/S-5 + 시니어 자기검토 #2 라운드 갭 closure (BACKEND_MODULE_SCOPES 24→26 + fs-based sync spec).
> S-4 SKIP (트리거 미충족 정직 처리).
> 관련 산출물: `scripts/verify-lint-ruleset-parity.mjs` (packages 도메인 추가),
> `commitlint.config.js` (SCOPE_LIST SSOT 26 backend + 19 meta = 45),
> `scripts/__tests__/commitlint-config.spec.mjs` (fs ↔ SCOPE_LIST 1:1 자동 검증 spec),
> `scripts/hook-timing.mjs` (opt-in 측정),
> `.husky/pre-commit` + `.husky/pre-push` (timing wrapper 통합).

- [SKIP-trigger-not-met] **[2026-05-06 commit-pipeline S-4] 🟢 LOW git-worktree-per-session-adr** ⏸ 트리거 미충족 (2026-05-06 검증) — ADR-0007 §Trigger Conditions 4 조건 현황: (1) **race incident**: 본 월 2건 < 3건 임계값 ❌, (2) **commit 흡수 사고 main 진입**: 0건 (push 전 검증으로 차단됨) ❌, (3) **동시 세션 정기**: 통상 1-2개 < 3개 임계값 ❌, (4) **`verify-lint-ruleset-parity` parity 회귀**: 0회 (도입 후 fail 0) ❌. 0/4 충족 — ADR-0008 신설 비용 (worktree 동기화 모델 + hook 격리 재설계) 대비 실익 0. 현 ADR-0007 hook 가드 + memory feedback (`feedback_lintstaged_other_session_files.md`) 정책으로 충분. 재검토 트리거: 위 4 조건 중 1개라도 충족 시 ADR-0008 sprint 시작. 참조: [`docs/adr/0007-multi-session-working-tree-safety.md`](../../docs/adr/0007-multi-session-working-tree-safety.md#trigger-conditions-for-reconsideration).
- [ ] **[2026-05-07 commit-pipeline followups LOW] 🟢 LOW timing-log-rotation** — `.husky/.timing-log.jsonl` (gitignored) 은 `EMS_HOOK_TIMING_LOG=1` opt-in 시 무한 append. 솔로 dev 환경에서는 운영 압력 낮지만 PoC scaling 시 size/mtime 기반 rotation (10MB or 30 days) 정책 필요. SSOT: `scripts/hook-timing.mjs` `emitTiming` append 분기에 rotation 로직 추가 또는 별도 `scripts/timing-log-rotate.mjs` cron job. 트리거: log 파일 size 5MB 초과 또는 다중 PC + CI 시간 추적 활성화 시.
- [ ] **[2026-05-07 commit-pipeline followups LOW] 🟢 LOW claude-md-backend-modules-count-update** — CLAUDE.md `### Backend Modules (24)` 헤더 + 표가 stale (실제 26개: `inspection-form-templates`, `security` 누락). commitlint SCOPE_LIST 는 fs-sync spec 으로 잠겼지만 CLAUDE.md 는 docs SSOT — 별도 commit 으로 분리 처리 권고 (본 sprint M-15 scope 외 회피). 트리거: 다음 docs sprint 또는 신규 모듈 추가 시 자동 발견.
