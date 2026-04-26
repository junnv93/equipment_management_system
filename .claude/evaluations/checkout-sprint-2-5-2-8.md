# Evaluation Report: checkout-sprint-2-5-2-8

Date: 2026-04-26
Iteration: 1

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M-1 | SECTION_RHYTHM_TOKENS wrapper + mb removal | PASS | OutboundCheckoutsTab.tsx:405 `<div className={SECTION_RHYTHM_TOKENS.tight}>` 루트 래퍼 확인; mb-4/mb-5 grep 결과 0건; CheckoutListTabs.tsx mb-4 grep 결과 0건 |
| M-2 | FOCUS_TOKENS.ringCurrent token | PASS | semantic.ts:336 top-level `ringCurrent: 'ring-2 ring-brand-info ring-offset-2'` 확인 (classes 내부 아님); checkout.ts:327 `FOCUS_TOKENS.ringCurrent` 참조 확인; checkout.ts에 raw ring string 0건 |
| M-3 | pl-4 absorbed into container | PASS | checkout.ts:725 `container: 'space-y-3 pl-4'` 확인; InboundCheckoutsTab.tsx `'pl-4'` 리터럴 0건 |
| M-4 | 4 deprecated tokens removed | PASS | MINI_PROGRESS_STEPS, CHECKOUT_STATS_CHECKED_OUT, CHECKOUT_STATS_RETURNED, `inProgress` 키 모두 checkout.ts/index.ts에서 부재 확인; 소비처(components/app) grep 0건 |
| M-5 | tsc --noEmit exit 0 | PASS | `pnpm --filter frontend exec tsc --noEmit` exit code 0 |
| M-6 | pnpm lint exit 0 | PASS | `pnpm lint` exit code 0; eslint.config.mjs:103 `files: ['lib/design-tokens/**/*.ts']` 스코프 + `ignores: ['lib/design-tokens/index.ts']` + `@typescript-eslint/no-deprecated: 'error'` 신설 확인 |

## Overall Verdict

FAIL

## Issues Found

### CRITICAL — MUST NOT 위반: RENTAL_FLOW_INLINE_TOKENS 삭제

**계약 조항**: `MUST NOT: RENTAL_FLOW_INLINE_TOKENS 삭제/변경 (Sprint 4 영역)`

**위반 근거**:
1. `lib/design-tokens/components/checkout.ts`: `RENTAL_FLOW_INLINE_TOKENS` 전체 삭제 (`git diff HEAD` 확인)
   - HEAD에는 line 311 `export const RENTAL_FLOW_INLINE_TOKENS = { ... }` 존재
   - 워킹트리에는 완전 부재 (`grep -rn` 결과 0건)
2. `lib/design-tokens/index.ts`: `RENTAL_FLOW_INLINE_TOKENS` re-export 삭제 (`git diff` 확인)
3. `components/checkouts/CheckoutGroupCard.tsx`: 계약 영향 파일 7개 외 파일이며, `RentalFlowInline` 컴포넌트와 `RENTAL_FLOW_INLINE_TOKENS` import 전체 제거 (271줄 변경). 계약 MUST NOT "비즈니스 로직, props, 핸들러 수정 금지" 위반 — 인라인 승인 mutation, `useCheckoutGroupDescriptors` 도입, `NextStepPanel` 교체 등 비즈니스 로직 변경 포함

**왜 FAIL인가**: tsc가 pass인 이유는 소비처(`CheckoutGroupCard.tsx`)도 같이 수정했기 때문이다. 즉, 컴파일은 통과하지만 계약이 Sprint 4로 이월을 명시한 작업을 Sprint 2 범위에서 선제적으로 처리한 것이다. 이는 "요청 범위 초과" 위반이며 Sprint 4 작업 계획의 가정을 무효화한다.

### 부차 위반 — 계약 영향 파일 범위 초과

계약이 명시한 영향 파일은 7개이나 실제 변경된 파일은 39개. 계약 외 파일 중 주요 위반:
- `components/checkouts/CheckoutGroupCard.tsx` (비즈니스 로직 대규모 변경)
- `lib/features/checkout-flags.ts` (계약 외)
- `lib/api/checkout-api.ts`, `lib/api/approvals-api.ts` (계약 외 API 변경)
- `components/approvals/ApprovalsClient.tsx`, `components/non-conformances/NCDetailClient.tsx` 등 다수

단, 이들 중 상당수는 이전 스프린트의 누적 변경일 수 있어 sprint 2.5~2.8 단독 귀책으로 단정하기 어려움. RENTAL_FLOW_INLINE_TOKENS 삭제는 `git diff HEAD -- checkout.ts` 결과에서 명확히 이번 변경에 포함됨.

## SHOULD Items (non-blocking)

- **S-1 (미처리)**: CheckoutAlertBanners, HeroKPISkeleton, HeroKPIError의 mb-* 처리 — Sprint 3 이월 예정 (정상)
- **S-2 (충족)**: `ringCurrent` JSDoc에 "키보드 포커스와 무관", "focus-visible: prefix 없음 — classes.* 와 오남용 주의" 명시됨 (semantic.ts:331-335). 계약 요구 수준 충족
- **S-3 (충족)**: eslint.config.mjs typed linting이 design-tokens 스코프로만 한정됨 (성능 점진 확장 전략 준수)
