---
slug: checkout-rental-phase-ui
type: contract
date: 2026-04-24
depends: [checkout-descriptor-phase-fields, checkout-row-3zone-grid, checkout-next-step-panel-unified]
sprint: 4
sprint_step: 4.4
---

# Contract: Sprint 4.4 — Rental Phase UI (`CheckoutPhaseIndicator` + `WorkflowTimeline` phase 접힘/펼침 + drill-down 8-step) · C-2 해소

## Context

V2 §7 C-2 지적 + 사용자 확정 결정(2026-04-24):

1. **문제**: 목록 `CheckoutMiniProgress.stepCount.rental = 5` vs 상세 `CHECKOUT_DISPLAY_STEPS.rental.length = 8`. 같은 checkout을 목록과 상세에서 **다른 단위**로 표기 → 유저 혼란 + 개발자 의미 불일치.
2. **사용자 확정**: "Phase-based '1/3 phase'" — 목록/상세 **모두** phase가 1차 표기 (APPROVE / HANDOVER / RETURN 3-phase). 상세는 drill-down으로 8-step 접근.
3. **Sprint 1.2에서 schema 선행**: `NextStepDescriptor.phase / phaseIndex / totalPhases` 필드 + `RentalPhase` enum + `getRentalPhase` / `getPhaseIndex` / `getStepsInPhase` 유틸 이미 확정 (`checkout-descriptor-phase-fields.md` depends).
4. **본 contract 범위**: **UI 컴포넌트 + 토큰 + i18n만**. 스키마/FSM 로직 수정 금지.

---

## Scope

### 수정 대상
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx`
  - **rental 분기 제거** — `stepCount.rental = 5`, `statusToStepIndex`의 rental 경로 모두 삭제.
  - non-rental(calibration/repair)만 담당. `checkoutType: 'calibration' | 'repair'` (rental 제외).
  - rental이 넘어오면 dev 환경에서 `console.warn` + production은 null 반환 (optional).
- `apps/frontend/components/checkouts/WorkflowTimeline.tsx`
  - Rental일 때만 **Phase 접힘/펼침** 구조로 재작성.
  - 기본 상태: 3개 phase card (완료/진행중/대기). **진행중 phase만** 내부 step 펼침. 완료 phase는 "3/3 완료 · 단계 보기" 링크. 미래 phase는 "3단계 대기".
  - "전체 단계 보기" 버튼 → Rental 8-step expanded Stepper (기존 `CheckoutStatusStepper`의 rental 분기 재활용).
  - `aria-expanded` + `aria-controls` + 키보드(Space/Enter 토글).
  - 반응형: 모바일 `pl-9`, 태블릿 `md:pl-11`, 데스크톱 `lg:grid-cols-3`.
  - Non-rental은 기존 로직 그대로 (calibration/repair Stepper + Timeline).
- `apps/frontend/lib/design-tokens/components/checkout-timeline.ts` (또는 `checkout.ts` 내부)
  - `CHECKOUT_RENTAL_PHASE_TOKENS` 신규: `container`, `phaseCard`, `phaseHeader`, `phaseTitle`, `phaseCount`, `stepItem`, `collapsedSummary`, `expandBtn`, `expandAllBtn`.
  - `satisfies Record<RentalPhase, { label: string; icon: string; accent: string }>` 강제.
- `apps/frontend/messages/ko.json` + `en.json`
  - `checkouts.rentalPhase.approve.label` = "승인" / "Approval"
  - `checkouts.rentalPhase.handover.label` = "반출·인수" / "Handover"
  - `checkouts.rentalPhase.return.label` = "반납" / "Return"
  - `checkouts.rentalPhase.xOfY` = "Phase {current}/{total}" / "Phase {current}/{total}"
  - `checkouts.rentalPhase.shortLabel` = "{current}/{total} · {label}" (목록용)
  - `checkouts.rentalPhase.expandAll` = "전체 단계 보기" / "Show all steps"
  - `checkouts.rentalPhase.collapseAll` = "접기" / "Collapse"
  - `checkouts.rentalPhase.stepCount` = "{count}단계" / "{count} steps"
  - `checkouts.rentalPhase.phaseComplete` = "{count}/{total} 완료" / "{count}/{total} complete"

### 신규 생성
- `apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx`
  - Rental 전용. 목록 Row Zone 4 (Sprint 4.2) 또는 compact variant NextStepPanel의 앞쪽에 배치.
  - Props: `{ phase: RentalPhase | null; phaseIndex: number | null; totalPhases: number | null; variant?: 'pill' | 'dots' }`
  - variant `pill`: "1/3 · 승인" 1줄
  - variant `dots`: 3 phase dot (완료=brand-ok, 진행중=brand-info+ring, 대기=ink-200)
  - `aria-label`: "현재 승인 단계 (3단계 중 1단계)"
- (선택) `apps/frontend/components/checkouts/RentalPhaseCard.tsx` — WorkflowTimeline 내부 phase 단위 카드. 접힘/펼침 상태 + 내부 step 목록.

### 수정 금지
- `packages/schemas/src/fsm/rental-phase.ts` — Sprint 1.2 소관.
- `CHECKOUT_DISPLAY_STEPS.rental` 8-step 배열 — 상세 drill-down에 그대로 사용.
- `resolveNextAction` / `getNextStep` — Sprint 1.1 소관.
- `CheckoutStatusStepper.tsx` 로직 본체 — rental 분기 **재활용**만 (expand 시).

---

## 참조 구현

```tsx
// apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx
'use client';

