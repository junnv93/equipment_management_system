# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 batch 이력은 [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md) 참조 (Open SHOULD 항목은 본 파일 유지).
완료 항목 및 빈 sprint 헤더는 본 문서에서 제거한다.


## Open

### 2026-05-07 calibration-cert-phase-a-architecture-closure (Mode 2 atomic, 옵션 C closure)

> Phase A 사용자-facing 마감 후(commit `80e77488`까지) 시니어 자기 감사로 식별된 *시스템 전반 일관성* 갭 6건. **2026-05-07 sprint `calibration-cert-phase-a-architecture-closure` 옵션 C closure + 2026-05-08 후속 sprint `phase-a-arch-followup` 흡수** — Gap 1 (sub-route) ✅ + Gap 2a/2b (FilterChip 컴포넌트 추출 + CalibrationContent 마이그레이션) ✅ + Gap 3 (design token) ✅ + Gap 4 (useEquipment 별도 fetch) ✅ + Gap 5 (entityIdPath) ✅ + Gap 6a/6b (RTL specs Dialog + Content) ✅ + 자기검토 #2 sub-route navigation-metadata SSOT ✅. archive batch `calibration-cert-phase-a-architecture-closure (+ followup)`.
>
> 자기검토 #3 라운드 5건 (4 valid + 1 STALE) — **2026-05-08 sprint `phase-c-followup-closure` 통합 closure** (Mode 2 Full harness, commit `0587277c`) + **2026-05-09 라운드 #2 systemic gap 2건 closure** (commit `e410f275` — sentinel `_all` 통일 + BasicInfoTab hook) + **2026-05-09 라운드 #3 systemic SSOT closure** (commit `a0ecb671` — EquipmentTabFooterLink 컴포넌트 + 메인 calibration sentinel `_all` 5 필터 통일). archive batch `phase-c-followup-closure (+ r2/r3)`.
>
> 잔여 (자기검토 #3 architectural decision 대기): Tab vs Sub-route 중복 architecture (Option A~D 결정 후 별도 sprint trigger). **2026-05-09 sprint `tab-subroute-architecture-decision-closure` closure** — ADR-0009 Option C 공식 채택 + CalibrationHistorySection SSOT fix + 5 tab JSDoc 보강.

### 2026-05-08 disposal-zod 잔여 후속

- [ ] **[2026-05-08 reject-modal S-2 후속] 🟢 LOW reviewDisposalSchema-discriminatedUnion** — `reviewDisposal` 경로의 수동 min-check(service lines 177-184)가 잔존. `reviewDisposalSchema`가 `z.object()` 기반이라 Zod가 reject 분기를 독립 강제 못 함. discriminatedUnion으로 교체 시 수동 check 제거 가능. 트리거: disposal 워크플로우 리팩토링 sprint.

### 2026-05-09 verify-impl-preexisting-ssot-closure 후속 (Step 28)

- [ ] **[2026-05-09 step28-S-1] 🟢 LOW MaintenanceHistoryTab brand 인라인 리터럴** — `text-brand-warning`(L275), `text-brand-info`(L289/L313), `bg-brand-ok text-white`(L326) 4건 JSX className 직접 리터럴(Step 28 위반). `TIMELINE_TOKENS`에 노드/아이콘 색상 토큰 추가 후 경유. `IncidentHistoryTab getIncidentTypeNodeColor()` 참고. 트리거: equipment-timeline token 리팩토링 sprint.

### 2026-05-09 three-low-tech-debt-closure 후속 (SHOULD)

- [ ] **[2026-05-09 three-low S-1] 🟢 LOW sort-rejection-telemetry-cluster-mode** — `SortRejectionTelemetryService` 단일 인스턴스 가정 in-memory rate limiter + dedupe Map. PM2 cluster / K8s replicas 배포 시 instance 별 60건 = 클러스터 전체 N×60 logging 폭주 가능. system-health Redis Lua atomic counter 패턴 차용 격상 (`SystemHealthRateLimiter` 인터페이스 재사용 후보). 트리거: cluster 배포 결정 시.
- [ ] **[2026-05-09 three-low S-3] 🟢 LOW sort-rejection-prometheus-counter** — 현재 `SortRejectionTelemetryService` 는 `Logger.warn` 만 — SIEM ingest 가능하나 Prometheus 대시보드/alert 미보유. `MetricsService.observeSortRejection({route, reason})` Counter 추가 (예: `sort_rejection_total{route, reason}`) 시 Grafana alert + p95 모니터링 가능. cardinality 통제 (route 마스킹 이미 구현, reason 3 enum). 트리거: 운영 SIEM/Grafana 통합 sprint.

### 2026-05-08 zod-i18n-mapper-hub-closure 후속 (SHOULD S-4)

> **2026-05-09 sprint `zod-hub-should-s4-followups` closure**: alert-rule + e2e-toast ✅ 완료. ESLint 마이그레이션 [SKIP-trigger-not-met] 정직 처리 (4 조건 평가 1/4 충족). archive batch `zod-hub-should-s4-followups`.

- [SKIP-trigger-not-met] **[2026-05-08 zod-hub S-4 후속] 🟢 LOW zod-fallback-eslint-custom-rule-migration** ⏸ 트리거 미충족 (2026-05-09 평가) — 4 조건 현황: (1) **신규 도메인 mapper 추가 횟수 (2026-05-08~)**: 0/3 ❌ — `zod-i18n-mapper-hub-closure` ratification 후 신규 mapper 0건. (2) **ts-morph spec 회귀 검출 능력**: 17 도메인 100% 커버, jest 실행 < 1s — 충분 ✅. (3) **ESLint custom rule 도입 비용**: TS AST 기반 rule + 단위 테스트 + plugin 등록 ≥ 100 LOC + 유지보수 부채 — 상당 ⚠️. (4) **편집기 실시간 피드백 가치**: 신규 mapper 추가 시점에만 의미. 현 워크플로 (`pnpm test` 자동 실행) 와의 격차 < 5초 — 한계적 ⚠️. → 1/4 충족 + over-engineering risk → SKIP. ts-morph spec SSOT 유지. 재검토 트리거: 신규 도메인 mapper 추가 3회 이상 누적 시. `commit-pipeline-safety S-4` (2026-05-06) `[SKIP-trigger-not-met]` 패턴 답습.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

- [ ] **[2026-05-05 bulk-tabs perf 후속] 🟢 LOW filters-key-memoization** — OutboundCheckoutsTab `filtersKey = JSON.stringify(filters)` 매 렌더 호출. `useMemo`로 stable 참조 + `useRowSelection.resetOn` deps 안정화. 트리거: 큰 filters 객체로 perf 회귀 시.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.

### 2026-05-09 srp-decomposition-final-closure 후속 (SHOULD)

- [ ] **[2026-05-09 srp-final S-2] 🟢 LOW approvals-invalidation-keys-ssot** — `use-approvals-item-mutations.ts`와 `use-approvals-bulk-mutations.ts` 각각에 `getInvalidationKeys` useCallback이 중복 정의. `apps/frontend/lib/api/approvals-invalidation.ts` 헬퍼로 추출 시 두 훅이 공유 가능. 현재 동작 올바름 — SSOT 선택적 개선. 트리거: 승인 쿼리키 구조 변경 또는 세 번째 소비자 추가 시.

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

> **2026-05-09 sprint `system-health-should-4items-closure` 완전 종결**: Item 1 (stale comment) ✅ + Item 2 (retention scheduler `SystemErrorEventsRetentionScheduler` @Cron 90일) ✅ + Item 3 (BullMQ `BullmqBacklogProviderImpl` + `QUEUE_STRATEGY` useFactory) ✅ + Item 4 (`@sentry/node` 정식 의존성 + 정적 import 전환) ✅. archive batch `system-health-should-4items-closure`.

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

