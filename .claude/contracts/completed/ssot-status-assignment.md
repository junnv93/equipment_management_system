---
slug: ssot-status-assignment
created: 2026-04-21
mode: 1
---

# Contract: 백엔드 status 리터럴 SSOT 2차 — 할당/인자 패턴

## Scope

- `apps/backend/src/modules/self-inspections/self-inspections.service.ts`
- `apps/backend/src/modules/intermediate-inspections/intermediate-inspections.service.ts`
- `apps/backend/src/common/file-upload/document.service.ts`
- `apps/backend/.eslintrc.js`

## MUST Criteria

| ID | Criterion |
|----|-----------|
| M1 | `pnpm --filter backend run tsc --noEmit` exits 0 |
| M2 | `pnpm --filter backend run build` exits 0 |
| M3 | `pnpm --filter backend run lint` exits 0 (no new lint errors) |
| M4 | self-inspections.service.ts에 `approvalStatus: '...'` 리터럴 할당 0개 — 모두 `SelfInspectionStatusValues.*` 사용 |
| M5 | intermediate-inspections.service.ts에 `approvalStatus: '...'` 리터럴 할당 0개 — 모두 `InspectionApprovalStatusValues.*` 사용 |
| M6 | intermediate-inspections.service.ts:228의 `eq(calibrations.approvalStatus, 'approved')` → `CalibrationApprovalStatusValues.APPROVED` |
| M7 | document.service.ts의 `'active' as DocumentStatus` 패턴 0개 — 모두 `DocumentStatusValues.ACTIVE` 사용 |
| M8 | ESLint `.eslintrc.js`에 Property 할당 패턴 selector 추가됨 (`Property[value.type='Literal'][key.name=...]`) |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S1 | controller override에도 동일 Property selector 추가 |
| S2 | `pnpm --filter backend run test` exits 0 |
