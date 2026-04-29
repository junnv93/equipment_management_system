# Contract: checkouts-phase3-inline-action

> **Slug**: checkouts-phase3-inline-action
> **Mode**: Mode 1 (Lightweight harness)
> **Plan reference**: `/home/kmjkds/.claude/plans/bubbly-purring-ullman.md`
> **Goal**: P0-3 inline action 토큰 마이그레이션 — 행 단위 액션 버튼을 solid primary → soft-tint inline action으로 전환, atom으로 캡슐화, 매핑 SSOT 도입.

## Scope

### In-scope (changed files)
- `packages/shared-constants/src/checkout-thresholds.ts` (변경)
- `packages/shared-constants/src/index.ts` (변경 — 다른 세션 변경 보존, append-only)
- `apps/frontend/components/ui/inline-action-button.tsx` (신규)
- `apps/frontend/components/ui/__tests__/inline-action-button.test.tsx` (신규)
- `apps/frontend/components/shared/NextStepPanel.tsx` (변경)
- `apps/frontend/lib/design-tokens/components/workflow-panel.ts` (변경)
- `apps/frontend/messages/{ko,en}/checkouts.json` (변경 — sr-only loading 라벨 필요 시)
- `.claude/skills/verify-design-tokens/SKILL.md` (변경 — Step 44 보강)
- `.claude/skills/verify-checkout-fsm/SKILL.md` (변경 — Step 40 패턴 갱신)

### Out-of-scope
- `apps/frontend/components/checkouts/CheckoutGroupCard.tsx` — bulkApprove 그룹 단일 CTA primary solid 유지
- `NEXT_STEP_PANEL_TOKENS.actionButton.*` (NextStepPanel floating/inline) — Phase 4 후보, tech-debt 이관
- `apps/frontend/components/checkouts/CheckoutDetail.tsx` — 와이어프레임 02 별도 phase
- 핸드오프 7건 architectural debt (stepper 토큰 승격 등) — 별도 PR 분리

### Plan 수정 사항 (Generator 진입 시 발견)
- **테스트 위치 변경**: `packages/shared-constants`에 vitest 인프라가 없음(`getCheckoutDdayTier`도 단위 테스트 없음, types/constants only). 플랜의 `packages/shared-constants/test/checkout-thresholds.test.ts`를 폐기하고, `resolveInlineActionVariant` 매트릭스 테스트는 `apps/frontend/components/ui/__tests__/inline-action-button.test.tsx`에 co-location. 이유: shared-constants는 build 전용(tsc compile), vitest 셋업 추가는 Phase 3 boundary 초과.

## MUST Criteria (Evaluator FAIL 시 재구현)

| # | Criterion | Verification |
|---|---|---|
| M1 | `pnpm tsc --noEmit` 0 errors (frontend) | `pnpm --filter @equipment-management/frontend tsc --noEmit` |
| M2 | `tsc -p tsconfig.json --skipLibCheck` 0 errors (shared-constants build) | `pnpm --filter @equipment-management/shared-constants build` |
| M3 | `WORKFLOW_PANEL_TOKENS.variant.{compact,hero}.actionButton` 토큰 호출처 0 | `grep -rn "WORKFLOW_PANEL_TOKENS\.variant\.\(compact\|hero\)\.actionButton" apps/` → 0 |
| M4 | `bg-surface-inline-action-*` / `text-surface-inline-action-*` / `border-surface-inline-action-*` 직접 className은 `inline-action-button.tsx` 외 0건 | `grep -rn "\(bg\|text\|border\)-surface-inline-action-" apps/frontend/components/ apps/frontend/app/` → `inline-action-button.tsx` 외 0 |
| M5 | NextStepPanel compact 분기 `{!canAct && <span>...} / {canAct && <InlineActionButton>...}` 상호 배타 보존 (verify-checkout-fsm Step 40) | manual diff review + grep `!canAct\|canAct &&` |
| M6 | `e.stopPropagation()` 보존 — 행 클릭 충돌 회피 | `grep -n "stopPropagation" apps/frontend/components/shared/NextStepPanel.tsx` ≥ 2 hits |
| M7 | InlineActionButton 단위 테스트 ≥ 8 케이스 PASS | `pnpm --filter @equipment-management/frontend test inline-action-button` |
| M8 | `resolveInlineActionVariant` 매핑 매트릭스 ≥ 7 케이스 PASS (atom 테스트 내 co-location) | 위 테스트 결과 |
| M9 | 와이어프레임 04 spec table 7개 속성 중 InlineActionButton base/variant 합성에 100% 반영 | code review of `inline-action-button.tsx` + `SURFACE_INLINE_ACTION_TOKENS` 참조 |
| M10 | i18n parity (필요 시) | ko/en 키 동기 — 신규 키 추가 시 양쪽 동일 |
| M11 | verify-implementation workflow 0 violations (verify-i18n, verify-ssot, verify-hardcoding, verify-frontend-state) | `.claude/skills/verify-implementation` 또는 개별 스크립트 실행 |
| M12 | `cn()` 외 인라인 className 합성 금지 — atom의 base/variant override 없음 | code review of NextStepPanel compact + hero usage |