import type { RentalPhase } from '@equipment-management/schemas';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { CHECKOUT_RENTAL_PHASE_TOKENS } from '@/lib/design-tokens';

interface CheckoutPhaseIndicatorProps {
  phase: RentalPhase | null;
  phaseIndex: number | null;
  totalPhases: number | null;
  variant?: 'pill' | 'dots';
  className?: string;
}

export function CheckoutPhaseIndicator({
  phase,
  phaseIndex,
  totalPhases,
  variant = 'pill',
  className,
}: CheckoutPhaseIndicatorProps) {
  const t = useTranslations('checkouts.rentalPhase');
  if (phase === null || phaseIndex === null || totalPhases === null) return null;

  const current = phaseIndex + 1; // 1-based 표기
  const label = t(`${phase}.label`);

  if (variant === 'dots') {
    return (
      <div
        role="group"
        aria-label={t('xOfY', { current, total: totalPhases })}
        className={cn(CHECKOUT_RENTAL_PHASE_TOKENS.dotsContainer, className)}
      >
        {Array.from({ length: totalPhases }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            data-phase-state={i < phaseIndex ? 'done' : i === phaseIndex ? 'active' : 'pending'}
            className={CHECKOUT_RENTAL_PHASE_TOKENS.dot}
          />
        ))}
      </div>
    );
  }

  // pill variant
  return (
    <span
      aria-label={t('xOfY', { current, total: totalPhases })}
      className={cn(CHECKOUT_RENTAL_PHASE_TOKENS.pill, className)}
    >
      {t('shortLabel', { current, total: totalPhases, label })}
    </span>
  );
}
```

```tsx
// WorkflowTimeline.tsx (rental 분기 스켈레톤)
function RentalTimeline({ descriptor, statusHistory }: Props) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('checkouts.rentalPhase');

  return (
    <section className={CHECKOUT_RENTAL_PHASE_TOKENS.container}>
      {RENTAL_PHASES.map((phase, idx) => {
        const phaseIndex = idx;
        const isDone = phaseIndex < descriptor.phaseIndex!;
        const isActive = phaseIndex === descriptor.phaseIndex;
        const steps = getStepsInPhase(phase);
        const phaseId = `rental-phase-${phase}`;

        return (
          <article
            key={phase}
            aria-expanded={isActive || expanded}
            aria-controls={`${phaseId}-steps`}
            data-phase-state={isDone ? 'done' : isActive ? 'active' : 'pending'}
            className={CHECKOUT_RENTAL_PHASE_TOKENS.phaseCard}
          >
            <header className={CHECKOUT_RENTAL_PHASE_TOKENS.phaseHeader}>
              <h4 className={CHECKOUT_RENTAL_PHASE_TOKENS.phaseTitle}>
                {t(`${phase}.label`)}
              </h4>
              <span className={CHECKOUT_RENTAL_PHASE_TOKENS.phaseCount}>
                {isDone
                  ? t('phaseComplete', { count: steps.length, total: steps.length })
                  : t('stepCount', { count: steps.length })}
              </span>
            </header>
            {(isActive || expanded) && (
              <ol id={`${phaseId}-steps`} className={CHECKOUT_RENTAL_PHASE_TOKENS.stepList}>
                {steps.map(step => <RentalStepItem key={step} step={step} ... />)}
              </ol>
            )}
          </article>
        );
      })}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        className={CHECKOUT_RENTAL_PHASE_TOKENS.expandAllBtn}
      >
        {expanded ? t('collapseAll') : t('expandAll')}
      </button>
    </section>
  );
}
```

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` 경고 0 (해당 파일 한정) | lint |
| M3 | `CheckoutPhaseIndicator.tsx` 신규 파일 존재 + named export | grep |
| M4 | `CheckoutMiniProgress.tsx`에서 `rental` key가 `stepCount`/`statusToStepIndex`에서 제거됨 | `grep -n "rental:" apps/frontend/components/checkouts/CheckoutMiniProgress.tsx apps/frontend/lib/design-tokens/components/checkout.ts \| grep -E "stepCount\|statusToStepIndex"` = 0 hit (rental 키 없음) |
| M5 | `CheckoutPhaseIndicator`가 `phase === null` 시 null 반환 | 코드 확인 + test |
| M6 | `CheckoutPhaseIndicator`의 `aria-label`이 i18n `rentalPhase.xOfY` 경유 (하드코딩 0) | grep |
| M7 | `WorkflowTimeline` rental 분기에서 3 phase card 렌더 (done/active/pending) + 각 `aria-expanded` + `aria-controls` + `data-phase-state` | grep |
| M8 | "전체 단계 보기" 버튼 존재 + 클릭 시 모든 phase expand (state toggle) | E2E |
| M9 | 진행중(active) phase만 기본 펼침, 완료/대기는 접힘 | E2E + 코드 |
| M10 | 키보드: Space/Enter로 phase card 토글 가능 (focus-visible + aria-expanded 상태 전환) | keyboard E2E |
| M11 | `CHECKOUT_RENTAL_PHASE_TOKENS`에 9+ key 정의 + `satisfies Record<RentalPhase, ...>` | grep |
| M12 | i18n 8개 키 (`approve.label`, `handover.label`, `return.label`, `xOfY`, `shortLabel`, `expandAll`, `collapseAll`, `stepCount`, `phaseComplete`) 양 로케일 존재 | `jq` |
| M13 | 목록 Row Zone 4에서 rental row는 `<CheckoutPhaseIndicator />` 사용 (MiniProgress rental 경로 미사용) | grep in CheckoutGroupCard |
| M14 | E2E rental 시나리오: PENDING → 목록 "Phase 1/3 · 승인", 상세 1st phase expanded. APPROVED → 목록 "Phase 2/3 · 반출·인수", 상세 2nd phase expanded. RETURN_APPROVED → 목록 "Phase 3/3 · 반납", 상세 3rd phase expanded | Playwright |
| M15 | E2E non-rental 시나리오 (calibration): 기존 MiniProgress "3/5" 표기 회귀 없음 | Playwright |
| M16 | axe-core: phase card `role="region"` 또는 `<article>`, `aria-expanded`/`aria-controls` 쌍 consistency, violation 0 | axe |
| M17 | `review-design` skill 재실행 결과 "information density" / "typography drama" 스코어 전/후 비교 문서화 (PR body) | review-design |
| M18 | 변경 파일 = `CheckoutPhaseIndicator.tsx`(신규) + `RentalPhaseCard.tsx`(선택) + `CheckoutMiniProgress.tsx` + `WorkflowTimeline.tsx` + `checkout-timeline.ts` 또는 `checkout.ts`(토큰) + `CheckoutGroupCard.tsx`(Zone 4 분기) + `ko.json` + `en.json` = **최대 8** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 8 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | Phase별 아이콘(승인=CheckCircle, 반출=Package, 반납=PackageCheck) lucide 매핑 토큰화 | `rental-phase-icon-map` |
| S2 | Mobile breakpoint(<640px)에서 phase card 축약 표기 ("1/3" 생략, label만) | `rental-phase-mobile-compact` |
| S3 | `CheckoutMiniProgress`가 rental을 받으면 자동으로 `CheckoutPhaseIndicator`에 delegation (type-safe wrapper) | `rental-mini-progress-delegation` |
| S4 | Phase 전환 애니메이션 (expanded 토글 220ms ease-in-out, Sprint 5.5 motion 예산 준수) | `rental-phase-motion` |
| S5 | Dark mode phase state 대비 검증 (`.dark` + `bg-brand-info/10` contrast) | `rental-phase-dark-contrast` |
| S6 | 향후 non-rental에도 phase 개념 확장 시(예: calibration 2-phase), 컴포넌트 재사용 가능하도록 `CheckoutPhaseIndicator`를 generic 설계 유지 | `phase-indicator-generic-design` |
| S7 | Storybook 스토리 4종(pending / in-approve / in-handover / complete) | `rental-phase-storybook` |
| S8 | screen reader 안내 녹음 (NVDA/VoiceOver) — phase 토글 + step drill-down 음성 흐름 | `rental-phase-sr-audit` |

