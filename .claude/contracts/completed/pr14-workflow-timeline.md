---
slug: pr14-workflow-timeline
date: 2026-04-24
mode: 1
---

# PR-14: WorkflowTimeline Contract

## MUST Criteria (루프 차단)
1. `pnpm --filter frontend run tsc --noEmit` passes
2. `apps/frontend/lib/design-tokens/components/checkout-timeline.ts` 생성 — CHECKOUT_TIMELINE_TOKENS (container/connector/node/dot/label 5개 노드 상태)
3. `apps/frontend/components/checkouts/WorkflowTimeline.tsx` 생성 — `status: CheckoutStatus`, `purpose: CheckoutPurpose` props
4. `computeStepIndex`, `computeTotalSteps` → `@equipment-management/schemas`에서 import (재구현 금지)
5. 5종 노드 상태 (past/current/next/future/skipped) 모두 렌더링
6. 루트 요소에 `data-testid="workflow-timeline"` 부착
7. 각 노드에 `data-step-state={nodeState}` 부착
8. Radix Tooltip으로 각 스텝 감싸기 — `help.status.{status}.description` i18n
9. `CheckoutDetailClient.tsx` 상태 진행 Card 에 WorkflowTimeline 추가 (Suspense + WorkflowTimelineSkeleton)
10. `CHECKOUT_TIMELINE_TOKENS` → `lib/design-tokens/index.ts` 에서 export
11. `borrower_approved` → `ko/checkouts.json` + `en/checkouts.json` help.status + stepper 섹션에 추가
12. `borrower_approved` → `CHECKOUT_STEP_LABELS`에 추가 (checkout.ts)
13. hex 하드코딩 금지, 로컬 enum/status 재정의 금지

## SHOULD Criteria (루프 차단 안 함)
1. 모바일 <768px compact 세로 레이아웃
2. WorkflowTimelineSkeleton 컴포넌트 제공
