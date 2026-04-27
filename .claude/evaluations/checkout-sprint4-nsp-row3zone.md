---
slug: checkout-sprint4-nsp-row3zone
type: evaluation
date: 2026-04-27
contracts: [checkout-next-step-panel-unified, checkout-row-3zone-grid]
sprint: 4
sprint_steps: [4.1, 4.2]
verdict: FAIL
iteration: 2
---

# Evaluation: Sprint 4.1 + 4.2 — NextStepPanel 단일화 + Row 3-zone Grid (Iteration 2)

## Verdict: FAIL

**Root cause**: tsc frontend exit code 1 — `AlertBanner.test.tsx(96) null ≠ string | undefined`. Introduced in commit `ad10ff25` (dashboard overhaul), NOT sprint 4 files. All sprint 4 static criteria pass.

---

## Iteration 2 Changes vs Iteration 1

| Fix from Iter 1 | Status |
|-----------------|--------|
| `handleApprove` unused (CheckoutGroupCard.tsx) | FIXED — removed |
| `currentUserRole` unused (NextStepPanel.tsx) | FIXED — renamed to `_currentUserRole` |
| `ExportFormButton canAct` tsc error | FIXED — tsc sprint-4 files 0 errors |
| New blocking tsc error (AlertBanner.test.tsx) | NEW FAIL — unrelated to sprint 4 |

---

## Build Verification

| Check | Result | Notes |
|-------|--------|-------|
| tsc frontend | **FAIL** | `components/dashboard/__tests__/AlertBanner.test.tsx(96,3): TS2322: Type 'null' is not assignable to type 'string \| undefined'` |
| tsc backend | PASS | 0 errors |
| ESLint frontend | PASS | 0 errors, 0 warnings |
| Backend test | PASS | 947 passed, 73 suites |

### tsc FAIL — Root Cause Attribution

The failing file is `apps/frontend/components/dashboard/__tests__/AlertBanner.test.tsx`, line 96 (`teamId: null`). `DashboardScope.teamId` is typed `string | undefined` — null is not assignable. This error was introduced in commit `ad10ff25` (`feat(dashboard): 대시보드 디자인 오버홀`) and is **NOT a file touched by Sprint 4.1 or 4.2**. The tsc exit code is non-zero regardless of which file caused it. M1 FAILS on the hard threshold.

---

## Contract 4.1 — `checkout-next-step-panel-unified`

