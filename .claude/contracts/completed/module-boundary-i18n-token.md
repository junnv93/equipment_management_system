# Contract: module-boundary-i18n-token

**Slug**: `module-boundary-i18n-token`
**Mode**: 1
**Sprint**: 2026-04-26 tech-debt 3건 — module-boundary + overdueClear i18n + return_to_vendor color
**Date**: 2026-05-09

---

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M-1 | `tsc --noEmit` passes (frontend) | `pnpm --filter frontend run tsc --noEmit` |
| M-2 | `tsc --noEmit` passes (backend) | `pnpm --filter backend run tsc --noEmit` |
| M-3 | `en/checkouts.json` overdueClear.title = `"No overdue items"` | `grep -c '"No overdue items"' apps/frontend/messages/en/checkouts.json` ≥ 1 |
| M-4 | `CHECKOUT_PURPOSE_TOKENS.return_to_vendor.badge` contains `brand-temporary` | `grep -n "brand-temporary\|'temporary'" apps/frontend/lib/design-tokens/components/checkout.ts \| grep -v '//'` — 4개 라인 이상 (badge/colorBar/CHECKOUT_ROW_TOKENS/purposeBar 각 1행) |
| M-5 | `CHECKOUT_ROW_TOKENS.colorBar.return_to_vendor` uses `temporary` | `grep -c "getSemanticLeftBorderClasses('temporary')" apps/frontend/lib/design-tokens/components/checkout.ts` ≥ 2 |
| M-6 | `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` = `'bg-brand-temporary'` | `grep -c "bg-brand-temporary" apps/frontend/lib/design-tokens/components/checkout.ts` ≥ 2 |
| M-7 | `return_to_vendor` purposeBar satisfies type (no neutral fallback leak) | `awk '/purposeBar: \{/,/\} satisfies/' apps/frontend/lib/design-tokens/components/checkout.ts \| grep "return_to_vendor.*neutral"` — 0건 |
| M-8 | Both module files have forwardRef architectural JSDoc | `grep -c "forwardRef — 진정한 양방향" apps/backend/src/modules/checkouts/checkouts.module.ts` ≥ 1 AND same grep in equipment-imports.module.ts |
| M-9 | tech-debt-tracker.md items marked complete | `grep -c "inbound-overview-module-boundary\|en-overdueclear-translation-spec\|purpose-bar-return-to-vendor" .claude/exec-plans/tech-debt-tracker.md` — open `[ ]` 라인 0건 |
| M-10 | 변경 범위 백엔드 테스트 pass | `pnpm --filter backend exec jest apps/backend/src/modules/checkouts/ apps/backend/src/modules/equipment-imports/ --passWithNoTests` — 두 모듈 모두 PASS (disposal 실패는 다른 세션 미커밋 변경사항, pre-existing) |

## SHOULD Criteria

| # | Criterion | Notes |
|---|-----------|-------|
| S-1 | ko/en checkouts.json overdueClear description parity | ko description도 의미적으로 자연스러운지 확인 |
| S-2 | `temporary` color JSDoc 이유 주석 포함 | checkout.ts return_to_vendor 섹션에 "임시 대여 반납" 설명 |
