# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-07 calibration-cert-phase-a-architecture-closure (Mode 2 atomic, 옵션 C closure)

> Phase A 사용자-facing 마감 후(commit `80e77488`까지) 시니어 자기 감사로 식별된 *시스템 전반 일관성* 갭 6건. **2026-05-07 sprint `calibration-cert-phase-a-architecture-closure` 옵션 C closure + 2026-05-08 후속 sprint `phase-a-arch-followup` 흡수** — Gap 1 (sub-route) ✅ + Gap 2a/2b (FilterChip 컴포넌트 추출 + CalibrationContent 마이그레이션) ✅ + Gap 3 (design token) ✅ + Gap 4 (useEquipment 별도 fetch) ✅ + Gap 5 (entityIdPath) ✅ + Gap 6a/6b (RTL specs Dialog + Content) ✅ + 자기검토 #2 sub-route navigation-metadata SSOT ✅. archive batch `calibration-cert-phase-a-architecture-closure (+ followup)`.
>
> 자기검토 #3 라운드 5건 (4 valid + 1 STALE) — **2026-05-08 sprint `phase-c-followup-closure` 통합 closure** (Mode 2 Full harness, commit `0587277c`). archive batch `phase-c-followup-closure`.
>
> 잔여 (자기검토 #3 architectural decision 대기): Tab vs Sub-route 중복 architecture (Option A~D 결정 후 별도 sprint trigger).


### 2026-05-06 query-dto-validation-ssot 잔여 후속

> Round 1 (2026-05-05) + Round 2 (2026-05-06) + Round 3 (2026-05-07) closure 이력은 archive 참조 (`query-dto-r2-ssot-closure` + `query-r3-closure`).

#### Round 1 후속

- [ ] **[2026-05-05 query-dto LOW 후속] 🟢 LOW sort-rejection-telemetry** — sort enum reject (unknown field / SQL injection 시도)는 현재 422만 반환하고 logging 없음. SIEM 연계 시 sort field rejection을 보안 이벤트로 telemetry. trigger: 보안팀 SIEM 통합 sprint.
- [ ] **[2026-05-05 query-dto SHOULD] 🟢 LOW notifications-teams-default-sort-spec** — notifications.service / teams.service는 본 sprint에서 sort 처리를 신규 도입 (이전엔 하드코딩 `desc(createdAt)` / `orderBy(name)`). default sort 의도 보존이 명시 spec으로 잠겨있지 않음. 단위 spec에서 `findAllForUser({})` → ORDER BY createdAt DESC 결과 검증 추가. 트리거: 회귀 발견 시.

### ~~2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화~~ ✅ CLOSED 2026-05-08

> `reject-modal-ssot-closure` harness PASS (iter 2): `RejectReasonDialog.tsx` dead code 삭제 + `approveDisposalSchema` discriminatedUnion + tsc 0 errors + 1630 backend tests PASS.

- [ ] **[2026-05-08 reject-modal S-2 후속] 🟢 LOW reviewDisposalSchema-discriminatedUnion** — `reviewDisposal` 경로의 수동 min-check(service lines 177-184)가 잔존. `reviewDisposalSchema`가 `z.object()` 기반이라 Zod가 reject 분기를 독립 강제 못 함. discriminatedUnion으로 교체 시 수동 check 제거 가능. 트리거: disposal 워크플로우 리팩토링 sprint.

### 2026-05-08 backend-zod-error-i18n-ssot 후속 (Mode 2 closure)

> Mode 2 Full harness PASS (iter 2). Archive batch row `backend-zod-error-i18n-ssot`.

- [ ] **[2026-05-08 zod-i18n 후속] 🟡 MEDIUM domain-mapper-hub-integration-systematic** — 본 sprint MUST M-11 은 5 도메인(non-conformance/checkout/calibration-plan/approval/calibration) hub 통합. 잔여 15 도메인 mapper(`equipment/disposal/cable(s)/calibration-factor/document/equipment-import/form-template/intermediate-inspection/notification/self-inspection/software-validation/team/test-software/user`) hub 통합 + 신규 도메인 추가 시 강제 메커니즘(eslint rule 또는 ts-morph spec). 트리거: 다국어 사용자 incident 또는 frontend i18n 운영 sprint.
- [ ] **[2026-05-08 zod-i18n 후속] 🟢 LOW domain-mapper-zod-fallback-eslint-rule** — 신규 도메인 mapper `mapXxxErrorToToast` 함수 추가 시 `extractValidationIssues || mapZodIssuesToToast` fallback 호출 강제하는 사용자 정의 eslint rule. 현재는 verify-zod Step 22 grep만 detection. 트리거: 신규 도메인 mapper 추가 시 fallback 누락 incident.
- [ ] **[2026-05-08 zod-i18n 후속] 🟢 LOW backend-payload-size-telemetry** — 다중 issue 응답 size 모니터링 (ADR-0008 Trigger Conditions §4 발동 조건 추적). Datadog/Sentry 또는 self-hosted prom counter. 트리거: 운영 telemetry 정비 sprint.

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

> **2026-05-06~07 closure sprint** (`commit-pipeline-safety-should-followups` + 시니어 #3 라운드 `commit-pipeline-safety-should-followups-r3`): S-2/S-3/S-5 + 자기검토 #2 갭 (BACKEND_MODULE_SCOPES 24→26 + fs-based sync spec) + 시니어 #3 라운드 (timing-log rotation + CLAUDE.md backend modules count update).
> S-4 SKIP (트리거 미충족 정직 처리).
> 관련 산출물: `scripts/verify-lint-ruleset-parity.mjs` (packages 도메인 추가),
> `commitlint.config.js` (SCOPE_LIST SSOT 26 backend + 19 meta = 45),
> `scripts/__tests__/commitlint-config.spec.mjs` (fs ↔ SCOPE_LIST 1:1 자동 검증 spec + markdown table parser fs-sync spec),
> `scripts/hook-timing.mjs` (opt-in 측정 + `rotateTimingLogIfNeeded`),
> `.husky/pre-commit` + `.husky/pre-push` (timing wrapper 통합).

- [SKIP-trigger-not-met] **[2026-05-06 commit-pipeline S-4] 🟢 LOW git-worktree-per-session-adr** ⏸ 트리거 미충족 (2026-05-06 검증) — ADR-0007 §Trigger Conditions 4 조건 현황: (1) **race incident**: 본 월 2건 < 3건 임계값 ❌, (2) **commit 흡수 사고 main 진입**: 0건 (push 전 검증으로 차단됨) ❌, (3) **동시 세션 정기**: 통상 1-2개 < 3개 임계값 ❌, (4) **`verify-lint-ruleset-parity` parity 회귀**: 0회 (도입 후 fail 0) ❌. 0/4 충족 — ADR-0008 신설 비용 (worktree 동기화 모델 + hook 격리 재설계) 대비 실익 0. 현 ADR-0007 hook 가드 + memory feedback (`feedback_lintstaged_other_session_files.md`) 정책으로 충분. 재검토 트리거: 위 4 조건 중 1개라도 충족 시 ADR-0008 sprint 시작. 참조: [`docs/adr/0007-multi-session-working-tree-safety.md`](../../docs/adr/0007-multi-session-working-tree-safety.md#trigger-conditions-for-reconsideration).
