# Contract: loading-skeleton-pr19

## Scope
PR-19: Loading Skeleton + inline Error 컴포넌트

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `tsc --noEmit` 0 error | `pnpm --filter frontend exec tsc --noEmit` |
| M2 | `CHECKOUT_LOADING_SKELETON_TOKENS` 파일 존재 + index.ts re-export | `grep -n "CHECKOUT_LOADING_SKELETON_TOKENS" apps/frontend/lib/design-tokens/index.ts` |
| M3 | HeroKPISkeleton, NextStepPanelSkeleton, CheckoutGroupCardSkeleton 파일 존재 | `ls apps/frontend/components/checkouts/HeroKPI*.tsx apps/frontend/components/checkouts/NextStepPanel*.tsx apps/frontend/components/checkouts/CheckoutGroupCard*.tsx` |
| M4 | HeroKPIError, NextStepPanelError, WorkflowTimelineError 파일 존재 | `ls apps/frontend/components/checkouts/HeroKPIError.tsx apps/frontend/components/checkouts/NextStepPanelError.tsx apps/frontend/components/checkouts/WorkflowTimelineError.tsx` |
| M5 | Spinner 사용 없음 (animate-pulse만) | `grep -r 'spinner\|Spinner' apps/frontend/components/checkouts/ --include="*.tsx" \| grep -v CheckoutStatusBadge` → 0 hit |
| M6 | hex 하드코딩 없음 | `grep -r '#[0-9a-fA-F]\{3,6\}' apps/frontend/components/checkouts/HeroKPI*.tsx apps/frontend/components/checkouts/NextStepPanel*.tsx apps/frontend/components/checkouts/WorkflowTimelineError.tsx apps/frontend/components/checkouts/CheckoutGroupCard*.tsx` → 0 hit |
| M7 | ko + en i18n 4키 추가 | `grep '"heroKpi"\|"nextStepPanel"\|"workflowTimeline"\|"retry"' apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json` |
| M8 | WorkflowTimelineSkeleton 재구현 없음 (WorkflowTimeline.tsx에서 import) | `grep "WorkflowTimelineSkeleton" apps/frontend/components/checkouts/HeroKPISkeleton.tsx` → 0 hit (신규 파일에서 재정의 없음 확인) |
| M9 | Error 컴포넌트에 `role="alert"` + `aria-live` 존재 | `grep -l 'role="alert"' apps/frontend/components/checkouts/*Error.tsx` |
| M10 | motion-reduce:animate-none 존재 (토큰 파일 또는 skeleton .tsx) | `grep -r "motion-reduce:animate-none" apps/frontend/lib/design-tokens/components/checkout-loading-skeleton.ts apps/frontend/components/checkouts/HeroKPISkeleton.tsx apps/frontend/components/checkouts/NextStepPanelSkeleton.tsx apps/frontend/components/checkouts/CheckoutGroupCardSkeleton.tsx` 참고: Tailwind v4 자동감지 — .ts 파일도 JIT 스캔 대상 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | CheckoutListSkeleton.tsx 상단에 HeroKPISkeleton 추가 |
| S2 | CheckoutDetailClient.tsx NextStepPanel 영역에 Suspense 경계 추가 |
| S3 | Error 컴포넌트가 useTranslations로 i18n 문자열 사용 |

## Success Definition
M1~M10 모두 PASS → 완료
SHOULD 실패 시 루프 차단 없이 tech-debt 기록
