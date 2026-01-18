# AGENTS.md - Database Package

Shared database package rules. Read root `./AGENTS.md` first.

---

## Module Context

**Role:** Single source of truth for database schemas and client (Drizzle ORM).

**Package Name:** `@equipment-management/db`

**Consumers:**

- `apps/backend` - Database operations, services
- `packages/schemas` - Zod schema generation (future)

---

## Tech Stack

- Drizzle ORM 0.36.x - Database ORM
- PostgreSQL 15 - Database
- drizzle-kit 0.20.x - Migration tool
- TypeScript 5.x - Type definitions

---

## Operational Commands

```bash
# From packages/db directory
pnpm build              # Compile TypeScript
pnpm clean              # Remove dist directory

# From apps/backend directory
pnpm db:generate        # Generate migrations
pnpm db:migrate         # Run migrations
pnpm db:studio          # Open Drizzle Studio
```

---

## Directory Structure

```
src/
├── schema/             # Drizzle schemas
│   ├── equipment.ts    # Equipment table schema
│   ├── teams.ts        # Teams table schema
│   ├── users.ts        # Users table schema
│   ├── loans.ts        # Loans table schema
│   ├── checkouts.ts    # Checkouts table schema
│   ├── calibrations.ts # Calibrations table schema
│   └── index.ts        # Schema exports
└── index.ts            # Drizzle client and utilities
```

---

## Schema Definition Rules

1. **Single Source of Truth**: All database schemas MUST be defined here
2. **Naming Convention**:
   - Table names: `camelCase` (e.g., `equipment`, `loanItems`)
   - Column names: `camelCase` (e.g., `managementNumber`, `createdAt`)
3. **Relations**: Define relations in the same file as the schema
4. **Types**: Export TypeScript types using `$inferSelect` and `$inferInsert`

---

## Import Patterns

### In Backend Services

```typescript
import { equipment } from '@equipment-management/db/schema/equipment';
import * as schema from '@equipment-management/db/schema';
import { db } from '@equipment-management/db';
```

### In Zod Schemas (Future)

```typescript
import { equipment } from '@equipment-management/db/schema/equipment';
import { createSelectSchema } from 'drizzle-zod';

export const equipmentSchema = createSelectSchema(equipment);
```

---

## Migration Strategy

1. **Schema Changes**: Modify schema files in `packages/db/src/schema/`
2. **Generate Migration**: Run `pnpm db:generate` from `apps/backend`
3. **Review Migration**: Check generated SQL in `apps/backend/drizzle/`
4. **Apply Migration**: Run `pnpm db:migrate` from `apps/backend`

---

## Golden Rules

1. **Never import from apps/backend**: This package should be independent
2. **Schema First**: Define schema here, then use in other packages
3. **Type Safety**: Always use Drizzle's inferred types
4. **Relations**: Define relations to enable query optimization

---

## Related Packages

- `@equipment-management/schemas`: Zod validation schemas (derived from Drizzle schemas)
- `apps/backend`: Uses this package for database operations

---

End of packages/db/AGENTS.md
