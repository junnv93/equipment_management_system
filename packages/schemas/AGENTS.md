# AGENTS.md - Schemas Package

Shared schemas package rules. Read root `./AGENTS.md` first.

---

## Module Context

**Role:** Single source of truth for all data types, validation schemas, and enums used across frontend and backend.

**Package Name:** `@equipment-management/schemas`

**Consumers:**

- `apps/backend` - DTO validation, type definitions
- `apps/frontend` - Form validation, API response types

---

## Tech Stack

| Component  | Version | Notes                                    |
| ---------- | ------- | ---------------------------------------- |
| Zod        | 4.x     | Schema validation (workspace dependency) |
| TypeScript | 5.x     | Type definitions                         |
| Jest       | 29.x    | Schema testing                           |

---

## Operational Commands

```bash
# From packages/schemas directory
pnpm build              # Compile TypeScript
pnpm test               # Run schema tests
pnpm test --watch       # Watch mode
```

---

## Directory Structure

```
src/
├── index.ts            # Main export file
├── equipment.ts        # Equipment schemas
├── loan.ts             # Loan schemas
├── reservation.ts      # Reservation schemas
├── calibration.ts      # Calibration schemas
├── checkout.ts         # Checkout schemas
├── team.ts             # Team schemas
├── user.ts             # User schemas
├── errors.ts           # Error types
├── enums.ts            # Shared enums
├── common/
│   └── base.ts         # Base schemas (pagination, etc.)
├── types/
│   ├── equipment-status.enum.ts
│   ├── rental-status.enum.ts
│   ├── calibration-method.enum.ts
│   ├── team.enum.ts
│   └── user-role.enum.ts
├── utils/
│   └── validation.ts   # Validation utilities
└── __tests__/
    ├── equipment.test.ts
    ├── validation.test.ts
    └── type-guards.test.ts
```

---

## Implementation Patterns

### Schema Definition Pattern

```typescript
// equipment.ts
import { z } from 'zod';
import { EquipmentStatus } from './types/equipment-status.enum';

// Base schema with all fields
export const EquipmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  managementNumber: z.string().min(1).max(50),
  assetNumber: z.string().optional(),
  modelName: z.string().optional(),
  manufacturer: z.string().optional(),
  serialNumber: z.string().optional(),
  status: z.nativeEnum(EquipmentStatus),
  location: z.string().optional(),
  teamId: z.string().uuid().optional(),
  createdAt: z.coerce.date(), // Use z.coerce.date() for API compatibility
  updatedAt: z.coerce.date(), // Handles both Date objects and ISO strings
});

// Create input (omit generated fields)
export const CreateEquipmentSchema = EquipmentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update input (all fields optional)
export const UpdateEquipmentSchema = CreateEquipmentSchema.partial();

// Query params
export const EquipmentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z.nativeEnum(EquipmentStatus).optional(),
  search: z.string().optional(),
  teamId: z.string().uuid().optional(),
});

// TypeScript types derived from schemas
export type Equipment = z.infer<typeof EquipmentSchema>;
export type CreateEquipmentInput = z.infer<typeof CreateEquipmentSchema>;
export type UpdateEquipmentInput = z.infer<typeof UpdateEquipmentSchema>;
export type EquipmentQuery = z.infer<typeof EquipmentQuerySchema>;
```

### Enum Definition Pattern

```typescript
// types/equipment-status.enum.ts
export enum EquipmentStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  CALIBRATION = 'calibration',
  RETIRED = 'retired',
}

export const EquipmentStatusLabels: Record<EquipmentStatus, string> = {
  [EquipmentStatus.AVAILABLE]: 'Available',
  [EquipmentStatus.IN_USE]: 'In Use',
  [EquipmentStatus.MAINTENANCE]: 'Under Maintenance',
  [EquipmentStatus.CALIBRATION]: 'Calibration',
  [EquipmentStatus.RETIRED]: 'Retired',
};
```

### Export Pattern

```typescript
// index.ts - Main exports
export * from './equipment';
export * from './loan';
export * from './reservation';
export * from './calibration';
export * from './checkout';
export * from './team';
export * from './user';
export * from './errors';
export * from './enums';
export * from './common/base';

// Re-export enums
export { EquipmentStatus } from './types/equipment-status.enum';
export { RentalStatus } from './types/rental-status.enum';
export { CalibrationMethod } from './types/calibration-method.enum';
export { TeamType } from './types/team.enum';
export { UserRole } from './types/user-role.enum';
```

---

## Schema Design Rules

### Required Fields

1. All entities MUST have: `id`, `createdAt`, `updatedAt`.
2. IDs MUST be UUID format: `z.string().uuid()` (or `z.number().int().positive()` for numeric IDs).
3. Timestamps: Use `z.coerce.date()` for API input/output (handles both Date objects and ISO strings). Use `z.date()` only for internal TypeScript types.

**Date Handling Pattern:**

