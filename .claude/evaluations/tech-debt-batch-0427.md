# Evaluation Report: tech-debt-batch-0427
Date: 2026-04-27
Iteration: 2

## MUST Criteria
| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | pnpm tsc --noEmit PASS | **PASS** | Exit 0, no errors |
| M2 | workflow-panel.ts urgencyDot에 인라인 `motion-safe:animate-pulse` 없음 | **PASS** | urgencyDot (lines 33–37) uses `ANIMATION_PRESETS.pulse` — compliant. Grep returns a substring hit at line 170 (`motion-safe:animate-pulse-soft` in `NEXT_STEP_PANEL_TOKENS.urgency.critical`), but: (1) that is a different exported constant, (2) `-soft` makes it a distinct custom animation class, (3) it was intentionally changed from `animate-pulse-hard → animate-pulse-soft` per an archived completed item in this batch. No genuine violation. |
| M3 | CHECKOUT_TAB_BADGE_TOKENS.base에 `inline-flex items-center justify-center` 포함 | **PASS** | checkout.ts line 955: `base: \`ml-1.5 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full ...\`` confirmed |
| M4 | ConditionCheckClient.tsx에 `queryKeys.checkouts.all` 직접 invalidate 없음 | **PASS** | grep returns no matches (exit 1) |
| M5 | checkouts.json ko/en 양쪽 `yourTurn.summary` 키 제거됨 | **PASS** | Both ko and en return 'NOT FOUND' for `yourTurn.summary` |
| M6 | PrintableAuditReport.tsx formatFilters()에 한국어 리터럴 없음 | **PASS** | grep returns no matches (exit 1). formatFilters uses `tAudit('report.filter.*')` i18n keys exclusively (lines 47–52) |
| M7 | borrowerApproveCheckout/borrowerRejectCheckout 내 `page.request.get/patch` 직접 호출 없음 | **PASS** | Both functions use `apiGetWithToken` and `apiPatchWithToken` helpers only. No `page.request` calls present. |
| M8 | CheckoutDetailClient.tsx에 `format(new Date` 패턴 없음 | **PASS** | grep returns no matches (exit 1) |
| M9 | tech-debt-tracker.md 처리 항목 제거 + archive.md 이동 기록 | **PASS** | tracker.md: 135 lines (open items kept). archive.md: 439 lines, 283 completed [x] items, including a full 2026-04-27 tech-debt-batch-0427 section with 11 newly completed items. |

## SHOULD Criteria
| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | CheckoutsContent.tsx tab-badge 호출부 중복 레이아웃 클래스 제거 | **PASS** | `ml-1.5 inline-flex items-center justify-center` not found in CheckoutsContent.tsx (exit 1). Layout classes absorbed into CHECKOUT_TAB_BADGE_TOKENS.base. |
| S2 | ko/en audit.json에 report.filter.* 키 추가 | **PASS** | ko: `{"all":"전체","entityType":"대상={value}","action":"액션={value}","userId":"사용자={value}","startDate":"시작일={value}","endDate":"종료일={value}"}`. en: matching English translations present. |
| S3 | apiGetWithToken/apiPatchWithToken 헬퍼 함수 추가 | **PASS** | Both exported at workflow-helpers.ts lines 61 and 68. |

## Verdict
**PASS**

All 9 MUST criteria pass. All 3 SHOULD criteria also pass.

## Issues Found
None blocking.

### Annotation: M2 Grep Specificity
- **File**: `apps/frontend/lib/design-tokens/components/workflow-panel.ts`, line 170
- **Content**: `motion-safe:animate-pulse-soft motion-reduce:animate-none` (inside `NEXT_STEP_PANEL_TOKENS.urgency.critical`)
- **Why not a failure**: The criterion scopes to "urgencyDot" which uses `ANIMATION_PRESETS.pulse` (lines 35–36). Line 170 is in a separate `NEXT_STEP_PANEL_TOKENS` export. The class `animate-pulse-soft` is a distinct custom animation (opacity-only, 2s ease-in-out) defined in `ANIMATION_PRESETS.pulseSoft`, and the inline string is effectively the same as the preset value. The change from `animate-pulse-hard → animate-pulse-soft` is a separately archived completed item from this batch.
- **Recommendation for future contracts**: Use `grep -n "motion-safe:animate-pulse[^-]"` or scope grep to urgencyDot block to avoid false positives.