## SHOULD Criteria (경고만, 루프 차단 안 함 — tech-debt 등록)

| # | Criterion | Verification |
|---|---|---|
| S1 | 다크모드 대비비 ≥ 3:1 (WCAG AA Non-text) | playwright snapshot 4 variant × light/dark + axe-core color-contrast |
| S2 | React.memo 작동 검증 — 불변 prop에서 리렌더 0 | React DevTools Profiler 또는 vitest renderCounter |
| S3 | Bundle size delta < 1KB gzip | next-bundle-analyzer baseline 비교 |
| S4 | leadingIcon 사용처 0 (와이어프레임 04 행 단위 icon 없음 권장) | `grep -rn "leadingIcon=" apps/frontend/components/` → 0 |
| S5 | review-architecture (Mode 2 보조) — atom 도입이 Layer 4 의존 그래프에 회귀 없음 | review-architecture skill 실행 |
| S6 | Storybook entry — 4 variant + loading + disabled + leadingIcon | 추후 별도 PR 가능 |

## Verification Commands (Evaluator step 5)

```bash
# 1. Build gate
pnpm --filter @equipment-management/shared-constants build
pnpm --filter @equipment-management/frontend tsc --noEmit

# 2. Unit tests
pnpm --filter @equipment-management/frontend test inline-action-button NextStepPanel

# 3. Token migration completeness
grep -rn "WORKFLOW_PANEL_TOKENS\.variant\.\(compact\|hero\)\.actionButton" apps/  # → 0
grep -rn "\(bg\|text\|border\)-surface-inline-action-" apps/frontend/components/ apps/frontend/app/  # → inline-action-button.tsx 외 0

# 4. FSM Step 40 보존
grep -n "!canAct\|canAct &&" apps/frontend/components/shared/NextStepPanel.tsx
grep -n "stopPropagation" apps/frontend/components/shared/NextStepPanel.tsx

# 5. verify-* skills
.claude/skills/verify-design-tokens/scripts/run-all.sh   # Step 44 강화 후
.claude/skills/verify-checkout-fsm/scripts/run-all.sh    # Step 40 갱신 후
.claude/skills/verify-implementation/scripts/run-all.sh  # i18n / ssot / hardcoding / frontend-state
```

## Wireframe Conformance Matrix (Phase 3 완료 후 자가 검증)

| 속성 | 와이어프레임 04 | 구현 | 검증 위치 |
|---|---|---|---|
| height | 28px | `h-7` | `SURFACE_INLINE_ACTION_TOKENS.base` |
| background | `hsl(brand / 0.10)` | `bg-surface-inline-action-{variant}-bg` | `SURFACE_INLINE_ACTION_TOKENS.variant.{key}` |
| color | `hsl(brand)` | `text-surface-inline-action-{variant}-fg` | 동상 |
| border | `1px solid hsl(brand / 0.22)` | `border` + `border-surface-inline-action-{variant}-border` | 동상 |
| box-shadow | `none` | (base에 미정의 = none) | 합성 클래스에 box-shadow 0 |
| font-weight | 600 | `font-semibold` | `SURFACE_INLINE_ACTION_TOKENS.base` |
| icon | none / size-12 lucide | `leadingIcon` prop optional, 마이그레이션 호출 0건 | NextStepPanel call site |

## Iteration Tracking

| Iter | Date | Verdict | FAIL items | Notes |
|------|------|---------|------------|-------|
| 1 | (pending) | — | — | initial generator run |
