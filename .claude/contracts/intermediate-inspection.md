# Contract: intermediate-inspection

## MUST Criteria
1. `pnpm tsc --noEmit` passes with 0 errors
2. 3 new tables exist in packages/db/src/schema/
3. Backend CRUD + approval workflow endpoints compile
4. Frontend form renders without runtime errors
5. New enums exported from @equipment-management/schemas
6. CAS (version field) on intermediate_inspections
7. @RequirePermissions on all endpoints
8. Server-side userId extraction (req.user.userId)

## SHOULD Criteria
1. @AuditLog on mutation endpoints
2. Cache invalidation on mutations
3. i18n keys in both en/ko
4. Zod validation via ZodValidationPipe
5. Frontend uses TanStack Query (no useState for server state)
