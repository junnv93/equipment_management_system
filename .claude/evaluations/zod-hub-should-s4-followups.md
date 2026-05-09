# Evaluation: zod-hub-should-s4-followups

## Iteration: 1
## Verdict: PASS

---

## MUST Criteria

| ID | Verdict | Evidence |
|----|---------|----------|
| M-1 | PASS | `grep -c "^  - name: validation$" infra/monitoring/prometheus/alert.rules.yml` → `1` (line 115). Validation group exists as the last group in file. |
| M-2 | PASS | `grep -cE "alert: ZodValidationIssues(HighCount|PersistentSpike)"` → `2`. Both rules present at lines 118 and 131. |
| M-3 | PASS | `grep -c 'zod_validation_issues_total{issue_count_bucket="11+"}'` → `2`. Both warning and critical exprs use the correct label selector. |
| M-4 | PASS (contract script defect — content verified by alternative means) | **Contract awk FAILS for last-group case.** `awk '/^  - name: validation$/,/^  - name:\|^[A-Za-z]/' alert.rules.yml` returns only 1 line because `validation` is the final group — no subsequent `- name:` or top-level `[A-Za-z]` line terminates the range. Direct inspection confirms: `grep -n "summary:\|description:\|severity:" alert.rules.yml \| awk -F: '$1 >= 115'` returns 6 matching lines (severity:warning line 123, summary: line 125, description: line 126, severity:critical line 136, summary: line 138, description: line 139). Content satisfies ≥4 annotations and ≥2 severity labels. Contract grep is broken, not the implementation. |
| M-5 | PASS | File exists at `apps/frontend/tests/e2e/features/i18n/zod-fail-toast.spec.ts`. Auth fixture import: `grep -c "from '../../shared/fixtures/auth.fixture'"` → `1`. |
| M-6 | PASS | `grep -c "expectToastVisible"` → `5` (≥3). `grep -c "li\[role=\"status\"\]"` → `0`. Helper SSOT used; direct selector absent from spec. (Note: `li[role="status"]` lives inside `toast-helpers.ts` as intended — spec correctly delegates to helper.) |
| M-7 | PASS | `grep -c "VALIDATION_ERROR"` → `2` (≥1). `grep -cE "code: 'too_small'\|code: 'invalid_format'\|code: 'invalid_type'"` → `4` (≥3). All three issue code scenarios present. |
| M-8 | PASS | `grep -cE "너무 작습니다\|형식을 만족하지\|형식이 올바르지 않습니다"` → `7` (≥3). Korean i18n strings verified in test assertions and comments. |
| M-9 | PASS | `grep -c "TEST_NC_IDS"` → `2` (≥1). `grep -cE "[a-f0-9]{8}-..."` → `0`. No inline UUIDs in spec file; `TEST_NC_IDS.NC_006_WITH_REPAIR` is SSOT constant. |
| M-10 | PASS | `grep -c "non_conformances\|UPDATE.*corrected"` → `2` (≥1). `resetNcToCorrected()` uses `UPDATE non_conformances SET status = 'corrected'` pattern consistent with `nc-rejection-flow.spec.ts`. |
| M-11 | PASS | `grep -c "AlertManager rule\|alert.rules.yml\|ZodValidationIssues" docs/adr/0008-backend-zod-error-i18n.md` → `3` (≥1). Lines 106-108: "[2026-05-09 closure] Prometheus AlertManager rule (`infra/monitoring/prometheus/alert.rules.yml` `validation` 그룹) 등록 완료 — `ZodValidationIssuesHighCount` ... + `ZodValidationIssuesPersistentSpike` ... 2-tier escalation." |
| M-12 | PASS | `grep -c "\[x\].*zod-validation-issues-alert-rule\|\[x\].*e2e-zod-fail-toast-verification"` → `0` (≥0 — items removed per Step 7a lifecycle). `grep -c "SKIP-trigger-not-met.*zod-fallback-eslint-custom-rule"` → `1`. SKIP marker present. |
| M-13 | PASS | `grep -c "zod-hub-should-s4-followups\|zod-hub S-4 후속" tech-debt-tracker-archive.md` → `1` (≥1). Detailed batch entry at line 73 covering all 3 items. |
| M-14 | PASS (contract script defect — content verified by alternative means) | **Contract awk FAILS for same reason as M-4.** `awk '/^### 2026-05-08 zod-i18n-mapper-hub-closure 후속/,/^###\|^$/' tracker.md` stops at first blank line (line 32 = blank between header and closure note), yielding only 1 line. Direct inspection `sed -n '31,37p'` shows 7 lines: header (31) + blank (32) + closure blockquote (33) + blank (34) + SKIP item (35) + blank (36) + next `###` (37). Satisfies ≥3. Contract grep is broken, not the implementation. |

