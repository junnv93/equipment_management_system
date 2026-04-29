---
slug: checkout-row-3zone-grid
type: contract
date: 2026-04-24
depends: [checkout-next-step-panel-unified, checkout-memo-boundary-optimization]
sprint: 4
sprint_step: 4.2
---

# Contract: Sprint 4.2 — `CheckoutGroupCard` Row 3-zone grid 재구조화 + MiniProgress tooltip 강등

## Context

V1 리뷰 S1 (Visual/UX) + V2 §7 Before/After 종합:

1. **현재 행 레이아웃** — `CheckoutGroupCard.tsx` L460~L560 row 내부가 **flex 6+개 자식**이 수평 나열. purposeBar / status badge / MiniProgress / 장비명 / 메타 / user / D-day / actions가 동등 가중치로 배열 → "중요한 게 뭔지" 즉시 파악 어려움.
2. **V1 S1 제안** — `grid-cols-[3px_72px_1fr_auto]` 4-zone으로 **의미 기반 재정렬**:
   - Zone 1 (3px): purposeBar 색 띠 (primary accent)
   - Zone 2 (72px): status pill + D-day 세로 스택 (identity 앞에 "상태 요약")
   - Zone 3 (1fr): identity (장비명 주체 + meta)
   - Zone 4 (auto): action cell = `<NextStepPanel variant="compact" />` (Sprint 4.1에서 이미 결정)
3. **MiniProgress 강등** — V1 S1 권고: MiniProgress가 행에서 큰 공간을 차지하지만 "진행률"은 부차 정보. 7×7 tooltip 버튼으로 Zone 4 내부 이동. 상세 진입이 1차 행동이므로 "3/5" 숫자는 호버/포커스 시에만.
4. **a11y**: Row가 `role="row"` + 키보드 focus (`tabIndex`), Zone 2~4에 `role="gridcell"` 또는 `role="cell"` 부여. `Tab`으로 행 간 이동, `Enter`로 상세 진입.

본 contract는 **레이아웃 재구조화만**. CTA 로직(버튼/overflow)은 Sprint 4.1에서 이미 `NextStepPanel variant="compact"`에 위임. 색/토큰은 Sprint 2에서 정비 완료.

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx`
  - **row container** (현재 L465 근처 `<div className={rowBaseClass} ...>`) → `grid grid-cols-[3px_72px_1fr_auto]` 적용. `rowBaseClass`는 기존 `cn(...)` 결과에 grid 클래스 포함.
  - Zone 1: `<span className={getPurposeBarClass(row.purpose)} aria-hidden="true" />` (3px width).
  - Zone 2: `<div className={CHECKOUT_ITEM_ROW_TOKENS.zoneStatus} role="cell">` — `<StatusPill>` 위, `<DdayBadge>` 아래 (세로 스택 `flex-col items-center gap-1`).
  - Zone 3: `<div className={CHECKOUT_ITEM_ROW_TOKENS.zoneIdentity} role="cell">` — 장비명 `<h4>` + meta (사용자/기간) `<p>`.
  - Zone 4: `<div className={CHECKOUT_ITEM_ROW_TOKENS.zoneAction} role="cell">` — `<NextStepPanel variant="compact" ... />` + `<MiniProgressTooltipButton step={current} total={total} />` (7×7).
  - 기존 `MiniProgress` 인라인 호출(L526 근처) **제거** → Zone 4의 tooltip button으로 이동.
  - Row에 `role="row"` + `tabIndex={0}` + `aria-label`(장비명+상태+D-day 요약) + `onKeyDown` (Enter = 상세 진입).
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`
  - 기존 인라인 horizontal dot strip은 유지(재사용), 새로 **tooltip 변형** export: `<MiniProgressTooltipButton ... />`.
  - `variant?: 'inline' | 'tooltipButton'` prop 추가, default `'inline'`.
  - `tooltipButton` variant: 7×7 size + `Tooltip` wrapper (shadcn `Tooltip`) 내부에 기존 inline 렌더.
  - `aria-label`: "진행 {current}/{total}단계 - 상세 보기".
- `apps/frontend/lib/design-tokens/components/checkout.ts`
  - `CHECKOUT_ITEM_ROW_TOKENS` 확장:
    - `grid: 'grid grid-cols-[3px_72px_1fr_auto] gap-3 items-center'`
    - `zoneStatus`, `zoneIdentity`, `zoneAction` 추가
    - `miniProgressTooltipButton`: 7×7 rounded + focus-visible (Sprint 2.6 `FOCUS_TOKENS.ringCurrent`) 참조
  - `satisfies` 강제 — 새 zone key 누락 시 컴파일 오류.

