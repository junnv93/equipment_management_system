# Evaluation: user-fk-integrity-sweep

## Iteration: 1

## Build Verification
- tsc: PASS (pre-verified)
- backend test: PASS (pre-verified, 44/565)
- db:migrate: PASS (pre-verified)

## Contract Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| MUST-1 | 8 FK constraints with correct onDelete | PASS | All 8 columns have `.references(() => users.id)` with correct policies: requestedBy(restrict), approvedBy(set null), discoveredBy(set null), correctedBy(set null), closedBy(set null), rejectedBy(set null), createdBy(restrict), deletedBy(set null) |
| MUST-2 | FK column indexes | PASS | 8 indexes added: calibration_factors_{requested_by,approved_by}_idx, non_conformances_{discovered_by,corrected_by,closed_by,rejected_by}_idx, repair_history_{created_by,deleted_by}_idx |
| MUST-3 | db:generate single migration | PASS | Single migration 0017_shiny_lethal_legion.sql generated with 8 ADD CONSTRAINT + 8 CREATE INDEX statements |
| MUST-4 | db:migrate clean apply | PASS | (pre-verified) |
| MUST-5 | tsc exit 0 | PASS | (pre-verified) |
| MUST-6 | backend test exit 0 | PASS | (pre-verified, 44 suites / 565 tests) |
| MUST-7 | Orphan 0건 사전 검증 | PASS | (pre-verified, 0 orphans across all 8 columns) |
| SHOULD-1 | onDelete policy consistency | PASS | notNull columns (requestedBy, createdBy) use restrict; nullable columns (approvedBy, discoveredBy, correctedBy, closedBy, rejectedBy, deletedBy) use set null. Consistent with contract specification. |
| SHOULD-2 | Additive DDL only | PASS | Migration contains only ALTER TABLE ADD CONSTRAINT and CREATE INDEX. No DROP, no ALTER COLUMN, no DELETE. |

## Scope Verification
- **Files changed:** 3 schema files + migration files only (verified via git diff)
- **No relations() changes:** Diff confirms only column definitions and index blocks modified
- **No service/controller/frontend changes:** git status shows only schema + migration files
- **users import added to repair-history.ts:** Required for .references() -- correct
- **No existing indexes/constraints modified:** All changes are purely additive

## MUST Failures
None.

## SHOULD Failures
None.

## Note on calibration-plans reference pattern
calibration-plans.ts uses `onDelete: 'restrict'` for ALL user FK columns including nullable ones (reviewedBy, approvedBy, rejectedBy). The sweep implementation diverges by using `set null` for nullable columns. However, the contract explicitly specifies the per-column policy, and the implementation matches the contract exactly. The divergence from calibration-plans is intentional -- nullable columns semantically benefit from set null (preserving the record when a user is deleted).

## Verdict: PASS
