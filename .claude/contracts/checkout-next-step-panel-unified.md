---
slug: checkout-next-step-panel-unified
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action, checkout-descriptor-phase-fields, checkout-meta-fail-closed, pr5-checkout-fsm-integration]
sprint: 4
sprint_step: 4.1
---

# Contract: Sprint 4.1 — `NextStepPanel` 단일 렌더 + `RentalFlowInline`/`LegacyActionsBlock` 제거 + actor variant

## Context

V2 리뷰 핵심 지적 중 4가지가 본 contract의 범위:

1. **F-1 (P0)**: `CheckoutDetailClient.tsx` L462-663 `LegacyActionsBlock` — 11개 `if` 블록이 status×role×purpose 조합을 하드코딩. 이미 `NextStepPanel`이 flag default `true`로 정상 경로지만 폴백이 살아 있어 두 진실 공존(C-1 배경).
2. **F-4 (P2)**: `CheckoutGroupCard.tsx` L71-134 내부 `RentalFlowInline` 로컬 컴포넌트 + L391 호출. Rental 목록 행에서 `NextStepPanel`과 공존 — 같은 status를 2곳에서 다르게 렌더.
3. **V2 §7 Before/After**: 목록 Zone 3(행 우측)과 상세 Hero가 **같은 UI 블록**이어야 정보 일치. `<NextStepPanel variant="compact|hero" />` + `actor` 분기로 수렴.
4. **V1 S3 (actor variant)**: requester / approver / receiver가 같은 화면을 봐도 **내 역할의 다음 행동**이 색/테두리/아이콘으로 즉시 구별되어야 함. Sprint 1.1 `resolveNextAction`가 `nextActor`를 반환하므로 컴포넌트에서 소비만 필요.

본 contract는 **UI 단일화만 담당**. FSM 규칙 변경, descriptor schema 확장은 Sprint 1 contract에서 이미 고정됨(`depends` 참조).

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/NextStepPanel.tsx`
  - `NextStepPanelProps`에 `variant?: 'compact' | 'hero'` (default `'compact'`) 추가.
  - `descriptor.nextActor` 기반 actor variant 분기: 현재 유저 role과 `nextActor` 비교해 `currentUserIsActor` 계산 → 그에 따라 테두리/배경/아이콘 분기 토큰 적용.
  - `variant="hero"`: 상세 Hero용 큰 typography + primary CTA 강조 + 좌측 phase indicator 삽입 가능 slot.
  - `variant="compact"`: 목록 Row Zone 3용 1줄 요약 + primary CTA 1개 + overflow menu(shadcn `DropdownMenu`).
  - V1 S3 색구분: `requester/approver/receiver` 3-way color token 분기 — `WORKFLOW_PANEL_TOKENS.actor.{role}` sub-tree 추가 (Sprint 2.6 FOCUS_TOKENS.ringCurrent 간접 사용).
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - `WORKFLOW_PANEL_TOKENS`에 `variant: { compact, hero }` 서브트리 + `actor: { requester, approver, receiver }` 서브트리 + `overflow: { trigger, menu }` 추가.
  - `satisfies Record<'requester'|'approver'|'receiver', { border: string; icon: string; accent: string }>` 강제.
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - L71-134 `RentalFlowInline` 내부 컴포넌트 **삭제**.
  - L388-392 `RentalFlowInline` 호출 블록 → `<NextStepPanel variant="compact" descriptor={...} checkoutId={...} currentUserRole={...} />` 로 치환.
  - NextStepPanel에 필요한 `descriptor`는 Sprint 1.1 결과물 `useCheckoutGroupDescriptors()` Map에서 조회 (이미 존재).
- `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - L462-663 `LegacyActionsBlock` **완전 삭제**.
  - L684 `{!isNextStepPanelEnabled() && LegacyActionsBlock()}` 분기 제거.
  - `NextStepPanel`을 `variant="hero"`로 교체, Hero 영역(헤더 바로 아래)에 배치.
  - 기존 L728-730 `currentStepIndex + 1` 계산 제거 — Sprint 1.2 `descriptor.nextStepIndex` 사용 (이미 schema에 존재).
- `apps/frontend/lib/checkout-flags.ts`
  - `isNextStepPanelEnabled` 함수 **삭제** (항상 true로 수렴됨). import 경로 정리.
  - 관련 unit test 삭제 또는 갱신.
- `packages/shared-constants/src/permissions.ts` 또는 기존 `PermissionsGuard` 연동 파일 — `currentUserRole` 전달 경로 확인만(수정 아님).

