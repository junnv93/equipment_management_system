# Evaluation: approvals-cast-aria-datamig-cleanup

## Iteration: 1
## Date: 2026-04-14

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | frontend tsc | PASS | Only error is pre-existing `AuditTimelineFeed.tsx(252,28) TS2345` — explicitly excluded per harness instructions. Zero new errors after `grep -v AuditTimelineFeed`. |
| M2 | backend tsc | PASS | `pnpm --filter backend exec tsc --noEmit` exited 0, no output. |
| M3 | `as Record<string, string>` cast 제거 | PASS | `grep 'as Record<string, string>' apps/frontend/lib/api/approvals-api.ts` → 0 hits. |
| M4 | ApprovalDetailModal aria-label i18n 사용 | PASS | `grep '"download"' apps/frontend/components/approvals/ApprovalDetailModal.tsx` → 0 hits. |
| M5 | data-migration.service.ts buildValues 람다 추출 | PASS | `grep -c 'buildValues'` → 3 (parameter name in `insertHistoryBatch` signature on line 847, call on line 871, comment on line 878). 3 ≤ 4 threshold met. |
| M6 | buildValues가 named private 메서드로 추출됨 | PASS | `grep -c 'private build.*Values'` → 3 (`buildCalibrationValues` line 794, `buildRepairValues` line 813, `buildIncidentValues` line 828). Exactly 3 as required. |

## SHOULD Criteria

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| S1 | `pnpm --filter backend run test` PASS | PASS | 578 tests passed, 45 suites passed (including `data-migration.service.spec.ts`). Zero failures. |
| S2 | i18n 키가 ko/en 양쪽에 동일 구조로 추가됨 | PASS | `ko/approvals.json`: `detail.downloadAttachment` = `"{filename} 다운로드"`. `en/approvals.json`: `detail.downloadAttachment` = `"Download {filename}"`. Both keys present under `detail` section with matching `{filename}` interpolation parameter. |

## Verdict: PASS

## Issues (FAIL only)

None.
