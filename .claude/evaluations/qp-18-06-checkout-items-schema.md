# Evaluation — qp-18-06-checkout-items-schema

Branch: `feat/checkout-items-sequence-quantity`
Verdict: **PASS**

## MUST results

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| 1 | `checkoutItems.sequenceNumber: integer notNull` + `quantity: integer notNull default(1)` | PASS | `packages/db/src/schema/checkouts.ts:124-125` |
| 2a | Migration file exists in `apps/backend/drizzle/manual/` | PASS | `apps/backend/drizzle/manual/20260407_add_checkout_items_sequence_quantity.sql` |
| 2b | ADD COLUMN both fields | PASS | migration L8-9 (`sequence_number integer` nullable, `quantity integer NOT NULL DEFAULT 1`) |
| 2c | Backfill via `ROW_NUMBER() OVER (PARTITION BY checkout_id ORDER BY created_at)` | PASS | migration L12-21 (adds `, id` tiebreaker — still scoped per checkout_id, compliant) |
| 2d | `quantity` default 1 satisfied | PASS | inline `NOT NULL DEFAULT 1` at L9 |
| 2e | `sequence_number` SET NOT NULL after backfill | PASS | migration L24 |
| 2f | BEGIN/COMMIT wrapper | PASS | L5, L26 |
| 3 | `CheckoutEquipmentSchema` adds `sequenceNumber`/`quantity` as `z.number().int().positive()` | PASS | `packages/schemas/src/checkout.ts:35-36` |
| 4 | `CheckoutsService.create()` maps `sequenceNumber: index + 1, quantity: 1` | PASS | `apps/backend/src/modules/checkouts/checkouts.service.ts:1301-1309` |
| 5 | `@equipment-management/db` tsc 0 errors | PASS | clean output |
| 6 | `backend` tsc 0 errors | PASS | clean output |
| 7 | `@equipment-management/schemas` tsc 0 errors | PASS | clean output |

## Call-site audit
- `insert(checkoutItems)` only in `checkouts.service.ts:1311` (covered).
- `checkoutItems.$inferInsert` only in `checkouts.seed.ts:1440` (factory updated with defaults at L1450-1451).
- No other insert sites missed.

## Observations (non-blocking / SHOULD)

1. **Seed multi-equipment items duplicate sequenceNumber.**
   `apps/backend/src/database/seed-data/operations/checkouts.seed.ts:1547-1572` — every `createCheckoutItem(...)` call falls back to factory default `sequenceNumber: 1`, so checkouts #7, #8, #29, #35, #65, #66, #67, #68 will have 2–3 items all with `sequence_number = 1`. This violates the semantic intent of QP-18-06 순번 (1~14 unique per checkout). No DB unique constraint enforces it, so tsc/seed will not fail, but the seeded data is wrong.
   Repair suggestion: pass explicit `sequenceNumber` overrides per item (e.g. `createCheckoutItem(CHECKOUT_007_ID, EQUIP_..., { sequenceNumber: 1 })`, `{ sequenceNumber: 2 }`, ...) or refactor into a helper that auto-increments per checkoutId. Not blocking the contract's MUST list, but recommended before merge.

2. **Migration backfill tiebreaker.** The SQL adds `, id` to the `ORDER BY` in `ROW_NUMBER()` (beyond the contract's `ORDER BY created_at`). This is a deterministic improvement and still PARTITION BY checkout_id, so it satisfies the MUST. No action needed.

3. **SSOT/hardcoding.** Informal check — no new hardcoded endpoints, query keys, or enums introduced. `quantity: 1` default is a domain constant tied to the form; acceptable inline.

## Verification commands run
- `pnpm --filter @equipment-management/db exec tsc --noEmit` → 0 errors
- `pnpm --filter @equipment-management/schemas exec tsc --noEmit` → 0 errors
- `pnpm --filter backend exec tsc --noEmit` → 0 errors
