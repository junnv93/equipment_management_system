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