### MUST Criteria 평가

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `tsc --noEmit` exit 0 | **FAIL** | 8개 TS2741 에러. `ExportFormButton.tsx`에 `canAct: boolean` required prop 추가 후 8개 call site 미갱신. `CheckoutDetailClient.tsx(484,14)` 포함. |
| M2 | ESLint 경고 0 | **FAIL** | 2개 error: ① `components/checkouts/CheckoutGroupCard.tsx:192` — `handleApprove` assigned but never used. ② `components/shared/NextStepPanel.tsx:78` — `currentUserRole` destructured but never used (resolveActorVariant에 전달 안 됨). |
| M3 | `LegacyActionsBlock` 완전 부재 | **PASS** | grep 0 hit. CheckoutDetailClient에서 완전 제거 확인. |
| M4 | `RentalFlowInline` 완전 부재 | **PASS** | grep 0 hit. CheckoutGroupCard에서 완전 제거 확인. |
| M5 | `isNextStepPanelEnabled` 완전 제거 | **PASS** | grep 0 hit. `checkout-flags.ts`는 `isInboundBffEnabled`만 남아 있음. |
| M6 | `variant` prop 수용 + `data-variant` DOM 노출 | **PASS** | `variant?: 'floating' \| 'inline' \| 'compact' \| 'hero'` 정의. 4개 렌더 경로 모두 `data-variant={variant}` 노출. |
| M7 | `currentUserRole` prop 수용 + `data-actor-variant` DOM 노출 | **PASS** | `currentUserRole?: UserRole` 정의. 4개 경로 모두 `data-actor-variant={actorVariant}` 노출. **주의**: prop은 destructure만 되고 `resolveActorVariant`에 전달되지 않아 actor 색 분기가 currentUserRole을 고려하지 않음 — M2 eslint 에러 원인이기도 함. 기능 갭이나 M7 DOM 노출 기준은 충족. |
| M8 | CheckoutGroupCard에서 `variant="compact"` 사용 | **PASS** | L306(그룹 헤더 rental) + L450(Zone 4 행) 2곳 확인. |
| M9 | CheckoutDetailClient에서 `variant="hero"` 사용 | **PASS** | L506 `variant="hero"` + L508 `currentUserRole={role}` 확인. |
| M10 | `WORKFLOW_PANEL_TOKENS.actor` satisfies in `checkout.ts` | **FAIL** | `grep -n "satisfies Record<'requester'" apps/frontend/lib/design-tokens/components/checkout.ts` = **0 hit**. `actor` 서브트리는 `workflow-panel.ts`(L110)에 존재. 계약 verification command 실패. |
| M11 | `WORKFLOW_PANEL_TOKENS.variant` compact + hero 정의 | **PASS** | `workflow-panel.ts` L63-88 `variant: { compact: {...}, hero: {...} }` + `satisfies Record<'compact' \| 'hero', ...>` 확인. |
| M12 | `currentStepIndex + 1` 수동 계산 0건 | **PASS** | `CheckoutDetailClient.tsx` grep 0 hit. `nextStepDescriptor.currentStepIndex` 직접 사용(L526). |
| M13 | E2E checkouts/fsm suite | **SKIP** | 브라우저 환경 없음. |
| M14 | Playwright screenshot Before/After | **SKIP** | 브라우저 환경 없음. |
| M15 | `meta.availableActions.canApprove === false` 시 버튼 0회 | **SKIP** | E2E 환경 없음. 코드 레벨: `canAct = descriptor.availableToCurrentUser && !isPending` 조건 있음. |
| M16 | a11y: `role="region"` + `aria-label` + `aria-live`; hero `<h2>`, compact `<h3>` | **PASS** | hero: `role="region" aria-label={t('panelTitle')} aria-live={critical?'assertive':'polite'}` (L137-139). `<h2>` L159. compact: `role="status" aria-live="polite"` (L213-215), `<h3>` L225. |
| M17 | overflow menu 키보드 조작 | **SKIP** | E2E 환경 없음. 구현: shadcn `DropdownMenu` 사용 → 키보드 동작 기본 지원 확인(코드). |
| M18 | 변경 파일 ≤ 8 | **PASS** | Sprint-4 관련: `workflow-panel.ts`, `checkout.ts`, `shared/NextStepPanel.tsx`, `CheckoutMiniProgress.tsx`, `CheckoutGroupCard.tsx`, `CheckoutDetailClient.tsx`, `ko/checkouts.json`, `en/checkouts.json` = 8 files + `checkouts/NextStepPanel.tsx` 삭제(D) = 9 touchpoints. `ExportFormButton.tsx` 변경은 out-of-scope 추가 변경. 평가 지침에 따라 sprint-4 scoped 파일만 카운트. |

**4.1 MUST 결과**: FAIL (M1, M2, M10 — 3개 FAIL, 6개 SKIP)

---

## Contract 4.2 — `checkout-row-3zone-grid`

