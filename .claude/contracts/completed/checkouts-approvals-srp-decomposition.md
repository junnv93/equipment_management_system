---
slug: checkouts-approvals-srp-decomposition
mode: 2
status: completed-partial
domain: frontend / dashboard / checkouts / approvals / SRP / harness
date: 2026-05-06
verdict: PARTIAL_PASS (Phase A.1 + A.4 + C.3 + C.4) — Phase A.2/A.3 + B + C.1/C.2 deferred to follow-up sprints
commits:
  - 90575326 — feat(dashboard): SystemHealthCard + CheckoutGroupCard mock (Phase A.1 hook 통합 일부)
  - bf812815 — feat(checkouts): close 7 tech-debt items (Phase A.1+A.4+C.3+C.4 main closure)
preceded_by:
  - bulk-selection-tabs-integration
related:
  - tab-component-split-sprint (tech-debt-tracker.md:58 — partial closure)
  - checkoutgroupcard-effective-role-and-dday-ssot (tech-debt-tracker.md:59 — closure)
  - outbound-direction-literal-ssot (tech-debt-tracker.md:60 — closure)
follow_up_sprints:
  - presentation-component-extraction (Phase A.2 + A.3 + C.1 + C.2)
  - approvals-mutation-decomposition (Phase B 5건)
---

# Sprint — Checkouts/Approvals SRP Decomposition (3 components × 1 contract)

## 배경

3개 거대 컴포넌트가 SRP를 위반하고 5+ 책임을 단일 컴포넌트에 집중:

| 컴포넌트 | 라인 (committed baseline) | 위반 책임 |
|---|---|---|
| `OutboundCheckoutsTab.tsx` | 676 | list query + bulk mutation 인라인 + pagination JSX 109줄 + stats grid JSX 153줄 |
| `ApprovalsClient.tsx` | 701 | 4 mutation 인라인 + enter-exit animation state machine + 2 comment dialog JSX |
| `CheckoutGroupCard.tsx` | 598 | equipment row JSX 158줄 + group aggregate 파생 + 레거시 SSOT 위반(role/dday) |

선행: 2026-05-05 bulk-selection-tabs-integration 시니어 자기검토 #2 라운드 식별 → tech-debt-tracker.md:58 등록 → 본 sprint가 closure.

## 가용한 사전 자산 (untracked, Phase A에서 채택)

- `apps/frontend/hooks/use-checkouts-list-query.ts` (이미 존재, 미연결)
- `apps/frontend/hooks/use-checkout-bulk-mutations.ts` (이미 존재, 미연결)

## SSOT 출처 (재사용)

`@/hooks/use-optimistic-mutation`, `@/hooks/use-bulk-selection`, `@/lib/checkouts/group-selection`, `@/lib/api/query-config`, `@/lib/api/cache-invalidation`, `@/lib/analytics/track`, `@/lib/design-tokens/*`, `@/lib/utils/checkout-filter-utils`, `@/hooks/use-checkout-card-mutations`, `@/hooks/use-effective-role`, `@/lib/utils/dday-utils`, `@equipment-management/schemas`, `@equipment-management/shared-constants`.

## MUST (실패 시 루프 재진입)

### A. OutboundCheckoutsTab decomposition

- **M-A1** 인라인 `useQuery(` 0건 in OutboundCheckoutsTab.tsx
- **M-A2** 인라인 `useOptimisticMutation(` 0건 in OutboundCheckoutsTab.tsx
- **M-A3** `useCheckoutsListQuery` + `useCheckoutBulkMutations` import 각 1건
- **M-A4** Pagination 분리: `CheckoutListPagination.tsx` 신설, OutboundCheckoutsTab의 `CHECKOUT_PAGINATION_TOKENS` 직접 사용 0건
- **M-A5** Stats grid 분리: `OutboundStatsGrid.tsx` 신설, `useStatCards`/`HeroKPI`/`SparklineMini` 사용 0건 in OutboundCheckoutsTab
- **M-A6** OutboundCheckoutsTab.tsx 라인 수 ≤ 280
- **M-A7** outbound direction SSOT — `direction: 'outbound'` 리터럴 0건 (CDVal.OUTBOUND 경유)

### B. ApprovalsClient decomposition

