# Tech Debt Tracker — 완료 항목 아카이브

harness 세션에서 완료된 SHOULD 실패·후속 작업 기록.
활성 TODO는 [tech-debt-tracker.md](./tech-debt-tracker.md) 참조.

---

## 2026-04-30 — tech-debt-batch-0501 (Mode 1 harness, 4건 + 8 architectural — iter 3)

### tech-debt-batch-0501 — 완료 4건 (9/9 MUST PASS — iter 2) + 8 architectural fix (iter 3)

#### iter 3 — Architecture-level 보강 (사용자 자가감사 후 수행, 8건)

- [x] **[iter3 #1] CAUSE_MAX_LENGTH SSOT 격상** — ✅ NCEditDialog 로컬 상수 `CAUSE_MAX_LENGTH = 500` → `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` import. backend/frontend 동일 SSOT 사용.
- [x] **[iter3 #2] Backend NC Zod defense-in-depth** — ✅ `create-non-conformance.dto.ts` (cause + actionPlan) + `update-non-conformance.dto.ts` (cause + actionPlan + correctionContent) 4 fields에 `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)` 추가. 프론트 클라이언트 우회 시도 차단. 35/35 unit test PASS.
- [x] **[iter3 #3] Disposal hardcoded `>= 10` SSOT 통일** — ✅ DisposalRequestDialog/ApprovalDialog/ReviewDialog 4 hardcoded `>= 10`/`< 10` → `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 통일 (8 hits). RejectModal과 동일 SSOT 정착.
- [x] **[iter3 #4] disposal i18n {min} 파라미터화** — ✅ `charCountMin: "{min}자 이상 입력해주세요 (현재: {count}자)"` (ko) / `"Min {min} characters required (current: {count})"` (en). 호출자에서 `min: VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 전달. 비즈니스가 임계값 변경 시 i18n 수정 불필요.
- [x] **[iter3 #5] ANALYTICS_EVENTS 레지스트리 신설** — ✅ `apps/frontend/lib/analytics/events.ts` 신설 (`ANALYTICS_EVENTS.SIDEBAR_CHECKOUTS_CLICK = 'sidebar.checkouts.click'` + `AnalyticsEventName` union type). 매직 스트링 → typed const SSOT. 이벤트 추가 시 단일 진입점.
- [x] **[iter3 #6] NavRow FRONTEND_ROUTES + ANALYTICS_EVENTS + useCallback** — ✅ `'/checkouts'` 매직 스트링 → `FRONTEND_ROUTES.CHECKOUTS.LIST` SSOT. 이벤트명 → `ANALYTICS_EVENTS.SIDEBAR_CHECKOUTS_CLICK`. 핸들러 inline 클로저 → `useCallback([href, badge])` stable reference. 확장 가능한 `ANALYTICS_PREFIX_MAP` 패턴(다른 도메인 추가 시 매핑 등록만).
- [x] **[iter3 #7] CHAR_COUNTER_TOKENS design-token 신설** — ✅ `lib/design-tokens/form-field-tokens.ts`에 `CHAR_COUNTER_TOKENS = { warningRatio: 0.8, warningClass: 'text-warning', destructiveClass: 'text-destructive' }` 추가. `index.ts` 통해 export. CharsCounter가 매직 넘버/클래스 대신 토큰 import.
- [x] **[iter3 #8] CharsCounter unit test + verify-hardcoding Step 32 확장** — ✅ `components/common/__tests__/CharsCounter.test.tsx` 11 case PASS (임계값 5 + warningRatio override 1 + 텍스트 fallback 2 + a11y 2 + className composition 1). verify-hardcoding Step 32에 'role' 정책(k-anonymity 가드레일) + ANALYTICS_EVENTS 매직 스트링 차단 grep 추가.

#### iter 1-2 — Contract MUST 9/9 (4건)

- [x] **[2026-04-30 setqueryd-purge SHOULD] 🟢 LOW charsCount 5곳 SSOT 통합** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `<CharsCounter>` SSOT 신설(`apps/frontend/components/common/CharsCounter.tsx`, memo + `useTranslations('common')` 내부 + 글로벌 `common.charCountRatio` i18n 키 fallback + 80%/100% 임계값 자동 색상 토글 + `<span class="block">` aria-live `role="status"` + REQUIRED_FIELD_TOKENS.charCount 베이스). NCEditDialog 인라인 `{cause.length} / 500` 제거(CAUSE_MAX_LENGTH 상수 + `<CharsCounter />` children 생략). RejectModal 인라인 삼항분기(`text-warning`/`text-destructive`) 제거(CharsCounter + children에 `t('rejectModal.charsRemaining')` 위임). **설계 결정**: Disposal 3개는 "min-required hint" 시맨틱(`{count}/10자 이상`)으로 본 컴포넌트의 "ratio+warning" 시맨틱과 다름 → 통합 대상은 2곳, Disposal은 i18n 키 정리만.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S7 Sidebar pendingCount 분석 이벤트** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `NavRowWithSecondaryAction.tsx` `track('sidebar.checkouts.click', { pendingCount })` 추가, `href.startsWith('/checkouts')` prefix gate로 다른 nav 클릭 영향 없음. 두 분기(sibling-anchor + single-anchor) 메인 NavLink에 `onClick={handlePrimaryClick}` 연결. PII deny-list 위반 0(pendingCount는 숫자, role 미포함). `lib/analytics/track.ts` SSOT(`app:analytics` CustomEvent dispatch) 첫 sidebar 호출처.
- [x] **[2026-04-30 sprint-4.5 SHOULD 후속] 🟢 LOW verify-bulk-action-bar-step-8-group-header** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `verify-bulk-action-bar/SKILL.md` Step 8(group header indeterminate, `getGroupRowIds`+`deriveGroupSelectionState`+`toCheckboxCheckedProp` SSOT + Radix `data-state="indeterminate"` 자동 `aria-checked="mixed"` 매핑 + grep 검증 명령) + Step 9(격리 fixture page 패턴, `app/(dashboard)/__visual__/<scenario>/page.tsx` 인라인 시드 + 네트워크/세션 의존 0 + grep 검증 명령) 신설. 안티패턴 4종 문서화.
- [x] **[2026-04-30 batch-0501 부수] 🟢 LOW disposal-i18n-namespace-cleanup** — ✅ 2026-04-30 완료 (tech-debt-batch-0501). `disposal.json` 안의 `common.charCount` 키(중첩 `common` 서브네임스페이스가 글로벌 `common.json` 키처럼 보이는 혼동) 제거 + 최상위 `disposal.charCountMin` 신설(ko/en 양쪽). 3개 dialog(DisposalRequestDialog/DisposalApprovalDialog/DisposalReviewDialog) `t('common.charCount')` → `t('charCountMin')` 호출 변경. 글로벌 `common.charCountRatio` 키와 시맨틱 분리 명확화.

---

## 2026-04-30 — tech-debt-batch-0430e (Mode 1 harness, 3건)

### tech-debt-batch-0430e — 완료 3건 (7/7 MUST PASS)

- [x] **[verify-impl-batch-0430d WARN] 🟢 LOW display-preferences-select-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430e). `DisplayPreferencesContent.tsx` 4개 Select 필드를 SSOT 배열 `.map()`으로 교체. `SUPPORTED_LOCALES` / `ITEMS_PER_PAGE_OPTIONS` / `DATE_FORMAT_OPTIONS` / `EQUIPMENT_SORT_OPTIONS` 모두 `@equipment-management/schemas` import. dateFormat UI 렌더링 메타데이터는 컴포넌트 레이어 상수(`DATE_FORMAT_EXAMPLE` / `DATE_FORMAT_I18N_KEY`)로 분리 (SSOT 허용 로컬 UI 옵션).
- [x] **[2026-04-30 sprint-4.5 SHOULD] S8 bulk-reject e2e 테스트** — ✅ 2026-04-30 완료 (tech-debt-batch-0430e). `wf-ap02-approvals-bulk-reject.spec.ts` Step 8(route mock 전체 성공 toast `/건이 반려되었습니다/`) + Step 9(route mock 부분 실패 toast `/건 반려 완료.*건 실패/`) + `finally page.unroute()` 정리. `expectToastVisible` SSOT 활용.
- [x] **[2026-04-29 nextauth-csrf §S1] 🟡 MEDIUM legacy-sw-unregister-e2e-verification** — ✅ 2026-04-30 완료 (tech-debt-batch-0430e). `tests/e2e/features/pwa/legacy-sw-cleanup.spec.ts` TC-01(getRegistrations() 0건) + TC-02(localStorage `__legacy_sw_cleaned_v1` 플래그 '1') + TC-03(재로드 후 플래그 유지 + reload 정책 주석 문서화). ADR-0006 same-origin 확인: 강제 reload 없음 = 의도된 설계.

---

## 2026-04-30 — tech-debt-batch-0430c/d + harness 세션 완료 (57건 아카이브)

### 2026-04-30 Checkouts V3 Sprint 4.5 SHOULD 잔여 — 완료 3건 (sprint45-should-residual harness)

- [x] **[2026-04-30 sprint-4.5 SHOULD] S3 그룹 헤더 indeterminate 체크박스** — ✅ 2026-04-30 완료 (sprint45-should-residual harness, Mode 2). `lib/checkouts/group-selection.ts` SSOT (getGroupRowIds / deriveGroupSelectionState / toCheckboxCheckedProp) + CheckoutGroupCard `selectedRowIds`/`onToggleGroup` 옵셔널 prop API + Radix `data-state="indeterminate"` + IME 가드 + 단위 테스트 19건 (SSOT 10 + 컴포넌트 9) + 격리 fixture page (`__visual__/group-indeterminate`) + e2e 3 시나리오. **부모 통합 미수행** — Outbound/Inbound 탭 통합은 후속 트래커 등록.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S4 D-day 6-level visual regression** — ✅ 2026-04-30 완료 (sprint45-should-residual harness). Storybook 도입 회피, 기존 Playwright `toHaveScreenshot()` 인프라 재사용 (의존성 0). `tests/e2e/visual/dday-6level.spec.ts` 12 baseline (6 level × light/dark). dev-only fixture (`__visual__/dday/page.tsx`) `process.env.NODE_ENV` 가드. SSOT 직접 import (`getCheckoutDdayVisualLevel` / `CHECKOUT_DDAY_VISUAL_THRESHOLDS` / `DDAY_VISUAL_LEVEL_CLASSES`) — 임계값/className 하드코딩 0건. 초기 PNG 캡처 후속 트래커 등록.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S6 EmptyState in-app 도움말 라우팅** — ✅ 2026-04-30 완료 (sprint45-should-residual harness). `FRONTEND_ROUTES.HELP` SSOT (`INDEX` + `TOPIC(key)` 빌더) + `app/(dashboard)/help/page.tsx` Next.js 16 sync Server Component + `messages/{ko,en}/help.json` placeholder (4 sections: checkout/calibration/nonConformance/permissions) + `i18n/request.ts` namespace 등록 + `dashboard/atoms/EmptyState` `secondaryAction` prop 신설 (다른 2 EmptyState는 이미 보유). `mailto:` 사용처(TeamMemberList/MemberProfileDialog)는 도메인 의도 별개로 보존. FAQ 카피는 운영팀 confirm 후 별도(후속 트래커 등록).

### 2026-04-30 Checkouts V3 Sprint 4.5 — 완료 5건

- [x] **[2026-04-30 sprint-4.5] 🟡 MEDIUM checkout-group-card-setQueryData** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `setQueryData` 2건 제거. onMutate `setQueriesData` (optimistic) + onError `invalidateQueries` + CAS 409 `removeQueries(detail)` 3-패턴으로 대체. tsc 0 에러.
- [x] **[2026-04-30 sprint-4.5] 🟢 LOW form-template-spec-pre-existing-tsc** — ✅ 2026-04-30 N/A (tech-debt-batch-0430d). backend tsc 0 에러 확인 — createdAt tsc 오류 사전 해소됨. 16 tests PASS.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S1 BulkActionBar SKILL.md actions slot 표준 명문화** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). verify-implementation SKILL.md Step 22(D1) 문서화: `actions?: React.ReactNode` slot 패턴 + 위반 패턴 grep 명시.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S2 useRowSelection IME 가드** — ✅ 2026-04-30 N/A + 부분 완료 (tech-debt-batch-0430d). use-bulk-selection.ts pre-flight grep 0건 → N/A. 실제 IME 가드는 `use-approval-keyboard.ts:44`에 `if (e.isComposing) return;` 추가 완료.
- [x] **[2026-04-30 sprint-4.5 SHOULD] S9 RejectModal charsRemaining 카운터** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `aria-live="polite"` char counter + `{remaining}자 남음` i18n ko/en. 80%/100% 임계값 색상 (text-amber-600/text-destructive). `REJECTION_MAX_LENGTH` SSOT.

### 2026-04-30 deps-supply-chain-hardening — 완료 9건

- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A3 ci-supply-chain-gate** — ✅ 2026-04-28 완료. `.github/workflows/supply-chain-gate.yml` 신설 (drift-check + dependabot-audit 2 jobs, `--ignore-scripts`로 preinstall 독립 검증).
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A1 mock-providers-identifier-helper** — ✅ 2026-04-28 완료. `createMockIdentifierService()` 헬퍼 추가, verify-ssot Step 44 검증 명령 6번에 mock 등록 grep 추가 + PASS/FAIL 항목 갱신.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A5 identifier-policy-docs** — ✅ 2026-04-28 완료. `docs/references/identifier-policy.md` 63 lines (5 섹션: SSOT 진입점/4 헬퍼/트레이드오프/예외/추가 절차). skills-index.md 인덱스 추가.
- [x] **[2026-04-30 deps-supply-chain] 🔴 IMMEDIATE A6 eslint-no-restricted-imports-crypto** — ✅ 2026-04-28 완료. `apps/backend/.eslintrc.js`에 `no-restricted-imports.paths` (`node:crypto`/`crypto` randomUUID) + `no-restricted-syntax` (`MemberExpression[property.name='randomUUID']`) + identifier.service.ts overrides 추가. 부수: 3 파일을 named import (`createHash`/`randomBytes`)로 좁힘.
- [x] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW main-residual-lint-errors** — ✅ 2026-04-28 완료 (system-wide-completion sprint Phase C1). pre-push hook에 `pnpm --filter backend run lint:ci` + `pnpm --filter frontend run lint` 추가하여 회귀 차단 게이트 보강. 부수: frontend `RouteLoading` deprecated 9건 일괄 SSOT 마이그레이션 + `variant="table"` 4건 → `"list"` 정합화 + `showHeader` prop 4건 제거.
- [x] **[2026-04-29 checkout-url-first-state] 🟢 LOW S6 parseCheckoutCreateParams-unit-test** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase D). `apps/frontend/lib/utils/__tests__/checkout-create-params.test.ts` 신설, 7 케이스 PASS.
- [x] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM A4 dependabot-yml-policy** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). semver-major ignore 28건, versioning-strategy 명시, YAML 파싱 통과.
- [x] **[2026-04-30 deps-supply-chain] 🟡 MEDIUM file-upload-form-template-spec-신설** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d Phase A N/A). 두 spec 모두 이미 존재 + 16 tests PASS.
- [x] **[2026-04-30 deps-supply-chain] 🟢 LOW identifier-negative-test** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase E). `jest.mock('node:crypto', factory)` 패턴으로 non-configurable 프로퍼티 우회. CSPRNG 장애 시 서비스 중단 negative test 추가.

### 2026-04-28 review-architecture skill 권고 — 완료 2건

- [x] **[2026-04-28 review-arch] 🟡 MEDIUM dev-doctor-hint-line-mode** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase B). `scripts/dev-doctor.mjs`에 `--hint-line` CLI mode 추가 + `formatHintLine()` export. `.claude/settings.json` SessionStart hook을 `node scripts/dev-doctor.mjs --hint-line 2>/dev/null || true` 1줄로 단순화.
- [x] **[2026-04-28 review-arch] 🟡 MEDIUM checkout-selectability-physical-ssot** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase A). `checkouts.service.ts` inline `===` 팀 비교 제거, `isPurposeCompatibleWithEquipment` + `USER_SELECTABLE_PURPOSES.includes()` 가드로 교체.