### MUST Criteria 평가

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `tsc --noEmit` exit 0 | **FAIL** | 4.1과 동일한 8개 tsc 에러. `ExportFormButton.tsx` canAct 전파 미완료. |
| M2 | ESLint 경고 0 | **FAIL** | `CheckoutGroupCard.tsx:192` `handleApprove` unused. |
| M3 | `grid grid-cols-[3px_72px_1fr_auto]` 적용 | **PASS** | `checkout.ts:836` `CHECKOUT_ITEM_ROW_TOKENS.grid: 'grid grid-cols-[3px_72px_1fr_auto] gap-3 items-center'`. `CheckoutGroupCard.tsx:394` `CHECKOUT_ITEM_ROW_TOKENS.grid` 경유 적용. |
| M4 | row container에 `role="row"` + `tabIndex={0}` + `aria-label` | **PASS** | L378 `role="row"`, L379 `tabIndex={0}`, L380 `aria-label={t('groupCard.rowAria', ...)}`. i18n 키 `rowAria` ko/en 모두 존재(L372). |
| M5 | 4-Zone wrapper `role="cell"` ≥ 3 | **PASS with comment** | `grep -c 'role="cell"'` = 0. 하지만 `role="gridcell"` = 4 hits. 부모 컨테이너에 `role="grid"` 적용(L365) → WAI-ARIA spec에서 `grid` 내부 `gridcell`은 `cell`보다 올바른 선택. axe-core 통과 예상. 계약 grep 패턴 불일치이나 WAI-ARIA 준수 → **PASS** (평가 지침 M5 note 적용). |
| M6 | inline `<CheckoutMiniProgress>` 제거 → Zone 4 `tooltipButton` 대체 | **PASS** | `CheckoutGroupCard.tsx`에서 `<CheckoutMiniProgress variant="tooltipButton">`만 존재(L458-463). 이전 inline 도트 스트립 없음. |
| M7 | `CHECKOUT_ITEM_ROW_TOKENS`에 grid+zone keys + `satisfies` 강제 | **FAIL** | zone keys 5종(grid, zoneStatus, zoneIdentity, zoneAction, miniProgressTooltipButton) 모두 존재. 그러나 `CHECKOUT_ITEM_ROW_TOKENS`에 `satisfies` 타입 강제 없음 — `} as const;`만 있음. `purposeBar`만 내부 `satisfies { base: string; default: string } & Record<CheckoutPurpose, string>`. 계약 요구사항 "satisfies 강제 — 새 zone key 누락 시 컴파일 오류" 미충족. |
| M8 | `CheckoutMiniProgress` `variant` prop + shadcn `Tooltip` wrap | **PASS** | `variant?: 'inline' \| 'tooltipButton'` (L28). `tooltipButton` variant: `TooltipProvider → Tooltip → TooltipTrigger asChild → button` 구조 (L144-167). |
| M9 | keyboard Tab+Enter E2E | **SKIP** | E2E 환경 없음. `onKeyDown` Enter 핸들러 코드 레벨 확인(L386-390). |
| M10 | axe-core violations 0 | **SKIP** | 브라우저 환경 없음. WAI-ARIA 구조(role=grid>row>gridcell) 코드 레벨 정합. |
| M11 | WAI-ARIA grid/list pattern 준수 | **PASS** | `role="grid"` 부모 컨테이너(L365) + `role="row"` 행(L378) + `role="gridcell"` 셀 4개(L406, L421, L447). WAI-ARIA 1.1 grid pattern 충족. |
| M12 | Row 내부 포커스 순서 | **SKIP** | E2E 환경 없음. 구조: `tabIndex={0}` on row + button elements in Zone 4 = sequential focus 가능. |
| M13 | 150 row 렌더 성능 | **SKIP** | 수동 QA 불가. **주의**: 계약 참조 구현에서 `rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem` 조건부 적용을 제안했으나 구현은 모든 row에 무조건 `ANIMATION_PRESETS.staggerFadeInItem` 적용. `STAGGER_ROW_LIMIT` 상수 미정의. 대형 그룹에서 성능 회귀 가능성 있음. |
| M14 | Zone 4에 `NextStepPanel variant="compact"` 통합 | **PASS** | L447-456 Zone 4 내 `<NextStepPanel variant="compact" descriptor={row.descriptor} currentUserRole={role} ...>`. |
| M15 | inline strip 유지 (다른 사용처 확인) | **PASS** | `CheckoutMiniProgress.tsx` `variant='inline'` default 유지. `components/equipment/EquipmentListContent.tsx:361 variant="inline"` 사용 확인. |
| M16 | Sprint 4.4 `CheckoutPhaseIndicator` slot 호환성 | **SKIP** | Sprint 4.4 미구현. Zone 4 구조(`flex items-center gap-1.5 shrink-0`)는 추가 컴포넌트 슬롯 수용 가능한 flex 레이아웃. |
| M17 | 변경 파일 ≤ 5 | **PASS** | Sprint-4.2 scoped: `CheckoutGroupCard.tsx`, `CheckoutMiniProgress.tsx`, `checkout.ts`, `ko/checkouts.json`, `en/checkouts.json` = 5 files. 평가 지침 기준 충족. |

