# Exec Plan — Suite-27 Equipment Import Auto Checkout Tracking

- Date: 2026-04-09
- Owner: harness (Planner → Generator → Evaluator)
- Status: Ready for Generator
- Precedent: suite-23/24/25 (`de481327`), suite-26 (`04acc900`)

## Goal

Regression coverage for the reverse Import flow: `received → return_requested` auto-creates a
`purpose=return_to_vendor` Checkout, then driving that checkout through lifecycle → import
`returned` + equipment `inactive`. **Complements WF-13 (happy path) with targeted assertions**:
(a) `returnCheckoutId` linkage integrity, (b) equipment → INACTIVE gate, (c) permission failures,
(d) state-mismatch errors, (e) CAS version conflict.

## Phase 0 — Investigation Summary (complete)

Anchors:

- `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts:574` — `initiateReturn`:
  `received → return_requested` via `updateWithVersion` (CAS), equipment → `AVAILABLE`, auto-creates
  checkout via `checkoutsService.create` with `purpose=RETURN_TO_VENDOR` (line 650–662, destination
  = vendorName for rental).
- `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts:694` —
  `updateWithVersion(..., { returnCheckoutId: newCheckout.id })` best-effort linkage.
- `apps/backend/src/modules/equipment-imports/equipment-imports.service.ts:760` — `onReturnCompleted(checkoutId)`:
  looks up import by `returnCheckoutId`, transaction: import → `RETURNED`, equipment → `ESVal.INACTIVE`
  (line 819).
- `apps/backend/src/modules/equipment-imports/equipment-imports.controller.ts:188` —
  `POST /api/equipment-imports/:id/initiate-return`, body `{ version }`, permission `CREATE_CHECKOUT`.
- `apps/backend/src/modules/checkouts/checkouts.service.ts:1796` — callback hookup
  (`rentalImportsService.onReturnCompleted` from return-approve path).
- `packages/db/src/schema/equipment-imports.ts:112` — `returnCheckoutId: uuid('return_checkout_id').references(checkouts.id)`.
- `apps/frontend/tests/e2e/workflows/wf-13-equipment-import-full-cycle.spec.ts` — existing happy-path E2E
  (ends at `import.status === 'returned'`, **no equipment → inactive assertion, no error paths**).

Feature fully implemented. No up-front `test.fixme` required except S27-08 (cancel rollback) pending
generator verification of reverse-rollback semantics.

## Phase 1 — Helper Extensions

File: `apps/frontend/tests/e2e/features/checkouts/helpers/checkout-helpers.ts` (MODIFY)

Grep existing exports first. Add only what's missing (do not duplicate `workflow-helpers.ts`):

1. `createReceivedRentalImport(page, tmToken, teToken): Promise<{ importId: string; equipmentId: string; version: number; checkoutsBefore: string[] }>`
   - Flow: `createPendingEquipmentImport` → approve (TM) → receive (TE) with minimal JSON body (documents optional).
   - Returns the auto-created equipmentId + initial version for CAS + a snapshot of existing active
     checkouts on that equipment (used to identify the newly auto-created return-checkout in S27-01).

2. `requestImportReturn(page, token, importId, version): Promise<APIResponse>`
   - POST `/api/equipment-imports/:id/initiate-return` with `{ version }`.

3. `getImportSnapshot(page, token, importId): Promise<{ status: string; version: number; returnCheckoutId: string | null; equipmentId: string | null; vendorName: string | null }>`
   - GET wrapper.

4. `findReturnCheckoutForImport(page, token, importId): Promise<{ id: string; purpose: string; destination: string; status: string } | null>`
   - Uses `returnCheckoutId` field if present; falls back to listing active checkouts on the linked
     equipment with `purpose=return_to_vendor`.

All helpers reuse `getCheckoutPool()` / `getBackendToken()` patterns.

## Phase 2 — Spec File

File: `apps/frontend/tests/e2e/features/checkouts/suite-27-import-return-checkout/s27-import-return-checkout.spec.ts` (CREATE)

Header pattern mirrors suite-26 (serial mode, chromium gating). Each test creates its own import
dynamically (no shared state, no seed dependence).

### Test cases

| # | Name | Goal |
|---|------|------|
| S27-01 | `received → return_requested 성공 시 자동 Checkout(purpose=return_to_vendor) 생성` | Assert auto-checkout created, `purpose=return_to_vendor`, `destination=vendorName`, `status=pending` |
| S27-02 | `import.returnCheckoutId linkage + equipment → AVAILABLE` | Assert `returnCheckoutId !== null` matches auto-checkout id, `equipment.status === available` (service.ts:626–630) |
| S27-03 | `auto-checkout lifecycle → import.status === returned` | Drive auto-checkout: approve → start → return → approve-return, assert final `import.status === returned` |
| S27-04 | `최종 완료 시 equipment.status === inactive` | Continuation of S27-03, assert `equipment.status === 'inactive'` (service.ts:819) |
| S27-05 | `권한 실패: quality_manager 의 initiate-return → 403` | Non-CREATE_CHECKOUT role blocked |
| S27-06 | `상태 불일치: pending 상태에서 initiate-return → 400 + IMPORT_ONLY_RECEIVED_CAN_RETURN` | Create pending import (no approve/receive), call initiateReturn, assert 400 code |
| S27-07 | `stale version → 409 ErrorCode.VersionConflict` | initiateReturn 두 번 with same version, 2번째는 409 + SSOT code |
| S27-08 | `test.fixme: auto-checkout cancel 시 import 롤백` | Cite backend file:line if rollback semantics 미구현 — generator phase 에서 최종 확정 |

All error-path cases import `ErrorCode.VersionConflict` from `@equipment-management/schemas`.

### Verification
`pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-27-import-return-checkout`

## Phase 3 — Narrative Doc

File: `docs/manual/checkout-import-scenarios.md` (MODIFY — append section)

New subsection under existing "시나리오 3" (or 부록):
- Suite-27 커버리지 매트릭스 (import.status × equipment.status × checkout.status for S27-01 ~ S27-04)
- 🔴 "자동 Checkout 생성" 항목이 이제 suite-27 로 커버됨을 명시
- WF-13 과의 차이점 (suite-27 은 WF-13 이 빠뜨린 linkage/equipment→inactive/error paths 보강)

## Phase 4 — Verification

```bash
pnpm tsc --noEmit
pnpm --filter backend run test                                                                  # 551+
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-27-import-return-checkout
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-23-cross-site-rbac
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-24-cancel-equipment-recovery
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-25-cas-concurrent-approval
pnpm --filter frontend exec playwright test --project=chromium tests/e2e/features/checkouts/suite-26-shared-equipment
git diff --exit-code apps/backend/src/database
git diff --exit-code packages/db/src/schema
```