- **API Input/Output:** `z.coerce.date()` - Accepts Date objects, ISO strings, or numbers
- **Internal Types:** `z.date()` - Strict Date object only
- **String Dates:** `z.string().datetime()` - For ISO string timestamps in API responses
- **Flexible:** `z.string().or(z.date())` - Accepts both (legacy pattern, prefer `z.coerce.date()`)

**Current Codebase Note:** Some schemas use mixed patterns (`z.date()`, `z.coerce.date()`, `z.string().or(z.date())`). Standardize on `z.coerce.date()` for new schemas.

### Naming Conventions

| Type          | Pattern                  | Example                 |
| ------------- | ------------------------ | ----------------------- |
| Schema        | PascalCase + Schema      | `EquipmentSchema`       |
| Create Schema | Create + Entity + Schema | `CreateEquipmentSchema` |
| Update Schema | Update + Entity + Schema | `UpdateEquipmentSchema` |
| Query Schema  | Entity + QuerySchema     | `EquipmentQuerySchema`  |
| Type          | PascalCase (no suffix)   | `Equipment`             |
| Input Type    | Entity + Input           | `CreateEquipmentInput`  |

### Validation Patterns

```typescript
// String with length constraints
name: z.string().min(1, 'Name is required').max(100, 'Name too long');

// Optional with default
page: z.coerce.number().int().positive().default(1);

// Email validation
email: z.string().email('Invalid email format');

// Date validation (use z.coerce.date() for API input)
startDate: z.coerce.date().min(new Date(), 'Date must be in future');

// For strict Date-only validation (internal use)
internalDate: z.date().refine((d) => d instanceof Date, 'Must be Date object');

// Custom validation
endDate: z.date().refine(
  (date, ctx) => date > ctx.parent.startDate,
  'End date must be after start date'
);
```

---

## Testing Strategy

### Schema Test Pattern

```typescript
// __tests__/equipment.test.ts
import { EquipmentSchema, CreateEquipmentSchema } from '../equipment';
import { EquipmentStatus } from '../types/equipment-status.enum';

describe('EquipmentSchema', () => {
  const validEquipment = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Equipment',
    managementNumber: 'EQ-001',
    status: EquipmentStatus.AVAILABLE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should validate correct equipment', () => {
    const result = EquipmentSchema.safeParse(validEquipment);
    expect(result.success).toBe(true);
  });

  it('should reject invalid UUID', () => {
    const result = EquipmentSchema.safeParse({
      ...validEquipment,
      id: 'invalid-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = CreateEquipmentSchema.safeParse({
      name: '',
      managementNumber: 'EQ-001',
      status: EquipmentStatus.AVAILABLE,
    });
    expect(result.success).toBe(false);
  });
});
```

### Type Guard Test Pattern

```typescript
// __tests__/type-guards.test.ts
import { isEquipmentStatus } from '../utils/validation';
import { EquipmentStatus } from '../types/equipment-status.enum';

describe('isEquipmentStatus', () => {
  it('should return true for valid status', () => {
    expect(isEquipmentStatus(EquipmentStatus.AVAILABLE)).toBe(true);
  });

  it('should return false for invalid status', () => {
    expect(isEquipmentStatus('invalid')).toBe(false);
  });
});
```

---

## Local Golden Rules

### Do's

- Export both Zod schema AND TypeScript type for every entity.
- Use `z.infer<typeof Schema>` to derive types from schemas.
- Use `z.coerce.date()` for date fields that come from API (handles ISO strings).
- Add JSDoc comments for complex validation rules.
- Write tests for all schemas with edge cases.
- Use `safeParse()` in production code for error handling.
- Test schemas with both Date objects and ISO strings to ensure API compatibility.

### Don'ts

- Don't define types separately from schemas; derive them.
- Don't use `z.any()` or `z.unknown()` without refinement.
- Don't use `z.date()` for API input/output; use `z.coerce.date()` instead.
- Don't mix `z.date()`, `z.coerce.date()`, and `z.string().or(z.date())` in the same schema.
- Don't add runtime logic in schema files; keep them pure.
- Don't import from other packages; this is the source of truth.
- Don't modify schemas without updating consuming code.

---

## Version Compatibility

When modifying schemas:

1. **Adding optional field:** Safe, backward compatible.
2. **Adding required field:** Breaking, requires migration.
3. **Removing field:** Breaking, requires major version bump.
4. **Changing validation:** May break existing data; test thoroughly.

### Migration Checklist

- [ ] Update schema in `packages/schemas`
- [ ] Run `pnpm test` in schemas package
- [ ] Update backend DTOs if needed
- [ ] Update frontend forms if needed
- [ ] Update database migration if schema maps to DB
- [ ] Update API documentation

---

## Common Schemas

### Pagination

```typescript
// common/base.ts
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
    }),
  });
```

### API Response

```typescript
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    meta: z.object({
      timestamp: z.string().datetime(),
    }),
  });

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
  meta: z.object({
    timestamp: z.string().datetime(),
  }),
});
```

---

End of schemas AGENTS.md.