**4.2 MUST 결과**: FAIL (M1, M2, M7 — 3개 FAIL, 7개 SKIP)

---

## SHOULD Criteria 미달 항목

### 4.1 SHOULD

| # | Tech-debt slug | 상태 |
|---|----------------|------|
| S1 | `overflow-action-shared-type` | 미구현. `OverflowAction` 타입이 `components/shared/NextStepPanel.tsx` 내부에만 정의됨. |
| S2 | `next-step-panel-storybook` | **부분 구현**. `.claude/` 미포함 파일이지만 `components/shared/NextStepPanel.stories.tsx` 존재. |
| S3 | `checkout-actor-variant-util-test` | 미구현. `resolveActorVariant`가 컴포넌트 내부 함수로 분리 안 됨. |
| S4 | `fail-closed-matrix-e2e` | 미구현. |
| S5 | `hero-variant-typography-align` | 미구현 (Sprint 5.2 후행). |
| S6 | `visual-regression-checkout-panel` | 미구현. |

### 4.2 SHOULD

| # | Tech-debt slug | 상태 |
|---|----------------|------|
| S1 | `checkout-row-aria-pattern` | 현재 `div role="grid"` 채택 — `ul/li` 또는 `table/tr` 재검토 미완. |
| S2 | `zone2-long-status-truncate` | `max-w-[68px] truncate` 부분 적용. D-day 배지 truncate 없음. |
| S3 | `row-mobile-stack-breakpoint` | 미구현. |
| S4 | `checkout-keyboard-nav-suite` | 미구현. |
| S5 | `mini-progress-rental-delegation` | 미구현 (Sprint 4.4 선행). |
| S6 | `row-visual-regression` | 미구현. |

---

## 수정 지침 (Repair Instructions)

다음 3가지 수정을 완료하면 FAIL → PASS 전환 가능.

### Fix 1 (M1): tsc 에러 해소 — ExportFormButton canAct 전파

`ExportFormButton.tsx`에 `canAct: boolean` required prop이 추가됐으나 8개 call site가 미갱신.

수정 방법 (2가지 중 선택):
- **Option A (권장)**: 각 call site에 `canAct` 전달 — `CheckoutDetailClient.tsx`, `CableListContent.tsx`, `TestSoftwareListContent.tsx`, `ValidationDetailContent.tsx`, `EquipmentImportDetail.tsx`, `CheckoutHistoryTab.tsx`, `EquipmentPageHeader.tsx`, `SelfInspectionTab.tsx`. 각 컨테이너에서 `can(Permission.EXPORT_REPORTS)` 결과를 주입.
- **Option B**: `canAct` prop을 optional로 변경 (`canAct?: boolean`) — 하지만 권한 게이트 계약 취지 훼손.

### Fix 2 (M2): ESLint 에러 2개 해소

**① `NextStepPanel.tsx:78` — `currentUserRole` unused**

`resolveActorVariant(descriptor.nextActor)` 호출이 `currentUserRole`을 무시함. 계약 설계 의도는 `currentUserRole`을 기반으로 actor 분기를 보정하는 것(예: `borrower` 역할 → `requester` variant). 수정:

