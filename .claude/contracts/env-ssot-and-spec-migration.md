# Contract — env-ssot-and-spec-migration

**Date**: 2026-05-13
**Mode**: Mode 1
**Slug**: `env-ssot-and-spec-migration`
**Scope**: PR-2 (frontend env SSOT) + PR-3 (equipment spec drizzle-stub migration)

---

## Context

- **PR-2**: `apps/frontend/.env.local`의 `INTERNAL_BACKEND_URL` "임시" 주석 + `ENABLE_LOCAL_AUTH` 누락. ADR-0006 SSOT 정합화.
- **PR-3**: `equipment.service.spec.ts:40-65` monolithic `mockReturnThis` 단일 객체 → drizzle-stub SSOT 마이그레이션.

---

## MUST Criteria

| # | 기준 | 검증 명령 |
|---|------|-----------|
| M-1 | `.env.local`에 "임시" 주석 0건 | `grep -c "임시" apps/frontend/.env.local` → 0 |
| M-2 | `.env.local`에 `ENABLE_LOCAL_AUTH=true` 존재 | `grep -c "ENABLE_LOCAL_AUTH=true" apps/frontend/.env.local` ≥1 |
| M-3 | `.env.local`에 `INTERNAL_BACKEND_URL=http://localhost:3001` 존재 (permanent) | `grep -c "INTERNAL_BACKEND_URL=http://localhost:3001" apps/frontend/.env.local` ≥1 |
| M-4 | `drizzle-stub.ts`에 `createDrizzleInsertWithReturningChain` export | `grep -c "export function createDrizzleInsertWithReturningChain" apps/backend/src/common/__tests__/drizzle-stub.ts` ≥1 |
| M-5 | `drizzle-stub.ts`에 `createDrizzleUpdateWithReturningChain` export | `grep -c "export function createDrizzleUpdateWithReturningChain" apps/backend/src/common/__tests__/drizzle-stub.ts` ≥1 |
| M-6 | `equipment.service.spec.ts`에 drizzle-stub SSOT import | `grep -c "drizzle-stub" apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts` ≥1 |
| M-7 | `equipment.service.spec.ts`에 `mockReturnThis` monolithic chain 0건 (line 47-64 범위) | `awk 'NR>=47 && NR<=64' apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts \| grep -c "mockReturnThis"` → 0 |
| M-8 | backend unit test PASS | `pnpm --filter backend run test -- --testPathPattern=equipment.service.spec` EXIT=0 |
| M-9 | backend tsc EXIT=0 | `pnpm --filter backend run tsc --noEmit` EXIT=0 |
| M-10 | frontend build EXIT=0 | `pnpm --filter frontend run build` EXIT=0 |

## SHOULD Criteria

| # | 기준 |
|---|------|
| S-1 | `.env.local` 섹션 구조가 `.env.example`와 동일 순서 |
| S-2 | `drizzle-stub.ts`에 신규 인터페이스 JSDoc |
| S-3 | `equipment.service.spec.ts` `findAll` 테스트: cache-level mock으로 DB 독립 |

---

## Changed Files

### PR-2
- `apps/frontend/.env.local`

### PR-3
- `apps/backend/src/common/__tests__/drizzle-stub.ts` (extension)
- `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts` (migration)
