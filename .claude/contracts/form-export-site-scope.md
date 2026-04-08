# Contract: form-export-site-scope

## MUST
- `grep -rE "params\.site\s*(\|\||\?\?)\s*scope" apps/backend/src/modules/reports` → 0 hits
- `pnpm --filter backend exec tsc --noEmit` → exit 0
- `pnpm --filter backend run test` → exit 0
- ≥1 new test asserts scoped user with mismatched site throws `ForbiddenException` (or HTTP 403)
- No regression in existing backend tests

## SHOULD
- Single reusable helper (no 3× duplicated reject logic)
- Admin/unscoped path covered by explicit test case
- Helper located with related code (same file or `reports/utils/`)