### 2026-04-28 checkouts-phase4-kpi-hierarchy — 완료 2건

- [x] **[2026-04-28 checkouts-phase4] 🟡 MEDIUM dashboard-pending-approval-card-alert-ring-token** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase C). `DASHBOARD_PENDING_APPROVAL_TOKENS.alertRing` 4키(heroFull/priority/compact/full) 신설. `PendingApprovalCard.tsx` 4곳 raw ring 클래스 → 토큰 경유.
- [x] **[2026-04-28 checkouts-phase4] 🟢 LOW heroKPI-atom-react-memo** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase F). `React.memo(function HeroKPI...)` named function expression으로 wrap. displayName 자동 보존.

### 2026-04-29 nextauth-csrf — 완료 1건

- [x] **[2026-04-29 nextauth-csrf §J3] 🟢 LOW verify-routing-origin-pre-commit-hook** — ✅ 2026-04-29 완료. `scripts/verify-routing-origin.sh` 신설(Steps 2-11) + `packages/shared-constants/__tests__/api-routing.spec.ts` 신설(34 invariant tests) + `.husky/pre-push` path-based gate 추가. Evaluator MUST 11/11 PASS.

### 2026-04-30 verify-implementation 발견 — 완료 1건

- [x] **[2026-04-30 verify-impl-batch-0430] 🟢 LOW fetchers-status-literal-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `apps/frontend/lib/api/approvals/fetchers.ts` 리터럴 3건 → `CheckoutStatusValues.PENDING` / `CheckoutPurposeValues.RETURN_TO_VENDOR` / `IntermediateCheckFilterStatusValues.DUE` SSOT 교체.

### 2026-04-27 approvals-ui-r2 DoD — 완료 2건

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-api-module-split** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase A). `approvals-api.ts` 1538줄 → `types/internal-rows/mappers/fetchers/actions` 5개 서브모듈 + 배럴 파일로 functional-axis 분리. 24개 호출처 변경 없음(배럴 re-export 보존).
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM bulk-approve-rate-limit** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `runWithConcurrency<T>(tasks, 5)` 헬퍼 도입, `bulkApprove` / `bulkReject` 동시 API 호출 5개로 제한.

### 2026-04-27 Sprint 4.1+4.2 — 완료 1건

- [x] **[2026-04-27 sprint-4.2] 🟢 LOW overflow-action-type-ssot** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase D). `OverflowAction` 인터페이스를 `lib/types/checkout-ui.ts` SSOT로 승격. `NextStepPanel.tsx`에서 `import type` + `export type` 분리 패턴으로 하위 호환성 보장.

### 2026-04-26 Sprint 3.1~3.2 — 완료 1건

- [x] **[2026-04-26 sprint-3.1] 🟡 MEDIUM inbound-bff-flag-removal** — ✅ 2026-04-30 완료 (tech-debt-batch-0430b). `checkout-flags.ts` 삭제, `InboundCheckoutsTab.tsx` BFF-only로 단순화 (legacy 3-useQuery 제거, `teamId` props 제거). `.env.example` 플래그 항목 제거.

### 2026-04-27 approvals-ui-r2 SHOULD — 완료 1건

- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW stepper-step-transition-animation** — ✅ 2026-04-30 완료 (tech-debt-batch-0430c). `APPROVAL_STEPPER_TOKENS.connector.transition = TRANSITION_PRESETS.fastBg` 신설, `ApprovalStepIndicator.tsx` connector div에 적용. background-color 200ms ease-standard `motion-safe:transition-[background-color]` 전환.

### 2026-04-28 dashboard-redesign-residual — 완료 6건

- [x] **[2026-04-28 dashboard-redesign] kpi-status-grid-min-h-token** — `DASHBOARD_DDAY_COMPACT_TOKENS.minHeightPx = 280` 토큰화 완료, CalibrationDdayList.tsx:63 사용. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] system-health-react-query-monitoring-polling** — `DashboardClient.tsx:173` `QUERY_CONFIG.MONITORING` 적용 완료. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] welcome-suffix-en-empty** — `_suffixNote` sibling 키 ko/en 양쪽 추가, intentional empty 명시. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] dashboard-controller-zod-scope-validation** — `DashboardScopeValidationPipe` + `@UsePipes` 적용, `packages/shared-constants/src/dashboard-scope.ts` SSOT 신설. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] dashboard-controller-process-env-direct** — `ConfigService.get<number>('DASHBOARD_STORAGE_CAPACITY_BYTES')` 경유, `env.validation.ts` Zod schema 추가. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 dashboard-redesign] pre-existing-dday-deprecation** — 4-tier 마이그레이션 완료, deprecated 6-tier 정의 + 배럴 re-export 모두 제거. (완료 2026-04-28 phase-e-residual)

### 2026-04-28 manage-skills P2 — 완료 4건

- [x] **[2026-04-28 manage-skills] verify-ssot-step-37-effective-role** — Step 37로 추가 (Step 36은 D-day SSOT가 선점). useEffectiveRole SSOT 경유 강제. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-frontend-state-step-24-dual-mode-asymmetry** — Step 24 추가, isControlled = propA && propB 비대칭 검증. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-frontend-state-step-21-online-status-ssot** — Step 21 확장, useOnlineStatus SSOT + navigator.onLine 직접 사용 금지. (완료 2026-04-28 phase-e-residual)
- [x] **[2026-04-28 manage-skills] verify-design-tokens-step-43-error-fallback** — Step 43 보강, getDerivedStateFromError 화이트리스트 + EmptyState variant="error" 경유 강제. (완료 2026-04-28 phase-e-residual)

### 2026-04-28 dashboard-redesign-phase-e-residual — 완료 1건

- [x] **[2026-04-28 phase-e-residual] 🟡 MEDIUM bundle-baseline-script-nextjs16-migration** — ✅ 2026-04-29 완료. `scripts/check-bundle-size.mjs`에 `measureFromBuildArtifacts()` 함수가 이미 존재하며 Next.js 16 PPR 빌드 산출물(build-manifest.json + app-paths-manifest.json) 직접 측정 지원. stdout 파싱은 레거시 fallback으로 유지.

### 2026-04-28 i18n-parity-hardening — 완료 7건

- [x] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM lib-i18n-client-singular-deprecation** — `apps/frontend/lib/i18n/client.ts` 파일 삭제 완료 (0 callers, 단수형 `useTranslation` 래퍼는 dead code). next-intl 표준 `useTranslations` (복수형) 직접 사용으로 통일. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW shadowed-binding-eslint-rule** — NonConformanceBanner.tsx의 `t` 변수 분리 완료 (`tNc` + `tBanner`). 정적 검증 shadowed 0건 달성. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW eslint-no-atom-i18n-rule** — `scripts/check-i18n-call-sites.mjs`에 `common.json` 구조 검증 추가 — root level은 sub-namespace(object)만 허용, flat string/array 추가 시 exit 1. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW e2e-no-missing-message-spec** — `tests/e2e/features/i18n/no-missing-message.spec.ts` 작성 완료. 시드 UUID 회피 위해 system-wide list 라우트 3개 사용. console.error MISSING_MESSAGE 패턴 + body raw key 노출 0건 검증. (완료 2026-04-28 gap-fix-iter)
- [x] **[2026-04-28 i18n-parity-hardening] 🟡 MEDIUM cross-cutting-ns-structural-check** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase B). `CROSS_CUTTING_NAMESPACES = ['common', 'errors']` 정책 명문화. `checkCommonJsonStructure()` → `checkStructuralNamespaces()`로 리팩터.
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW frontend-patterns-shared-exception-text-precision** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase G). `frontend-patterns.md` 위치별 예외 정책을 도메인/shared/common.* 3-bullet로 명확화.
- [x] **[2026-04-28 i18n-parity-hardening] 🟢 LOW i18n-namespaces-array-comment-lag** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase F). `apps/frontend/i18n/request.ts` "Phase 0 ~ Phase 1+" stale 주석 제거.

### 2026-04-28 supply-chain-gate-completion 부수 발견 — 완료 4건

- [x] **[2026-04-28 software-validations] 🔴 IMMEDIATE software-validation-approve-comment-silent-loss** — ✅ 2026-04-28 완료 (harness Mode 2). 도메인 결정 (c) **컬럼 + audit_logs 이중 안전망** 적용: `software_validations.approval_comment text` 컬럼 신설 + service `approve()` underscore prefix 제거. Migration `0048_add_software_validation_approval_comment.sql`. 4 spec 케이스 PASS.
- [x] **[2026-04-28 software-validation-comment] 🟢 LOW service-param-underscore-prefix-static-check** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `verify-implementation` SKILL.md Step 21 (경고 레벨 W2) 등록.
- [x] **[2026-04-28 software-validation-comment] 🟢 LOW frontend-approval-comment-input-ui-audit** — ✅ 2026-04-30 완료 (harness Mode 1). `ValidationApproveDialog` (technical/quality 통합 type prop) + `ValidationRejectDialog` 신설. `SoftwareValidationContent` 8 useState → activeDialog discriminated union 압축.
- [x] **[2026-04-28 supply-chain-gate-completion] 🟢 LOW eslint-require-alias-rename-gap (dynamic import variant)** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 Phase C). `dynamic import('node:crypto')` / `import('crypto')` 패턴 2개 차단 selector 추가.

### 2026-04-28 sidebar-nav-action-pattern — 완료 4건

- [x] **[2026-04-28 sidebar-nav-action-pattern] 🟢 LOW resolve-badge-and-action-exhaustive-kind-check** — ✅ 2026-04-29 완료 (tech-debt-batch-0429 Phase E). `switch (cfg.kind)` + `assertNever(x: never): never` 패턴 적용. `count-with-action` / `count` 양쪽 명시, default → assertNever로 컴파일 타임 exhaustiveness 보장.
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟡 MEDIUM g9-getpendingchecks-borrower-pending** — ✅ F-1에서 처리. EXISTS 서브쿼리로 `requester.teamId === userTeamId` 매칭 + `pending` status 추가. borrower TM nav 배지 정상 카운트.
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟡 MEDIUM use-checkout-group-descriptors-actor-ctx** — ✅ F-2에서 처리. hook 시그니처에 `userTeamId?` 합류, `requesterTeamId`를 FE Checkout 타입에 추가, `getNextStep`에 actorCtx 전달. defense-in-depth 일관성.
- [x] **[2026-04-29 rental-approval-workflow-fix] 🟢 LOW actor-team-disabled-wcag** — ✅ F-3에서 처리. `aria-describedby` 연결 + `role="status"` 사유 노출. SR이 disabled 버튼에 포커스 시 사유 읽음.

### 2026-04-29 button-loading-codemod — 완료 1건

- [x] **[2026-04-29 button-loading] 🟢 LOW visual-double-spinner-settings-only** — ✅ 2026-04-30 완료. CalibrationSettingsContent / SystemSettingsContent / DisplayPreferencesContent 3개 파일 `loadingPosition="replace"` + `loadingLabel={t('common.saving')}` 적용, 내부 Loader2 조건부 렌더 + 미사용 import 정리 완료.

### 2026-04-30 verify-implementation post-batch — 완료 2건

- [x] **[2026-04-30 verify-impl-post-batch] 🟡 MEDIUM reason-field-trim-missing-3-dto** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 session wrapup). 3개 DTO 모두 `z.string().trim().min(1, ...)` 패턴으로 수정: reject-return.dto.ts:16, reject-checkout.dto.ts:16, borrower-reject-checkout.dto.ts:16.
- [x] **[2026-04-30 verify-impl-post-batch] 🟢 LOW manual-entry-fallback-react-form-event** — ✅ 2026-04-30 완료 (tech-debt-batch-0430 session wrapup). `ManualEntryFallback.tsx:46` `React.FormEvent<HTMLFormElement>` → `React.SyntheticEvent<HTMLFormElement>` 교체 (React 19 deprecated 해소).

### 2026-04-30 tech-debt-batch-0430c SHOULD 이연 항목 — 완료 3건

- [x] **[2026-04-30 batch-0430c B3.5] 🟢 LOW mobilenav-list-semantics** — ✅ 2026-04-30 완료. `MobileNav.tsx` section items map → `<ul className="flex flex-col gap-1 list-none" role="list"><li key={item.href}>` 구조 전환. DashboardShell과 동일 패턴 적용 완료.
- [x] **[2026-04-30 batch-0430c B6] 🟢 LOW stepper-start-node-label-token** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `APPROVAL_STEPPER_TOKENS.startNodeLabel: { srOnly: 'sr-only' }` 추가. `ApprovalStepIndicator` `index === 0` 노드에 `aria-label={t('steps.startNodeLabel')}` 적용. ko/en i18n parity 완료.
- [x] **[2026-04-30 batch-0430c B7.1] 🟢 LOW verify-implementation-spec-helper-return-type** — ✅ 2026-04-30 완료 (tech-debt-batch-0430d). `verify-implementation` SKILL.md Step 20 (경고 레벨 W1) 등록. `makeMock*`/`setup*`/`create*` spec 헬퍼 return type 누락 탐지 grep 추가.

---

## 2026-04-28 — tech-debt-residual 완료 (Phase 1: 2건 SSOT/하드코딩 + Phase 2: 5건 SSOT/문서/스킬)

### 2026-04-28 harness: tech-debt-residual Phase 2 (재평가 후 추가 처리)

