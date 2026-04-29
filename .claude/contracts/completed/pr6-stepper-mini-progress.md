---
slug: pr6-stepper-mini-progress
type: contract
date: 2026-04-24
---

# PR-6 Contract: CheckoutStatusStepper next 상태 + CheckoutMiniProgress 확장

## Scope

- `apps/frontend/components/checkouts/CheckoutStatusStepper.tsx` (수정 ±40 lines)
- `apps/frontend/components/checkouts/CheckoutMiniProgress.tsx` (수정 ±30 lines)

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 검증 |
| M2 | `CheckoutStatusStepper`에 `dueAt?: string \| null` prop 추가 | grep |
| M3 | `useCheckoutNextStep` 내부 호출로 `nextDescriptor` 획득 | grep |
| M4 | next 노드: `aria-label="다음 단계: {stepLabel}"` | grep |
| M5 | `aria-current="step"` current 노드에만 (next 노드 중복 금지) | 코드 확인 |
| M6 | `ELEVATION_TOKENS.surface.raised` Stepper 컨테이너 적용 | grep |
| M7 | `CheckoutMiniProgress` urgency=critical aria-label: "기한 초과 — {stepName} ({n}/{total})" | grep |
| M8 | 기존 `nextStepIndex?: number` prop 하위 호환 유지 (삭제 금지) | grep |
| M9 | 하드코딩 status 문자열 추가 금지 | grep |

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | CheckoutMiniProgress: urgency=critical → current dot ring-brand-critical 클래스 |
| S2 | Stepper에서 내부 계산한 nextStepIndex가 외부 prop보다 우선 |

## Context

### 현재 상태
- `CheckoutStatusStepper.tsx`: 이미 `nextStepIndex?: number` prop + `CHECKOUT_STEPPER_TOKENS.status.next` 사용
- `CheckoutMiniProgress.tsx`: 이미 `descriptor?: NextStepDescriptor` prop + isLate 처리
- 추가 작업: `dueAt` prop + 내부 hook 호출 + aria-label + elevation token

### 핵심 변경 패턴
```typescript
// CheckoutStatusStepper에 추가
import { useCheckoutNextStep } from '@/hooks/use-checkout-next-step';
import { ELEVATION_TOKENS } from '@/lib/design-tokens';

// props에 dueAt 추가
interface CheckoutStatusStepperProps {
  currentStatus: CheckoutStatus;
  checkoutType: 'calibration' | 'repair' | 'rental';
  nextStepIndex?: number; // 하위 호환 유지
  dueAt?: string | null;  // 신규
}

// 내부: hook 호출로 nextStepIndex 자동 계산
const descriptor = useCheckoutNextStep({
  status: currentStatus,
  purpose: checkoutType as CheckoutPurpose,
  dueAt,
});
const resolvedNextStepIndex = nextStepIndex ?? descriptor.currentStepIndex;
```

### CheckoutMiniProgress urgency aria-label
```typescript
const ariaLabel = isLate
  ? `기한 초과 — ${stepName} (${currentStepNumber}/${stepCount})`
  : t('groupCard.progressLabelWithStep', { stepName, current: currentStepNumber, total: stepCount });
```

### 토큰 위치
```typescript
import { CHECKOUT_STEPPER_TOKENS, ELEVATION_TOKENS } from '@/lib/design-tokens';
```
