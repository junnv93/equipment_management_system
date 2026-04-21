---
slug: ssot-status-assignment
iteration: 1
verdict: PASS
---

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| M1 | `pnpm --filter backend run tsc --noEmit` exits 0 | PASS | `pnpm tsc --noEmit` from `apps/backend/` → EXIT_CODE:0, no errors |
| M2 | `pnpm --filter backend run build` exits 0 | PASS | `nest build` → EXIT_CODE:0 |
| M3 | `pnpm --filter backend run lint` exits 0 | PASS | `eslint "{src,apps,libs,test}/**/*.ts" --fix` → EXIT_CODE:0, no errors |
| M4 | self-inspections.service.ts has 0 `approvalStatus: '...'` literal assignments | PASS | grep `approvalStatus:\s*'[a-z]` → no matches |
| M5 | intermediate-inspections.service.ts has 0 `approvalStatus: '...'` literal assignments | PASS | grep `approvalStatus:\s*'[a-z]` → no matches |
| M6 | intermediate-inspections.service.ts:~228 uses `CalibrationApprovalStatusValues.APPROVED` (not `'approved'`) | PASS | grep `'approved'` → no matches in file |
| M7 | document.service.ts has 0 `'active' as DocumentStatus` patterns | PASS | grep `'active' as DocumentStatus` → no matches |
| M8 | `.eslintrc.js` has Property assignment pattern selector added | PASS | Lines 79-84: `Property[key.name=/^(status|approvalStatus|returnApprovalStatus)$/][value.type='Literal'][value.value=/.../]` present in global `no-restricted-syntax` rules |

## SHOULD criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|----------|
| S1 | controller override에도 동일 Property selector 추가 | PASS | Lines 108-113: Property selector duplicated inside `**/*.controller.ts` override block |
| S2 | `pnpm --filter backend run test` exits 0 | PASS | 69 test suites, 911 tests — all passed, EXIT_CODE:0 |

## Issues requiring fix (FAIL items only)

없음. 모든 MUST/SHOULD 기준 통과.
