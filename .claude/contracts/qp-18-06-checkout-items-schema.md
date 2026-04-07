---
slug: qp-18-06-checkout-items-schema
mode: 1
created: 2026-04-07
---

# Contract — QP-18-06 checkoutItems 스키마 갭 보강

## Goal
양식 QP-18-06의 "장비 목록(순번 1~14, 수량)"을 데이터 모델에 반영하기 위해 `checkout_items` 테이블에 `sequence_number`, `quantity` 컬럼을 추가하고, 생성 시 자동 할당 로직을 구현한다.

## Scope (변경 파일)
- `packages/db/src/schema/checkouts.ts` — checkoutItems 컬럼 추가
- `packages/schemas/src/checkout.ts` — CheckoutEquipmentSchema 필드 추가
- `apps/backend/src/modules/checkouts/checkouts.service.ts` — create() insert 시 sequenceNumber 자동 할당, quantity 기본 1
- `apps/backend/drizzle/manual/20260407_add_checkout_items_sequence_quantity.sql` — 신규 마이그레이션

## MUST
1. `packages/db/src/schema/checkouts.ts`의 `checkoutItems`에 다음 컬럼 존재:
   - `sequenceNumber: integer('sequence_number').notNull()`
   - `quantity: integer('quantity').notNull().default(1)`
2. 마이그레이션 SQL 파일이 `apps/backend/drizzle/manual/`에 존재하며:
   - 두 컬럼을 ADD COLUMN
   - 기존 행에 대해 `sequence_number = ROW_NUMBER() OVER (PARTITION BY checkout_id ORDER BY created_at)` 백필
   - `quantity`는 DEFAULT 1로 충족
   - 백필 후 `sequence_number`에 NOT NULL 제약 적용
3. `CheckoutEquipmentSchema` Zod에 `sequenceNumber: z.number().int().positive()`, `quantity: z.number().int().positive()` 추가
4. `CheckoutsService` create() 트랜잭션에서 itemsData 매핑 시 `sequenceNumber: index + 1`, `quantity: 1` 포함
5. **`pnpm --filter @equipment-management/db run tsc --noEmit` 0 errors**
6. **`pnpm --filter backend run tsc --noEmit` 0 errors**
7. **`pnpm --filter @equipment-management/schemas run tsc --noEmit` 0 errors**

## SHOULD
- 기존 checkouts 단위 테스트 회귀 없음 (`pnpm --filter backend run test -- --testPathPattern=checkouts`)
- 마이그레이션 rollback 파일 작성 권장하나 차단 아님

## Non-Goals
- 서명 필드 / 작성자 필드 (별도 PR)
- DTO/Controller 변경 (CheckoutItem은 응답에서 자동 직렬화됨)
- 프론트엔드 변경
- Export 기능 (③에서 처리)

## Verification
```bash
pnpm --filter @equipment-management/db run tsc --noEmit
pnpm --filter @equipment-management/schemas run tsc --noEmit
pnpm --filter backend run tsc --noEmit
pnpm --filter backend run test -- --testPathPattern=checkouts
```
