# AP-03 Evaluation — Iteration 2

**Date**: 2026-04-27
**Evaluator**: Skeptical QA Agent

## Summary

**PASS**

All 9 MUST criteria are satisfied. The 2 Iteration 1 FAIL items (MUST-2 min(1), MUST-5 Promise.allSettled) are confirmed fixed. TypeScript compiles with 0 errors.

---

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| 1 | `mode` discriminated union → compile-time props validation | PASS | `RejectModal.tsx` lines 39–53: `type RejectModalProps = { mode: 'single'; item: ...; onConfirm: ... } \| { mode: 'bulk'; count: ...; onBulkConfirm: ... }`. TS discriminated union enforces correct prop shapes at call sites. |
| 2 | `RejectReasonSchema` min(1) max(500) | PASS | `approvals-api.ts` lines 203–206: `z.string().min(1, '반려 사유를 입력해주세요.').max(500, ...)`. Comment on line 201 explains design rationale (frontend = presence check only, backend = min(10) defense-in-depth). |
| 3 | local state only — no `useActionState`, no external `setValidationError` | PASS | `RejectModal.tsx` lines 63–65: only `useState` for `reason`, `error`, `isPending`. No `useActionState` import. No `setValidationError` prop. Comment on lines 37, 62 confirms the explicit design decision. |
| 4 | Template select → textarea auto-fill only when empty | PASS | `RejectModal.tsx` lines 94–99: `handleTemplateSelect` checks `if (!reason.trim())` before calling `setReason`. User-written content is protected. |
| 5 | `bulkReject` uses `Promise.allSettled` + partial failure toast | PASS | `approvals-api.ts` lines 994–1006: `Promise.allSettled(ids.map(...))` parallel execution, results mapped to `success`/`failed` arrays. `ApprovalsClient.tsx` lines 359–401: `onSuccessCallback` branches on `result.failed.length > 0 && result.success.length === 0` (total fail), `result.failed.length > 0` (partial), and `else` (total success) with distinct toast variants. |
| 6 | `useOptimisticMutation` + `getInvalidationKeys()` (AR-4) | PASS | `ApprovalsClient.tsx` lines 131–137: `getInvalidationKeys()` helper consolidates 4 queries (`counts`, `kpi`, `APPROVAL_KEYS`, `equipment.all`, `nonConformances.all`). Used at lines 157, 221, 266, 356 covering approve / reject / bulkApprove / bulkReject mutations. All 4 use `useOptimisticMutation`. |
| 7 | `verify-i18n` PASS — `rejectModal.single.description` + `rejectModal.bulk.description` in ko/en | PASS | `ko/approvals.json` lines 194–199: `"single": { "description": "..." }`, `"bulk": { "description": "..." }` present. `en/approvals.json` lines 194–199: both keys present with correct English translations. No parity gap between locales for these two keys. |
| 8 | a11y: `aria-describedby` on textarea, error `role="alert"` | PASS | `RejectModal.tsx` line 137: `<DialogDescription id="reject-modal-desc">`. Line 173: `aria-describedby={error ? 'reject-error' : 'reject-modal-desc'}` — switches target when error appears. Lines 175–181: `<p id="reject-error" role="alert" aria-live="assertive">`. Both ARIA requirements satisfied. |
| 9 | `REJECTION_MIN_LENGTH` server-side validation comment | PASS | `approvals-api.ts` line 198: `"min: 서버에서도 동일 규칙 적용 (defense in depth — backend validation exists)"`. Lines 201–202: explicit comment naming `REJECTION_REASON_MIN_LENGTH` and `validation-rules.ts`. Verified actual backend enforcement exists: `packages/shared-constants/src/validation-rules.ts` line 18 `REJECTION_REASON_MIN_LENGTH: 10`, used in multiple backend DTOs (`disposal.dto.ts`, `mark-corrected.dto.ts`). Note: most backend reject DTOs use `min(1)` — the comment overstates uniformity, but the comment existence criterion is met. |
| TS | TypeScript compile — 0 errors | PASS | `cd apps/frontend && pnpm tsc --noEmit` → exit code 0, no diagnostic output. |

