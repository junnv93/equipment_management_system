# Evaluation Report: approvals-ui-r2 — AP-01
**Iteration**: 5
**Date**: 2026-04-27
**Verdict**: PASS

## MUST Criteria Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| MUST-1 | 3카드 KPI (grep-c=3) | PASS | `grep -c "kpi-value-" ApprovalKpiStrip.tsx` → **3** |
| MUST-2 | null/0/양수 3-way 분기 | PASS | (verified Iter 4) |
| MUST-3 | Badge 제거 | PASS | (verified Iter 4) |
| MUST-4 | APPROVAL_ROW_TOKENS SSOT (0 local consts) | PASS | `grep -n "URGENCY_BORDER\|URGENCY_BG" ApprovalRow.tsx` → **0 lines** |
| MUST-5 | i18n parity | PASS | `kpi.urgent='긴급'/'Urgent'`, `kpi.empty.notReady='준비 중'/'Not ready yet'` 양 언어 확인 |
| MUST-6 | a11y role="region"/"button" + aria-live | PASS | `role={onClick ? 'button' : 'region'}` (L58) — "group" 없음 |
| MUST-7 | generateMetadata i18n | PASS | (verified Iter 4) |
| MUST-8 | Bundle delta | DEFERRED | CI |
| AR-5 | Zod tab validation | PASS | `page.tsx` L133-135: `z.enum(availableTabs)` → `safeParse` → `redirect(...)` |
| AR-15 | queryKey teamId 제거 | PASS | `ApprovalsClient.tsx` 5곳 전부 `queryKeys.approvals.list(activeTab)` — 두 번째 인자 없음 |
| tsc | TypeScript 에러 0건 | PASS | `pnpm tsc --noEmit` → error 0건 |

## Iteration History

| Iter | Issue | Status |
|------|-------|--------|
| 1 | URGENCY_BORDER/URGENCY_BG local constants | FIXED |
| 2 | role="group" → role="region" | FIXED |
| 3 | Contract i18n key alignment (pendingCount→totalPending, avgDays→avgWait) | FIXED |
| 4 | grep-c "kpi-value-" returned 2 (dynamic testid + skeleton) | FIXED (skeleton renamed, 3 static testIds added via prop) |
| 5 | Final verification | PASS |

## Action Required

Proceed to git commit and AP-02 implementation.
