# Tech Debt Tracker Archive

완료된 배치 이력. 상세 sprint 내용은 git log 및 `memory/` 파일 참조.

## 2026년 4월 배치 이력

| Batch | 처리일 | 항목 수 | 상태 |
|-------|--------|---------|------|
| tech-debt-batch-0430 (A~G) | 2026-04-28 | 31 | 완료 |
| tech-debt-batch-0430b | 2026-04-29 | 12 | 완료 |
| tech-debt-batch-0430c | 2026-04-30 | 8 | 완료 |
| **tech-debt-batch-0430d** | **2026-04-30** | **11** | **완료** — setQueryData purge, startNodeLabel, charsRemaining, dependabot, Settings 스피너 3건, IME가드, verify-implementation 3 step, file/form-template spec |
| **setqueryd-purge-and-bulk-ux** | **2026-04-30** | **9** | **완료** (Mode 2 harness, 17/17 MUST PASS) — useOptimisticMutation 추출 (`use-checkout-card-mutations.ts`), CheckoutGroupCard 165 lines 인라인 mutation 제거, S1 verify-bulk-action-bar SKILL 신설, S2 IME 가드 RowSelectCell+ApprovalKpiStrip 확장, S7 analytics SSOT (`lib/analytics/track.ts`) + sidebar 200ms debounce, S8 wf-ap02 Step 7 a11y, S9 charsRemaining REQUIRED_FIELD_TOKENS+text-warning+80% 임계값 |
| **tech-debt-batch-0430e** | **2026-04-30** | **3** | **완료** (Mode 1 harness, 7/7 MUST PASS) — display-preferences-select-ssot(SSOT 4배열 `.map()` 교체), wf-ap02 Step 8/9(bulk-reject route mock + 부분실패 시뮬레이션), legacy-sw-cleanup.spec.ts(TC-01~03 신설, reload 정책 문서화) |
| **sprint45-should-residual** | **2026-04-30** | **3** | **완료** (Mode 2 harness) — S3 그룹 헤더 indeterminate(`lib/checkouts/group-selection.ts` SSOT + 격리 fixture page + e2e 3 시나리오), S4 D-day 6-level Playwright snapshot infra(`tests/e2e/visual/dday-6level.spec.ts` light+dark 12 baseline), S6 in-app `/help` 라우트 + `FRONTEND_ROUTES.HELP` SSOT + EmptyState `secondaryAction` prop |
| **tech-debt-batch-0501** | **2026-04-30** | **4 + 8 arch** | **완료** (Mode 1 harness, 9/9 MUST + 8/8 arch PASS — iter 3) — **iter 1-2 (4건)**: `<CharsCounter>` SSOT, NCEditDialog/RejectModal 인라인 제거, Disposal `common.charCount` → `charCountMin` 정리, NavRow analytics.track, verify-bulk-action-bar Step 8/9 신설. **iter 3 (8 arch)**: ① `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH` SSOT로 NCEditDialog `CAUSE_MAX_LENGTH` 격상 ② Backend NC Zod 4 fields `.max()` 추가(defense-in-depth) ③ Disposal 4 hardcoded `>= 10` → `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` 통일(8 hits) ④ disposal i18n `{min}` 파라미터화 ⑤ `ANALYTICS_EVENTS` 레지스트리(`lib/analytics/events.ts`) 신설 ⑥ NavRow `FRONTEND_ROUTES.CHECKOUTS.LIST` + `ANALYTICS_EVENTS` + `useCallback` 적용 ⑦ `CHAR_COUNTER_TOKENS` design-token(warningRatio/warningClass/destructiveClass) 신설 ⑧ CharsCounter unit test 11/11 PASS + verify-hardcoding Step 32 'role' 정책 + ANALYTICS_EVENTS 매직스트링 차단 추가 |
| **stale-contract-cleanup** | **2026-04-30** | **5 contracts** | **완료** (Mode 1 harness) — REGISTRY Active 5건 전부 아카이브: ar13(이미 PASS) + nc-design-review-phases(CONDITIONAL PASS) + dashboard-role-layout(M-26 calibration-status.ts:140 type cast) + ul-qp-18-forms-replacement(M-P3-b 함수명 정정) + e2e-63-fixes(fixture 회귀 + 11 spec 수정 → 백엔드 E2E 14스위트/177건 → 0/0 PASS). system_admin TestRole 도입 + fixture 권한 격리 아키텍처 개선 |

## 2026년 5월 배치 이력

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
| analytics-events-registry-production-callers | 2026-05-03 | 3 | 완료 |
| checkout-row-onclick-callback | 2026-05-03 | 1 | 완료 |
| charscounter-min-mode-disposal | 2026-05-03 | 7 | 완료 |
| stagger-low-spec-guard | 2026-05-03 | 3 | 완료 |
| groupcard-usecallback-t-scan | 2026-05-03 | 0 | 완료 |
| checkout-zone2-status-truncate-closure | 2026-05-03 | 0 | 완료 |
| **nextauth-csrf-verify-harness** | **2026-05-05** | **2** | **완료** (Mode 2 harness) — §S3 manual curl을 SSOT 자동 스모크로 승격(`pnpm compose:onprem:verify` + `scripts/onprem-verify.mjs` + `scripts/diagnostics/csrf-invariants.json` 머신 판독 SSOT, disjoint sanity 포함) + §J1 manual reproduction을 영구 진단 harness로 결빙(`scripts/diagnostics/nextauth-csrf-trace.mjs` env stack/SW/basePath/proxy 헤더/cookie domain 종합 + `tmp/diagnostics/<ISO>-trace.json` artifact). nginx `lan.conf`는 LAN+onprem 공용임을 명시하는 헤더 주석 추가(rename 회피로 git blame 보존, blast radius 5+). ADR-0006에 `## Recurrence Response` 절 신설 + `infra/ONPREM_DEPLOYMENT.md` 권장 절차 갱신 + `scripts/diagnostics/README.md` 1차 응답자 절차 |