---

## Iteration Delta (vs Iter 1)

- **MUST-2**: was FAIL (`min(10)` via `REJECTION_MIN_LENGTH` constant) → now PASS (`min(1)` hardcoded, comment explains rationale)
- **MUST-5**: was FAIL (`for...of` sequential loop) → now PASS (`Promise.allSettled` parallel execution, lines 994–1006)
- **Bonus fix (mode="single")**: `ApprovalsClient.tsx` line 518 `mode="single"` prop correctly supplied — TypeScript would now catch missing discriminants.
- **Bonus fix (.issues)**: `RejectModal.tsx` line 106 `parsed.error.issues[0].message` — `.errors` was the Iter 1 bug, now corrected.

---

## SHOULD / Observations (non-blocking)

| # | Observation | Severity |
|---|-------------|----------|
| S-1 | **Stale i18n label text**: `rejectModal.reasonLabel` in both ko/en still reads "10자 이상 필수" / "min. 10 characters" (ko line 190, en line 190), but the schema now uses `min(1)`. The UI label is rendered directly (`t('rejectModal.reasonLabel')`), creating a misleading display. Similarly, `rejectModal.validation` and `bulk.rejectValidation` keys still reference "10자". Not a MUST failure (those keys are not in scope), but a user-visible inconsistency introduced by the schema change. | Medium |
| S-2 | **Backend min(10) comment overstated**: Comment claims "backend validation exists" uniformly, but most backend reject DTOs use `min(1)` (not `min(10)`). Only `disposal.dto.ts` and `mark-corrected.dto.ts` actually use `REJECTION_REASON_MIN_LENGTH=10`. The defense-in-depth claim is partially true but misleading. | Low |
| S-3 | **BulkActionBar `onBulkConfirm` error swallowing**: `RejectModal.tsx` lines 116–118: `catch { setError(t('toasts.rejectError')) }` swallows rejection from `mutateAsync`. In partial-failure scenarios this is benign (Promise.allSettled never rejects), but if `fetchItemsMapIfNeeded` throws (network error before `allSettled`), the catch shows a generic error. This is an edge case and acceptable. | Low |
| S-4 | **`BulkActionBar.onBulkReject` closes modal only on resolve**: `RejectModal.tsx` never closes itself on success — it calls `onBulkConfirm` and the caller (`BulkActionBar`) must close via `onClose`. In `BulkActionBar`, `isRejectModalOpen` is only reset via `onClose={()=>setIsRejectModalOpen(false)}`. If the mutation resolves successfully, `bulkRejectMutation.onSuccessCallback` does not call the modal's `onClose`. The modal closes only if: (a) `RejectModal` catches an error and sets error state, or (b) the `handleBulkReject` resolves and the caller triggers close externally. Trace: `mutateAsync` resolves → `onSuccessCallback` fires → does not call `setIsRejectModalOpen(false)`. The modal will remain open after a successful bulk reject. **This is a behavioral defect but not a MUST criteria failure.** | Medium |

---

## Post-merge Actions

1. **S-1 fix**: Update `rejectModal.reasonLabel` in ko/en approvals.json from "10자 이상 필수" to "반려 사유" (and en from "min. 10 characters" to "Rejection Reason"). Also update `rejectModal.validation` and `bulk.rejectValidation` keys to match the actual `min(1)` rule.
2. **S-4 fix**: After successful `onBulkConfirm`, the modal should close. Either `RejectModal` should call `onClose()` after a successful confirm (in the `try` block after `await props.onBulkConfirm`), or `BulkActionBar` should reset `isRejectModalOpen` in its `onBulkReject` promise chain.
3. **S-2 note**: Document (or correct) the comment at `approvals-api.ts` line 198 to be more precise about which backend modules enforce `min(10)` vs `min(1)`.
