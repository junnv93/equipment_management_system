# Contract: inbound-overview-bff-extraction

**Slug**: `inbound-overview-bff-extraction`
**Mode**: 1
**Sprint**: checkouts ↔ equipment-imports 양방향 forwardRef 완전 제거
**Date**: 2026-05-09

---

## Architecture Goal

Before:
- `CheckoutsModule` ⇌ `EquipmentImportsModule` (양방향 forwardRef)

After:
- `CheckoutsModule` → exports `CHECKOUT_CREATOR` token  
- `EquipmentImportsModule` → imports `CheckoutsModule` directly (no forwardRef)
- `InboundOverviewModule` → imports both directly (no forwardRef)
- 결과: **forwardRef 0건**

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M-1 | tsc PASS | `pnpm tsc --noEmit 2>&1 \| tail -5` — 에러 없음 |
| M-2 | forwardRef 완전 제거 — checkouts.module.ts | `grep -c "forwardRef" apps/backend/src/modules/checkouts/checkouts.module.ts` = 0 |
| M-3 | forwardRef 완전 제거 — equipment-imports.module.ts | `grep -c "forwardRef" apps/backend/src/modules/equipment-imports/equipment-imports.module.ts` = 0 |
| M-4 | CHECKOUT_CREATOR token 존재 (common/contracts) | `grep -c "CHECKOUT_CREATOR" apps/backend/src/common/contracts/checkout-creator.contract.ts` ≥ 1 |
| M-5 | equipment-imports.service.ts가 CHECKOUT_CREATOR inject 사용 | `grep -c "CHECKOUT_CREATOR" apps/backend/src/modules/equipment-imports/equipment-imports.service.ts` ≥ 1 |
| M-6 | InboundOverviewModule 존재 | `test -f apps/backend/src/modules/inbound-overview/inbound-overview.module.ts && echo EXIST` = EXIST |
| M-7 | InboundOverviewService.getInboundOverview 존재 | `grep -c "getInboundOverview" apps/backend/src/modules/inbound-overview/inbound-overview.service.ts` ≥ 1 |
| M-8 | checkouts.controller.ts에서 getInboundOverview 제거 | `grep -c "getInboundOverview" apps/backend/src/modules/checkouts/checkouts.controller.ts` = 0 |
| M-9 | InboundOverviewController @Controller('checkouts') + @Get('inbound-overview') | `grep -c "inbound-overview\|Controller.*checkouts" apps/backend/src/modules/inbound-overview/inbound-overview.controller.ts` ≥ 2 |
| M-10 | app.module.ts에 InboundOverviewModule 등록 | `grep -c "InboundOverviewModule" apps/backend/src/app.module.ts` ≥ 1 |
| M-11 | 변경 범위 테스트 PASS | `pnpm --filter backend exec jest apps/backend/src/modules/checkouts/ apps/backend/src/modules/equipment-imports/ apps/backend/src/modules/inbound-overview/ --passWithNoTests 2>&1 \| tail -5` — PASS |
| M-12 | CheckoutsService에 CHECKOUT_CREATOR export | `grep -c "CHECKOUT_CREATOR" apps/backend/src/modules/checkouts/checkouts.module.ts` ≥ 2 (provide + export) |

## SHOULD Criteria

| # | Criterion | Notes |
|---|-----------|-------|
| S-1 | InboundOverviewService 단위 테스트 | inbound-overview.service.spec.ts 생성 |
| S-2 | tech-debt-tracker.md에 완료 반영 | inbound-overview-module-boundary 재오픈 항목 완료 처리 |