### 수정 금지
- `CheckoutGroupCard` memo boundary 자체 (Sprint 3.4에서 이미 수정).
- `getDdayClasses`, `formatDday` 유틸 로직 (재사용만).
- `NextStepPanel` 구현 (Sprint 4.1 소관).
- MiniProgress의 stepCount/statusToStepIndex 매핑 — Sprint 4.4에서 rental 분기 제거 시 동시 갱신.

### 신규 생성
- 없음 — 기존 컴포넌트 확장만. Zone별 subcomponent는 이 파일 내부 함수로 inline 분리 권장.

---

## 참조 구현 (제시만)

```tsx
// CheckoutGroupCard.tsx row 재구조
<div
  role="row"
  tabIndex={0}
  aria-label={t('row.aria', {
    equipment: row.equipmentName,
    status: t(`status.${row.status}`),
    dday: formatDday(daysRemaining),
  })}
  onKeyDown={(e) => {
    if (e.key === 'Enter') handleRowClick(row.checkoutId);
  }}
  className={cn(
    rowBaseClass,
    CHECKOUT_ITEM_ROW_TOKENS.grid,
    rowIndex < STAGGER_ROW_LIMIT && ANIMATION_PRESETS.staggerFadeInItem,
  )}
  style={...}
>
  {/* Zone 1 — purposeBar */}
  <span className={getPurposeBarClass(row.purpose)} aria-hidden="true" />

  {/* Zone 2 — status + D-day 세로 스택 */}
  <div role="cell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneStatus}>
    <CheckoutStatusBadge status={row.status} />
    {daysRemaining !== null && (
      <span className={`${CHECKOUT_ITEM_ROW_TOKENS.dday} ${getDdayClasses(daysRemaining)}`}>
        {formatDday(daysRemaining)}
      </span>
    )}
  </div>

  {/* Zone 3 — identity */}
  <div role="cell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneIdentity}>
    <h4 className={CHECKOUT_ITEM_ROW_TOKENS.equipmentName}>{row.equipmentName}</h4>
    <p className={CHECKOUT_ITEM_ROW_TOKENS.meta}>
      {row.userName} · {row.period}
    </p>
  </div>

  {/* Zone 4 — action + mini tooltip */}
  <div role="cell" className={CHECKOUT_ITEM_ROW_TOKENS.zoneAction}>
    <NextStepPanel
      variant="compact"
      descriptor={descriptorMap.get(row.checkoutId)}
      checkoutId={row.checkoutId}
      currentUserRole={currentUserRole}
      overflowActions={buildOverflowActions(row)}
    />
    <MiniProgressTooltipButton
      variant="tooltipButton"
      checkoutType={row.purpose === 'rental' ? 'rental' : row.purpose}
      currentStatus={row.status}
    />
  </div>
</div>
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` 경고 0 (해당 파일 한정) | lint |
| M3 | `CheckoutGroupCard.tsx` row container에 `grid grid-cols-[3px_72px_1fr_auto]` 적용 | `grep -n "grid-cols-\[3px_72px_1fr_auto\]" apps/frontend/components/checkouts/CheckoutGroupCard.tsx` = 1+ hit (토큰 경유도 허용) |
| M4 | row container에 `role="row"` + `tabIndex={0}` + `aria-label` 존재 | grep |
| M5 | 4-Zone 각 wrapper가 `role="cell"` 부여 | `grep -c 'role="cell"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx` >= 3 |
| M6 | 기존 inline `<CheckoutMiniProgress ... />` horizontal strip 호출 제거 → Zone 4의 `tooltipButton` variant로 대체 | grep |
| M7 | `CHECKOUT_ITEM_ROW_TOKENS`에 `grid`, `zoneStatus`, `zoneIdentity`, `zoneAction`, `miniProgressTooltipButton` key 추가 + `satisfies` 강제 | grep + 타입 |
| M8 | `CheckoutMiniProgress`에 `variant` prop 추가, default `'inline'`, `tooltipButton` variant가 shadcn `Tooltip` wrap | grep |
| M9 | keyboard: `Tab`으로 row focus → `Enter`로 상세 진입 동작 E2E 통과 | Playwright keyboard test |
| M10 | axe-core: 새 row 구조에서 violation 0건 (role/label 충돌 없음) | axe-core |
| M11 | Row가 `<table>` / `<tbody>` 없이 `role="row"` + `role="cell"`만 쓸 경우, 부모 컨테이너에 `role="grid"` 또는 `role="list"` + `role="listitem"`으로 변경 중 하나 선택 (WAI-ARIA grid pattern 준수) | axe-core + 문서 |
| M12 | Row 내부 클릭 가능 요소(NextStepPanel button, MiniProgress tooltip button)가 row `tabIndex`와 focus trap 없이 순차 이동 | keyboard E2E |
| M13 | 150 row 대형 그룹 렌더 시 grid layout 성능 회귀 없음 (Sprint 3.5 stagger 상한 존중) | Profiler 수동 QA |
| M14 | Sprint 4.1 `NextStepPanel variant="compact"`와 통합됨 (compact variant가 Zone 4 안에 무리 없이 맞음) | manual QA + screenshot |
| M15 | MiniProgress 인라인 strip은 **유지**(다른 곳 쓰는지 확인), Sprint 4.4에서 rental 분기 제거 시 추가 정리 | grep |
| M16 | Sprint 4.4 `CheckoutPhaseIndicator` 도입 시 rental은 MiniProgress 대신 PhaseIndicator 사용 — Zone 4 구조는 둘 다 수용 가능해야 함 (검증: `PhaseIndicator` slot 호환성 테스트) | 통합 테스트 |
| M17 | 변경 파일 = `CheckoutGroupCard.tsx` + `CheckoutMiniProgress.tsx` + `checkout.ts` (토큰) + i18n `ko.json`/`en.json` (row.aria 키) = **최대 5** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 5 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | Row container를 `<li>` + 부모 `<ul role="list">` 또는 `<tr>` + 부모 `<table role="grid">`로 재검토 — ARIA pattern 최적화 | `checkout-row-aria-pattern` |
| S2 | Zone 2 status+D-day 세로 스택을 `max-w-[72px]` + text-truncate로 긴 status 라벨(예: "BORROWER_APPROVED") 처리 | `zone2-long-status-truncate` |
| S3 | row mobile breakpoint(<640px) 시 Zone 구조 재배치 (2행 stack) — V1 S1 모바일 미언급 | `row-mobile-stack-breakpoint` |
| S4 | Playwright keyboard navigation 전용 suite 추가: J/K(행 상/하)는 Sprint 4.5 U-02에서 연계 | `checkout-keyboard-nav-suite` |
| S5 | MiniProgress tooltipButton이 Sprint 4.4의 `CheckoutPhaseIndicator`로 자동 분기 (rental일 때만) — props `purpose` 기반 delegation | `mini-progress-rental-delegation` |
| S6 | Visual regression: Row 레이아웃 screenshot diff 자동화 | `row-visual-regression` |

