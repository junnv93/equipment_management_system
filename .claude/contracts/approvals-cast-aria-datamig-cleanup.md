# Contract: approvals-cast-aria-datamig-cleanup

## Scope
- `apps/frontend/lib/api/approvals-api.ts`
- `apps/frontend/components/approvals/ApprovalDetailModal.tsx`
- `apps/frontend/messages/ko/approvals.json`
- `apps/frontend/messages/en/approvals.json`
- `apps/backend/src/modules/data-migration/services/data-migration.service.ts`

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | frontend tsc 통과 | `pnpm --filter frontend run tsc --noEmit` exit 0 |
| M2 | backend tsc 통과 | `pnpm --filter backend run tsc --noEmit` exit 0 |
| M3 | `as Record<string, string>` cast 제거 | `grep 'as Record<string, string>' apps/frontend/lib/api/approvals-api.ts` → 0 hit |
| M4 | ApprovalDetailModal aria-label i18n 사용 | `grep '"download"' apps/frontend/components/approvals/ApprovalDetailModal.tsx` → 0 hit |
| M5 | data-migration.service.ts buildValues 람다 추출 | `grep -c 'buildValues' apps/backend/src/modules/data-migration/services/data-migration.service.ts` → ≤ 4 hit (시그니처 1 + 호출부 3) |
| M6 | data-migration buildValues가 named private 메서드로 추출됨 | `grep -c 'private build.*Values' apps/backend/src/modules/data-migration/services/data-migration.service.ts` → 3 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `pnpm --filter backend run test` PASS |
| S2 | i18n 키가 ko/en 양쪽에 동일 구조로 추가됨 |