- [x] **[2026-04-27 sprint-4.1] 🟢 LOW group-header-currentUserRole-parity** — ✅ 2026-04-28 완료. `CheckoutGroupCard.tsx:327` group header `NextStepPanel variant="compact"`에 `currentUserRole={role}` prop 추가. row zone 4 (line 482-485) 패턴과 parity 달성. 컴포넌트 스코프 `role` 변수(line 106) 재사용, 추가 prop drilling 불필요. tsc 0 error.
- [x] **[2026-04-24 sprint-1.2] 🟢 LOW non-rental purpose phase 개념 확장 설계 미문서화** — ✅ 2026-04-28 완료. `packages/schemas/src/fsm/rental-phase.ts:62 getRentalPhase()`에 `@design` JSDoc 블록 추가. non-rental(calibration/repair) phase 확장 시 재설계 영향 범위(`RentalPhase` 타입, `RENTAL_STATUS_TO_PHASE` 구조, `CheckoutPhaseIndicator` 호출부) 명시. tsc 0 error.
- [x] **[2026-04-24 86th-session] 🟢 LOW verify-design-tokens NEXT_STEP_PANEL_TOKENS 명시적 검증 단계 미포함** — ✅ 2026-04-28 완료. `.claude/skills/verify-design-tokens/SKILL.md`에 Step 42 추가: `workflow-panel.ts → index.ts re-export → NextStepPanel.tsx 소비` 토큰 체인 검증. grep 패턴 3종(re-export 확인, 소비처 SSOT 경유, satisfies 가드) + PASS/FAIL 기준 명시. Output Format 표에 Row 42 추가.
- [x] **[2026-04-24 pr-17] 🟢 LOW E2E global-setup trigger-overdue-check 역할 문서화** — ✅ 2026-04-28 완료. `docs/references/e2e-patterns.md` Anti-Patterns 섹션 다음에 "global-setup System Trigger API — 역할 선택 가이드" 섹션 추가. `technical_manager` 사용 근거(`UPDATE_EQUIPMENT` 권한 보유 + audit 잡음 회피 + 운영자 페르소나) 명시 + ✅/❌ 코드 예시.
- [x] **[2026-04-24 sprint-1.5] 🟢 LOW design-tokens-partial-audit** — ✅ 2026-04-28 완료 (audit only — fix 불필요). `apps/frontend/lib/design-tokens/components/` 전수 스캔 결과 `Partial<Record<...>>` **0건**. 이미 모든 design token 파일이 `as const satisfies Record<...>` 강제 패턴 준수. 트래커 항목 정리 목적 archive 이동.

### 2026-04-28 harness: tech-debt-residual Phase 1

- [x] **[2026-04-27 verify-auth] 🟢 LOW self-inspections-role-literal-ssot** — ✅ 2026-04-28 완료. `self-inspections.controller.ts:286` role 리터럴(`'system_admin'`, `'technical_manager'`) → `UserRoleValues.SYSTEM_ADMIN` / `UserRoleValues.TECHNICAL_MANAGER` SSOT 경유 교체. line 28 `import { UserRoleValues } from '@equipment-management/schemas'` 추가. tsc 0 error.
- [x] **[2026-04-27 verify-hardcoding] 🟢 LOW revocation-error-message-dynamic** — ✅ 2026-04-28 완료. `checkouts.service.ts:3209` 하드코딩 `'within 5 minutes'` → template literal `` `within ${APPROVAL_REVOCATION_WINDOW_MS / 60_000} minutes` `` 동적 계산. line 54 기존 import 재사용 (중복 import 0건). tsc 0 error.

#### 분리/보류 결정 (트래커 잔류)

- `approvals-api-module-split` (1507줄) — `bulkApprove`/`bulkReject`가 `fetchItemsMapIfNeeded` 등 3개 private helper에 직접 결합된 단일 class 구조. 단순 파일 분리 시 캡슐화 파괴 → 인터페이스 재설계 선행 필요. 트리거 조건("파일 크기가 개발 마찰 원인이 될 때") 미충족으로 보류 확정.
- 조건부 항목 28건 — Sentry SDK 미도입, BFF 1주 무결 미충족, DB-backed 설정 타당성 미검증, TTY 세션 필요 등 트리거 조건 미충족. 선제 구현 시 YAGNI 위반 + 유지보수 부채 가중 위험.

---

## 2026-04-27 — tech-debt-0427-open 완료 (10건 수정 + 4건 기존 archive 이동)

### 2026-04-27 harness: tech-debt-0427-open

#### 기존 완료 [x] 4건 이동

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-13-self-inspection-category** — ✅ 2026-04-27 완료. `self_inspection` SSOT 체인 전체 추가 (schemas → shared-constants → backend → frontend → i18n).
- [x] **[2026-04-27 sprint4-3-to-5] 🔴 HIGH rejection-presets-seed** — ✅ 2026-04-27 완료. 5건 삽입. `seed-data/admin/rejection-presets.seed.ts` 신규. 교정유효기간만료(is_default)·장비상태부적합(is_default)·반출정보오류(is_default)·중복신청·신청요건미충족.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM stale-time-query-config-presets** — ✅ 2026-04-27 완료. 36건 전수 교체. COMBOBOX_SEARCH preset 신규, Settings/Profile/NotificationPreferences→SETTINGS, 콤보박스 4개→COMBOBOX_SEARCH.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟡 MEDIUM revoke-approval-workflow-e2e** — ✅ 2026-04-27 완료. WF-AP-03 등록 + wf-ap03-revoke-approval.spec.ts 작성. test.skip(REVOCATION_WINDOW_EXPIRED) 명시적 마킹.

#### 이번 세션 처리 10건

- [x] **[2026-04-27 fsm-terminal-actor-variant] 🟡 MEDIUM use-checkout-next-step-fallback-terminated-from** — ✅ 2026-04-27 완료. `UseCheckoutNextStepInput`에 `terminatedFromStatus?: CheckoutStatus | null` 추가, fallback getNextStep() 전달 + useMemo deps 포함. tsc 0 error.
- [x] **[2026-04-27 ar13] 🟢 LOW ar13-self-inspection-approve-weak-cast** — ✅ 2026-04-27 완료. `SelfInspectionDetail` 인터페이스 추가, `apiClient.get<SelfInspectionDetail>()` + `.data.version` 타입 안전 패턴 적용. tsc 0 error.
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM ar-14-software-validation-approve-comment** — ✅ 2026-04-27 완료. backend `approveValidationSchema`에 `approvalComment` optional 추가, `softwareValidationApi.approve()` 3-arity 확장, `TAB_META.commentRequired: true` 활성화. tsc 0 error, backend 947 tests PASS.
- [x] **[2026-04-27 manage-skills] 🟢 LOW revocation-window-ms-shared-constants** — ✅ 2026-04-27 완료. `APPROVAL_REVOCATION_WINDOW_MS = 300_000` business-rules.ts + index.ts SSOT 승격. checkouts.service.ts 로컬 상수 제거 + import 교체.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW not-found-href-ssot** — ✅ 2026-04-27 완료. 4개 파일(app/not-found.tsx, equipment/[id], non-conformances/[id], calibration-plans/[uuid]) `href="/"` → `href={FRONTEND_ROUTES.DASHBOARD}`.
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW create-equipment-import-form-react-formevent** — ✅ 2026-04-27 완료. `CreateEquipmentImportForm.tsx:113` `React.FormEvent` → `React.SyntheticEvent<HTMLFormElement>`.
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-reason-stale-i18n** — ✅ 2026-04-27 완료. `RejectReasonSchema` min(1) → min(REJECTION_MIN_LENGTH=10) defense-in-depth. ko/en `{min}자 이상` placeholder 통일.
- [x] **[2026-04-27 ar13] 🟢 LOW ar13-dashboard-kpi-self-inspection** — ✅ 2026-04-27 완료. self-inspections.controller.ts approve/reject `@AuditLog` action 'update' → 'approve'/'reject'. APPROVAL_KPI.PROCESSED_ACTIONS 자동 포함.
- [x] **[2026-04-24 sprint-1.1] 🟡 MEDIUM DESCRIPTOR_TABLE 재생성 스크립트 부재** — ✅ 2026-04-27 완료. `packages/schemas/scripts/gen-descriptor-table.ts` 신규 + package.json `gen:descriptor-table` 등록. schemas 695 tests PASS.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM qr-label-size-preset-micro-ssot** — ✅ 2026-04-27 완료. `LabelSizePreset`에 `'micro'` 추가(30×12mm, qrSizeMm=8), `LABEL_SAMPLER_LAYOUT.micro`, `getSamplerPresetOrder()` 갱신. 세로 합계 259.7mm < 297mm ✓
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW react-form-event-deprecation** — ✅ 2026-04-27 확인. RejectModal.tsx:102 이미 수정됨. CreateEquipmentImportForm.tsx는 위 항목에서 처리 완료.

---

## 2026-04-27 — approvals SSOT + checkout i18n/enum SSOT 완료

### 2026-04-27 harness: approvals-ar7-ar6-e2e + checkout-sprint4-3-to-5

- [x] **[2026-04-27 approvals-ar7-ar6-e2e] 🟢 LOW approval-detail-modal-deprecated-section-tokens** — ✅ 2026-04-27 완료. `APPROVAL_DETAIL_SECTION_TOKENS` → `APPROVAL_DETAIL_MODAL_TOKENS.sectionBody`/`.historyCard` 교체 + deprecated 정의 삭제. 영향: ApprovalDetailModal.tsx, ApprovalHistoryCard.tsx, approval.ts, index.ts. tsc PASS.
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM i18n-audit-borrower-actions** — ✅ 2026-04-27 완료. ko/en audit.json에 `actions.borrower_approve`/`borrower_reject` 키 추가 (커밋 27f71c79).
- [x] **[2026-04-27 checkout-sprint4-3-to-5] 🟡 MEDIUM checkout-history-purpose-raw-literals** — ✅ 2026-04-27 완료. SelectItem value를 `UserSelectableCheckoutPurposeEnum.enum.*` SSOT로 교체 (커밋 27f71c79).

---

## 2026-04-26 — design-tokens SSOT 정비 + FSM 컨트랙트 동적화 + Sprint 1.x 다수 확인

### 2026-04-26 harness: medium-token-ssot-fixes — 실수정 완료 6건

- [x] **[2026-04-26 nc-verify] 🟡 MEDIUM nceditdialog-form-field-tokens-barrel** — ~~`NCEditDialog.tsx:10` 직접 서브패스 import~~ → `index.ts`에 `REQUIRED_FIELD_TOKENS`·`REQUIRED_FIELD_A11Y` barrel re-export 추가 + NCEditDialog import 통합 완료 (2026-04-26 harness medium-token-ssot-fixes).
- [x] **[2026-04-26 nc-verify] 🟡 MEDIUM statusAlert-dark-prefix** — ~~`non-conformance.ts:96` `dark:border-brand-critical/30 dark:bg-brand-critical/10` 잔존~~ → `dark:` prefix 2개 제거 완료, CSS 변수 자동 전환 체계 복구 (2026-04-26 harness medium-token-ssot-fixes).
- [x] **[2026-04-26 sprint-2.4] 🟡 MEDIUM tab-badge-raw-class-audit** — ~~`NOTIFICATION_LIST_FILTER_TOKENS.tabBadge` raw class~~ → `semantic.ts`에 `ALERT_TAB_BADGE_COLOR` 공유 토큰 신설, checkout·notification 양쪽 참조로 통합 완료 (e32c12cb).
- [x] **[2026-04-26 sprint-2.3] 🟡 MEDIUM overdueClear icon SSOT 통일** — 실측 결과 `checkout-icons.ts:60`에 `overdueClear: CheckCircle2` 이미 등록됨 + `OutboundCheckoutsTab.tsx`가 `CHECKOUT_ICON_MAP.emptyState.overdueClear` SSOT 경유 중. 이미 완료 상태 확인 (2026-04-26 medium-token-ssot-fixes 검증).
- [x] **[2026-04-26 sprint-2.3] 🟡 MEDIUM OutboundCheckoutsTab aria-label "건" 하드코딩** — 실측 결과 L323 `t('list.count.unit', { value: card.value })` i18n 사용 중. `ko/checkouts.json:544 "unit": "{value}건"` + `en/checkouts.json:544 "unit": "{value} items"`. 이미 완료 상태 확인 (2026-04-26 medium-token-ssot-fixes 검증).
- [x] **[2026-04-24 sprint-1.2] 🟡 MEDIUM 컨트랙트 M2·M13 "208 entry" 스테일 수치** — ~~"208" 하드코딩~~ → M2·M13·Acceptance·연계 contracts 섹션 전체 `EXPECTED_ENTRY_COUNT`(= `TOTAL_STATUSES × TOTAL_PURPOSES × TOTAL_ROLES`) 동적 참조로 교체. 테스트 describe 문자열도 template literal로 통일 완료 (2026-04-26 harness medium-token-ssot-fixes).

### 2026-04-26 harness: 이전 세션 항목 실측 확인 완료