---

## Verification Commands

```bash
# 1. 빌드 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/components/checkouts/CheckoutMiniProgress.tsx \
  apps/frontend/lib/design-tokens/components/checkout.ts

# 2. Grid 구조
grep -n "grid-cols-\[3px_72px_1fr_auto\]" \
  apps/frontend/components/checkouts/CheckoutGroupCard.tsx \
  apps/frontend/lib/design-tokens/components/checkout.ts
# 기대: 1+ hit (토큰 경유)

grep -c 'role="cell"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: >= 3

grep -n 'role="row"' apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1 hit

grep -n "variant: 'inline' | 'tooltipButton'" apps/frontend/components/checkouts/CheckoutMiniProgress.tsx
# 기대: 1 hit

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 5

# 4. E2E + axe
pnpm --filter frontend run test:e2e -- checkouts/suite-ux
# + axe-core violations 0
```

---

## 위험 / 롤백

- **위험**: Grid 전환 시 72px 고정 Zone 2가 일부 로케일(영어 길이)에서 truncate 필요 → M11/S2에서 대응. RTL 언어는 미지원(현재 ko/en만).
- **위험**: Row 내부 focus ring 중첩 — NextStepPanel compact button + MiniProgress tooltip trigger + row 자체 tabIndex 3중 포커스. Focus order 명확화 M12 요구.
- **롤백**: 본 contract는 1 PR 단위, 이전 flex layout으로 revert 가능.

---

## Acceptance

루프 완료 조건 = MUST 17개 모두 PASS + axe-core 0 violation + keyboard E2E 통과 + PR screenshot diff 첨부.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 3.4 · `checkout-memo-boundary-optimization.md` — `handleRowClick` useCallback 패턴 선행, 본 contract가 의존.
- Sprint 3.5 · stagger 12-row 상한 — row container 변경이 stagger style 유지하는지 검증.
- Sprint 4.1 · `checkout-next-step-panel-unified.md` — Zone 4에 `NextStepPanel variant="compact"` 배치. 선행 권장.
- Sprint 4.3 · `checkout-detail-dday-badge.md` — Zone 2의 D-day 표기를 상세에서도 동일 컴포넌트로 공유 가능한지 검증.
- Sprint 4.4 · `checkout-rental-phase-ui.md` — rental일 때 `CheckoutPhaseIndicator`가 MiniProgress tooltip button을 대체. 구조 호환성.
- Sprint 5.4 · density & rhythm — Row 기본 64px cozy 일관성. 본 contract는 높이 제약 반영.
- MEMORY.md `feedback_pre_commit_self_audit` — a11y/role 리터럴 금지 + 하드코딩 0 체크.