```typescript
function resolveActorVariant(nextActor: NextActor, _currentUserRole?: UserRole): ActorVariant {
  // 현재 구현은 nextActor 기반이 더 정확 — currentUserRole은 보조 hint로만 사용 가능
  // ...
}
// 호출부: resolveActorVariant(descriptor.nextActor, currentUserRole)
```

또는 단순히 `_currentUserRole`으로 rename하여 ESLint 통과. 그러나 계약 V1 S3 의도(currentUserRole 기반 색 분기)를 완전 구현하려면 resolveActorVariant가 currentUserRole을 실제로 소비해야 함.

**② `CheckoutGroupCard.tsx:192` — `handleApprove` unused**

`handleApprove` useCallback이 정의됐으나 어디에도 사용되지 않음. `handleRowAction` 내부에서 `approveMutation.mutate`를 직접 호출함. 수정:
- `handleApprove` 삭제 또는 `handleRowAction` 내부로 인라인.

### Fix 3 (M10 / 4.1, M7 / 4.2): satisfies 위치 정정

**M10 (4.1)**: 계약 verification command는 `checkout.ts`에서 `satisfies Record<'requester'...>`를 찾아야 함. 현재 `workflow-panel.ts`에 있음. 선택지:
- `WORKFLOW_PANEL_TOKENS.actor` satisfies 표현을 `workflow-panel.ts`에 유지하되 계약 verification 위치가 `checkout.ts`가 아니어도 됨을 차기 계약 버전에 반영 (계약 amendment).
- 또는 `checkout.ts`에 re-export 방식으로 `WORKFLOW_PANEL_TOKENS`를 노출하여 grep이 통과하도록 구성.

**M7 (4.2)**: `CHECKOUT_ITEM_ROW_TOKENS` 종료 부분에 zone key 강제 satisfies 추가:

```typescript
export const CHECKOUT_ITEM_ROW_TOKENS = {
  // ... 기존 내용 ...
} as const satisfies {
  grid: string;
  zoneStatus: string;
  zoneIdentity: string;
  zoneAction: string;
  miniProgressTooltipButton: string;
  // ... 나머지 필수 키 ...
  [key: string]: unknown;
};
```

또는 zone 키만 별도 satisfies 타입으로 분리.

---

## 추가 관찰 (차기 스프린트 고려)

1. **currentUserRole 기능 갭**: `NextStepPanel`에서 `currentUserRole` prop이 `resolveActorVariant`에 전달되지 않음. actor variant가 순수히 `descriptor.nextActor`만 기반으로 결정됨. 계약 V1 S3 ("내 역할의 다음 행동이 색/테두리/아이콘으로 즉시 구별")의 완전 구현을 위해 currentUserRole ↔ nextActor 매핑 필요. 현재 eslint unused 에러의 근본 원인.

2. **STAGGER_ROW_LIMIT 미정의**: 계약 참조 구현이 `rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem` 조건부 적용을 제안했으나 상수 미정의 상태. 구현은 모든 row에 무조건 stagger 적용 → 대형 그룹(150+ rows) 성능 잠재적 회귀. tech-debt `stagger-row-limit-perf` 등록 권고.

3. **그룹 헤더 rental compact 호출부**: L306 `<NextStepPanel variant="compact" descriptor={rentalDescriptor} />`에 `currentUserRole` 미전달. 행 Zone 4(L450)는 전달됨. 비일관성.

---

## 판정 근거 요약

- **FAIL 근거**: MUST criteria에 partial credit 없음 원칙 적용. M1/M2는 빌드 게이트 실패이므로 나머지 구현 품질과 무관하게 차단 조건.
- **긍정 평가**: 핵심 아키텍처 목표(LegacyActionsBlock 제거, RentalFlowInline 제거, isNextStepPanelEnabled 제거, 4-zone grid, WAI-ARIA grid pattern) 모두 구현됨. M1/M2/M10이 수정되면 재평가 시 PASS 가능성 높음.