- [x] **[2026-04-24 wf34-pr13] 🟡 MEDIUM URGENCY_ICON 로컬 맵 → checkout-icons.ts SSOT 이관** — 실측 확인(2026-04-26): `YourTurnBadge.tsx:30` `CHECKOUT_ICON_MAP.urgencyBadge[urgency]` SSOT 경유. 로컬 URGENCY_ICON 맵 없음. 이미 수정됨.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW .env.example 플래그 문서화 누락** — Sprint 1.4(2026-04-24) 해소: 변수 자체를 .env.local/.env.example에서 제거.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟡 MEDIUM NextStepPanel 플래그 상시화** — Sprint 1.4(2026-04-24) 완료: checkout-flags.ts return true 상시화, LegacyActionsBlock 제거, isNextStepPanelEnabled 호출부 전체 제거.
- [x] **[2026-04-22 pr22] 🟢 LOW approvals-api.ts approverId 미사용 파라미터** — 실측 확인(2026-04-26): approvals-api.ts에서 approverId/userId 파라미터 없음. use-approvals-api.ts hook wrapper도 동일. 이미 수정됨.
- [x] **[2026-04-22 pr22] 🟢 LOW Checkout.user.department 백엔드 DTO 미지원 필드** — 실측 확인(2026-04-26): `checkout-api.ts:67` `department?: string` optional로 이미 수정됨.
- [x] **[2026-04-24 pr-3] 🟢 LOW Layer 1 직접 import — dashboard.ts/header.ts/sidebar.ts** — 실측 확인(2026-04-26): dashboard/header/sidebar 모두 `../utils`에서 import (primitives 직접 import 없음). `utils.ts`는 design-tokens 내부 중간 계층 — Layer 1 위반 아님. 이미 수정됨.
- [x] **[2026-04-24 pr4-7] 🟢 LOW en/checkouts.json 3개 키 누락** — 2026-04-24 해소: cancelCheckout/cancelTitle/cancelDescription 추가.
- [x] **[2026-04-24 pr4-7] 🟢 LOW CheckoutsContent.tsx PURPOSE_OPTIONS 로컬 재정의** — 실측 확인(2026-04-26): `CheckoutsContent.tsx:47/412` `USER_SELECTABLE_CHECKOUT_PURPOSES` SSOT 경유. 로컬 배열 없음. 이미 수정됨.
- [x] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab pagination ?? 10 매직넘버** — 실측 확인(2026-04-26): `pageSize ?? 10` 패턴 전체 codebase 검색 0건. 이미 수정됨.
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW borrowerReject dialog onErrorCallback reason 미초기화** — 89차 세션 수정: `onErrorCallback`에 `setBorrowerRejectReason('')` 추가 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW REJECTED 상태 카드에 borrowerRejectionReason 미표시** — 89차 세션 수정: `borrowerRejectionReason ?? rejectionReason` 우선순위로 표시 (commit 14c2d526).
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW CheckoutNotificationEvent lenderTeamId 미선언** — 88차 세션 즉시 수정: notification-events.ts에 `lenderTeamId?: string` 추가.
- [x] **[2026-04-24 rental-phase5-8] 🟢 LOW lenderTeamId ?? '' 빈 문자열 fallback** — 88차 세션 즉시 수정: `?? undefined`로 교체.
- [x] **[2026-04-24 rental-phase5-8] 🔴 Critical LegacyActionsBlock 취소 조건 BORROWER_APPROVED 누락** — 88차 세션 즉시 수정: FSM SSOT 일치.
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-fsm-borrower-actions** — 이미 수정됨: CheckoutDetailClient.tsx handleNextStepAction에 borrower_approve/borrower_reject case 명시적 존재 확인(2026-04-24 검증).
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-rental-flow-cleanup** — 2026-04-26 해소: `CheckoutGroupCard.tsx` `RentalFlowInline` + `isNextStepPanelEnabled()` 분기 제거, `RENTAL_FLOW_INLINE_TOKENS` checkout.ts/index.ts에서 제거, `i18n.checkouts.rentalFlow.*` ko/en 양쪽 제거 완료.
- [x] **[2026-04-24 pr5] 🟢 LOW checkout-legacy-next-step-panel-cleanup** — 2026-04-26 해소: `checkout-flags.ts` 파일 삭제, `isNextStepPanelEnabled` 모든 import/호출부 제거 완료. (components/checkouts/NextStepPanel.tsx는 신규 구현 확인 — 삭제 불가)
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM Stale CAS 5차 재발 — CheckoutDetailClient 8개 mutation** — 실측 확인(2026-04-26): mutationFn L155/178/203/236/262/287/313/341 전체 `getCheckout(checkout.id)` fresh fetch 패턴으로 이미 구현 완료. 트래커 기록 시점 이후 수정됨.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM WorkflowTimeline TooltipTrigger > div 키보드 포커스 불가** — 실측 확인(2026-04-26): `WorkflowTimeline.tsx:133` `tabIndex={0}` 이미 존재. 트래커 기록 시점 이후 수정됨.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM CheckoutGroupCard useMutation 직접 사용** — 2026-04-26 Stale CAS 위험 해소: `mutationFn` 내 `checkoutApi.getCheckout(id)` fresh fetch 패턴 적용 (개별·bulk 모두). `useOptimisticMutation` 미전환은 의도적 설계 결정 — list-level predicate invalidation이 단일 queryKey로 표현 불가, safeCallback 자동화는 후속 리팩토링으로 이연.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM nextStepIndex prop +1 오프셋 혼란** — 실측 확인(2026-04-26): `CheckoutDetailClient.tsx:519-521` `nextStepDescriptor.currentStepIndex` (+1 없음). descriptor null 시 undefined 전달 패턴으로 이미 수정됨.
- [x] **[2026-04-24 pr14-15] 🟢 LOW WorkflowTimeline 내부 Suspense 무의미** — 실측 확인(2026-04-26): WorkflowTimeline.tsx에 Suspense import/사용 없음. 이미 제거됨.
- [x] **[2026-04-24 pr14-15] 🟢 LOW staggerItem 60ms SSOT 이탈** — 실측 확인(2026-04-26): `motion.ts` `getStaggerFadeInStyle()` 함수가 `MOTION_TOKENS.stagger[type]` SSOT 경유. magic 60 없음. 이미 수정됨.
- [x] **[2026-04-24 pr14-15] 🟢 LOW CheckoutDetailClient href 하드코딩** — 실측 확인(2026-04-26): `FRONTEND_ROUTES.EQUIPMENT.DETAIL(equip.id)` 이미 사용됨. 이미 수정됨.
- [x] **[2026-04-24 pr-19] 🟢 LOW CHECKOUT_DETAIL 프리셋 미등록 (4차 QUERY_CONFIG 인라인)** — 실측 확인(2026-04-26): `query-config.ts:347` `CHECKOUT_DETAIL` 프리셋 존재, `CheckoutDetailClient.tsx:113` `...QUERY_CONFIG.CHECKOUT_DETAIL` 스프레드 사용. 이미 수정됨.
- [x] **[2026-04-24 pr-19] 🟢 LOW Error 배너 3종 px-4 py-3 spacing 중복** — 2026-04-26 해소: `components/shared/InlineErrorBanner.tsx` 공통 컴포넌트 추출, HeroKPIError/NextStepPanelError/WorkflowTimelineError 3종 모두 교체 완료.
- [x] **[2026-Q2 pr-17] 🟡 MEDIUM NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL 상시화** — Sprint 1.4(2026-04-24) 완료. CheckoutDetailClient LegacyActionsBlock 제거, checkout-flags.ts 상시화, env 파일 변수 제거. CheckoutGroupCard.tsx 잔여 분기는 checkout-legacy-rental-flow-cleanup 항목으로 이연.
- [x] **[2026-04-24 sprint-1.3] 🟡 MEDIUM checkout-role-canapprove-removal** — 2026-04-26 해소: `CheckoutGroupCard.tsx` `canApprove` prop 완전 제거, `yourTurnCount` legacy 분기 제거, `descriptor.availableToCurrentUser` 기반 YourTurnBadge 교체 완료. `OutboundCheckoutsTab.tsx` `can(Permission.APPROVE_CHECKOUT)` 호출 제거 완료.

---

## 2026-04-22 — checkout-subtab-ia + subtab-ssot-fix 후속 (63261b0d + followup)

### 2026-04-22: subtab-ia tech-debt 4건 + verify/review 후속 3건 — WCAG / Select / QUERY_CONFIG / URL SSOT

- [x] **🟡 MEDIUM QUERY_CONFIG 인라인 오버라이드** — `query-config.ts`에 `CHECKOUT_LIST/CHECKOUT_SUMMARY/CHECKOUT_DESTINATIONS/EQUIPMENT_IMPORT_LIST` 프리셋 추가. `CheckoutsContent.tsx` + `OutboundCheckoutsTab.tsx` + `InboundCheckoutsTab.tsx` 교체. 4차 재발 종결.
- [x] **🟡 MEDIUM Radix Select spurious onValueChange 가드 누락** — `handleStatusChange/handleLocationChange/handlePurposeChange/handlePeriodChange` 첫 라인에 `if (value === filters.X) return;` 가드 추가. 의도치 않은 URL 리셋 방지.
- [x] **🟡 MEDIUM role="tabpanel" 내부 role="tablist" (WCAG 4.1.2)** — `CheckoutListTabs`(tablist)를 `role="tabpanel"` div 외부 sibling으로 이동. tabpanel에는 목록+페이지네이션만 잔류. axe-core 위반 해소.
- [x] **🟢 LOW handlePageChange URL SSOT 이중 경로** — `handlePageChange` → `filtersToSearchParams({ ...filters, page: newPage })` 일원화. `URLSearchParams` 직접 조작 패턴 제거.
- [x] **🟢 LOW handleSubTabChange URL 직접 조작** — `filtersToSearchParams({ ...filters, subTab: newSubTab, status: 'all', page: 1 })`으로 일원화. `useSearchParams` 직접 의존성 제거.
- [x] **🟡 MEDIUM InboundCheckoutsTab CACHE_TIMES.SHORT 직접 지정 3곳** — inbound checkout → `CHECKOUT_LIST`, rental/internal import → `EQUIPMENT_IMPORT_LIST` 프리셋 교체. `query-config.ts`에 `EQUIPMENT_IMPORT_LIST` 신규 추가.
- [x] **🟡 MEDIUM CHECKOUT_DESTINATIONS staleTime/gcTime DAY 티어 불일치** — `query-config.ts` CHECKOUT_DESTINATIONS 프리셋을 `LONG/VERY_LONG` → `staleTime: CACHE_TIMES.DAY, gcTime: CACHE_TIMES.DAY`로 수정. `cache-config.ts:31` 주석이 DAY 티어 예시로 "반출 목적지 목록"을 명시하고 있었음.
- [x] **🟡 MEDIUM isAllActive 5-필드 인라인이 countActiveFilters SSOT 우회** — `OutboundCheckoutsTab.tsx` `isAllActive` 계산을 `countActiveFilters(filters) > 0` SSOT로 교체. 새 필터 추가 시 동기화 누락 위험 제거.
- [x] **🟢 LOW placeholderData가 QUERY_CONFIG 스프레드보다 앞에 위치** — `CheckoutsContent.tsx` liveSummary 쿼리에서 `placeholderData: initialSummary`를 `...QUERY_CONFIG.CHECKOUT_SUMMARY` 이후로 이동. 미래 프리셋 확장 시 silent overwrite 방지.

---

## 2026-04-22 — checkout-lender-guard (harness Mode 1)

### 2026-04-22 harness: checkout-lender-guard — MEDIUM+LOW 보안 결함 수정 (0a3b851f)

- [x] **🟡 MEDIUM approve lenderTeam identity-rule 강제** — `if (... && approverTeamId)` → `if (...)` + `if (!approverTeamId || ...)` 패턴. 팀 미소속 사용자 RENTAL 승인 바이패스 차단. 928 tests PASS.
- [x] **🟡 MEDIUM rejectReturn lenderTeam identity-rule 강제** — 동일 패턴. `rejectReturn` L2032 수정.
- [x] **🟢 LOW approve NO_EQUIPMENT 가드 추가** — `if (!firstEquip) throw BadRequestException(NO_EQUIPMENT)` — `enforceScopeFromData` 이전 배치.
- [x] **🟢 LOW rejectReturn NO_EQUIPMENT 가드 추가** — 동일 패턴. `rejectReturn` L2009 수정.

---

## 2026-04-22 — checkout-fsm + checkouts cleanup + design-token arbitrary text

### 2026-04-22 harness: checkout-fsm-backend (PR-2) review-architecture 후속

- [x] **🟡 MEDIUM CHECKOUT_FORBIDDEN을 400→403으로 수정** — 완료 (db7f5be3)
- [x] **🟡 MEDIUM approve-return/reject-return 컨트롤러 가드 FSM과 정렬** — 완료 (db7f5be3)
- [x] **🟡 MEDIUM writeTransitionAudit 실패 명시적 로깅** — 완료 (refactor로 캡슐화 4c9db711)
- [x] **🟡 MEDIUM approve guard VIEW_CHECKOUTS → APPROVE_CHECKOUT** — 완료 (4c9db711)
- [x] **🟡 MEDIUM rejectReturn lenderTeam BadRequestException → ForbiddenException** — 완료 (d27fd09b)
- [x] **🟡 MEDIUM ConflictException 4개 메서드 catch 블록 누락** — 완료 (d27fd09b)
- [x] **[PR-2] 🟢 LOW CheckoutErrorCode enum 도입** — ✅ `checkout-error-codes.ts` 신규 생성 (23개 코드, JSDoc), service.ts 인라인 30건 전환.
- [x] **[PR-2] 🟢 LOW rejectReturn 스코프 검증 무조건 실행** — ✅ `enforceScopeFromData` 호출을 approverTeamId 조건 밖으로 이동. 방어선 일관성 확보.
- [x] **[PR-2] 🟢 LOW reject 엔드포인트 반려 사유 검증 이중 위치** — ✅ controller.ts L465-470 중복 검증 블록 제거, 서비스 단일 경로로 통일.

### 2026-04-22 harness: checkout-fsm-backend PR-2 후속

- [x] **[PR-2] 🔴 HIGH checkout-fsm E2E 격리 검증 필요** — ✅ 18/18 PASS (라이브 DB). approve_return 테스트 기대값 수정 — guard APPROVE_CHECKOUT 강화로 `AUTH_INSUFFICIENT_PERMISSIONS` 반환 (이전: `CHECKOUT_FORBIDDEN`). 격리 완전 검증.
- [x] **[PR-2] 🟢 LOW checkout service spec mockReq permissions 패턴 문서화** — ✅ `docs/references/backend-patterns.md` "FSM assertFsmAction 서비스 테스트 픽스처 패턴" 섹션 추가.
- [x] **[PR-2] 🟡 MEDIUM approve (최초 승인) 엔드포인트 guard 과소제어** — ✅ 확인 결과 이미 APPROVE_CHECKOUT으로 설정됨. Evaluator 오탐. E2E 기대값(CHECKOUT_FORBIDDEN→AUTH_INSUFFICIENT_PERMISSIONS) 수정 완료.

### 2026-04-21 harness: checkout-fsm-schemas PR-1 후속

- [x] **[PR-1] 🟢 LOW canPerformAction 권한 매트릭스 5 role 미완성** — ✅ quality_manager(조회전용 3케이스) + lab_manager(전체권한 4케이스) describe 블록 추가. 18/18 E2E PASS와 함께 검증.

### 2026-04-21 harness: 78-1 typo-primitives-checkout-ssot 후속

- [x] **[78-1] 🟡 MEDIUM `checkout.ts:197` `w-[18px] h-[18px]` 잔존** — ✅ `--spacing-step-dot` @theme + `DIMENSION_TOKENS.stepDot` 3-layer 적용.
- [x] **[78-8] 🟢 LOW top-3 도메인 arbitrary text-[Npx] 53건 제거** — ✅ MICRO_TYPO.meta(11px)/detail(13px) 신규 토큰 + globals.css @theme + primitives.ts 3-way SSOT 체인. non-conformance.ts(21건), audit.ts(18건), dashboard.ts(14건) 적용. display 크기(`text-[5rem]`/`text-[56px]`) 예외 유지.
- [x] **[78-1] 🟢 LOW 잔여 design-tokens 도메인 arbitrary text-[Npx] ~37건** — ✅ text-sm-wide(15px) 신규 3-layer 토큰 + MICRO_TYPO.siteTitle 추가. team/settings/approval/equipment/sidebar/calibration-plans/mobile-nav/software.ts 8개 파일 전량 처리. 11.5px→meta(11), 12.5px→text-xs(12) 라운딩. display 예외 보존.
- [x] CheckoutGroupCard 행 `div role="button"` → `<button>` 시맨틱 — ✅ 내부 `<Button>/<Link>` 중첩으로 `<button>` 사용 불가 (HTML5 spec). `div[role=button]` + WCAG 준수 패턴 유지 + 명시적 주석 추가.
- [x] **[78-7] 🟡 MEDIUM InboundCheckoutsTab 전역 isLoading vs 섹션별 로딩 dead code** — ✅ 전역 가드 제거 + `isAnyLoading` 가드로 전체 빈상태 보호.
- [x] **[78-7] 🟢 LOW EmptyState `useAuth()` 직접 호출 → props 주입 패턴** — ✅ `canAct?: boolean` prop 추가, useAuth 제거, 3 소비처 업데이트.

### 2026-04-21 harness: checkout-78-round2 후속

- [x] **[78-r2] 🟢 LOW renderLoadingState 중복 제거** — ✅ `CheckoutListSkeleton`에 `label`/`srOnly` props + `aria-busy` 추가, 양 탭 파일의 로컬 함수 제거.
- [x] **[78-r2] 🟢 LOW Overdue 배너 aria-label i18n + 앵커 포커스 이동** — ✅ `overdueScrollAriaLabel`/`bannerClose` i18n 추출, `tabIndex={-1}` + `focus()` 추가.
- [x] **[78-r2] 🟢 LOW skeleton label/srOnly 하드코딩 → i18n** — ✅ `checkouts.loading.*` 8개 키 추가, `t()` 교체.
- [x] **[78-r2] 🟢 LOW 배너 닫기 후 포커스 소실** — ✅ WCAG 2.1 SC 2.4.3: rAF + pendingCheckRef 포커스 이전.

---

## 2026-04-21 — SW 검증 캐시 책임 경계 분리 (아키텍처 수정)

- [x] **SW 검증 캐시 APPROVALS 이중 삭제 제거** — ✅ `invalidateCache()`에서 `deleteByPrefix(APPROVALS)` 제거. 책임 경계 명시: 서비스=도메인 로컬 캐시(sw-validations/test-software), 레지스트리=크로스 도메인(dashboard+approvals). `cache-event.registry.ts` 및 `software-validations.service.ts` 주석 정합성 수정.

