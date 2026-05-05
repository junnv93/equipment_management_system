# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.

## Batch 이력

> 2026년 4월 배치 이력 → [tech-debt-tracker-archive.md](tech-debt-tracker-archive.md)

| Batch | 처리일 | 항목 수 | 상태 |
|-------|--------|---------|------|
| disposal-zod-defense-in-depth | 2026-05-01 | 5 | 완료 |
| disposal-service-fail-close | 2026-05-02 | 2 | 완료 |
| error-codes-ssot-system-wide | 2026-05-02 | 15 | 완료 |
| tier-2-rejectmodal-ssot-integration | 2026-05-02 | ~38 | 완료 |
| equipment-reject-zod-fail-close-hardening | 2026-05-02 | 3 | 완료 |
| rejection-reason-notfound-systemic-closure | 2026-05-02 | 16 | 완료 |
| tier2-fsm-invalid-status-transition | 2026-05-02 | 26 | 완료 |
| 2026-05-03 batch (12 sprints) | 2026-05-03 | 12 | 완료 |
| quality-audit-ssot | 2026-05-03 | 11 | 완료 |
| data-migration-preview-windowing | 2026-05-03 | 6 | 완료 |
| security-auditable-revocation-comment | 2026-05-03 | 0 | 완료 |
| calibration-action-button-aria-labels | 2026-05-03 | 4 | 완료 |
| document-file-frontend-error-mapper | 2026-05-03 | 6 | 완료 |
| inspection-template-frontend-error-mapper | 2026-05-03 | 5 | 완료 |
| frontend-test-final-run | 2026-05-03 | 0 | 완료 |
| verify-implementation-orphan-skills-registration | 2026-05-03 | 1 | 완료 |
| disposal-review-calibration-reject-fail-close | 2026-05-03 | 2 | 완료 |
| inspection-template-analytics-events | 2026-05-03 | 4 | 완료 |
| inspection-template-feature-flag | 2026-05-03 | 4 | 완료 |
| lab-manager-explicit-permission-spec-closure | 2026-05-03 | 0 | 완료 |
| create-test-equipment-token-deprecation-closure | 2026-05-03 | 0 | 완료 |
| sidebar-nav-aria-key-literal-union | 2026-05-03 | 3 | 완료 |
| sidebar-row-container-li-semantics | 2026-05-03 | 0 | 완료 |
| disposal-opinion-comment-zod-min10-defense-closure | 2026-05-03 | 1 | 완료 |
| nc-design-review-phases-eslint-disable-cleanup | 2026-05-03 | 1 | 완료 |
| checkouts-pending-hero-priority | 2026-05-03 | 2 | 완료 |
| eslint-require-randomuuid-alias-guard | 2026-05-03 | 1 | 완료 |
| playwright-trace-on-failure-policy | 2026-05-03 | 2 | 완료 |
| second-skip-link-row1-closure | 2026-05-03 | 0 | 완료 |

### 2026-05-03 harness: calibration-design-review-phase1 후속

- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-certificate-ocr-api** — 교정성적서 PDF/OCR 추출 API와 기관별 룰 기반 필드 매핑 필요. 현재 1차 구현은 UI 안내만 반영. 트리거: 교정성적서 등록 정확도 개선 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-measurement-template-ssot** — 장비 분류별 측정 항목/허용오차 템플릿 SSOT와 자동 판정 저장 모델 필요. 현재 결과 segmented UI만 반영. 트리거: 교정성적서 측정값 추적 Sprint.
- [ ] **[2026-05-03 calibration-design-review-phase1] 🟡 MEDIUM calibration-plan-item-comments** — 교정계획 상세 항목별 검토 의견 저장/해결 API와 inline comment UI 필요. 현재 상세 메타/결재 맥락만 반영. 트리거: 교정계획 상세 리뷰 UX Sprint.
| analytics-events-registry-production-callers | 2026-05-03 | 3 | 완료 |
| checkout-row-onclick-callback | 2026-05-03 | 1 | 완료 |
| charscounter-min-mode-disposal | 2026-05-03 | 7 | 완료 |
| stagger-low-spec-guard | 2026-05-03 | 3 | 완료 |
| groupcard-usecallback-t-scan | 2026-05-03 | 0 | 완료 |
| checkout-zone2-status-truncate-closure | 2026-05-03 | 0 | 완료 |
| nextauth-csrf-verify-harness | 2026-05-05 | 2 | 완료 |

