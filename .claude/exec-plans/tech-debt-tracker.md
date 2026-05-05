# Tech Debt Tracker

harness 세션에서 이연된 SHOULD 실패·후속 작업을 누적 관리한다.
완료 항목은 `tech-debt-tracker-archive.md`로 이동.


## Open

### 2026-05-05 query-dto-validation-ssot 후속 (Mode 2 harness 발견)

- [ ] **[2026-05-05 query-dto S-1 후속] 🟢 LOW parsesortstring-helper-deprecation** — `apps/backend/src/common/utils/sort.ts`의 `parseSortString` / `sortByField` / `getProperty` 헬퍼는 mapper 도입 후 사용처 0건. 옵션 (a) 파일 삭제 (확실히 unused — `grep -rn "parseSortString\\|sortByField" apps/backend/src` 결과 0), (b) deprecated 주석. 트리거: cleanup sprint.
- [ ] **[2026-05-05 query-dto MEDIUM 후속] 🟡 MEDIUM csv-token-enum-validation** — `statuses`/`methods`/`roles`/`teams`/`ids` 등 CSV 다중값 필드는 현재 `optionalTrimmedString(LONG_CSV_MAX_LENGTH)`만 적용 — 토큰 단위 enum 검증은 service-layer 위임. service에서 `CHECKOUT_STATUS_VALUES.includes(token)` 화이트리스트 강제 누락 시 unknown status 토큰이 silent 무시. 옵션 (a) Zod `z.string().transform(s => s.split(',')).pipe(z.array(StatusEnum))` 단일 파이프 (b) service helper `parseCsvEnum<T>(csv, allowedValues)` SSOT. 트리거: unknown token으로 인한 실제 incident 또는 정기 sprint.
- [ ] **[2026-05-05 query-dto LOW 후속] 🟢 LOW sort-rejection-telemetry** — sort enum reject (unknown field / SQL injection 시도)는 현재 422만 반환하고 logging 없음. SIEM 연계 시 sort field rejection을 보안 이벤트로 telemetry. trigger: 보안팀 SIEM 통합 sprint.
- [ ] **[2026-05-05 query-dto MEDIUM 후속] 🟡 MEDIUM audit-report-query-trim-max** — `apps/backend/src/modules/audit/dto/audit-log-query.dto.ts`(startDate/endDate/cursor)와 `reports/dto/report-query.dto.ts`(status/period 등)는 본 sprint에서 명시적으로 제외 (별도 정책). pagination cursor 형식 + 보고서 도메인별 enum 결정 후 동일 SSOT 패턴 적용. 트리거: audit/reports 도메인 sprint.
- [ ] **[2026-05-05 query-dto SHOULD] 🟢 LOW notifications-teams-default-sort-spec** — notifications.service / teams.service는 본 sprint에서 sort 처리를 신규 도입 (이전엔 하드코딩 `desc(createdAt)` / `orderBy(name)`). default sort 의도 보존이 명시 spec으로 잠겨있지 않음. 단위 spec에서 `findAllForUser({})` → ORDER BY createdAt DESC 결과 검증 추가. 트리거: 회귀 발견 시.

### 2026-05-01~02 disposal-zod 후속 — RejectModal SSOT 통합 + 시스템 전반 보안 강화 (재구조화)

본 세션은 frontend가 이미 `≥ 10` 강제 중인 disposal/calibration-plan 2개 도메인만 backend Zod 격상 (Tier 1 안전). 시니어 자기검토 결과 단순 도메인별 페어링 sprint(7건)는 단편 누적이라 판단 — 진정한 시스템적 해결은 **RejectModal SSOT 컴포넌트로 통합** + 시스템 전반 Zod 가드 일괄 적용.

#### 시스템적 통합 sprint (Mode 2 권장)

#### 별도 ADR 필요

- [ ] **[2026-05-02 system-arch] 🟡 MEDIUM backend-zod-error-message-i18n-adr** — backend `VM.string.min('field', N)` 응답이 한국어 하드코딩. frontend locale=en이어도 backend 한국어 그대로. 옵션 (a) `Accept-Language` 헤더 기반 backend i18n (b) error code 반환 + frontend 번역 (c) 현 상태 유지(한국 단일 운영 확정). ADR 결정 필요. 트리거: 다국어 운영 결정 시.

### 2026-04-30 sprint45-should-residual 후속 (Mode 2 harness 발견)

- [ ] **[2026-04-30 sprint-4.5 S6 후속] 🟢 LOW help-faq-content-authoring** — `messages/{ko,en}/help.json` 4 섹션 (checkout/calibration/nonConformance/permissions) placeholder만 등록. 운영팀과 협의 후 실제 FAQ 카피 작성 + 섹션 anchor 키 동기화. `feedback_no_fabricate_domain_data.md` 정책에 따라 카피 생성 금지 — 사용자/운영팀 입력 후 별도 작업. 트리거: 운영팀 FAQ 콘텐츠 공급.

### 2026-05-05 bulk-selection-tabs-integration 후속 (Mode 2 harness 발견)

