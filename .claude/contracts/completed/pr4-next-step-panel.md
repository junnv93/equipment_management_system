---
slug: pr4-next-step-panel
type: contract
date: 2026-04-24
---

# PR-4 Contract: shared/NextStepPanel + useCheckoutNextStep 업그레이드

## Scope

- `apps/frontend/hooks/use-checkout-next-step.ts` (수정)
- `apps/frontend/components/shared/NextStepPanel.tsx` (신규)
- `apps/frontend/components/shared/__tests__/NextStepPanel.test.tsx` (신규)
- `apps/frontend/components/shared/NextStepPanel.stories.tsx` (신규)

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | 빌드 검증 |
| M2 | `components/shared/NextStepPanel.tsx` 신규 생성 | 파일 존재 확인 |
| M3 | `NEXT_STEP_PANEL_TOKENS` 사용 (WORKFLOW_PANEL_TOKENS 금지) | grep |
| M4 | `variant?: 'floating' \| 'inline' \| 'compact'` prop | grep |
| M5 | `isPending=true` → button disabled + aria-disabled="true" | 코드 확인 |
| M6 | `key={descriptor.currentStatus}` → re-mount 트리거 | grep |
| M7 | `descriptor.nextAction === null` → terminal 배지만 렌더 | 코드 확인 |
| M8 | `availableToCurrentUser=true` → action 버튼, false → actor hint | 코드 확인 |
| M9 | `use-checkout-next-step.ts`에 `nextStep?: NextStepDescriptor \| null` 옵션 추가 + Zod 검증 | grep |
| M10 | i18n: 직접 문자열 하드코딩 금지, t() 호출만 사용 | grep |
| M11 | CheckoutAction import: `@equipment-management/schemas` SSOT | grep |
| M12 | 단위 테스트: terminal 렌더, availableToCurrentUser true/false, isPending disabled 케이스 | 테스트 실행 |

## SHOULD Criteria (루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | 스토리북 stories.tsx 10개 스토리 |
| S2 | aria-label에 currentStep/total 포함 (`{n}/{total} 단계`) |
| S3 | urgency=critical 시 animate-pulse 클래스 |
| S4 | role="status" aria-live="polite" 최상위 div |

## Context

### 기존 파일 상태
- `checkouts/NextStepPanel.tsx` 이미 존재 (`WORKFLOW_PANEL_TOKENS` 기반, checkoutId 필수 prop)
- `shared/NextStepPanel.tsx` 미존재 → 신규 생성 필요
- `use-checkout-next-step.ts` 존재하지만 서버 nextStep 필드 미지원

### 토큰 위치
```typescript
import { NEXT_STEP_PANEL_TOKENS, ANIMATION_PRESETS, ELEVATION_TOKENS } from '@/lib/design-tokens';
```

### 테스트 제약
- `jest-axe` 미설치 — aria 속성 수동 검증으로 대체
- `@testing-library/react` 사용

### 중요 인터페이스
```typescript
interface NextStepPanelProps {
  descriptor: NextStepDescriptor;
  variant?: 'floating' | 'inline' | 'compact';
  onActionClick?: (action: CheckoutAction) => void | Promise<void>;
  isPending?: boolean;
  className?: string;
  'data-testid'?: string;
}
```

### hook 업그레이드
```typescript
interface UseCheckoutNextStepInput {
  status: CheckoutStatus;
  purpose: CheckoutPurpose;
  dueAt?: string | null;
  nextStep?: NextStepDescriptor | null; // 서버 응답 — Zod 검증 후 fallback
}
```
