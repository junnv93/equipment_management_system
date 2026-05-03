# approval-audit-timeline-ui

## Scope

Approval detail modal에서 기존 backend audit log를 승인 이력 타임라인으로 표시한다.

## MUST

- `ApprovalDetailModal`은 `ApprovalItem.approvalHistory`가 없는 경우 현재 승인 항목에 대응하는 audit entity를 조회해야 한다.
- audit log의 승인 관련 action만 `ApprovalHistoryEntry`로 변환해야 한다.
- incoming 항목은 checkout return과 equipment import를 구분해야 한다.
- disposal 항목은 audit log가 disposal request id가 아니라 equipment id에 기록되는 점을 반영해야 한다.
- 기존 `approvalHistory`가 제공되는 경우에는 기존 값을 우선해야 한다.

## Verification

- `pnpm --filter frontend test -- audit-history.test.ts --runInBand`
- `pnpm --filter frontend test -- InspectionFormDialog.gallery.test.tsx audit-history.test.ts --runInBand`
- `pnpm --filter frontend exec eslint components/approvals/ApprovalDetailModal.tsx lib/api/approvals/audit-history.ts lib/api/approvals/__tests__/audit-history.test.ts`
- `pnpm --filter frontend run type-check`

