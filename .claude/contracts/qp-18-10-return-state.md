---
slug: qp-18-10-return-state
mode: 1
created: 2026-04-07
---

# Contract — QP-18-10 equipment_imports 반납 상태 컬럼 추가

## Goal
양식 QP-18-10 Part2(반납) 매핑을 위해 `equipment_imports`에 사용 위치/수량/반납 상태 컬럼을 추가한다. 본 PR은 **DB 컬럼만** 추가하며 DTO/Service/UI 변경은 포함하지 않는다(④에서 처리).

## Scope (변경 파일)
- `packages/db/src/schema/equipment-imports.ts` — 컬럼 5개 추가
- `apps/backend/drizzle/0003_add_equipment_imports_return_state.sql` — 마이그레이션 (drizzle-kit 형식)
- `apps/backend/drizzle/meta/_journal.json` — entry 추가
- `apps/backend/drizzle/meta/0003_snapshot.json` — drizzle-kit 생성 (`db:generate`)

## MUST
1. `equipment_imports` 테이블에 다음 컬럼 추가 (모두 nullable — 기존 행 호환):
   - `usageLocation: varchar('usage_location', { length: 255 })`
   - `quantityOut: integer('quantity_out')`
   - `quantityReturned: integer('quantity_returned')`
   - `returnedCondition: jsonb('returned_condition')` — `{ appearance, abnormality, notes }` 형식 (자유 jsonb)
   - `returnedAbnormalDetails: text('returned_abnormal_details')`
2. 마이그레이션 SQL이 5개 컬럼을 모두 ADD COLUMN하며 모두 nullable
3. `pnpm --filter @equipment-management/db exec tsc --noEmit` 0 errors
4. `pnpm --filter backend exec tsc --noEmit` 0 errors
5. 기존 equipment-imports 단위 테스트 회귀 없음

## SHOULD
- 컬럼 주석으로 양식 매핑 명시 (코멘트)

## Non-Goals
- DTO/Service/Controller 변경 (④에서)
- Zod 스키마 추가 (④에서)
- 프론트엔드 UI
- Export 기능 (④에서)
- DB 백필 (NULL 허용으로 충분)

## Verification
```bash
pnpm --filter @equipment-management/db exec tsc --noEmit
pnpm --filter backend exec tsc --noEmit
pnpm --filter backend exec jest equipment-imports
```
