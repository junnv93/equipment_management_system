# @equipment-management/db

Database schema and client package (Drizzle ORM).

## Overview

This package contains:

- **Drizzle schemas**: Database table definitions (single source of truth)
- **Drizzle client**: Database connection and query client
- **Database utilities**: Connection testing, health checks, metrics

## Structure

```
packages/db/
├── src/
│   ├── schema/          # Drizzle schemas
│   │   ├── equipment.ts
│   │   ├── teams.ts
│   │   ├── users.ts
│   │   ├── loans.ts
│   │   ├── checkouts.ts
│   │   ├── calibrations.ts
│   │   └── index.ts
│   └── index.ts         # Drizzle client and utilities
└── package.json
```

## Usage

### Import Schema

```typescript
import { equipment } from '@equipment-management/db/schema/equipment';
import * as schema from '@equipment-management/db/schema';
```

### Import Client

```typescript
import { db, pgPool, testConnection, healthCheck } from '@equipment-management/db';
```

## Migration

Migrations are managed in `apps/backend/drizzle/` directory.

To generate migrations:

```bash
cd apps/backend
pnpm db:generate
```

## Architecture

This package follows the **T3 Stack pattern**:

- Database schemas are in a shared package
- All apps can import schemas directly
- Single source of truth for database structure

See `docs/development/schema-architecture-decision.md` for details.