---

## Verification Commands

```bash
# 1. 빌드 + lint
pnpm --filter frontend exec tsc --noEmit
pnpm --filter frontend exec eslint \
  apps/frontend/components/checkouts/CheckoutPhaseIndicator.tsx \
  apps/frontend/components/checkouts/CheckoutMiniProgress.tsx \
  apps/frontend/components/checkouts/WorkflowTimeline.tsx

# 2. rental 키 제거
grep -n "rental:" apps/frontend/components/checkouts/CheckoutMiniProgress.tsx apps/frontend/lib/design-tokens/components/checkout.ts | grep -iE "stepCount|statusToStepIndex"
# 기대: 0 hit

grep -n "<CheckoutPhaseIndicator" apps/frontend/components/checkouts/CheckoutGroupCard.tsx
# 기대: 1+ hit

grep -cE 'aria-expanded|aria-controls' apps/frontend/components/checkouts/WorkflowTimeline.tsx
# 기대: >= 6 (3 phase × 2 attribute)

# 3. 토큰
grep -n "CHECKOUT_RENTAL_PHASE_TOKENS" apps/frontend/lib/design-tokens/
# 기대: 정의 + export

grep -n "satisfies Record<RentalPhase" apps/frontend/lib/design-tokens/
# 기대: 1+ hit

# 4. i18n 키
for key in approve.label handover.label return.label xOfY shortLabel expandAll collapseAll stepCount phaseComplete; do
  jq ".checkouts.rentalPhase.\"$key\"" apps/frontend/messages/ko.json apps/frontend/messages/en.json
done
# 기대: 양 로케일 모두 non-null

# 5. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 8

# 6. E2E
pnpm --filter frontend run test:e2e -- checkouts/suite-ux checkouts/fsm
# rental 3-phase 전 시나리오 + non-rental 회귀
```

