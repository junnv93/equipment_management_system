# Evaluation: 78-6 PageHeader onboardingHint + 프리미엄 테이블

## Verdict: FAIL

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | tsc 0 errors | PASS | `pnpm --filter frontend exec tsc --noEmit` → no output (0 errors) |
| M2 | OnboardingHint 인터페이스가 PageHeader.tsx에서 export됨 | PASS | `apps/frontend/components/shared/PageHeader.tsx:17: export interface OnboardingHint {` |
| M3 | useOnboardingHint 훅 존재 | PASS | `apps/frontend/hooks/use-onboarding-hint.ts` 파일 존재 확인 |
| M4 | SSR-safe — useState<boolean\|null>(null) 패턴 사용 | PASS | `use-onboarding-hint.ts:14: const [dismissed, setDismissed] = useState<boolean \| null>(null);` |
| M5 | PAGE_HEADER_ONBOARDING_TOKENS이 page-layout.ts에 export됨 | PASS | `page-layout.ts:170: export const PAGE_HEADER_ONBOARDING_TOKENS = { ... }` |
| M6 | PREMIUM_TABLE_TOKENS이 page-layout.ts에 export됨 | PASS | `page-layout.ts:188: export const PREMIUM_TABLE_TOKENS = { ... }` |
| M7 | InboundCheckoutsTab에서 PREMIUM_TABLE_TOKENS 사용 (stripe + stickyHeader + importantCol 3가지) | PASS | stripe(313), stickyHeader(301-306), importantCol(316) 3가지 모두 확인 |
| M8 | CheckoutsContent.tsx에서 onboardingHint prop이 PageHeader에 전달됨 | PASS | `CheckoutsContent.tsx:230: onboardingHint={{ id: 'checkouts-first-visit', ... }}` |
| M9 | 변경 파일 ≤ 7개 (git diff --name-only HEAD) | **FAIL** | 변경 파일 **13개** — 허용 한도(7개)의 약 2배 초과 |

## SHOULD Criteria

해당 없음 — 제공된 계약에 SHOULD 기준 없음.

## Issues Found

### [BLOCKING] M9 변경 파일 수 초과

- **기준**: ≤ 7개
- **실제**: 13개
- **초과분 목록** (7개 초과):

```
.claude/skills/harness/references/example-prompts.md   ← 하니스 참조 파일 (범위 외)
apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx
apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx
apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx
apps/frontend/components/checkouts/CheckoutGroupCard.tsx
apps/frontend/components/checkouts/CheckoutMiniProgress.tsx
apps/frontend/components/checkouts/CheckoutStatusStepper.tsx
apps/frontend/components/shared/PageHeader.tsx
apps/frontend/lib/design-tokens/components/checkout.ts
apps/frontend/lib/design-tokens/components/page-layout.ts
apps/frontend/lib/design-tokens/index.ts
apps/frontend/messages/en/checkouts.json
apps/frontend/messages/ko/checkouts.json
```

핵심 기능(M2~M8) 구현에 필요한 최소 파일은 다음 5~6개로 추정:
- `PageHeader.tsx` (M2)
- `use-onboarding-hint.ts` (M3/M4)
- `page-layout.ts` (M5/M6)
- `design-tokens/index.ts` (re-export)
- `InboundCheckoutsTab.tsx` (M7)
- `CheckoutsContent.tsx` (M8)

실제로는 `OutboundCheckoutsTab.tsx`, `CheckoutGroupCard.tsx`, `CheckoutMiniProgress.tsx`, `CheckoutStatusStepper.tsx`, `checkout.ts`, `messages/en/*.json`, `messages/ko/*.json`, `example-prompts.md` 등 **7개 추가 파일**이 범위를 벗어나 변경됨.

이는 BEHAVIORAL GUIDELINES의 "수술적 변경" 원칙 위반이기도 하며, M9 MUST 기준을 충족하지 못함.