### 수정 금지
- `resolveNextAction`, `NextStepDescriptor` 타입 — Sprint 1 contract 소관.
- `CheckoutMiniProgress.tsx`, `CheckoutPhaseIndicator.tsx`(신규) — Sprint 4.4 contract 소관.
- 서버 `meta.availableActions` 로직 — Sprint 1.3 fail-closed.
- 백엔드 checkouts 서비스 본체.

### 신규 생성
- 없음 — 기존 컴포넌트 확장만.

---

## 참조 구현 (제시만 — 실제는 구현자가 작성)

```typescript
// apps/frontend/components/checkouts/NextStepPanel.tsx (확장 핵심)
interface NextStepPanelProps {
  descriptor: NextStepDescriptor;
  checkoutId: string;
  variant?: 'compact' | 'hero';
  currentUserRole: UserRole; // actor variant 판정용
  onAction?: (action: NonNullable<NextStepDescriptor['nextAction']>) => void | Promise<void>;
  overflowActions?: OverflowAction[]; // compact 전용. 취소/조건 확인/QR 등
  className?: string;
}

export function NextStepPanel({
  descriptor,
  checkoutId,
  variant = 'compact',
  currentUserRole,
  onAction,
  overflowActions,
  className,
}: NextStepPanelProps) {
  const t = useTranslations('checkouts.fsm');
  const actorVariant = resolveActorVariant(descriptor.nextActor, currentUserRole);
  // ...
  return (
    <section
      className={cn(
        WORKFLOW_PANEL_TOKENS.container.base,
        WORKFLOW_PANEL_TOKENS.variant[variant].container,
        WORKFLOW_PANEL_TOKENS.actor[actorVariant].border,
        className,
      )}
      data-variant={variant}
      data-actor-variant={actorVariant}
      ...
    >
      {/* ... */}
    </section>
  );
}

function resolveActorVariant(
  nextActor: NextStepActor,
  currentUserRole: UserRole
): 'requester' | 'approver' | 'receiver' {
  // actor-role 매핑 (Sprint 1.1 `NextStepActor` 기반)
  // nextActor === 'borrower' && role === test_engineer → 'requester'
  // nextActor === 'approver' → 'approver'
  // ...
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` 경고 0 (해당 파일 한정) | lint |
| M3 | `CheckoutDetailClient.tsx`에서 `LegacyActionsBlock` 식별자 완전 부재 | `grep -n "LegacyActionsBlock" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'` = 0 hit |
| M4 | `CheckoutGroupCard.tsx`에서 `RentalFlowInline` 식별자 완전 부재 | `grep -n "RentalFlowInline" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 0 hit |
| M5 | `isNextStepPanelEnabled` 함수 및 import 완전 제거 | `grep -rn "isNextStepPanelEnabled" apps/frontend/` = 0 hit |
| M6 | `NextStepPanel`이 `variant` prop을 받고, `data-variant` attribute로 DOM 노출 | grep + DOM snapshot |
| M7 | `NextStepPanel`이 `currentUserRole` prop을 받고 `data-actor-variant` attribute로 DOM 노출 | grep + DOM snapshot |
| M8 | `CheckoutGroupCard` 호출부에서 `<NextStepPanel variant="compact" ... />` 사용 | grep |
| M9 | `CheckoutDetailClient` 호출부에서 `<NextStepPanel variant="hero" ... />` 사용 | grep |
| M10 | `WORKFLOW_PANEL_TOKENS.actor`가 `satisfies Record<'requester'\|'approver'\|'receiver', ...>` | `grep -n "satisfies Record<'requester'" apps/frontend/lib/design-tokens/components/checkout.ts` = 1 hit |
| M11 | `WORKFLOW_PANEL_TOKENS.variant` 2개 variant(`compact`, `hero`) 정의 | grep |
| M12 | 상세 Hero 영역에서 `currentStepIndex + 1` 수동 계산 0건 → `descriptor.nextStepIndex` 사용 | `grep -n "currentStepIndex + 1\|currentStepIndex \+ 1" 'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'` = 0 hit |
| M13 | E2E `features/checkouts/` 기존 테스트 suite 전량 통과 (회귀 가드) | test |
| M14 | Playwright screenshot: `/checkouts` 목록 Rental row · 상세 Hero 양쪽 모두 NextStepPanel 렌더됨 (Before/After 비교 PR body 첨부) | manual QA |
| M15 | `PermissionsGuard` fail-closed 시나리오: `meta.availableActions.canApprove === false`일 때 compact/hero 둘 다 primary 버튼 렌더 0회 | E2E |
| M16 | a11y: NextStepPanel `role="region"` + `aria-label` + `aria-live` (urgency에 따라) 유지. hero variant는 `<h2>`, compact variant는 `<h3>` | axe-core + manual |
| M17 | overflow menu (compact): 키보드 조작 가능 (`Tab` 포커스 → `Enter`/`Space` 오픈, `Esc` 닫기, `↑↓` 항목 이동) | keyboard E2E |
| M18 | 변경 파일 = `NextStepPanel.tsx` + `CheckoutGroupCard.tsx` + `CheckoutDetailClient.tsx` + `checkout-flags.ts` + `checkout.ts` (디자인 토큰) + test 갱신 = **최대 8** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 8 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `OverflowAction` 타입을 `packages/schemas` 또는 `lib/types/checkout-ui.ts`로 export → 호출부 타입 일관 | `overflow-action-shared-type` |
| S2 | `NextStepPanel` Storybook stories 3종(compact-requester / hero-approver / compact-blocked) 추가 | `next-step-panel-storybook` |
| S3 | `resolveActorVariant` 유틸을 `lib/utils/checkout-actor.ts`로 분리 + unit test | `checkout-actor-variant-util-test` |
| S4 | `PermissionsGuard` fail-closed E2E를 역할 4종 × status 13 매트릭스로 확장 | `fail-closed-matrix-e2e` |
| S5 | `variant="hero"` top padding/typo를 Sprint 5.2 typography 6단계(Hero H: 22/28 semibold) 도입 시 alias | `hero-variant-typography-align` |
| S6 | Playwright visual regression(Percy/Chromatic 또는 screenshot diff) 도입 | `visual-regression-checkout-panel` |

---

## Verification Commands

```bash
# 1. 빌드 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/NextStepPanel.tsx \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx' \
  apps/frontend/lib/design-tokens/components/checkout.ts

