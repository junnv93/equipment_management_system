# Scan Agent Prompts

Launch these 3 agents in parallel during Step 2.

## Agent A: Backend Scan

```
Scan apps/backend/src/ thoroughly. Report each finding with file:line.

1. TODO/FIXME/HACK comments (exclude test files)
2. Security gaps:
   - Controllers missing @RequirePermissions or @SkipPermissions
   - Mutation endpoints (POST/PATCH/DELETE) missing @AuditLog
   - userId extracted from request body instead of req.user
3. Performance:
   - N+1 query patterns (DB queries inside loops)
   - Missing cache invalidation after mutations
   - Queries without pagination
4. Dead code:
   - Unused exports
   - Empty catch blocks
   - Commented-out code blocks

Group by severity: CRITICAL / HIGH / MEDIUM / LOW
```

## Agent B: Frontend Scan

```
Scan apps/frontend/ thoroughly. Report each finding with file:line.

1. TODO/FIXME comments (exclude node_modules, .next)
2. Hardcoded strings:
   - Korean text in component files (not in messages/*.json)
   - English text that should be i18n keys
3. Performance:
   - Components >500 lines that could be split
   - useState where URL params should be SSOT
4. Accessibility:
   - Icon-only buttons without aria-label
   - Forms without labels
5. Missing error.tsx or loading.tsx in routes

Group by severity: CRITICAL / HIGH / MEDIUM / LOW
```

## Agent C: Infrastructure & Packages Scan

```
Scan packages/, .github/workflows/, docker files thoroughly. Report each finding with file:line.

1. packages/schemas:
   - Enums defined but unused
   - Validation messages referencing non-existent keys
2. packages/shared-constants:
   - Permissions defined but not used in any controller or can() check
   - API_ENDPOINTS that don't match actual routes
3. packages/db:
   - Tables without indexes on frequently queried columns
   - FK ON DELETE policy inconsistencies
   - Missing relations() definitions
4. CI/CD:
   - Deprecated actions
   - Redundant installs/builds across jobs
   - Missing caching
5. Environment:
   - .env.example vs actual usage gaps

Group by severity: CRITICAL / HIGH / MEDIUM / LOW
```

## Verification Checklist (Step 3)

After scan agents return, verify each finding:

| Claim Type | Verification Method |
|-----------|-------------------|
| "File X missing Y" | `Read` the file completely |
| "Decorator missing" | `Read` full controller, check all endpoints |
| "Index missing" | `Read` schema file's index section |
| "Hardcoded string" | `Read` the specific line |
| "Unused export" | `Grep` for usage across codebase |
| "Missing file" | `Glob` for the file pattern |

**False positive rate from experience: ~23% (3/13 in 2026-04-02 scan)**