---

## 2026-04-21 — tech-debt-batch-0421f (routeMap + cache 문서화 + tracker 정리)

- [x] **routeMap 4개 페이지 미등록** — ✅ `/software-validations`, `/scan`, `/handover`, `/checkouts/import` 추가. `QrCode` 아이콘 추가. `scan`/`handover`/`checkoutsImport` 신규 i18n 키 ko/en 추가.
- [x] **SW 검증 캐시 하이브리드 패턴 문서화** — ✅ `cache-event.registry.ts` 하이브리드 패턴 주석 보강. 미래 통합 조건 명시.
- [x] **tracker false positive 7건 정리** — ⚠️ scope.type / ParseUUID 순서 / EquipmentImportDetail role / CheckoutHistoryTab invalidate / 빈 번역 키 5건: 재검증 결과 코드가 이미 올바름 → 오탐 판정.

---

## 2026-04-21 — tech-debt-batch-0421e (verify-implementation 후속 3건)

- [x] **`security.controller.ts` lineNumber PG integer 범위 미검증** — ✅ `PG_INT_MAX = 2_147_483_647` 상수 + `parseCspLineNumber()`에 `Math.min(Math.trunc(raw), PG_INT_MAX)` 클램프 추가. string 경로도 동일하게 클램프.
- [x] **`LoginPageContent.tsx` 하드코딩 한국어 문자열** — ✅ `tLogin('title')` / `tLogin('formSubtitle')` / `tLogin('separator')` 교체. `formSubtitle` 키 ko/en auth.json 추가.
- [x] **`security.service.spec.ts` `as never` 타입 단언** — ✅ `AppDatabase` import 추가, `mockDb as never` → `mockDb as unknown as AppDatabase` 교체.

---

## 2026-04-21 — tech-debt-batch-0421d (code-reviewer 지적 12건 전수 수정)

- [x] **LoginProviders error 필드 미소비** — ✅ `error` 구조 분해 추가, `tLogin('serverUnavailable')` vs `tLogin('configRequired')` i18n 분기 UI.
- [x] **inspection renderer stale import 경로** — ✅ self/intermediate 양 파일 `../../../common/docx/docx-template.util` canonical 경로 교체.
- [x] **`managementNumber: ''` 이벤트 페이로드 빈 문자열** — ✅ L159·L354·L408 키-값 쌍 제거. 템플릿이 `{{managementNumber}}` 미사용이므로 기능 영향 없음 확인.
- [x] **SecurityService 단위 스펙 미작성** — ✅ `security.service.spec.ts` 신규. DB INSERT 정상 경로 + throw 금지 2케이스.
- [x] **renderer MERGED_TEXT_COL 상수 스펙 미작성** — ✅ checkout-form-renderer / equipment-import-form-renderer 스펙 신규. ROWS 상수 + 확인 문장 XML 검증.
- [x] **k6 setup() silent failure** — ✅ K6_USER_EMAIL/K6_USER_PASSWORD/K6_VALIDATION_ID 미설정 + login 非200 → throw.
- [x] **lineNumber varchar → integer** — ✅ `csp-reports.ts` integer 컬럼, `0042_csp_reports_line_number_int.sql` USING CASE 마이그레이션.
- [x] **NormalizedCspReport 타입 분리** — ✅ `security.types.ts` 신규, service·controller 양쪽 import 교체.
- [x] **Dead code 제거** — ✅ ApproveEquipmentRequestDto + CreateSharedEquipmentSwaggerDto + swagger import 제거.
- [x] **ValidationCreateDialog re-export 제거** — ✅ `export type { CreateFormState }` 제거, 소비처 직접 import 확인.
- [x] **docx 셀 인덱스 SSOT화** — ✅ `docx-cell-indices.ts` 신규 + layout 파일들 import/re-export.

---

## 2026-04-21 — tech-debt-batch-0421c (CSP 영속화 + createZodDto 마이그레이션)

- [x] **[2026-04-18 completion] 🟢 LOW CSP report 영속화** — ✅ 2026-04-21 완료. `csp_reports` 테이블(migration 0041) + SecurityService + SecurityModule DrizzleModule 등록.
- [x] **[2026-04-17 qr-phase3] ❓ 커밋 7a6255d1 메시지 귀속 복구** — ✅ 2026-04-21 결정: status quo(A). 히스토리 재작성 없이 현 커밋 인정.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] createZodDto 대규모 전환** — ✅ 2026-04-21 완료. calibration/data-migration/settings/equipment/notifications/teams DTO 전환. 잔여는 트리거 기반.

---

## 2026-04-21 — form-export-services + 보안 수정

- [x] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-exportability.ts 전용 verify 없음** — ✅ 2026-04-21 Won't Do. verify-hardcoding Step 23 + verify-ssot로 이미 커버. 별도 스킬 추가 없음.
- [x] **[2026-04-21 form-export-services] 보안 — checkout 스코프 검증 빈 items 엣지케이스** — ✅ 2026-04-21 완료. deny-by-default 가드 추가 (`6872c419`). `scopeActive && items.length === 0` 조건 즉시 404 반환.

---

## 2026-04-21 — ssot-status-phase2-3 (할당/인자 패턴 + 전체 종결)

- [x] **[2026-04-17 history-card-qp1802] multi-form 3-way 분리 패턴 확산** — ✅ 2026-04-21 완료. QP-18-06/07/08/10 모두 Data/Renderer/Layout 3-way 분리 완료 (tech-debt-batch-0421b).
- [x] **[2026-04-17 history-card-qp1802] 프론트엔드 E2E 검증** — ✅ 2026-04-21 완료. `wf-history-card-export.spec.ts`에 §5 섹션 유형 라벨 검증 test block 추가 (TIMELINE_ENTRY_TYPE_LABELS SSOT).
- [x] **[2026-04-17 history-card-qp1802] 시스템 관리자 승인 경로 접근 제어 확인** — ✅ 2026-04-21 완료. Phase D 분석: lab_manager 직접 승인은 UL-QP-18 §5.2 절차 준수, Permission guard + audit 이중 보호.
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW 양식 교체 운영 반영** — ✅ 2026-04-21 완료. `docs/operations/form-template-replacement.md` runbook 작성 (Phase E).
- [x] **[2026-04-17 ul-qp-18-forms] 🟢 LOW review-W4 EXPORT_QUERY_LIMITS.FULL_EXPORT 스트리밍** — ✅ 2026-04-21 완료. Phase C 분석: No-Go 결정. 현재 규모 안전 범위. `docs/references/export-streaming-decision.md` 참조.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 6 — Permission.EXPORT_REPORTS TE 정책 재확인** — ✅ 2026-04-21 완료. 의도된 정책. UL-QP-18 §5.2 준수, SiteScopeInterceptor 팀 격리 확인.

---

## 2026-04-21 — tech-debt-batch-b (E2E globalPrefix + cplan axe-core + M4.8 + ValidationCreateDialog 분리)

- [x] **[2026-04-16 tech-debt-s2s4] E2E globalPrefix 통합** — createTestApp에 setGlobalPrefix('api') 추가 + 22개 E2E 스펙 경로를 API_ENDPOINTS 기반으로 마이그레이션. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-e2e — UL-QP-19-01 UI 다운로드 E2E 없음** — `wf-export-ui-download.spec.ts`에 QP-19-01 케이스 추가 완료. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW verify-seed-integrity — shared-test-data.ts ITEM_013~022 없음** — CPLAN_008/009 + ITEM_013~022 sync 완료. 완료 2026-04-21.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — axe-core E2E** — `tests/e2e/a11y/calibration-plans.a11y.spec.ts` 신규 생성. list/detail/create/Reject dialog 6개 테스트. 완료 2026-04-21.
- [x] **[2026-04-20 calibration-phase4-7] M4.8 계약 모순** — CalibrationRecord.certificatePath는 M4.3(API 응답 호환성) 유지를 위해 보존. M4.8 범위를 packages/schemas+DTO로 한정, CalibrationRecord는 virtual computed field(documents 조인)로 명시(주석 추가 + contract 업데이트). 완료 2026-04-21.
- [x] **[2026-04-21 tech-debt-batch-0421] S4 — ValidationCreateDialog.tsx 232줄** (SHOULD ≤150 초과) — VendorValidationFields + SelfValidationFields 분리 완료 (135줄). 완료 2026-04-21.

---

## 2026-04-21 — batch-a-techdebt-0421 (validation 컴포넌트 분리 + calibration 쿼리키)

- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Sticky 액션 바** — `CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.stickyContainer` 적용 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — confirmItem optimistic** — `optimisticConfirmedId` 패턴 구현 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — Reject textarea minLength=10** — `.length < 10` disabled 조건 + button disabled 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM Phase 2 — year "_all" 필터** — SelectItem `_all` + i18n `allYears` 구현 완료. (코드 확인 2026-04-21)
- [x] **[2026-04-20 calibration-phase4-7] S6 — CALIBRATION_DETAIL 쿼리키 바인딩** — `useCalibrationDetail` 훅 추가, `queryKeys.calibrations.detail` + `QUERY_CONFIG.CALIBRATION_DETAIL` 연결 완료. (2026-04-21)
- [x] **[2026-04-21 cleanup-0421] ValidationDocumentsSection.tsx 255줄 → 93줄** — DocumentTable.tsx 분리 완료. (2026-04-21)
- [x] **[2026-04-21 cleanup-0421] ValidationEditDialog.tsx 190줄 → 149줄** — VendorEditFields.tsx 분리 완료. (2026-04-21)

## 2026-04-21 — e2e-api-endpoints-migration / review-architecture

- [x] **[2026-04-20 e2e-api-endpoints-migration] pre-existing E2E 실패 13건** — ✅ 완료 2026-04-21. auth: canonical emails(lab.manager/tech.manager/test.engineer) + auth.service testPasswords 확장. checkouts: version:1 추가 + TEAM_FCC_EMC_RF_SUWON_ID 동일팀 장비. auth 8/8, checkouts 13/13 통과.
- [x] **[2026-04-20 review-architecture] BE: CalibrationPlanSyncListener 이중 갱신** — ✅ 완료 2026-04-21. `if (payload.linkedPlanItemId)` 진입부 early-return 추가. tx 내 직접 링크된 경우 year-scope recordActualCalibrationDate 스킵.
- [x] **[2026-04-20 review-architecture] BE: CALIBRATION_UPDATED/UPLOADED/REVISED 이벤트 미발행** — ✅ 완료 2026-04-21. update()에 emitAsync(CALIBRATION_UPDATED) 추가 + recordCertificateDocuments() 신규 메서드로 UPLOADED/REVISED emit. teamId는 resolveEquipmentTeamId()로 정확히 조회. controller uploadDocuments에서 호출.
- [x] **[2026-04-20 review-architecture] FE: ValidationDetailContent `useCasGuardedMutation` 교체** — ✅ 완료 2026-04-21. useMutation → useCasGuardedMutation 전환. isConflictError 수동 처리 제거. fetchCasVersion으로 항상 최신 version 조회 후 mutate.
- [x] **[2026-04-20 review-architecture] FE: VersionHistory staleTime 미지정** — ✅ 완료 2026-04-21. REFETCH_STRATEGIES.STATIC 적용 (버전히스토리는 append-only, focus refetch 불필요).
- [x] **[2026-04-20 e2e-api-endpoints-migration] POST /checkouts/:id/return HTTP 메서드 불일치** — ✅ 확인 종결 2026-04-20. 실측 결과 컨트롤러 `@Post(':uuid/return')` + 테스트 `.post()` 모두 POST로 정합. SSOT(`api-endpoints.ts`)는 URL 경로만 관리(HTTP 메서드 무관). 불일치 없음.

## 2026-04-20 — calibration-status-filter-url / calibration-plan-confirm / nc-workflow-atomicity

- [x] **[2026-04-20 calibration-status-filter-url] E2E 테스트 deprecated status 파라미터 잔존** — ✅ 완료 2026-04-20. `group-a-calibration-display.spec.ts` + `group-a-filter-status.spec.ts` + `equipment-list.plan.md` 수정. 상태 드롭다운 → 교정기한 필터 드롭다운 인터랙션 교체.
- [x] **[2026-04-20 calibration-plan-confirm] S5 — confirmAllItems 서비스 단위 테스트 미작성** — ✅ 완료 2026-04-20. 4개 케이스 추가: approved 2건 확인, non-approved BadRequestException, CAS 불일치 ConflictException, actualCalibrationId 없는 항목 0건 반환.
- [x] **[2026-04-20 calibration-plan-confirm] S6 — 렌더러 테스트에 확인 셀 assertion 없음** — ✅ 완료 2026-04-20. `calibration-plans-export.service.spec.ts`에 두 확인자 이름 기록 + confirmedBy=null → '-' assertion 추가.
- [x] **[2026-04-20 nc-workflow-atomicity] S2 — close() 복원 구조화 로그 없음** — ✅ 완료 2026-04-20. `close()` 캐시 무효화 직후 `logger.debug({ message: 'NC close: equipment status restore', ncId, equipmentId, previousEquipmentStatus, equipmentStatusRestored })` 구조화 로그 추가.
- [x] **[2026-04-20 nc-workflow-atomicity] S1 — NC close() previousEquipmentStatus 복원 단위 테스트 없음** — ✅ 완료 2026-04-20. `describe('previousEquipmentStatus restore logic')` 3개 시나리오 추가: spare 복원, null→available 폴백, disposed(excluded)→available 폴백.

## 2026-04-20 — cplan-export-audit Warning 즉시 수정

- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM renderer.service templateBuffer 내부 로드** — ✅ 완료 2026-04-20. orchestrator(CalibrationPlansExportService)가 getTemplateBuffer 후 render(plan, buffer) 주입. renderer에서 FormTemplateService DI 완전 제거. 순수 unit 테스트 가능 구조 달성.
- [x] **[2026-04-20 cplan-export-audit] 🟡 MEDIUM CalibrationPlansContent TableRow 이중 네비게이션** — ✅ 완료 2026-04-20 (실측 확인). TableRow onClick 없음, Link absolute inset-0 overlay만 유지. 히스토리 스택 이중 push 해소.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — ApprovalTimeline sr-only 요약** — ✅ 완료 2026-04-20. `<span className="sr-only">N단계 완료, 진행 중 단계, 총 3단계</span>` 추가.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — PlanStatusBadge 추출** — ✅ 완료 2026-04-20. `PlanStatusBadge.tsx` 신규 + CalibrationPlansContent/VersionHistory/CalibrationPlanDetailClient 3곳 교체.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 8 — prefers-reduced-motion 가드** — ✅ 완료 2026-04-20. `CALIBRATION_PLAN_DETAIL_HEADER_TOKENS.stickyContainer`에 `motion-reduce:transition-none` 추가.

## 2026-04-20 — calibration-phase4-7 / nc-detail-design-fix

