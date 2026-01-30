# E2E Test Seed Data Implementation

## Overview

This directory contains the comprehensive seed data implementation for the Equipment Management System E2E tests. The implementation is organized into three phases with progressive complexity.

## Current Status

### ✅ Phase 1: COMPLETE (~74 records)

Core entities fully implemented with complete test coverage:

- **Teams** (6): 3 sites, 6 classifications (E, R, W, S, A, P)
- **Users** (8): 4 roles, proper hierarchy, NextAuth compatibility
- **Equipment** (32): All 8 filterable statuses, varied calibration ranges
- **Calibrations** (18): Approval workflows, PASS/FAIL/CONDITIONAL results
- **Non-Conformances** (10): All statuses, repair linking, workflow scenarios

### ✅ Phase 2: SUBSTANTIAL PROGRESS (~28 records)

Advanced entities with sophisticated relationships:

- **Repair History** (8): 4 linked to NC (1:1), various results (completed/partial/failed)
- **Calibration Factors** (12): 5 types, approval workflows, frequency parameters
- **Checkouts** (STUB): 15 planned
- **Calibration Plans** (STUB): 6 plans + 15 items
- **Software History** (STUB): 8 planned

### ⏳ Phase 3: READY FOR IMPLEMENTATION (~70 records)

Administrative and historical data with stubs in place:

- Location History (20)
- Maintenance History (15)
- Incident History (15)
- Equipment Requests (6)
- Equipment Attachments (8)
- Audit Logs (30)

## Running the Seed

### Prerequisites

1. Docker containers running (PostgreSQL, Redis)
2. Database schema synchronized: `pnpm db:push`

### Execute Seed

```bash
# Option 1: Direct execution
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management \
  pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts

# Option 2: Using environment
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/equipment_management
pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts
```

## File Structure

```
seed-data/
├── core/                           # Phase 1 Core Entities
│   ├── teams.seed.ts              # 6 teams ✅
│   ├── users.seed.ts              # 8 users ✅
│   └── equipment.seed.ts           # 32 equipment ✅
│
├── calibration/                    # Calibration Management
│   ├── calibrations.seed.ts        # 18 calibrations ✅
│   ├── calibration-factors.seed.ts # 12 factors ✅
│   ├── calibration-plans.seed.ts   # 6 plans + 15 items (STUB)
│   └── (others planned)
│
├── operations/                     # Equipment Operations
│   ├── non-conformances.seed.ts    # 10 NC records ✅
│   ├── repair-history.seed.ts      # 8 repairs ✅
│   ├── checkouts.seed.ts           # 15 checkouts (STUB)
│   └── (others planned)
│
├── history/                        # Historical Records (Phase 3 STUBS)
│   ├── location-history.seed.ts
│   ├── maintenance-history.seed.ts
│   └── incident-history.seed.ts
│
└── admin/                          # Administrative (Phase 3 STUBS)
    ├── equipment-requests.seed.ts
    ├── equipment-attachments.seed.ts
    └── audit-logs.seed.ts

utils/
├── date-helpers.ts                # Date utilities ✅
├── uuid-constants.ts              # Fixed UUIDs ✅
└── verification.ts                # Data validation ✅

seed-test-new.ts                   # Main orchestrator ✅
```

## Key Features

### 1. Fixed UUIDs

All entities use deterministic UUIDs for test stability:

- Teams: `7dc3b94c-82b8-...`
- Users: `00000000-0000-0000-0000-000000000001` etc.
- Equipment: `eeee1001-0001-...` pattern
- Others: Domain-specific patterns

### 2. Realistic Data Relationships

- Non-conformances linked to repairs (1:1)
- Calibration factors with approval workflows
- Equipment with varied calibration dates
- Users with proper role hierarchy

### 3. SSOT Compliance

All enums imported from `@equipment-management/schemas`:

- Equipment statuses
- User roles
- Calibration methods
- Non-conformance types
- etc.

### 4. Date Handling

