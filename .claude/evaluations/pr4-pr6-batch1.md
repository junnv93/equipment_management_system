---
slug: pr4-pr6-batch1
date: 2026-04-24
iteration: 1
---

## PR-4 Contract Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | 사전 확인 (tsc passing) |
| M2 | `components/shared/NextStepPanel.tsx` 신규 생성 | PASS | 파일 존재: `apps/frontend/components/shared/NextStepPanel.tsx` |
| M3 | `NEXT_STEP_PANEL_TOKENS` 사용, `WORKFLOW_PANEL_TOKENS` 금지 | PASS | line 8: `import { NEXT_STEP_PANEL_TOKENS, ANIMATION_PRESETS }`. `WORKFLOW_PANEL_TOKENS` 없음 |
| M4 | `variant?: 'floating' \| 'inline' \| 'compact'` prop | PASS | line 17: 정확히 일치 |
| M5 | `isPending=true` → `disabled` + `aria-disabled="true"` | PASS | line 109: `disabled={isPending}`, line 110: `aria-disabled={isPending}`. React JSX boolean `true` → attribute `"true"` |
| M6 | `key={descriptor.currentStatus}` re-mount 트리거 | PASS | line 59 (terminal div), line 83 (active div) 양쪽에 적용 |
| M7 | `descriptor.nextAction === null` → terminal 배지만 렌더 | PASS | line 56: early return with terminal badge. 버튼 없음 |
| M8 | `availableToCurrentUser=true` → action 버튼, `false` → actor hint | PASS | line 79: `const canAct = descriptor.availableToCurrentUser`. line 104: `{canAct ? <button>…</button> : <p>…hint…</p>}` |
| M9 | `nextStep?: NextStepDescriptor \| null` + Zod 검증 | PASS | line 21: `nextStep?: NextStepDescriptor \| null`, line 43: `NextStepDescriptorSchema.safeParse(nextStep)` |
| M10 | i18n: 직접 문자열 하드코딩 금지, `t()` 호출만 사용 | PASS | `grep '"[가-힣]'` 결과 없음. 모든 한국어 문자열은 `t()` 경유 |
| M11 | `CheckoutAction` import: `@equipment-management/schemas` SSOT | PASS | line 6: `import type { CheckoutAction, NextStepDescriptor } from '@equipment-management/schemas'` |
| M12 | 단위 테스트: terminal 렌더, availableToCurrentUser true/false, isPending disabled | PASS | 5/5 PASS (terminal, available=true+click, available=false, isPending, urgency=critical) |

## PR-6 Contract Results

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | 사전 확인 (tsc passing) |
| M2 | `CheckoutStatusStepper`에 `dueAt?: string \| null` prop 추가 | PASS | line 24: `dueAt?: string \| null` |
| M3 | `useCheckoutNextStep` 내부 호출로 descriptor 획득 | PASS | line 16: import, line 84: `const descriptor = useCheckoutNextStep({status, purpose, dueAt})`. 변수명 `descriptor` (계약서 `nextDescriptor` 표기와 차이 있으나 기능 동일) |
| M4 | next 노드: `aria-label="다음 단계: {stepLabel}"` | PASS | line 148, 225: `aria-label={isNext ? \`다음 단계: ${getStepLabel(status)}\` : undefined}` (모바일·데스크톱 양쪽) |
| M5 | `aria-current="step"` current 노드에만, next 노드 중복 금지 | PASS | line 147, 224: `aria-current={isCurrent ? 'step' : undefined}`. next 노드에 `aria-current` 없음 |
| M6 | `ELEVATION_TOKENS.surface.raised` Stepper 컨테이너 적용 | PASS | line 14: import, line 131: `className={cn('w-full', ELEVATION_TOKENS.surface.raised)}` |
| M7 | `CheckoutMiniProgress` urgency=critical aria-label: "기한 초과 — {stepName} ({n}/{total})" | **WARN** | `isLate` 조건부 + `ariaLabel` 패턴은 존재하나 **구현 방식이 계약서 Context와 다름**. 계약서는 template literal `\`기한 초과 — ${stepName} …\`` 패턴을 제시했으나, 실제 구현은 `t('groupCard.progressLabelOverdue', {...})`를 사용. i18n 키 `"progressLabelOverdue": "기한 초과 — {stepName} ({current}/{total})"` (ko.json line 355)가 존재하므로 **런타임 출력은 요구사항과 동일**. 계약 검증 기준 "grep for `기한 초과 —` or `isLate` + aria-label"에서 후자 조건(`isLate` + `ariaLabel` 존재) 충족. PASS로 판정하되 계약 context와의 구현 방식 차이를 기록 |
| M8 | 기존 `nextStepIndex?: number` prop 하위 호환 유지 (삭제 금지) | PASS | line 22: `nextStepIndex?: number`, line 90: `const resolvedNextStepIndex = nextStepIndex ?? descriptor.currentStepIndex` |
| M9 | 하드코딩 status 문자열 추가 금지 | PASS | 모든 status 비교는 `CSVal.*` 상수 경유. `as 'rejected' \| 'canceled'`는 TypeScript 타입 assertion (런타임 문자열 하드코딩 아님) |