---

## Open

### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 시스템적 통합 sprint (Mode 2 권장)

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [x] ~~**[2026-04-30 sprint-4.5 S3 후속] 🟡 MEDIUM checkouts-tab-bulk-selection-integration**~~ — **2026-05-05 완료** (`bulk-selection-tabs-integration` Mode 2 harness, 2 iter PASS). OutboundCheckoutsTab 통합 (Inbound는 receive flow 도메인 비대상으로 별도 sprint 분리). bulk approve + reject (backend 기존 endpoint, 신규 0건). 9 files: CheckoutBulkActionBar 신설 + CheckoutGroupCard row 체크박스 + applyGroupToggle SSOT 헬퍼 + analytics SSOT 호출 + i18n bulk.* 11키 응집 + e2e spec. 26 unit tests / tsc / lint / build PASS.
- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

- [ ] **[2026-05-05 bulk-tabs S-3 후속] 🟢 LOW bundle-gate-runner-restoration** — `bundle-gate.mjs` runner가 본 환경에서 부재 (과거 PR-11에서 evaluator만 commit, runner는 stash/branch 미상). First Load JS gzip 임계치 자동 검증 재활성화. 트리거: bundle 회귀 incident 또는 정기 점검.
- [ ] **[2026-05-05 bulk-tabs UX 후속] 🟡 MEDIUM mutateAsync-ux-consistency** — ApprovalsClient + OutboundCheckoutsTab의 BulkActionBar가 `await onBulkApprove()` 호출하지만 콜백이 `() => void` (mutate fire-and-forget)라 await 무의미 → AlertDialog가 API 응답 전 즉시 close, isPending visual feedback 손실. 전 도메인 onBulkApprove/Reject 콜백 시그니처 `() => Promise<void>` 강화 + `mutateAsync` 전환. 트리거: 사용자 UX 피드백 또는 별도 sprint.
- [ ] **[2026-05-05 bulk-tabs 테스트 후속] 🟢 LOW checkout-bulk-action-bar-unit-test** — `CheckoutBulkActionBar.test.tsx` 신규. AlertDialog open/close, RejectModal mode='bulk' 호출, isPending→disabled, aria-hidden=true on selectedCount=0. 트리거: 회귀 발견 시.
- [ ] **[2026-05-05 bulk-tabs perf 후속] 🟢 LOW filters-key-memoization** — OutboundCheckoutsTab `filtersKey = JSON.stringify(filters)` 매 렌더 호출. `useMemo`로 stable 참조 + `useRowSelection.resetOn` deps 안정화. 트리거: 큰 filters 객체로 perf 회귀 시.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM checkout-bulk-extended-actions** — bulk-cancel / bulk-return / bulk-borrower-approve / bulk-borrower-reject backend endpoint + frontend wiring. 단건 endpoint의 fail-close 순서 (scope→FSM→domain) 그대로 활용 가능 (Promise.allSettled 패턴). 트리거: 운영 요구사항 발생.
- [ ] **[2026-05-05 bulk-tabs spec 후속] 🟢 LOW spec-stale-comment-cleanup** — `outbound-bulk-action.spec.ts` 143줄 주석에 구버전 키 경로(`checkouts.toasts.bulkApproveAll`) 잔존 가능. `bulk.approveAll`로 정정. 트리거: 다음 e2e 스킴 변경 시 일괄.

### 2026-04-30 Checkouts V3 Sprint 4.5 T1+T2 SHOULD/Architecture Concerns


### 2026-04-30 deps-supply-chain-hardening 후속

#### 후속 (본 세션 2026-04-28에서 발견)

### 2026-04-28 checkouts-phase4-kpi-hierarchy SHOULD 이연 항목


