---
slug: pr4-6-8-combined
type: evaluation
date: 2026-04-24
---

# Evaluation: PR-4 + PR-6 + PR-8
Date: 2026-04-24

## PR-4 Results — shared/NextStepPanel + useCheckoutNextStep 업그레이드

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | 타입 에러 없음. 전체 프론트엔드 tsc exit 0 확인 |
| M2 | `components/shared/NextStepPanel.tsx` 신규 생성 | PASS | 파일 존재: `apps/frontend/components/shared/NextStepPanel.tsx` |
| M3 | `NEXT_STEP_PANEL_TOKENS` 사용, `WORKFLOW_PANEL_TOKENS` 금지 | PASS | `NEXT_STEP_PANEL_TOKENS` 사용 확인, `WORKFLOW_PANEL_TOKENS` 미출현 |
| M4 | `variant?: 'floating' \| 'inline' \| 'compact'` prop | PASS | 17번 줄: `variant?: 'floating' \| 'inline' \| 'compact'` 정확히 선언됨 |
| M5 | `isPending=true` → button disabled + aria-disabled="true" | PASS | 109번 줄: `disabled={isPending}`, 110번 줄: `aria-disabled={isPending}`. React가 boolean true를 DOM 속성 "true"로 직렬화. 테스트(`expect(button).toHaveAttribute('aria-disabled', 'true')`) 통과 확인 |
| M6 | `key={descriptor.currentStatus}` 존재 | PASS | 59번 줄(terminal 분기)과 83번 줄(active 분기) 양쪽 모두 `key={descriptor.currentStatus}` 존재 |
| M7 | `descriptor.nextAction === null` → terminal 배지만 렌더, 액션 버튼 없음 | PASS | 56번 줄 `if (descriptor.nextAction === null)` 분기: CheckCircle2 아이콘 + `{t('hint.terminal')}` 배지만 렌더. 버튼 없음 확인 |
| M8 | `availableToCurrentUser=true` → 버튼, `false` → 버튼 없이 actor hint | PASS | 104번 줄 `const canAct = descriptor.availableToCurrentUser`. 117번 줄 false 분기: `<p>` 태그에 `t('actor.{nextActor}')` 렌더. 버튼 없음 확인 |
| M9 | `use-checkout-next-step.ts`에 `nextStep?: NextStepDescriptor \| null` + `NextStepDescriptorSchema.safeParse` | PASS | 21번 줄: `nextStep?: NextStepDescriptor \| null` 필드 존재. 43번 줄: `NextStepDescriptorSchema.safeParse(nextStep)` 호출 확인 |
| M10 | i18n: 직접 문자열 하드코딩 금지, t() 호출만 사용 | PASS | 한국어/영어 하드코딩 사용자 표시 문자열 없음. 모든 텍스트는 `t('...')` 경유 |
| M11 | `CheckoutAction` import: `@equipment-management/schemas` SSOT | PASS | 6번 줄: `import type { CheckoutAction, NextStepDescriptor } from '@equipment-management/schemas'` |
| M12 | 단위 테스트 5개 통과 (terminal, availableToCurrentUser true/false, isPending disabled 케이스 포함) | PASS | `components/shared/__tests__/NextStepPanel.test.tsx` — 5개 테스트 전체 PASS 확인. 테스트 목록: terminal 배지, availableToCurrentUser=true 버튼+클릭, availableToCurrentUser=false actor hint, isPending disabled+aria-disabled, urgency=critical animate-pulse |

**PR-4 소계: 12/12 PASS**

---

## PR-6 Results — CheckoutStatusStepper next 상태 + CheckoutMiniProgress 확장

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` exit 0 | PASS | PR-4 M1과 공유. 동일 실행 결과 |
| M2 | `CheckoutStatusStepper`에 `dueAt?: string \| null` prop 추가 | PASS | 20번 줄: `dueAt?: string \| null` 선언됨 |
| M3 | `useCheckoutNextStep` 내부 호출로 `nextDescriptor` 획득 | PASS | 12번 줄 import, 80~84번 줄 컴포넌트 최상위에서 `useCheckoutNextStep({ status, purpose, dueAt })` 호출 확인. 변수명 `descriptor` (계약서의 `nextDescriptor`와 다르나 동일 역할) |
| M4 | next 노드: `aria-label="다음 단계: {stepLabel}"` | PASS | 148번 줄(모바일): `aria-label={isNext ? \`다음 단계: ${getStepLabel(status)}\` : undefined}`, 225번 줄(데스크톱) 동일 패턴 |
| M5 | `aria-current="step"` current 노드에만 (next 노드 중복 금지) | PASS | 147번 줄: `aria-current={isCurrent ? 'step' : undefined}`. `isNext` 분기에는 aria-current 없음. 데스크톱(224번 줄)도 동일 |
| M6 | `ELEVATION_TOKENS.surface.raised` Stepper 컨테이너 적용 | PASS | 11번 줄 import, 127번 줄: `className={cn('w-full', ELEVATION_TOKENS.surface.raised)}` |
| M7 | `CheckoutMiniProgress` urgency=critical aria-label: "기한 초과 — {stepName} ({n}/{total})" | PASS | 69번 줄: `` `기한 초과 — ${stepName} (${currentStepNumber}/${stepCount})` `` 정확히 일치 |
| M8 | 기존 `nextStepIndex?: number` prop 하위 호환 유지 (삭제 금지) | PASS | 18번 줄: `nextStepIndex?: number` 존재. 86번 줄: `resolvedNextStepIndex = nextStepIndex ?? descriptor.currentStepIndex` — 외부 prop 우선 사용 |
| M9 | 하드코딩 status 문자열 추가 금지 | PASS | git diff 및 코드 검토 결과 `=== 'overdue'` 등 리터럴 비교 없음. 모두 `CSVal.*` SSOT 경유 |

**PR-6 소계: 9/9 PASS**

---

## PR-8 Results — i18n empty.celebration 키 추가

| ID | Criterion | Verdict | Notes |
|----|-----------|---------|-------|
| P8-M1 | `apps/frontend/messages/ko/checkouts.json`에 `empty.celebration.title` 존재 | PASS | 92번 줄: `"title": "기한 초과 건 없음"` 확인 |
| P8-M2 | `apps/frontend/messages/en/checkouts.json`에 `empty.celebration.title` 존재 | PASS | 91번 줄: `"title": "No overdue checkouts"` 확인 |
| P8-M3 | `node scripts/check-i18n-keys.mjs --all` exits 0 | PASS | 실행 결과: ko/checkouts.json 107개 키 모두 존재, en/checkouts.json 107개 키 모두 존재. exit code 0 |

**PR-8 소계: 3/3 PASS**

---

## Summary

**결과: PASS**
Iteration: 1
Issues for fix loop: 없음 (전체 24개 MUST 기준 24/24 통과)

### 비고

- PR-4 M5: `aria-disabled={isPending}` (boolean) — React가 DOM 직렬화 시 `"true"` 문자열로 변환. 테스트에서 `toHaveAttribute('aria-disabled', 'true')` 통과 확인. 기술적으로 계약서 요구사항(aria-disabled="true") 충족.
- PR-6 M3: 계약서에 `nextDescriptor`라고 명시됐으나 실제 구현 변수명은 `descriptor`. 의미는 동일, 기능적 요구사항 충족.
- PR-8 M3: `check-i18n-keys.mjs`가 `empty.celebration.title` 키를 명시적으로 검증하지는 않으나 (emptyState.* 네임스페이스만 체크), 키 자체는 ko/en 양쪽 파일에 정확히 존재.