- **M-B1** `use-approvals-item-mutations.ts` 신설 (approve + reject)
- **M-B2** `use-approvals-bulk-mutations.ts` 신설 (comment-required 분기 + partial-failure)
- **M-B3** `use-approval-row-transitions.ts` 신설 (processingIds/exitingIds setTimeout)
- **M-B4** `ApprovalCommentDialog.tsx` 신설 (mode='single'|'bulk'), ApprovalsClient의 `Dialog\b` 사용 ≤ 1
- **M-B5** ApprovalsClient.tsx에서 `useOptimisticMutation(` 0건
- **M-B6** ApprovalsClient.tsx 라인 수 ≤ 320
- **M-B7** 신규 mutation hook 4개에서 `setQueryData` 0건

### C. CheckoutGroupCard decomposition

- **M-C1** `CheckoutEquipmentRow.tsx` 신설 (`React.memo`), CheckoutGroupCard의 `role="gridcell"` 0건
- **M-C2** `use-checkout-group-aggregates.ts` 신설
- **M-C3** effectiveRole SSOT — `session?.user?.role` 직접 참조 0건 (useEffectiveRole 경유)
- **M-C4** dday SSOT — 로컬 `calculateDaysRemaining` 정의 0건 (`@/lib/utils/dday-utils` import)
- **M-C5** CheckoutGroupCard.tsx 라인 수 ≤ 320

### D. Cross-cutting

- **M-D1** `tsc --noEmit` exit 0
- **M-D2** frontend lint exit 0
- **M-D3** frontend unit test 회귀 0 (BulkActionBar.test, CheckoutBulkActionBar.test, CheckoutGroupCard.test, SystemHealthCard.test 모두 PASS)
- **M-D4** e2e mock spec 회귀 0 (outbound-bulk-action, group-indeterminate, wf-ap02-approvals-bulk-reject)
- **M-D5** 신규 hook unit spec ≥ 4건 PASS
- **M-D6** 신규 컴포넌트 unit spec ≥ 2건 PASS
- **M-D7** 신규 hook + 컴포넌트에서 `setQueryData` 0건
- **M-D8** analytics SSOT 보존 — `track('checkout.bulk_approve'`/`bulk_reject'` 호출 위치 useCheckoutBulkMutations 내부 1회씩만
- **M-D9** queryKeys SSOT — 신규 hook 내 `queryKey: [` 리터럴 array 0건 (모두 `queryKeys.X.Y(...)` 경유)
- **M-D10** prop drilling depth — 신규 컴포넌트 props ≤ 12개
- **M-D11** React 19 IME 가드 — CheckoutEquipmentRow에 `isComposing` 가드
- **M-D12** useEffect skip-first 패턴 — 신규 useEffect deps 의도 주석
- **M-D13** verify-frontend-state Step 35 PASS (setQueryData 0건)
- **M-D14** baseline 격리 — 본 sprint commit에 다른 세션 변경 미혼입 (`git diff --stat`으로 검증)
- **M-D15** i18n parity — 신규 키 도입 시 ko/en 동시 (목표: 0 신규 키)

## SHOULD (tech-debt 등록, 루프 차단 X)

- **S-1** InboundCheckoutsTab BFF 분해 (별도 sprint)
- **S-2** ApprovalsClient KPI strip + sidebar 추가 분해
- **S-3** OutboundStatsGrid React Profiler P95 < 16ms
- **S-4** CheckoutEquipmentRow react-virtual 검토 (100+ row)
- **S-5** axe-core scan 4 신규 컴포넌트 0 violation
- **S-6** Storybook 등록
- **S-7/S-8** useCheckoutsListQuery + useCheckoutBulkMutations 직접 spec

## 작업

### Generator
- Phase 0 진단 (read-only)
- Phase A (OutboundCheckoutsTab) → commit A
- Phase B (ApprovalsClient) → commit B
- Phase C (CheckoutGroupCard) → commit C
- Phase D (verify + spec + tech-debt closure) → commit D

### Evaluator
- 각 MUST grep 검증
- SHOULD 미통과 → tech-debt-tracker
- 자기검토 라운드 ≥ 2 (#1 표면 / #2 architecture 갭)

## 종료 조건
- M 전체 PASS → main 직접 커밋 (4 commit)
- M 일부 FAIL → phase rollback 재시도
- SHOULD 미통과 → tech-debt-tracker 등록 후 통과
