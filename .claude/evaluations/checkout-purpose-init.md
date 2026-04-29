# Evaluation: checkout-purpose-init

Date: 2026-04-29
Reviewer: Evaluator Agent (code-reviewer)
File: apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx

## Overall Verdict: PASS

| # | Criterion | Result | Notes |
|---|-----------|--------|-------|
| M1 | cross-team purpose='rental' 초기화 | PASS | Lines 99-107 |
| M2 | own-team purpose='calibration' 초기화 | PASS | 묵시적 else + 3가지 guard |
| M3 | selectedSite/selectedTeamId 동기 초기화 | PASS | Lines 112-125 |
| M4 | Effect 2 fallback 유지 | PASS | Lines 147-161 intact |
| M5 | TypeScript 타입 안전성 | PASS | Equipment import + optional chaining |
| M6 | SSOT 준수 | PASS | 조건 의미 동일 |
| M7 | render phase getQueryData 안전성 | PASS | 동기 캐시 read, side effect 없음 |

Hook order: queryClient(L82), user(L83) → useState(L99, L112, L119) 순서 올바름.
