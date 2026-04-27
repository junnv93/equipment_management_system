---
slug: checkout-sprint4-nsp-row3zone
date: 2026-04-27
sprint: 4
contracts: [checkout-next-step-panel-unified, checkout-row-3zone-grid]
status: in-progress
---

# Sprint 4.1+4.2: NextStepPanel 단일화 + Row 3-zone Grid

## 현황 분석 (2026-04-27)

이미 완료된 항목(contracts 선행 조건):
- LegacyActionsBlock, RentalFlowInline, isNextStepPanelEnabled 모두 부재
- shared/NextStepPanel variant: 'floating'|'inline'|'compact' 이미 존재
- CheckoutGroupCard 그룹 헤더에 `<NextStepPanel variant="compact" />` 이미 통합

미완성 항목 (이번 세션 구현):
- shared/NextStepPanel에 variant='hero' 및 currentUserRole + actor variant 미구현
- 행(row)에 `<NextStepPanel variant="compact" />` 미통합 (기존 인라인 버튼 사용)
- Row 3-zone grid 미적용 (현재 flex)
- WORKFLOW_PANEL_TOKENS.actor 및 WORKFLOW_PANEL_TOKENS.variant 미정의
- CHECKOUT_ITEM_ROW_TOKENS 그리드 존 미정의
- CheckoutMiniProgress variant='tooltipButton' 미구현
- CheckoutDetailClient variant="floating" → "hero" 미전환

## 파일 변경 목록

1. `apps/frontend/lib/design-tokens/components/workflow-panel.ts` — WORKFLOW_PANEL_TOKENS.variant/actor/overflow 추가; NEXT_STEP_PANEL_TOKENS.container.hero 추가
2. `apps/frontend/lib/design-tokens/components/checkout.ts` — CHECKOUT_ITEM_ROW_TOKENS grid/zone 추가; container에서 flex 레이아웃 분리
3. `apps/frontend/components/shared/NextStepPanel.tsx` — hero variant, currentUserRole, actor variant, overflow menu, data-variant/data-actor-variant
4. `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx` — variant prop 추가; tooltipButton variant
5. `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — Row 3-zone grid 적용; per-row NextStepPanel compact; parent role="grid"
6. `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` — variant="hero"; currentUserRole 추가
7. `apps/frontend/messages/ko/checkouts.json` — groupCard.rowAria 키 추가
8. `apps/frontend/messages/en/checkouts.json` — groupCard.rowAria 키 추가
9. `apps/frontend/components/checkouts/NextStepPanel.tsx` — **삭제** (dead code, imported 없음)

## 검증 명령

```bash
pnpm --filter frontend exec tsc --noEmit
grep -rn "LegacyActionsBlock\|RentalFlowInline\|isNextStepPanelEnabled" apps/frontend/ 2>/dev/null | grep -v ".next"
grep -n 'variant="hero"' 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
grep -n 'variant="compact"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
grep -n "satisfies Record<'requester'" apps/frontend/lib/design-tokens/components/workflow-panel.ts
grep -n "grid-cols-\[3px_72px_1fr_auto\]" apps/frontend/lib/design-tokens/components/checkout.ts
grep -c 'role="cell"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
```