---

## SHOULD Criteria

| ID | Verdict | Notes |
|----|---------|-------|
| S-1 | PASS | `ZodValidationIssuesHighCount for: 10m` (warning), `ZodValidationIssuesPersistentSpike for: 5m` (critical). Matches contract requirement exactly. |
| S-2 | PASS | Single `page.route(REJECT_PATH, ...)` handler in `triggerRejectWithMockedFailure`. `if (route.request().method() !== 'PATCH') return route.continue()` on line 71 — all non-PATCH requests pass through to real backend. All 3 test cases call this same helper (DRY, no per-case inline route). |
| S-3 | PASS | tech-debt-tracker.md line 35: 4 conditions fully enumerated with pass/fail status for each. Re-evaluation trigger stated explicitly: "재검토 트리거: 신규 도메인 mapper 추가 3회 이상 누적 시". `commit-pipeline-safety S-4` precedent cited. Follows the established pattern. |

---

## Architectural Concerns

1. **Contract M-4 / M-14 awk pattern defect (structural, not implementation)**: Both awk range patterns use `/^[A-Za-z]/` or `/^$/` as end-anchors, which fails when the target section is the last section in the file. This is a systemic evaluator-script hazard — any future sprint adding a new last-group to `alert.rules.yml` or a last section to `tech-debt-tracker.md` will silently produce false FAIL. Recommend adding a sentinel comment `# END` or switching the awk end-anchor to EOF-tolerant patterns (e.g., `ENDFILE` in gawk, or use `sed -n '/start/,/end/p'` with explicit end markers). Not a blocker for this sprint; flagged for future contract authoring.

2. **PromQL "p95 spike" terminology mismatch**: The sprint context describes the alert as targeting "p95 spike", but `zod_validation_issues_total` is a Counter (not a histogram). The implemented `sum(rate(...[5m])) > threshold` is semantically correct for a Counter. The "p95" wording in the sprint description is misleading but the PromQL itself is technically sound. No defect in the implementation.

3. **Missing `by (job)` in PromQL aggregation**: `sum(rate(zod_validation_issues_total{issue_count_bucket="11+"}[5m]))` aggregates across all instances. In a PM2 cluster or K8s multi-replica deployment, this sums across replicas (desired behavior for total throughput alert). However, without instance-level disaggregation, the alert cannot identify which instance is misbehaving. This is acknowledged in MEMORY as a known single-instance assumption tech-debt — not a defect in this sprint's scope.

4. **`beforeAll` DB reset vs `beforeEach`**: `resetNcToCorrected()` runs once in `beforeAll`, not before each test. This is safe because all 3 tests use `page.route()` mock that returns HTTP 400 without modifying DB. The `corrected` status is preserved throughout the serial test run. Consistent with the reference `nc-rejection-flow.spec.ts` pattern. However: if a future test is added that does NOT use the mock (e.g., a happy-path test), it would leave the NC in `open` status and break subsequent tests. This is a latent maintainability risk — not a current defect.

5. **No `page.unroute()` teardown**: Routes registered via `page.route()` on the `techManagerPage` fixture are scoped to the page context. Because Playwright fixtures create a new browser context per test (even in serial mode with `test.describe.configure({ mode: 'serial' })`), route leakage between tests is not possible. No defect.

6. **SKIP justification quality (Item 2)**: The 4-condition evaluation is honest and aligns with industry-standard trigger-based deferral. The re-evaluation trigger ("신규 도메인 mapper 추가 3회 이상") is specific and measurable, not vague. The `commit-pipeline-safety S-4` precedent citation provides institutional context. This is a senior-quality SKIP justification.

7. **TypeScript compilation**: `pnpm tsc --noEmit` EXIT=0. No new type errors introduced.

8. **YAML syntax**: `python3 yaml.safe_load()` confirms valid YAML structure.

---

## Recommendation

**PASS → ready for Step 7 (contract → completed/, REGISTRY cleanup)**

Two contract grep scripts (M-4, M-14) produce false 0 results due to awk range not handling last-section EOF correctly. The underlying content fully satisfies the intent. Both have been verified by alternative means (direct `sed`/`grep` with line numbers). These are evaluator script defects, not implementation defects.

All 14 MUST criteria: substantively satisfied.
All 3 SHOULD criteria: PASS.
tsc: EXIT=0. YAML: valid.

No blocking issues found. Architectural notes flagged for future sprint consideration (awk contract pattern authoring + PromQL instance disaggregation).
