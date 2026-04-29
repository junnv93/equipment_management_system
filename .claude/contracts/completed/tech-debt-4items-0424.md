# Contract: tech-debt-4items-0424

## Scope

4건의 tech-debt 수정 (Mode 1):

| # | 항목 | 액션 |
|---|------|------|
| ① | rejectReturn 스코프 순서 | 이미 수정 완료 → tracker 아카이브 |
| ② | submitConditionCheck FSM 리터럴 | 이미 수정 완료 → tracker 아카이브 |
| ③ | approvals-api.ts UASVal 하드코딩 3건 | 코드 수정 |
| ④ | useQuery isError 분기 누락 | 코드 수정 |

## Changed Files

- `apps/frontend/lib/api/approvals-api.ts`
- `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
- `apps/frontend/messages/ko/checkouts.json`
- `apps/frontend/messages/en/checkouts.json`
- `.claude/exec-plans/tech-debt-tracker.md` (① ② 아카이브, ③ ④ 제거)

## MUST Criteria

| # | Criterion | Verify Command |
|---|-----------|----------------|
| M1 | tsc --noEmit frontend PASS | `pnpm --filter frontend run tsc --noEmit` |
| M2 | approvals-api.ts L1142 `UASVal.PENDING_REVIEW` (raw string 없음) | `grep -n "'pending_review'" apps/frontend/lib/api/approvals-api.ts` → 0건 |
| M3 | approvals-api.ts L1165/1192 `UASVal.PENDING` (raw `'pending'` 없음) | `grep -n "status: 'pending'" apps/frontend/lib/api/approvals-api.ts` → 0건 |
| M4 | OutboundCheckoutsTab `isError`/`refetch` 구조분해 | `grep -n "isError\|refetch" apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx` |
| M5 | OutboundCheckoutsTab `<ErrorState` 렌더링 존재 | `grep -n "ErrorState" apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx` |
| M6 | InboundCheckoutsTab 3개 쿼리 모두 `isError` 구조분해 | `grep -c "isError" apps/frontend/app/\(dashboard\)/checkouts/tabs/InboundCheckoutsTab.tsx` → ≥3 |
| M7 | InboundCheckoutsTab `<ErrorState` 렌더링 3곳 | `grep -c "ErrorState" apps/frontend/app/\(dashboard\)/checkouts/tabs/InboundCheckoutsTab.tsx` → ≥3 |
| M8 | ko+en checkouts.json 에러 키 동기화 | `grep -n "fetchError\|sectionFetchError" apps/frontend/messages/ko/checkouts.json apps/frontend/messages/en/checkouts.json` |
| M9 | `any` 타입 미도입 | `grep -n ": any" apps/frontend/app/\(dashboard\)/checkouts/tabs/OutboundCheckoutsTab.tsx apps/frontend/app/\(dashboard\)/checkouts/tabs/InboundCheckoutsTab.tsx` → 0건 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | ErrorState onRetry prop에 refetch 바인딩 |
| S2 | isAnyError로 InboundCheckoutsTab 전체 빈 상태 조기반환 가드 |

## Success Definition

- M1~M9 모두 PASS
- ①② tech-debt 항목이 tech-debt-tracker-archive.md로 이동됨
- ③④ tech-debt 항목이 tech-debt-tracker.md Open 섹션에서 제거됨