Proper PostgreSQL date/timestamp conversion:

- `Date` → `YYYY-MM-DD` strings for date columns
- ISO strings for timestamp columns
- Helper functions: `daysAgo()`, `monthsLater()`, `toDateString()`

### 5. Verification Framework

SQL-based verification checks:

- Record counts per table
- Status distribution validation
- Approval workflow coverage
- Relationship integrity

## Implementation Guidelines

### Adding New Seed Data

1. **Create seed file** in appropriate category:

   ```typescript
   import { myTable } from '@equipment-management/db/schema';

   export const MY_SEED_DATA: (typeof myTable.$inferInsert)[] = [
     {
       /* records */
     },
   ];
   ```

2. **Use SSOT types**:

   ```typescript
   import { MyStatus } from '@equipment-management/schemas';

   status: 'pending' as MyStatus, // ✅ Type-safe
   ```

3. **Handle dates properly**:

   ```typescript
   import { toDateString, daysAgo } from '../../utils/date-helpers';

   createdDate: toDateString(daysAgo(5)), // ✅ Correct
   createdDate: daysAgo(5),                // ❌ Wrong for date column
   ```

4. **Import in main seed file**:

   ```typescript
   import { MY_SEED_DATA } from './seed-data/category/my-entity.seed';

   // In main() function:
   await db.insert(schema.myTable).values(MY_SEED_DATA);
   ```

## Test Coverage Matrix

| Feature                         | Count | Status         |
| ------------------------------- | ----- | -------------- |
| Equipment Statuses (filterable) | 8     | ✅ All covered |
| Equipment Classifications       | 6     | ✅ All covered |
| Sites                           | 3     | ✅ All covered |
| User Roles                      | 5     | ✅ All covered |
| Calibration Statuses            | 3     | ✅ All covered |
| Non-conformance Statuses        | 4     | ✅ All covered |
| Approval Workflows              | 3     | ✅ All covered |
| Repair Results                  | 3     | ✅ All covered |

## Next Steps for Phase 3

To complete the remaining tables:

1. **Location History** (20 records)

   - Equipment movements between locations
   - Timestamp tracking

2. **Maintenance History** (15 records)

   - Maintenance operations
   - Technician records

3. **Incident History** (15 records)

   - Equipment incidents
   - Damage, malfunction, repair records

4. **Equipment Requests** (6 records)

   - Create/update/delete request workflows
   - Approval statuses

5. **Equipment Attachments** (8 records)

   - File uploads for equipment
   - Inspection reports, history cards

6. **Audit Logs** (30 records)
   - All CRUD operations
   - Distributed timestamps (6 months)
   - User and action tracking

## Verification Checklist

Before considering implementation complete:

- [ ] All Phase 1 E2E tests pass
- [ ] Equipment filter test covers all 8 statuses
- [ ] Calibration approval workflow tests pass
- [ ] Non-conformance repair linking tests pass
- [ ] Verification script validates all record counts
- [ ] Database has no orphaned records
- [ ] All SSOT types properly used
- [ ] No hardcoded enum values
- [ ] Date handling verified for both date and timestamp columns

## Troubleshooting

### "relation does not exist"

- Run `pnpm db:push` to sync schema
- Verify DATABASE_URL connects to correct database

### Type errors with enums

- Ensure enum imported from `@equipment-management/schemas`
- Use `as Type` casting if necessary (e.g., `'pending' as Status`)

### Date insertion errors

- Use `toDateString(date)` for date columns (returns `YYYY-MM-DD`)
- Use Date objects for timestamp columns
- Check PostgreSQL column type in schema

### Duplicate key errors

- Verify fixed UUIDs are unique
- Check seed data doesn't conflict with existing records
- Run cleanup phase before re-running seed

## References

- **Schema**: `packages/db/src/schema/`
- **Enums**: `packages/schemas/src/enums.ts`
- **Plan**: Original seed data plan document
- **Tests**: `apps/frontend/tests/e2e/`