- [x] **[2026-04-20 calibration-phase4-7] S3 — CACHE_EVENTS.CALIBRATION_CREATED payload linkedPlanItemId** — ✅ 완료 2026-04-20. `CalibrationCachePayload.linkedPlanItemId?: string | null` 필드 추가 + `calibration.service.ts` emit 시 `planItemId ?? null` 주입.
- [x] **[2026-04-20 calibration-phase4-7] MC.4 — Phase 5a/5b/5c 커밋 병합** — ✅ 확인 종결 2026-04-21. 코드는 정상, 커밋 분리 불필요.
- [x] **[2026-04-20 calibration-phase4-7] 고아 SQL 파일 정리** — ✅ 완료 2026-04-20. journal 검증 후 0033/0034/0035/0036 orphan 4개 삭제. canonical(0034/0035/0036/0037) 보존.
- [x] **[2026-04-20 nc-detail-design-fix] W-FE1 NCDetailClient.tsx:329 편집 권한 명시성** — ✅ 완료 2026-04-20. `canEditNC = canCloseNC` alias 추가 + UL-QP-18 §14 근거 주석으로 의도 명확화.
- [x] **[2026-04-20 nc-detail-design-fix] W-BE2 calibration-plan-renderer.service.ts:72 confirmedSignature 로직** — ✅ 완료 2026-04-20. 주석 추가.
- [x] **[2026-04-20 nc-detail-design-fix] W-BE3 calibration-plans-export.service.spec.ts:173 테스트 하드코딩** — ✅ 완료 2026-04-20. `'연간교정계획서'` 리터럴 → `FORM_CATALOG['UL-QP-19-01'].name.replace(/\s+/g, '')` SSOT 경유로 교체.

## 2026-04-20 — skill-gap 업데이트

- [x] **[2026-04-20 skill-gap] verify-auth Step 13 추가** — FE role 리터럴 직접 비교 탐지. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-hardcoding Step 23 추가** — export-data 서비스의 status allowlist 리터럴 탐지. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-frontend-state Related Files + Step 15 추가** — use-cas-guarded-mutation.ts 커버. ✅ 완료 2026-04-20.
- [x] **[2026-04-20 skill-gap] verify-cas Related Files + Step 12 추가** — use-cas-guarded-mutation.ts fetch-before-mutate 훅 참조. ✅ 완료 2026-04-20.

## 2026-04-19 — 다수 세션 완료

- [x] **[2026-04-19 test-software-detail-refactor] S1 — optimisticUpdate non-null assertion** — ✅ 완료 2026-04-19. `throw new Error('optimisticUpdate: cache miss on detail page')`로 교체.
- [x] **[2026-04-19 docx-append-section-sectpr] S1 — insertBeforeSectPr fallback** — ✅ 완료 2026-04-20. `lastIndexOf('</w:body>')` + slice+concat 방식으로 교체.
- [x] **[2026-04-19 verify-sql-safety] 🟠 HIGH fk-resolution.service.ts ilike() 직접 사용** — ✅ 완료 2026-04-19. `safeIlike(users.name, likeContains(name))`로 교체.
- [x] **[2026-04-19 review-arch] 🟡 MEDIUM purgeDeletedDocuments 전체 배치 실패 무한루프** — ✅ 완료 2026-04-19. `consecutiveFullFailBatches` 카운터 + `MAX_CONSECUTIVE_FULL_FAIL=2` 연속 실패 시 abort.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM sql 템플릿 → eq() 전환 (enum 필터)** — ✅ 2026-04-19. form-template-export.service.ts 5건 eq() 교체.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM HandoverQRDisplay appUrl 빈 문자열 가드** — ✅ 이미 적용됨.
- [x] **[2026-04-19 qr-review] 🟡 MEDIUM refetchOnMount QUERY_CONFIG 통합** — ✅ 이미 적용됨.
- [x] **[2026-04-19 qr-review] 🟢 LOW appUrl getAppUrl() 유틸 추출** — ✅ 이미 적용됨.
- [x] **[2026-04-19 verify] 🟢 LOW verify-hardcoding — getTemplateBuffer() 6곳 문자열 리터럴** — ✅ 완료 2026-04-19. `getTemplateBuffer(entry.formNumber)` 교체.
- [x] **[2026-04-19 review-arch] 🟢 LOW exportSoftwareValidation site 스코프 post-filter** — ✅ 완료 2026-04-19. WHERE 절로 이동.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW LABEL_CONFIG.cell 관심사 혼합** — ✅ 완료 2026-04-20. `LABEL_CONFIG.scaling` 네임스페이스 신설.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW pt→mm 매직 넘버 0.353** — ✅ 완료 2026-04-20. `PT_TO_MM = 25.4 / 72` named 상수.
- [x] **[2026-04-19 qr-sampler-review] 🟢 LOW i18n size.* 치수 하드코딩** — ✅ 완료 2026-04-20. 보간 토큰 교체.

### 2026-04-19 sw-validation-overhaul Phase 3-7

- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL quality_approve 후 FE testSoftware.detail 캐시 미무효화** — ✅ 완료 2026-04-20. `commonInvalidateKeys`에 `queryKeys.testSoftware.detail(softwareId)` 포함.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH SoftwareValidationContent 6개 뮤테이션 useMutation 직접** — ✅ 완료 2026-04-20. 6개 `useOptimisticMutation` 전환 + `setQueryData` 완전 제거.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH EN i18n 13개 키 누락** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationsModule export 누락** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM calibration-plans review() assertIndependentApprover 미적용** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM SoftwareValidationListener 과잉 캐시 무효화** — ✅ 완료 2026-04-20. `delete(exact-key)` 교체.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM wf-14b E2E 미업데이트** — ✅ 완료 2026-04-20. Steps 12-17 추가.
- [x] **[2026-04-19 sw-validation] 🟢 LOW 재검증 배너 i18n 메시지 미구분** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🔴 CRITICAL Phase 4 — 다중 항목 DOCX 렌더링 누락** — ✅ 완료 2026-04-20. T6 렌더러 3행 루프 + CONTROL_MAX_ROWS=3.
- [x] **[2026-04-19 sw-validation] 🟠 HIGH Phase 3 — 글로벌 /software-validations 라우트 + Sidebar 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FE exportability 유틸 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — FRONTEND_ROUTES.SOFTWARE_VALIDATIONS 상수 없음** — ✅ 완료 2026-04-20. 5 빌더 추가.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — error.tsx (Error Boundary) 없음** — ✅ 완료 2026-04-20.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 4 — RFC 5987 content-disposition 헬퍼 미추출** — ✅ 완료 2026-04-20. `common/http/content-disposition.util.ts` + 6개 컨트롤러 적용.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — renderer spec 없음** — ✅ 완료 2026-04-20. 9 tests PASS.

### 2026-04-19 api-ssot-e2e-serial-export-batch

- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C2 — data-migration Execute FK 인덱스 드리프트** — ✅ 완료 2026-04-19. `chunkOffset + chunkIdx` O(1) 계산으로 교체.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C1 — data-migration 하드코딩 상태 리터럴 4곳** — ✅ 완료 2026-04-19. `CableStatusValues.ACTIVE` 등 values.ts SSOT 경유.
- [x] **[2026-04-18 arch-review] 🔴 CRITICAL C3 — documents.controller IStorageProvider 직접 주입** — ✅ 완료 2026-04-19. `DocumentService.downloadWithPresign()` + `getThumbnailBuffer()` 추가, 컨트롤러 직접 의존 제거.
- [x] **[2026-04-18 arch-review] 🟠 HIGH H1 — data-migration 케이블 INSERT 캐시 무효화 누락** — ✅ 완료 2026-04-19. `CABLES_CACHE_PREFIX` 상수 신설.
- [x] **[2026-04-18 arch-review] 🟠 HIGH H3 — data-migration 이력 시트 중복 검사 fallthrough** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-review] 🟡 MEDIUM M4 — data-migration Preview 파일 cleanup 누락** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-rev2] 🟡 MEDIUM exportSoftwareValidation resolveUser N+1** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 arch-rev2] 🟢 LOW exportSoftwareRegistry teamId 스코프 미처리** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟠 HIGH verify-hardcoding — data-migration API unwrapResponseData 미사용** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-ssot — history-card 'equipment_photo' 문자열 직접** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-e2e — networkidle + waitForTimeout + auth.fixture** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟡 MEDIUM verify-workflows — serial 모드 미설정 3파일** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟢 LOW verify-i18n — en selfInspection.form 키 3개 누락** — ✅ 완료 2026-04-19.
- [x] **[2026-04-18 verify] 🟢 LOW verify-design-tokens — transition 하드코딩 3건** — ✅ 완료 2026-04-19.
- [x] **[2026-04-19 ul-qp-18-forms] verify-seed-integrity SHOULD FAIL** — ✅ 완료 2026-04-19. truncate 리스트 4개 추가 + checkCount 2건 추가.
- [x] **[2026-04-19 ul-qp-18-forms] 🟢 LOW renderer 유닛 테스트** — ✅ 완료 2026-04-19. 3종 spec, 29 tests PASS.

## 2026-04-18 — 완결-완결 패스 / nc-permission-async-cache

- [x] **[2026-04-17 qr-phase3] 🟠 HIGH documents.nonConformanceId FK 도입** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH CSP + sops HANDOVER_TOKEN_SECRET** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 qr-phase3] 🟠 HIGH Playwright E2E 3종** — ✅ 완료 2026-04-18. 10/10 PASS.
- [x] **[2026-04-18 completion] 🟡 MEDIUM B2 NCDocumentsSection permission gate 재적용** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 completion] 🟡 MEDIUM B3 i18n `nonConformanceManagement` 이관** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 completion] 🟡 MEDIUM C1 이미지 썸네일 server-side 리사이징** — ✅ 완료 2026-04-18. `GET /documents/:id/thumbnail?size=sm|md|lg`.
- [x] **[2026-04-18 completion] 🟢 LOW D1 document.service.spec.ts 신규** — ✅ 완료 2026-04-18. 9 tests PASS.
- [x] **[2026-04-18 completion] 🟢 LOW E1 verify-* 스킬 실행** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM async onSuccessCallback await + NC 첨부 캐시 이벤트** — ✅ 완료 2026-04-18.
- [x] **[2026-04-18 nc-permission-async-cache] 🟡 MEDIUM CACHE_EVENTS vs NOTIFICATION_EVENTS 분리** — ✅ 완료 2026-04-18 (tech-debt-tracker Rev2 Phase 1).
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Per-row 체크박스 + BulkActionBar 추출** — ✅ 완료 2026-04-18 (Rev2 Phase 4-5).
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Intent URL 파라미터 확산** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM Handover 토큰 → 범용 OneTimeToken 프리미티브** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM verify-qr-ssot + verify-handover-security 스킬 신설** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟡 MEDIUM PWA 완결 (아이콘 PNG + 서비스워커 + Install Prompt)** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW Lighthouse/axe/bundle 배포 게이트** — ✅ 완료 2026-04-20.
- [x] **[2026-04-17 qr-phase3] 🟢 LOW pre-commit self-audit 자동화** — ✅ 완료 2026-04-18 (Phase 0).

### 2026-04-18 arch-ci-gate-zod-pilot

- [x] **[2026-04-17 arch-ci-gate-zod-pilot] CI SOPS 게이트 secret 미등록 시 무음 skip 방지** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] pre-push 에서 선택적 SOPS 검증 훅** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 arch-ci-gate-zod-pilot] `derivePurposeFromStatus` switch → CheckoutStatus enum SSOT** — ✅ 완료 2026-04-18.

### 2026-04-18 ul-qp-18-forms

- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-21 e2e (equipment-registry-export)** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM wf-19b/wf-20b 확장** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM self-inspection UI DTO 필드 노출** — ✅ 완료 2026-04-18.

## 2026-04-17 — history-card-qp1802 / ul-qp-18-forms / verify 후속

- [x] **[2026-04-17 history-card-qp1802] A — renderer 매직 상수 SSOT 이관** — ✅ 완료 2026-04-17.
- [x] **[2026-04-17 history-card-qp1802] C — data service merge 헬퍼 유닛 테스트** — ✅ 완료 2026-04-17. 13개 테스트.
- [x] **[2026-04-17 history-card-qp1802] B — 승인 메타 SSOT 헬퍼 markApprovalMeta** — ✅ 완료 2026-04-17. 3개 승인 경로 통일.
- [x] **[2026-04-17 history-card-qp1802] 타협 2 — 이벤트 기반 캐시 전략 통합** — ✅ 완료 2026-04-19.
- [x] **[2026-04-17 history-card-qp1802] renderer 유닛 테스트** — ✅ 완료 2026-04-19. 13개 테스트.
- [x] **[2026-04-17 ul-qp-18-forms] review-W1 팀 JOIN managementNumber→teamId** — ✅ 완료 2026-04-17.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W3 scope 강제 비대칭** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] 🟡 MEDIUM review-W2 renderer db 주입 경계** — ✅ 완료 2026-04-18.
- [x] **[2026-04-17 ul-qp-18-forms] verify-ssot Step 3b 탐지 패턴 확장** — ✅ 완료 2026-04-17.

## 2026-04-16 — docker-infra-standards / e2e-infra-redesign

- [x] **[2026-04-15 docker-infra-standards] S1 — CI quality-gate bats/shellcheck/hadolint/dclint 스텝 추가** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase C — sops/age secret 관리 실제 도입** — ✅ 완료 2026-04-15. ADR-0005 Accepted 승격.
- [x] **[2026-04-15 docker-infra-standards] Phase G — 컨테이너 보안 하드닝** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase E — rustfs 커스텀 이미지** — ✅ 완료 2026-04-16.
- [x] **[2026-04-15 docker-infra-standards] Phase J — 공급망 보안** — ✅ 완료 2026-04-16. Syft SBOM + Cosign keyless.
- [x] **[2026-04-15 docker-infra-standards] Phase L — 네트워크 세그멘테이션** — ✅ 완료 2026-04-16. prod/lan 2-tier 구조.
- [x] **[2026-04-15 docker-infra-standards] Phase O — Renovate 도입 검토** — ✅ 완료 2026-04-16. Renovate 불필요 판정, dependabot.yml 경로 추가.
- [x] **[2026-04-16 e2e-infra-redesign] S2 — data-migration.service.spec.ts lint 에러** — ✅ 완료 2026-04-16.
- [x] **[2026-04-16 e2e-infra-redesign] S3 — beforeAll 축소** — ✅ 완료 2026-04-16.
- [x] **[2026-04-16 e2e-infra-redesign] S4 — afterAll 축소** — ✅ 완료 2026-04-16.

## 2026-04-21 — tech-debt-batch-0421 + ssot-validation-cleanup + isError fix