---

## 위험 / 롤백

- **위험**: `CheckoutMiniProgress` rental 분기 제거 후 아직 마이그레이션 안 된 호출부(예: 대시보드 위젯)에서 런타임 에러 가능 — `grep -rn "stepCount\.rental"` 전수 확인 필수.
- **위험**: Phase 분류가 잘못되면 목록/상세 모두 틀리게 표시됨 — Sprint 1.2 `RENTAL_STATUS_TO_PHASE` 매핑이 canonical. 본 contract는 그 매핑을 **소비만** (재정의 금지).
- **위험**: expanded 상태 전역 toggle 버튼이 저성능 기기(150+ row × 3 phase)에서 layout shift — Sprint 3.5 stagger 상한 + `prefers-reduced-motion` 존중으로 완화.
- **롤백**: 본 contract 1 PR 단위로 revert 가능. MiniProgress rental 분기 복원, PhaseIndicator 삭제.

---

## Acceptance

루프 완료 조건 = MUST 18개 모두 PASS + axe 0 violation + rental/non-rental 전 시나리오 E2E 통과 + `review-design` 스코어 개선 기록.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록.

---

## 연계 contracts

- Sprint 1.2 · `checkout-descriptor-phase-fields.md` — schema 선행. `phase`/`phaseIndex`/`totalPhases`/`RentalPhase` 공급.
- Sprint 1.1 · `checkout-fsm-resolve-action.md` — descriptor 출처. phase 필드 항상 채워짐 보장.
- Sprint 4.1 · `checkout-next-step-panel-unified.md` — hero variant 내부에 `<CheckoutPhaseIndicator variant="dots">` slot.
- Sprint 4.2 · `checkout-row-3zone-grid.md` — Row Zone 4에 rental이면 `<CheckoutPhaseIndicator variant="pill">` 배치.
- Sprint 4.3 · `checkout-detail-dday-badge.md` — Hero에서 DdayBadge와 PhaseIndicator 수평 배치.
- Sprint 5.2 · typography 6단계 — phase title/count typography alias.
- Sprint 5.5 · motion 예산 — phase 토글 220ms ease-in-out.
- MEMORY.md `project_82_pr3_design_tokens_20260424` — Layer 2 토큰 확장 원칙 정합.