### 2026-04-29 harness: nextauth-csrf-single-origin SHOULD 후속 (ADR-0006 정착 후 deferred)

- [x] **[2026-04-29 nextauth-csrf §S3] 🟡 MEDIUM docker-compose-onprem-prod-manual-verification** — 완료(2026-05-05 nextauth-csrf-verify-harness): manual `curl` 레시피를 SSOT 자동 스모크로 승격. `pnpm compose:onprem:verify` 진입점(`scripts/onprem-verify.mjs`) + `scripts/diagnostics/csrf-invariants.json` 머신 판독 SSOT + ADR-0006 §Recurrence Response 절 + `infra/ONPREM_DEPLOYMENT.md` 권장 절차 갱신. nginx `lan.conf`는 LAN+onprem 공용임을 명시하는 헤더 주석 추가(rename 회피, blast radius 5+).
- [x] **[2026-04-29 nextauth-csrf §J1] 🟢 LOW phase-0-reproduction-actual-network-trace** — 완료(2026-05-05 nextauth-csrf-verify-harness): manual reproduction 시나리오를 영구 진단 harness로 결빙. `scripts/diagnostics/nextauth-csrf-trace.mjs` (env stack/SW/basePath/proxy 헤더/cookie domain 종합 진단 + JSON artifact `tmp/diagnostics/<ISO>-trace.json`). `scripts/diagnostics/README.md` 1차 응답자 절차 + ADR-0006 본문 link.

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

- [x] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-queue-size-impl** — 종결 2026-05-05 `system-health-data-source-ssot` sprint. `AsyncWorkBacklogProvider` 인터페이스 + `pending-work-aggregate` strategy (prom-client gauge 합산) 도입. BullMQ 도입 시 strategy 교체만으로 확장 가능 (interface 보존).
- [x] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW system-health-error-source-table** — 종결 2026-05-05 `system-health-data-source-ssot` sprint. `system_error_events` 테이블 SSOT + GlobalExceptionFilter 5xx fire-and-forget 캡처 + PII deny-list. Sentry 옵션 sink (DSN-gated, lazy import).
- [x] **[2026-04-28 dashboard-thresholds-ssot] 🟢 LOW dashboard-storage-capacity-env** — 종결 2026-05-05 `system-health-data-source-ssot` sprint. env 를 explicit override 로 격하 + monitoring 서비스의 host-disk(`df`) 측정값을 default fallback 으로 사용. `pg_database_size` 는 별도 `dbSizeBytes` 필드로 분리.

### 2026-05-05 system-health-data-source-ssot 후속 (SHOULD)

- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW system-health-frontend-transparency-fields** — SystemHealthCard 가 `storageBackend` / `queueBackend` / `errorSource` 식별자를 사용자에게 표시 + i18n. 현재는 backend 응답에만 포함. 트리거: 디자인 QA sprint.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW system-error-events-retention-policy** — `system_error_events` 테이블 운영 누적 시 retention 정책 (90 일 보존 + monthly partition). 트리거: 운영 누적 후 또는 첫 monthly review.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW bullmq-async-work-backlog-strategy** — Redis/BullMQ 도입 후 `BullmqBacklogProvider` strategy 추가. interface 는 이미 열림 — `DashboardModule` 의 `useExisting` 만 교체. 트리거: 큐 인프라 sprint.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW sentry-node-dependency-formal-add** — `@sentry/node` 패키지 정식 도입 + production DSN 정책. 현재는 운영자가 직접 설치하는 lazy import 방식. 트리거: 운영 모니터링 정비 sprint.
- [ ] **[2026-05-05 system-health-data-source-ssot] 🟢 LOW verify-ssot-system-health-provider-step** — verify-ssot 스킬에 SystemHealthProvider 컨트랙트 우회 검출 Step 신설. (1) `dashboard.service.ts` 에서 `pg_database_size` / `auditLogs.action.*reject.*cancel` 인라인 호출 0 검증, (2) backend identity 리터럴 (`'host-disk'` 등) 이 production 코드에서 enum import 외 사용 0 검증. 트리거: manage-skills sprint.

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