- [x] **[2026-04-20 calibration-plan-confirm] S7 — CPLAN_008 항목 주석 미비** — 2026-04-21 완료: ITEM_019~022 각 항목 위에 확인완료/bulk-confirm대상/actualCalibrationId 상태 주석 추가.
- [x] **[2026-04-17 history-card-qp1802] equipment_attachments seed 경로 형식 교정** — 2026-04-21 완료: 6건 절대경로 → 상대경로(`inspection_reports/`, `history_cards/`, `other/`) 교정. `SEED_PLACEHOLDER_ATTACHMENT_PATHS` export + `seed-test-new.ts` placeholder 자동 생성 (PDF/JPEG).
- [x] **[2026-04-18 arch-review] 🟡 MEDIUM M2 — data-migration 세션 상태 메모리 의존** — 2026-04-21 완료: `executionStartedAt` 타임스탬프 + `MIGRATION_EXECUTION_TIMEOUT_MS` (10분) stale 판정으로 서버 재시작 후 재시도 가능.
- [x] **[2026-04-18 arch-rev2] 🟢 LOW EquipmentRegistryDataService SELECT \*** — 2026-04-21 재검증: equipment-registry-data.service.ts:102-119에 이미 16컬럼 projection 적용됨. 코드 변경 불필요.
- [x] **[2026-04-19 sw-validation] 🟢 LOW software-validations.service.ts approve() 인라인 검사** — 2026-04-21 재검증: line 385에 이미 assertIndependentApprover 사용 중. 코드 변경 불필요.
- [x] **[2026-04-19 sw-validation] 🟡 MEDIUM Phase 3 — 10개 컴포넌트 미추출** — 2026-04-21 완료: `ValidationCreateDialog`, `ValidationActionsBar`, `ValidationFunctionsTable`, `ValidationControlTable` 추출. `SoftwareValidationContent.tsx` 1033→404줄.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — 운영 가이드 문서 없음** — 2026-04-21 완료: `docs/references/software-validation-workflow.md` 생성.
- [x] **[2026-04-19 review-arch] 🟢 LOW form-templates-api GET 패턴 불일치** — 2026-04-21 완료: `docs/references/frontend-patterns.md`에 "API GET 응답 패턴 선택" 섹션 추가.
- [x] **[2026-04-19 verify-e2e] 🟢 LOW wf-35:103 토스트 .first() 직접 사용** — 2026-04-21 완료: `expectToastVisible(pageB, /데이터 충돌|.../)` 교체.
- [x] **[2026-04-20 skill-gap] 🟢 LOW calibration-plan-renderer.service.ts iCell.alignment 직접 조작** — 2026-04-21 완료: `calibration-plan.layout.ts`에 `ALIGNMENT.CENTER_MIDDLE` / `CENTER_MIDDLE_SHRINK` 토큰 추출.
- [x] **[2026-04-20 cplan-export-audit] 🟢 LOW Phase 3 — KPI aria-pressed** — 2026-04-21 재검증: button 분기(line 253)에 aria-pressed={isActive} 이미 적용. div 분기는 toggle 버튼이 아님 — 미적용 의도된 설계.
- [x] **[2026-04-21 cleanup-0421] DocumentTable.tsx 213줄** — 2026-04-21 완료: DocumentUploadButton + DocumentTableRow 분리 → DocumentTable.tsx 85줄.
- [x] **[2026-04-21 ssot-step19] ValidationActionsBar.tsx** — 2026-04-21 완료: `ValidationStatusValues.DRAFT/SUBMITTED/APPROVED/REJECTED` 교체 (PostToolUse hook 자동 수정).
- [x] **[2026-04-21 ssot-step19] ValidationDetailContent.tsx** — 2026-04-21 완료: `ValidationStatusValues.DRAFT` + `ValidationTypeValues.VENDOR/SELF` 교체.
- [x] **[2026-04-21 ssot-step19] ValidationEditDialog.tsx** — 2026-04-21 완료: `ValidationTypeValues.VENDOR` 교체.
- [x] **[2026-04-21 ssot-step19] ValidationCreateDialog.tsx** — 2026-04-21 완료: `ValidationTypeValues.VENDOR/SELF` + DocumentUploadButton.tsx 포함 동시 수정.
- [x] **[2026-04-21 verify-e2e] wf-35-cas-ui-recovery.spec.ts** — 2026-04-21 완료: `auth.fixture` import + type-only `BrowserContext, Page` 분리 (PostToolUse hook 자동 수정).
- [x] **[2026-04-21 frontend-state] SoftwareValidationContent.tsx isError 미처리** — 2026-04-21 완료: `isError` 추가, 에러 UI 분기(`loadError` i18n 키, `XCircle` 아이콘) 추가.
- [x] **[2026-04-21 form-export-services] 🟢 LOW renderer 내 단일 열 인덱스 named constant 미적용** — 2026-04-21 완료. checkout/equipment-import layout에 `TEXT_COL = 1` 추가, renderer 리터럴 교체. commit 7458ae0e.
- [x] **[2026-04-21 docx-layer-fix] 🔴 ARCH domain→reports 단방향 의존성 위반** — 2026-04-21 완료. `src/common/docx/docx-template.util.ts` + `docx-xml-helpers.ts` 신설. 5개 도메인 renderer(checkouts/equipment-imports/software-validations/test-software/equipment) import 경로를 `common/docx/`로 교체. reports/ barrel re-export 유지. commit 7458ae0e.
- [x] **[2026-04-21 verify-ssot] 🟠 HIGH `'calibration_certificate'` 리터럴 직접 사용** — 2026-04-21 완료. `DocumentTypeValues.CALIBRATION_CERTIFICATE` 경유로 교체 (service 6곳 + controller 1곳 + spec 픽스처 3곳).
- [x] **[2026-04-21 verify-hardcoding] 🟡 MEDIUM `queryKey: ['auth', 'providers']` 하드코딩** — 2026-04-21 완료. `queryKeys.auth.providers()` 추가 + `AuthProviders.tsx` 경유.
- [x] **[2026-04-21 verify-hardcoding] 🟢 LOW `EXPORTABLE_STATUSES` 리터럴 직접 사용** — 2026-04-21 완료. `ValidationStatusValues.SUBMITTED/.APPROVED/.QUALITY_APPROVED` 경유로 교체.
- [x] **[2026-04-21 review-architecture] 🟢 LOW CreateFormState 역의존** — 2026-04-21 완료. `validation-create-form.types.ts` 신설. `ValidationCreateDialog` re-export, 형제 컴포넌트는 types 파일 직접 import.
- [x] **[2026-04-19 sw-validation] 🟢 LOW Phase 7 — k6 부하 테스트 미검증** — 2026-04-21 완료. `scripts/load/software-validation-export.k6.js` + `software-validation-list.k6.js` 생성. export p95 < 2000ms(DOCX 완화), list p95 < 500ms 목표.
- [x] **[2026-04-21 verify-ssot] 🟢 LOW verify-ssot Step 23 추가** — 2026-04-21 완료. `ssot-checks.md` Step 23(DocxTemplate 레거시 barrel 경로 탐지) 추가 + SKILL.md Output 테이블 업데이트. Step 13 누락 6개 DocumentType 값 보완.
- [x] **[2026-04-21 verify-ssot] 🟠 HIGH `'calibration_certificate'` 리터럴** — 2026-04-21 완료. `DocumentTypeValues.CALIBRATION_CERTIFICATE` 교체 (service 6 + controller 1 + spec 3곳).
- [x] **[2026-04-21 verify-hardcoding] 🟡 MEDIUM `queryKey: ['auth', 'providers']` 하드코딩** — 2026-04-21 완료. `queryKeys.auth.providers()` 네임스페이스 추가 + `AuthProviders.tsx` 경유.
- [x] **[2026-04-21 verify-hardcoding] 🟢 LOW `EXPORTABLE_STATUSES` 리터럴** — 2026-04-21 완료. `ValidationStatusValues.SUBMITTED/.APPROVED/.QUALITY_APPROVED` 경유.

### 2026-04-22 harness: fsm-literal-audit (PR-24 세션)

- [x] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW self-audit ⑧ 기존 파일 7건 FSM 리터럴 위반** — ✅ 2026-04-22 fsm-literal-audit harness 분석 완료: 7개 파일 모두 CheckoutStatus FSM 값 아님. 5개(CreateEquipmentContent/ResultSection/CreateNC/NCDocuments/document-upload): Promise.allSettled JS 표준 'rejected'/'fulfilled'로 CSVal 변환 불가 (의미론적 오류). 2개(IntermediateCheckAlert:153,219): IntermediateCheckStatusKey 로컬 변수 비교, ESLint MemberExpression 규칙 비발동. NCDocumentsSection.tsx:78 `; self-audit-exception` 태그 추가 완료. pnpm lint PASS.
- [x] **[2026-04-22 nc-p4-guidance] 🟢 LOW pre-existing ⑧ FSM 리터럴 7건 (NC/IntermediateCheck/document 영역)** — ✅ checkout-arch-pr3-11 항목과 동일. fsm-literal-audit 분석으로 닫힘. 모두 비-CSVal 도메인 (Promise.allSettled / UploadedFile UI / IntermediateCheckStatusKey). 전환 불필요, 기존 eslint-disable 예외 올바름.
- [x] **[2026-04-22 fsm-literal-audit] 🟢 LOW self-audit.md 문서 미반영** — ✅ 2026-04-22 `docs/references/self-audit.md` "9대 아키텍처 원칙"으로 갱신 완료. ⑧ FSM 리터럴 / ⑨ hex 색상 섹션 추가 + self-audit-exception 마커 위치표 추가. `verify-design-tokens` Step 18 (ISVal `satisfies` 제약) 추가.
- [x] **[2026-04-22 subtab-ia] 🟢 LOW verify-zod: verifyHandoverToken @UseInterceptors 누락 (기존 파일)** — ✅ 2026-04-22 PR-22 세션에서 `checkouts.controller.ts:194`에 `@UseInterceptors(ZodSerializerInterceptor)` 추가 완료.

### 2026-04-22 harness: checkout-lender-guard-p1p3 (PR-20 세션)

- [x] **[2026-04-22 review-arch] 🟢 LOW approveReturn checkTeamPermission 미적용** — ✅ 2026-04-22 PR-20 세션에서 `approveReturn`에 `checkTeamPermission` 루프 추가 완료 (ClassificationEnum.enum SSOT 참조). CROSS_TEAM_FORBIDDEN 테스트도 추가. approve/rejectReturn 패리티 달성.
- [x] **[2026-04-22 p1p3] 🟢 LOW approve 테스트 mockDrizzle.where.then 오버라이드 패턴 비작동** — ✅ 2026-04-22 PR-20 세션에서 `describe('approve')` success/LENDER_TEAM_ONLY 테스트의 `mockDrizzle.where.then` → `mockChain.then` 오버라이드 패턴으로 완전 교체 완료. approveReturn 테스트 패턴과 통일.

### 2026-04-24 harness: tech-debt-4items-0424

- [x] **[2026-04-22 p1p3] 🟡 MEDIUM rejectReturn 스코프 체크 순서 역전 (보안)** — ✅ 2026-04-24 확인: PR-24 fsm-literal-audit 세션에서 이미 수정 완료. `checkouts.service.ts` L2044 `enforceScopeFromData` → L2046 `assertFsmAction` 순서로 확정. 주석("스코프 검증 이후 FSM 검사 — 스코프 외 사용자가 FSM 오류로 상태 역추론하는 정보 노출 방지")도 추가됨. tracker와 실제 코드 불일치 아카이브 처리.
- [x] **[2026-04-22 p1p3] 🟡 MEDIUM submitConditionCheck step 리터럴 SSOT 위반** — ✅ 2026-04-24 확인: PR-24 fsm-literal-audit 세션에서 이미 수정 완료. `checkouts.service.ts` L2158/L2170/L2193/L2229/L2237 전부 `CCSVal.LENDER_CHECKOUT`/`CCSVal.LENDER_RETURN` SSOT 경유. raw 리터럴 0건.
- [x] **[2026-04-22 pr22] 🟡 MEDIUM approvals-api.ts UASVal 하드코딩 3건** — ✅ 2026-04-24 완료. `mapSoftwareToApprovalItem`(L1142): `UASVal.PENDING_REVIEW`, `mapNonConformanceToApprovalItem`(L1165): `UASVal.PENDING`, `mapInspectionToApprovalItem`(L1192): `UASVal.PENDING` 교체 완료.
- [x] **[2026-04-22 subtab-ia] 🟡 MEDIUM useQuery isError 분기 누락 — OutboundCheckoutsTab + InboundCheckoutsTab** — ✅ 2026-04-24 완료. OutboundCheckoutsTab: `checkoutsError`/`refetchCheckouts` 구조분해 + `<ErrorState>` 추가. InboundCheckoutsTab: 3개 쿼리 모두 `isError`/`refetch` 구조분해 + 섹션별 `<ErrorState>` 추가 + `isAnyError` 조기반환 가드. ko/en i18n 키(`outbound.fetchError`, `inbound.sectionFetchError`) 동기화.

### 2026-04-24 세션 B — Backend Surgical Cleanups (PR-20 잔여 + review-architecture 후속)

- [x] **[2026-04-22 p1p3] 🟢 LOW approveReturn scope 체크 비대칭** — ✅ 2026-04-24 PR-20 잔여 완료: `enforceScopeFromCheckout` → `enforceScopeFromData`로 교체, firstEquip.site/teamId 재활용 (커밋 c0b5fb19)
- [x] **[2026-04-24 PR-20] 🟢 LOW assertFsmAction 순서 비대칭 — approve/approveReturn vs rejectReturn** — ✅ 2026-04-24 완료: approve·approveReturn 모두 scope-먼저 패턴으로 통일 (커밋 1b573f5a)
- [x] **[2026-04-24 review-arch] 🔶 WARNING approve·rejectReturn Map 삽입 순서 비결정성** — ✅ 2026-04-24 완료: `equipmentMap.values().next().value` → `equipmentMap.get(items[0].equipmentId)` 교체 (approve + rejectReturn). approveReturn은 이미 올바른 패턴 사용 중이었음 (커밋 e6d485b1).
- [x] **[2026-04-24 review-arch] 🔶 WARNING rejectReturn reason 검증 순서 — scope/FSM 이전 정보 노출** — ✅ 2026-04-24 완료: reason 빈값 검증 블록을 `enforceScopeFromData` + `assertFsmAction` 이후로 이동. 스코프 외 사용자 checkout 상태 역추론 방지 (커밋 e6d485b1).

---

## 2026-04-27 — tech-debt-tracker 전수 처리 (harness tech-debt-batch-0427)

### 실측 확인 — 이전 세션에서 이미 완료된 항목

- [x] **[2026-04-24 86th-session] 🟡 MEDIUM SOFTWARE_VALIDATION_* 이벤트 5개 cache-event.registry.ts 미등록** — ✅ 2026-04-27 실측 확인: `cache-event.registry.ts` L359-391에 `SOFTWARE_VALIDATION_*` 이벤트 5개 이미 등록됨. 트래커 stale 항목.
- [x] **[2026-04-24 rental-phase9] 🟢 LOW rejectReturnMutation onErrorCallback returnRejectReason 미초기화** — ✅ 2026-04-27 실측 확인: `CheckoutDetailClient.tsx` `rejectReturnMutation`의 `onSuccessCallback`·`onErrorCallback` 양쪽 모두 `setReturnRejectReason('')` 있음. 트래커 stale 항목.
- [x] **[2026-04-24 pr-3] 🟢 LOW EquipmentImportDetail.tsx role 리터럴 액션 게이트** — ✅ 2026-04-27 실측 확인: `EquipmentImportDetail.tsx`는 이미 `can(Permission.APPROVE_EQUIPMENT_IMPORT)` 패턴 사용. 트래커 stale 항목.
- [x] **[2026-04-24 sprint-1.1] 🟢 LOW checkout-fsm.test.ts 13건 기존 실패** — ✅ 2026-04-27 실측 확인: `pnpm --filter @equipment-management/schemas run test` 643건 PASS (0 failures). 트래커 stale 항목.
- [x] **[2026-04-24 rental-phase3-4] 🟡 MEDIUM borrowerApprove/borrowerReject 단위 테스트** — ✅ 2026-04-27 부분 완료: borrowerApprove (a)(b)(c)(d) + borrowerReject (a)(b)(c)는 이전 세션에서 이미 구현됨.