- [ ] **[2026-05-05 bulk-tabs S-3 후속] 🟢 LOW bundle-gate-runner-restoration** — `bundle-gate.mjs` runner가 본 환경에서 부재 (과거 PR-11에서 evaluator만 commit, runner는 stash/branch 미상). First Load JS gzip 임계치 자동 검증 재활성화. 트리거: bundle 회귀 incident 또는 정기 점검.
- [x] ~~**[2026-05-05 bulk-tabs UX 후속] 🟡 MEDIUM mutateAsync-ux-consistency**~~ — 2026-05-06 closure. BulkActionBar/CheckoutBulkActionBar 콜백 시그니처 `() => Promise<void>` 강제 + 호출자 `mutate` → `mutateAsync` 전환 + internal try/catch (unhandled rejection 차단). verify-bulk-action-bar Step 12 신설.
- [x] ~~**[2026-05-05 bulk-tabs 테스트 후속] 🟢 LOW checkout-bulk-action-bar-unit-test**~~ — 2026-05-06 closure. BulkActionBar.test.tsx + CheckoutBulkActionBar.test.tsx 신규 (7 cases — resolve/reject dialog timing, isPending disabled, aria-hidden, AR-8 canReject 미표시).
- [ ] **[2026-05-05 bulk-tabs perf 후속] 🟢 LOW filters-key-memoization** — OutboundCheckoutsTab `filtersKey = JSON.stringify(filters)` 매 렌더 호출. `useMemo`로 stable 참조 + `useRowSelection.resetOn` deps 안정화. 트리거: 큰 filters 객체로 perf 회귀 시.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 통합. UL-QP-18 receive workflow 정의 + 권한 매트릭스(borrower 측 receive scope) 확정 후 별도 sprint. 트리거: receive UX 운영 요구사항 발생.
- [ ] **[2026-05-05 bulk-tabs scope 후속] 🟡 MEDIUM checkout-bulk-extended-actions** — bulk-cancel / bulk-return / bulk-borrower-approve / bulk-borrower-reject backend endpoint + frontend wiring. 단건 endpoint의 fail-close 순서 (scope→FSM→domain) 그대로 활용 가능 (Promise.allSettled 패턴). 트리거: 운영 요구사항 발생.
- [ ] **[2026-05-05 bulk-tabs spec 후속] 🟢 LOW spec-stale-comment-cleanup** — `outbound-bulk-action.spec.ts` 143줄 주석에 구버전 키 경로(`checkouts.toasts.bulkApproveAll`) 잔존 가능. `bulk.approveAll`로 정정. 트리거: 다음 e2e 스킴 변경 시 일괄.
- [ ] **[2026-05-06 bulk-tabs 시니어 자기검토 #2 후속] 🟡 MEDIUM tab-component-split-sprint** — `OutboundCheckoutsTab.tsx` 789줄 + `ApprovalsClient.tsx` 700줄 + `CheckoutGroupCard.tsx` 606줄. SRP 위반 — list query / stat cards / pagination / bulk selection / mutation 5책임이 단일 컴포넌트 집중. 분리 plan: `useCheckoutsListQuery` hook + `useCheckoutBulkMutations` hook + `<CheckoutsListPagination />` + `<CheckoutsStatsGrid />` 추출. ApprovalsClient도 동일 패턴. 트리거: 회귀 발견 또는 신규 책임 추가 sprint 진입 시.
- [ ] **[2026-05-06 bulk-tabs verify-implementation 레거시 후속] 🟢 LOW checkoutgroupcard-effective-role-and-dday-ssot** — `CheckoutGroupCard.tsx` 2 레거시 위반 (sprint45 이전 코드, 본 sprint 변경 무관 — verify-implementation 스캔으로 발견). (a) line 135 `session?.user?.role` 직접 참조 → `useEffectiveRole().effectiveRole` 교체 (시뮬레이션 모드 미반영 위험, verify-ssot Step 37). (b) lines 60-66 `calculateDaysRemaining` 로컬 재정의 → `import { calculateDaysRemaining } from '@/lib/utils/dday-utils'` 교체 (로컬 `Math.ceil` vs SSOT `Math.round` 결과 차이 가능, verify-ssot Step 56). 트리거: CheckoutGroupCard 후속 sprint 진입 또는 시뮬레이션 모드 회귀 보고 시.
- [ ] **[2026-05-06 bulk-tabs verify-ssot WARN 후속] 🟢 LOW outbound-direction-literal-ssot** — `OutboundCheckoutsTab.tsx` lines 218/228/282/317의 `direction: 'outbound'` 리터럴 4건 (sprint45 이전 코드). `CheckoutDirectionValues.OUTBOUND` (`@equipment-management/schemas`) 미경유. `checkout-api.ts` line 229의 `CheckoutQuery.direction: 'outbound' \| 'inbound'` 타입 자체도 SSOT 미사용 — 타입 + 사용처 동시 정정 필요. 트리거: checkout-api 다음 변경 sprint.
- [ ] **[2026-05-06 bulk-tabs verify-e2e WARN 후속] 🟢 LOW outbound-bulk-spec-polling-cleanup** — `tests/e2e/checkouts/outbound-bulk-action.spec.ts` EXT-2의 `await page.waitForTimeout(1500)` (invalidate 후 refetch 안정화) — verify-e2e Step 4 "≤1000ms 쌍 패턴" 예외 미해당. `await expect(rowCheckboxes).toHaveCount(initialCount - 5, { timeout: 5000 })` 폴링으로 대체. 트리거: e2e 다음 sprint 또는 회귀.


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