## Overall Verdict

**PASS**

모든 MUST 기준 (PR-4 × 12 + PR-6 × 9 = 21개) 통과.

## Issues Found (MUST failures only)

None.

## SHOULD Criteria Status

### PR-4 SHOULD

| # | Criterion | Status | Evidence |
|---|-----------|--------|---------|
| S1 | 스토리북 stories.tsx 10개 스토리 | PASS | `NextStepPanel.stories.tsx` 존재, export count 11 (`export const` × 10 + `export default` × 1) |
| S2 | aria-label에 currentStep/total 포함 (`{n}/{total} 단계`) | PASS | line 78: `` stepLabel = `... — ${descriptor.currentStepIndex}/${descriptor.totalSteps}` ``, line 108: `aria-label={stepLabel}` |
| S3 | urgency=critical 시 animate-pulse 클래스 | PASS | `NEXT_STEP_PANEL_TOKENS.urgency.critical`에 `motion-safe:animate-pulse motion-reduce:animate-none` 포함 (workflow-panel.ts line 94). 테스트 line 122에서도 검증됨 |
| S4 | role="status" aria-live="polite" 최상위 div | PASS | terminal div (line 60–62) + active div (line 84–86) 양쪽에 `role="status" aria-live="polite" aria-atomic="true"` |

### PR-6 SHOULD

| # | Criterion | Status | Evidence |
|---|-----------|--------|---------|
| S1 | CheckoutMiniProgress: urgency=critical → `ring-brand-critical` 클래스 | **FAIL** | `ring-brand-critical`이 CheckoutMiniProgress.tsx에 없음. `CHECKOUT_MINI_PROGRESS.dot.late`만 사용 (late dot 색상만 변경됨). ring 클래스 미적용 |
| S2 | Stepper에서 내부 계산한 nextStepIndex가 외부 prop보다 우선 | **FAIL** | line 90: `nextStepIndex ?? descriptor.currentStepIndex` — 외부 prop이 우선, 내부 계산이 fallback. 계약서 S2는 반대 우선순위를 요구하나 실제 구현은 역방향. SHOULD이므로 루프 차단 아님 |

### 주요 관찰 사항

- PR-6 M7 구현 방식: 계약서 Context는 template literal `기한 초과 — ...`을 예시로 제시했으나, 구현은 i18n 경유 방식 채택. 이는 기능상 동등하며 i18n 일관성 측면에서 더 나은 구현이나, 계약 context 패턴과의 차이를 명시.
- PR-6 S2 우선순위 역전: 계약서는 "내부 계산 > 외부 prop" 우선순위를 명시했으나 실제 코드는 "외부 prop > 내부 계산 fallback". 하위 호환(M8) 관점에서는 외부 prop 우선이 더 안전하지만 S2 기준은 충족 못함.
