# approval-audit-timeline-ui Evaluation

## Result

PASS

## Evidence

- Added `apps/frontend/lib/api/approvals/audit-history.ts`.
  - Resolves approval category to audit entity type/id.
  - Maps only `review`, `approve`, `borrower_approve`, `reject`, and `borrower_reject` actions into `ApprovalHistoryEntry`.
- Updated `apps/frontend/components/approvals/ApprovalDetailModal.tsx`.
  - Fetches entity audit logs only when the modal is open and no inline `approvalHistory` exists.
  - Reuses `ApprovalHistoryCard` and `ApprovalStepIndicator` with the resolved history.
- Added `apps/frontend/lib/api/approvals/__tests__/audit-history.test.ts`.

## Verification

```bash
pnpm --filter frontend test -- audit-history.test.ts --runInBand
pnpm --filter frontend test -- InspectionFormDialog.gallery.test.tsx audit-history.test.ts --runInBand
pnpm --filter frontend exec eslint components/approvals/ApprovalDetailModal.tsx lib/api/approvals/audit-history.ts lib/api/approvals/__tests__/audit-history.test.ts
pnpm --filter frontend run type-check
```

Results:
- `audit-history.test.ts`: 1 suite / 3 tests PASS.
- Combined focused frontend tests: 2 suites / 4 tests PASS.
- ESLint: PASS.
- Frontend type-check: PASS.