# 2. 금지 식별자 완전 부재
grep -rn "LegacyActionsBlock\|RentalFlowInline\|isNextStepPanelEnabled" apps/frontend/ 2>/dev/null | grep -v ".next\|dist"
# 기대: 0 hit

# 3. 신규 prop 도입
grep -n "variant=\"compact\"\|variant=\"hero\"" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  'apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx'
# 기대: 2+ hit (compact 1, hero 1)

grep -n "satisfies Record<'requester'" apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1 hit

# 4. currentStepIndex + 1 패턴 부재
grep -rn "currentStepIndex + 1\|currentStepIndex \+ 1" apps/frontend/ 2>/dev/null | grep -v ".next"
# 기대: 0 hit

# 5. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 8

# 6. E2E
pnpm --filter frontend run test:e2e -- checkouts/fsm checkouts/suite-ux
```

---

## 위험 / 롤백

- **위험**: `LegacyActionsBlock` 삭제 후 특정 role × status 조합에서 버튼 누락 가능 → Sprint 1.3 fail-closed + Sprint 1.1 resolveNextAction 208 table test가 선행 통과해야 본 contract 착수 가능.
- **롤백 계획**: 본 contract는 1 PR로 묶어 revert 가능 단위. flag는 이미 default `true`였으므로 flag 재활성화 복귀 불가 — revert 시 Sprint 1 이전 legacy path 복원.
- **Feature flag 없음**: Sprint 1.4에서 flag default `true` 확정 + 최소 1 스프린트 유예 완료 후 본 contract 착수 전제 (플랜 "사용자 확정 결정 5" 준수).

---

## Acceptance

루프 완료 조건 = MUST 18개 모두 PASS + E2E 회귀 0건 + manual QA Before/After screenshot PR body 첨부.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1 · `checkout-fsm-resolve-action.md` — 본 contract의 descriptor 출처. 선행.
- Sprint 1.2 · `checkout-descriptor-phase-fields.md` — `nextStepIndex`/`phase` 필드 소비. 선행.
- Sprint 1.3 · `checkout-meta-fail-closed.md` — 서버 fail-closed 보증. 선행.
- Sprint 1.4 · `pr5-checkout-fsm-integration.md` — flag default `true`. 선행.
- Sprint 2.6 · `checkout-rhythm-focus-inbound-tokens.md` — `FOCUS_TOKENS.ringCurrent` hero variant에 소비.
- Sprint 4.2 · `checkout-row-3zone-grid.md` — Row Zone 4에 NextStepPanel compact 배치. 병행 진행 가능.
- Sprint 4.4 · `checkout-rental-phase-ui.md` — hero variant에 `CheckoutPhaseIndicator` slot 제공. 병행 진행 가능.
- Sprint 5.2 · typography 6단계 — hero variant title typography alias (후행).
