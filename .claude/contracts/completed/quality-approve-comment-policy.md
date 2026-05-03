# quality-approve-comment-policy

## Scope

Software validation quality approval comment audit trail stale debt closure.

## MUST

- Quality approval DTO must accept `qualityApprovalComment`.
- Backend `qualityApprove()` must persist `qualityApprovalComment` independently from technical `approvalComment`.
- Empty or omitted quality approval comments must persist as `null`.
- Existing quality approval fields (`qualityApproverId`, `qualityApprovedAt`, status transition) must remain intact.
- Frontend API/UI must pass the quality approval comment through to the backend.

## Verification

- `pnpm --filter backend test -- software-validations.service.spec.ts --testNamePattern="qualityApprovalComment|qualityApprove" --runInBand`

