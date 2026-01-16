# AGENTS.md - Equipment Management System

Central governance file for AI agents. All agents MUST read this file first and follow delegated rules.

---

## Project Context

**Business Goal:** Enterprise equipment management system for tracking equipment, loans, calibrations, checkouts, and team assignments.

**Architecture:** pnpm monorepo with Turborepo orchestration.

| Layer    | Technology                                          | Version                                         |
| -------- | --------------------------------------------------- | ----------------------------------------------- |
| Frontend | Next.js (App Router), React, TailwindCSS, shadcn/ui | Next.js 14.0.3, React 18                        |
| Backend  | NestJS, Drizzle ORM, PostgreSQL                     | NestJS 10.x, Drizzle 0.36.x, drizzle-kit 0.20.x |
| Shared   | TypeScript, Zod validation schemas                  | TypeScript 5.x, Zod 4.x                         |
| Auth     | NextAuth.js + Azure AD + JWT                        | next-auth 4.24.x                                |
| Testing  | Jest, React Testing Library, Supertest              | Jest 29.x                                       |

---

## Operational Commands

```bash
# Development
pnpm install              # Install all dependencies
pnpm dev                  # Run all apps in dev mode
pnpm build                # Build all apps
pnpm test                 # Run all tests
pnpm lint                 # Lint all packages

# Docker
pnpm docker:up            # Start containers
pnpm docker:down          # Stop containers
pnpm docker:logs          # View logs

# Backend specific (from apps/backend)
pnpm start:dev            # NestJS dev server with watch
pnpm db:migrate           # Run Drizzle migrations
pnpm db:studio            # Open Drizzle Studio
pnpm test:e2e             # Run E2E tests

# Frontend specific (from apps/frontend)
pnpm dev                  # Next.js dev server (port 3000)
pnpm test:watch           # Jest in watch mode
```

---

## Golden Rules

### Immutable Constraints

1. **TypeScript Strict Mode:** Never use `any` type. Use `unknown` with type guards.
2. **Schema Source of Truth:**
   - Database schema: `@equipment-management/db` (Drizzle schemas)
   - Validation schemas: `@equipment-management/schemas` (Zod schemas)
   - All data types MUST derive from these packages.
3. **No Direct DB Access in Controllers:** Controllers call Services only.
4. **API Routes:** Current implementation uses `/api/` prefix (e.g., `/api/equipment`). Future versioning may migrate to `/api/v1/`.
5. **Environment Variables:** Never hardcode secrets. Use `.env` files (gitignored).

### Do's

- Use Drizzle schemas from `@equipment-management/db` for database operations.
- **Use Zod schemas from `@equipment-management/schemas` for ALL validation.** (Single Source of Truth)
- Use `ZodValidationPipe` with `@UsePipes` decorator in controllers for validation.
- DTO classes are for Swagger documentation (`@ApiProperty`) and type hints only - actual validation is done by Zod.
- Use React Query (`@tanstack/react-query`) for server state.
- Use shadcn/ui components from `components/ui/`.
- Write tests for new services and critical components.
- Follow conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`.

### Don'ts

- Don't install duplicate dependencies in multiple packages.
- Don't import `axios` directly; always use `apiClient` from `lib/api/api-client.ts` or domain-specific API functions from `lib/api/[resource]-api.ts`.
- Don't create new UI components without checking shadcn/ui first.
- Don't bypass authentication guards in protected routes.
- Don't use inline styles; use TailwindCSS classes.
- Don't commit without running `pnpm lint`.

---

## Standards

### Naming Conventions

| Type                | Convention       | Example                           |
| ------------------- | ---------------- | --------------------------------- |
| Files (components)  | PascalCase       | `EquipmentList.tsx`               |
| Files (utilities)   | kebab-case       | `date-utils.ts`                   |
| Variables/Functions | camelCase        | `getEquipmentById`                |
| Types/Interfaces    | PascalCase       | `Equipment`, `CreateEquipmentDto` |
| Constants           | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE`                   |
| API Routes          | kebab-case       | `/api/v1/equipment-categories`    |

### Git Strategy

- **main:** Production-ready code
- **develop:** Integration branch
- **feature/[name]:** New features
- **fix/[name]:** Bug fixes
- **Commit Format:** `type(scope): description` (e.g., `feat(equipment): add search filter`)

### Maintenance Policy

When code diverges from these rules, agents SHOULD:

1. Flag the inconsistency in the response.
2. Propose an update to the relevant AGENTS.md file.
3. Prioritize fixing the divergence in the current task if feasible.

---

## Context Map (Action-Based Routing)

- **[NestJS Backend Modules](./apps/backend/AGENTS.md)** - API routes, services, DTOs, database operations, authentication guards.

- **[Next.js Frontend App](./apps/frontend/AGENTS.md)** - Pages, components, hooks, API client, styling, state management.

- **[Database Package](./packages/db/AGENTS.md)** - Drizzle schemas and client (single source of truth for DB schema).
- **[Shared Schemas Package](./packages/schemas/AGENTS.md)** - Zod schemas, TypeScript types, enums, validation utilities.

- **[API Client Package](./packages/api-client/src/)** - HTTP client configuration, type-safe API calls.

- **[UI Components Package](./packages/ui/src/)** - Shared cross-app UI components (currently minimal).

- **[Docker Configuration](./docker/)** - Dockerfile definitions for frontend and backend.

- **[Database Package](./packages/db/)** - Drizzle schema and client (single source of truth for DB schema).
- **[Database Migrations](./apps/backend/drizzle/)** - Drizzle migration files.

- **[E2E Tests](./apps/backend/test/)** - End-to-end API tests with Supertest.

---

## Quick Reference: File Locations

```
/
├── apps/
│   ├── backend/           # NestJS API server
│   │   ├── src/modules/   # Feature modules (equipment, rentals, auth...)
│   │   └── drizzle/       # Migration files
│   └── frontend/          # Next.js web app
│       ├── app/           # App Router pages
│       ├── components/    # React components
│       ├── hooks/         # Custom React hooks
│       └── lib/api/       # API client functions
├── packages/
│   ├── db/                # Database schema and client (Drizzle ORM)
│   │   ├── src/schema/    # Drizzle schemas (single source of truth)
│   │   └── src/index.ts   # Drizzle client
│   ├── schemas/           # Shared Zod schemas (API validation)
│   ├── api-client/        # HTTP client
│   └── ui/                # Shared UI components
└── docs/                  # Project documentation
```

---

## Environment Setup

Required environment variables must be configured in `.env` files (see `.env.example` if available).

**Backend:**

- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT signing secret
- `AZURE_AD_CLIENT_ID` - Azure AD application ID
- `AZURE_AD_CLIENT_SECRET` - Azure AD application secret
- `AZURE_AD_TENANT_ID` - Azure AD tenant ID

**Frontend:**

- `NEXT_PUBLIC_API_URL` - Backend API base URL (default: `http://localhost:3001`)
- `NEXTAUTH_URL` - Frontend base URL (default: `http://localhost:3000`)
- `NEXTAUTH_SECRET` - Must match backend secret

**Security Note:** Never commit `.env` files. Use `.env.example` as a template with placeholder values.

---

End of root AGENTS.md. Consult delegated files for domain-specific rules.
