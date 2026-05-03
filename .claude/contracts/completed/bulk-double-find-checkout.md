# Contract: bulk-double-find-checkout

> **Slug**: `bulk-double-find-checkout`
> **Created**: 2026-05-03
> **Mode**: backend performance debt harness

## Scope

Remove the intentional 2N `findCheckoutEntity` read pattern from bulk approve/reject while preserving the single-item fail-close path, audit behavior, notification behavior, and per-item partial failure semantics.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | `bulkApprove` performs one `findCheckoutEntity` read per id for version lookup and does not trigger a second checkout entity read inside approve processing. | `bulkApprove` passes the preloaded checkout into `approveInternal`. |
| M2 | `bulkReject` performs one `findCheckoutEntity` read per id for version lookup and does not trigger a second checkout entity read inside reject processing. | `bulkReject` passes the preloaded checkout into `rejectInternal`. |
| M3 | Public single-item `approve` and `reject` APIs remain unchanged. | Public methods delegate to private internal methods without changing signatures. |
| M4 | Single-item security and domain ordering remains centralized in the existing approve/reject logic. | Internal methods contain the prior fail-close path and accept only an optional preloaded checkout. |
| M5 | Regression tests cover the bulk read reuse wiring. | `checkouts.service.spec.ts` includes `bulk approve/reject read reuse`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Remove stale comments describing the double-read trade-off as intentional. | bulk comments now describe checkout reuse instead of double read. |
| S2 | Backend type-check and targeted checkout service tests pass. | Verification commands below. |

## Verification Commands

```bash
pnpm --filter backend test -- checkouts.service.spec.ts --runInBand
pnpm --filter backend run type-check
```
