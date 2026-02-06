# Group D: Full Workflow Integration Tests

This directory contains sequential E2E tests for the complete NC-Repair workflow integration.

## Test Files

### Sequential Execution Required

These tests MUST run in order as they modify database state:

1. **nc-creates-status-change.spec.ts** (D-1)

   - Creates NC and verifies equipment status changes to non_conforming
   - Sets up initial state for subsequent tests

2. **repair-with-nc-connection.spec.ts** (D-2)

   - Creates repair history with NC connection
   - Verifies auto-link guidance display
   - Depends on: D-1 (NC must exist)

3. **nc-auto-corrected.spec.ts** (D-3)

   - Verifies NC status automatically updates to corrected
   - Checks repair link badge and success message
   - Depends on: D-2 (repair with NC connection)

4. **tech-manager-closes-nc.spec.ts** (D-4)

   - Tests technical_manager can access NC edit/closure
   - Verifies closure approval workflow
   - Depends on: D-3 (NC in corrected status)

5. **equipment-status-restored.spec.ts** (D-5)

   - Verifies equipment status restoration logic
   - Checks status based on NC closure state
   - Depends on: D-4 (NC closure state)

6. **complete-workflow-verification.spec.ts** (D-6)
   - Comprehensive audit trail verification
   - Validates all workflow steps completed correctly
   - Depends on: All previous D-group tests

## Running the Tests

### Run all Group D tests sequentially:

```bash
pnpm test:e2e --grep "Group D"
```

### Run individual test (for debugging):

```bash
pnpm test:e2e tests/e2e/nc-repair-workflow/group-d/nc-creates-status-change.spec.ts
```

### Important Notes:

- Tests modify database state
- Must run in sequential order (1 → 6)
- Do NOT run in parallel with other tests
- Clean database state may be required between test runs

## Test Data

- **Equipment**: WORKFLOW_TEST_EQUIPMENT_ID (Network Analyzer - initially available)
- **Users**: test_engineer, technical_manager
- **NC Type**: damage (손상)
- **Test Content Pattern**: "E2E 테스트 D-X: ..."

## SSOT Compliance

All tests follow SSOT principles:

- Import types from `@equipment-management/schemas`
- Use constants from `../constants/test-data.ts`
- Use helpers from `../helpers/` directory
- Never hardcode status values or labels

## Workflow Stages

```
available → [Create NC] → non_conforming
            ↓
         [Create Repair + Link NC]
            ↓
         NC: open → corrected
            ↓
         [Manager Closes NC]
            ↓
         NC: closed
            ↓
non_conforming → [All NCs Closed] → available
```

## Expected Results

After all tests complete:

1. Equipment has NC with cause "E2E 테스트 D-1: 디스플레이 파손"
2. NC is in corrected status (or closed if D-4 closed it)
3. Repair history record exists and is linked to NC
4. Equipment status depends on NC closure state
5. Complete audit trail is maintained