### 실수정 완료 — 이번 세션 (2026-04-27)

- [x] **[2026-04-26 manage-skills] 🟡 MEDIUM bulk-action-bar-subpath-import** — ✅ 2026-04-27 완료: `BulkActionBar.tsx:6` `@/lib/design-tokens` barrel import로 교체.
- [x] **[2026-04-26 nc-r3] 🟢 LOW list-chip-arrow-i18n** — ✅ 2026-04-27 완료: `ko/en non-conformances.json`에 `list.chip.arrow: " →"` 추가 + `NonConformancesContent.tsx` chip 화살표 `t('list.chip.arrow')` 교체.
- [x] **[2026-04-26 nc-r4] 🟢 LOW nclistrow-mini-workflow-sr-only** — ✅ 2026-04-27 완료: `NonConformancesContent.tsx` `MiniWorkflow`에 `stepLabel?: string` prop 추가, `sr-only` span 렌더링, 호출부 `stepLabel={t('ncStatus.' + nc.status)}` 전달.
- [x] **[2026-04-26 nc-verify] 🟢 LOW visualTableEditor-focus-ring** — ✅ 2026-04-27 완료: `VisualTableEditor.tsx:184` `focus:ring-2` → `focus-visible:ring-2` 교체.
- [x] **[2026-04-22 verify-fsm] 🟢 LOW reject-return 컨트롤러 guard ↔ FSM permission 동기화 주석 누락** — ✅ 2026-04-27 완료: `checkouts.controller.ts` reject-return 엔드포인트에 `REJECT_CHECKOUT` ↔ FSM `reject_return` 정렬 주석 추가.
- [x] **[2026-04-22 checkout-arch-pr3-11] 🟢 LOW blocked 버튼 focus-visible 누락** — ✅ 2026-04-27 완료: `workflow-panel.ts:49-52` `WORKFLOW_PANEL_TOKENS.action.blocked`에 `FOCUS_TOKENS.classes.default` 추가.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM shared/ExportFormButton + PageHeader useAuth() 직접 호출** — ✅ 2026-04-27 완료: `ExportFormButton.tsx` `canAct: boolean` prop 추가 + 8개 call site 전수 업데이트. `PageHeader.tsx` `OnboardingHintBanner`에서 `useAuth()` 제거 + `OnboardingHint.canShowPrimaryAction?: boolean` 추가.
- [x] **[2026-04-24 pr14-15] 🟡 MEDIUM pulseHard container-level scale animation UX 저하** — ✅ 2026-04-27 완료: `workflow-panel.ts:163-164` critical urgency `animate-pulse-hard` → `animate-pulse-soft` 교체 (scale 제거, opacity-only).
- [x] **[2026-04-24 pr-19] 🟢 LOW CheckoutListSkeleton CHECKOUT_LOADING_SKELETON_TOKENS 미사용** — ✅ 2026-04-27 완료: `CheckoutListSkeleton.tsx` shadcn `<Skeleton>` 제거 + `CHECKOUT_LOADING_SKELETON_TOKENS.base` raw div 패턴으로 교체 (`HeroKPISkeleton` 동일 패턴).
- [x] **[2026-04-26 sprint-2.4] 🟢 LOW checkout-group-card-purpose-cast** — ✅ 2026-04-27 완료: `CheckoutGroupCard.tsx` `as 'calibration' | 'repair' | 'rental'` 리터럴 캐스트 → `as UserSelectableCheckoutPurpose` SSOT 교체.
- [x] **[2026-04-24 rental-phase3-4] 🟡 MEDIUM borrowerReject (d) 테스트 추가** — ✅ 2026-04-27 완료: `checkouts.service.spec.ts` borrowerReject (d) `req.user.teamId !== requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY)` 케이스 추가. 37/37 PASS.

---

## 2026-04-27 — tech-debt-batch-0427 배치 처리 (harness Mode 1)

### 실구현 완료 7건

- [x] **[2026-04-27 vi] 🟢 LOW workflow-panel-urgency-dot-animation-ssot** — `workflow-panel.ts` urgencyDot.warning/critical의 인라인 `'motion-safe:animate-pulse'`를 `ANIMATION_PRESETS.pulse` SSOT 경유로 교체. `ANIMATION_PRESETS` import 추가. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-27 vi] 🟢 LOW condition-check-query-key-tier** — `ConditionCheckClient.tsx` L58 `queryKeys.checkouts.all` 광역 invalidate → `queryKeys.checkouts.view.all()` 계층 경유로 교체. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-27 equipment-pwa-audit-i18n] 🟢 LOW formatFilters-compound-i18n** — `PrintableAuditReport.tsx` `formatFilters()` 6개 한국어 리터럴 → `tAudit('report.filter.*')` i18n 키로 완전 교체. ko/en audit.json에 `report.filter` 서브트리 추가. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-26 sprint-2.4] 🟢 LOW tab-badge-base-absorb-layout** — `CHECKOUT_TAB_BADGE_TOKENS.base`에 `inline-flex items-center justify-center` 흡수 + `ml-1` → `ml-1.5`. `CheckoutsContent.tsx` 호출부 중복 클래스 제거. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-24 wf34-pr13] 🟢 LOW yourTurn.summary dead i18n key 정리** — ko/en `checkouts.json` `yourTurn.summary` 키 제거. 사용 중인 `count`/`summaryAria`만 유지. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-24 wf34-pr13] 🟢 LOW borrowerApproveCheckout apiPatch 래퍼 미사용** — `workflow-helpers.ts`에 `apiGetWithToken`/`apiPatchWithToken` 헬퍼 추가. `borrowerApproveCheckout`/`borrowerRejectCheckout`가 직접 `page.request.get/patch` 대신 새 헬퍼 사용으로 패턴 통일. (2026-04-27 tech-debt-batch-0427)
- [x] **[2026-04-24 pr14-15] 🟢 LOW CheckoutDetailClient date-fns format 직접 사용** — `CheckoutDetailClient.tsx` 5곳의 `format(new Date(...), { locale: ko })` → `useDateFormatter().fmtDate()/fmtDateTime()` 전환. `date-fns`/`ko` import 제거. (2026-04-27 tech-debt-batch-0427)

### 실측 확인 완료 5건 (코드 수정 없음)

- [x] **[2026-04-24 pr-3] 🟢 LOW NEXT_STEP_PANEL_TOKENS dead token** — 실측 확인(2026-04-27): `NextStepPanel.tsx`가 `NEXT_STEP_PANEL_TOKENS.container/urgency/terminal/labels` 전부 사용 중. PR-4 구현으로 이미 해소됨.
- [x] **[2026-04-24 pr4-7] 🟡 MEDIUM use-inbound-section-pagination.ts URLSearchParams 직접 조작** — 실측 확인(2026-04-27): `CheckoutsContent.updateUrl()`이 `filtersToSearchParams()` 결과로 URL을 완전 교체 — 기존 section page params 자동 소거됨. resetFilters 시 실제 잔존 없음. 설계 정상.
- [x] **[2026-04-24 pr4-7] 🟢 LOW OutboundCheckoutsTab celebration EmptyState i18n 하드코딩** — 실측 확인(2026-04-27): `t('emptyState.overdueClear.title/description')` i18n 키 이미 사용 중. ko/en 번역 키 존재 확인. 이미 완료 상태.
- [x] **[2026-04-24 rental-phase9] 🟢 LOW router.refresh() + invalidateKeys 이중 동기화** — 실측 확인(2026-04-27): `CheckoutDetailPage`가 async Server Component — 상태 변경 후 breadcrumb·메타데이터 동기화에 `router.refresh()` 필수. 의도적 이중 갱신. 유지 결정.
- [x] **[2026-04-24 sprint-1.2] 🟢 LOW computeStepIndex exhaustive satisfies 전환 미완** — 실측 확인(2026-04-27): `checkout-fsm.ts` `computeStepIndex` 이미 `as const satisfies Record<CheckoutStatus, number>` 패턴 적용됨 (rental/non-rental 양쪽). 이미 완료 상태.

## 2026-04-27 — tech-debt-0427-cleanup harness + 백엔드 API 4종 + FSM 아키텍처 + approvals E2E

### harness: tech-debt-0427-cleanup (M1~M11 전 PASS) + 추가 완료 2건

- [x] **[2026-04-27 dashboard-design] 🟡 MEDIUM dynamic-ssr-strategy** — `DashboardRow3/4` 8개 위젯 `ssr:true` → `ssr:false` 전환 완료. "First Load JS -15~30KB" 주석 제거. (2026-04-27 별도 세션)
- [x] **[2026-04-27 tech-debt-0427-cleanup] 🟢 LOW equipment-ts-dark-text-brand-info** — `equipment.ts:92` `text-ul-midnight dark:text-brand-info` → `text-brand-info`. CSS 변수 자동 전환 체계 준수. (2026-04-27 별도 세션)
- [x] **[2026-04-27 dashboard-design] 🟢 LOW dark-text-brand-prefix** — `dashboard.ts:101,105` `dark:text-brand-info` → `text-brand-info` 교체 완료. CSS 변수 자동 전환 체계 준수. (2026-04-27 harness: tech-debt-0427-cleanup M2 PASS)
- [x] **[2026-04-27 vi] 🟢 LOW guidance-urgency-normal-i18n** — `ko/checkouts.json` `guidance.urgency.normal: "일반"`, `en/checkouts.json` `"Normal"` 추가 완료. 빈 문자열 해소. (2026-04-27 harness: tech-debt-0427-cleanup M5 PASS)
- [x] **[2026-04-27 page-container-ssot] 🟡 MEDIUM frontend-routes-inline-href** — `EquipmentStickyHeader.tsx`, `CreateCalibrationPlanContent.tsx` 2곳, `NonConformanceManagementClient.tsx` 4곳, 4개 `not-found.tsx` 총 8곳 하드코딩 href → `FRONTEND_ROUTES.*` SSOT 상수 교체 완료. (2026-04-27 harness: tech-debt-0427-cleanup M1+M11 PASS)
- [x] **[2026-04-27 sprint-2.1-2.2] 🟢 LOW brand-info-font-medium-audit** — `grep -rn "text-brand-info font-medium" apps/frontend/components/` 결과 0건 확인. 전수 스캔 완료. (2026-04-27 harness: tech-debt-0427-cleanup M6 PASS)
- [x] **[2026-04-27 dashboard-phase4-6] 🟢 LOW row4-use-translations-extraction** — `DashboardRow4.tsx` `useTranslations('dashboard')` 직접 호출 → `recentActivityAriaLabel?: string` prop으로 추출. `DashboardClient.tsx:191`에서 `recentActivityAriaLabel={t('srOnly.recentActivity')}` 전달. (2026-04-27 harness: tech-debt-0427-cleanup M7 PASS)
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW reject-modal-ux-min-length-inconsistency** — `RejectModal` 입력창 아래 `t('rejectModal.minLengthHint', { min: REJECTION_MIN_LENGTH })` helper text 추가. ko `"{min}자 이상 입력하세요."`, en `"Please enter at least {min} characters."` i18n 양쪽 추가. (2026-04-27 harness: tech-debt-0427-cleanup M3+M10 PASS)
- [x] **[2026-04-27 approvals-ui-r2] 🟢 LOW bulk-reject-modal-no-auto-close** — `handleSubmit` bulk 분기에서 `await props.onBulkConfirm(...)` 성공 후 `props.onClose()` 자동 호출 추가. catch 진입 시 onClose 미호출(의도된 UX). (2026-04-27 harness: tech-debt-0427-cleanup M4 PASS)

### harness: checkout-sprint4-3-to-5 (M8~M11 PASS)

- [x] **[2026-04-27 sprint4-3-to-5] 🔴 HIGH bulk-approve-endpoint** — `bulk-approve.dto.ts` + `PATCH /checkouts/bulk-approve` controller + `bulkApprove(Promise.allSettled + CAS)` service 구현. 947 tests PASS. (2026-04-27 harness: checkout-sprint4-3-to-5 M8 PASS)
- [x] **[2026-04-27 sprint4-3-to-5] 🟡 MEDIUM destinations-recent-endpoint** — `GET /checkouts/destinations/recent` — userId scope + 60s TTL Redis 캐시 + `selectDistinct` + limit 5. (2026-04-27 harness: checkout-sprint4-3-to-5 M10 PASS)
- [x] **[2026-04-27 sprint4-3-to-5] 🔴 HIGH revoke-approval-endpoint** — `PATCH /checkouts/:id/revoke-approval` — fail-close(scope→FSM→domain) + CAS + `REVOCATION_WINDOW_EXPIRED` 에러코드 + `AuditLog extraInfo: { revokeReason, previousApprovedAt }`. (2026-04-27 harness: checkout-sprint4-3-to-5 M11 PASS)
- [x] **[2026-04-27 sprint4-3-to-5] 🟢 LOW backend-lint-unused-vars** — `pnpm --filter backend run lint` exit 0 확인. 미사용 변수 제거 완료. (2026-04-27 커밋 a8421829)

### harness: fsm-terminal-actor-variant (완료 항목)

- [x] **[2026-04-24 sprint-1.5] 🟡 MEDIUM fsm-terminal-step-index-semantics** — `terminatedFromStatus` DB 컬럼(nullable) + `computeReachedStepIndex` 헬퍼 + `NextStepDescriptor.reachedStepIndex` 필드 구현. reject/borrowerReject/cancel 전이 시 `terminatedFromStatus` 저장, `buildNextStep`에서 전달. (2026-04-27 harness: fsm-terminal-actor-variant)
- [x] **[2026-04-27 sprint-4.1] 🟡 MEDIUM actor-variant-role-mapping-gap** — `ActorVariant` + `roleToActorVariant` SSOT → `@equipment-management/schemas` 승격. `isMyTurn` 계산 + `YourTurnBadge` 컴포넌트 구현. `data-my-turn` 전 variant 적용. (2026-04-27 harness: fsm-terminal-actor-variant)
- [x] **[2026-04-27 dashboard-design-review] 🟢 LOW dashboard-client-row-extraction** — `DashboardClient.tsx` 449→197라인. `DashboardRow0~4` 분리 완료. 동적 임포트 + `SIDEBAR_WIDGET_RENDERERS` → Row3/Row4 이동. (2026-04-27 완료)

### harness: approvals-ar7-ar6-e2e (완료 항목)

- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-mini-stepper-e2e-spec** — `wf-ap01-approvals-mini-stepper.spec.ts` 생성. `role="progressbar"` 균일 렌더 + `aria-valuemax` + 단일단계 분수레이블 미노출 E2E 커버. (2026-04-27 harness: approvals-ar7-ar6-e2e)
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approvals-bulk-reject-e2e-spec** — `wf-ap02-approvals-bulk-reject.spec.ts` 생성. `BulkActionBar` aria-hidden 토글 + `RejectModal` bulk 모드 + 일괄 반려 완료 + 선택 해제 시퀀스 커버. (2026-04-27 harness: approvals-ar7-ar6-e2e)
- [x] **[2026-04-27 approvals-ui-r2] 🟡 MEDIUM approval-card-border-tokens-dead-code** — card-view 미도입 확정으로 `APPROVAL_CARD_BORDER_TOKENS` + `getApprovalCardBorderClasses()` 삭제. `design-tokens/components/approval.ts` + `design-tokens/index.ts`. tsc PASS. (2026-04-27 verify-implementation 세션)
