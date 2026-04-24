# Evaluation Report: tech-debt-4items-0424

**Date**: 2026-04-24
**Iteration**: 1
**Evaluator**: sonnet

## Verdict: FAIL

## MUST Criteria Results

| Criterion | Command Result | Verdict |
|-----------|---------------|---------|
| M1 tsc | `pnpm --filter frontend exec tsc --noEmit` → 0 errors (no output) | PASS |
| M2 no raw 'pending_review' | `grep -n "'pending_review'" approvals-api.ts` → 0건 | PASS |
| M3 no raw `status: 'pending'` | `grep -n "status: 'pending'" approvals-api.ts` → **3건** (L486, L488, L650) | FAIL |
| M4 OutboundCheckoutsTab isError/refetch | L160: `isError: checkoutsError`, L161: `refetch: refetchCheckouts`, L367: `void refetchCheckouts()` — 구조분해 + 바인딩 확인 | PASS |
| M5 OutboundCheckoutsTab ErrorState | L17: import, L365: `<ErrorState` 렌더링 존재 | PASS |
| M6 InboundCheckoutsTab isError count ≥3 | `grep -c "isError" InboundCheckoutsTab.tsx` → **3** | PASS |
| M7 InboundCheckoutsTab ErrorState count ≥3 | `grep -c "ErrorState" InboundCheckoutsTab.tsx` → **5** (import 1 + 렌더링 4) | PASS |
| M8 ko+en i18n error keys | ko/en 양쪽: `sectionFetchError`(en L430, ko L433), `fetchError`(en L449, ko L452) — 4건 동기화 확인 | PASS |
| M9 no `any` type | OutboundCheckoutsTab + InboundCheckoutsTab 양쪽 0건 | PASS |

## SHOULD Criteria

| Criterion | Status |
|-----------|--------|
| S1 ErrorState onRetry prop에 refetch 바인딩 | DONE — Outbound L367: `onRetry={() => void refetchCheckouts()}`, Inbound L256/L308/L421: 각 섹션 refetch 바인딩 |
| S2 isAnyError InboundCheckoutsTab 조기반환 가드 | DONE — L163: `const isAnyError = inboundCheckoutsError \|\| rentalImportsError \|\| internalSharedImportsError`, L212: `!isAnyError &&` 조기반환 가드 |

## Issues Found

### MUST Failures

**M3 FAIL**: `grep -n "status: 'pending'" apps/frontend/lib/api/approvals-api.ts` 가 **3건**을 반환함. 계약의 verify 명령은 0건을 기대.

- L486: `equipmentImportApi.getList({ status: 'pending', sourceType: 'rental' })`
- L488: `equipmentImportApi.getList({ status: 'pending', sourceType: 'internal_shared' })`
- L650: `equipmentImportApi.getList({ status: 'pending', sourceType: 'rental' })` (deprecated 메서드)

**기술적 분석**: 이 3건은 `UnifiedApprovalStatus(UAS)` 도메인이 아닌 `EquipmentImport` 도메인의 status 파라미터 — `equipmentImportApi.getList()` 호출부. 계약이 겨냥한 UAS 하드코딩(L1142/L1165/L1192)은 모두 `UASVal.PENDING_REVIEW` / `UASVal.PENDING`으로 교체 완료됨. 그러나 **계약 M3의 verify 명령이 "→ 0건"을 성공 기준으로 명시**했으므로, 실측값 3건은 FAIL 판정.

추가로: L448(`statuses: 'pending'`) 및 L450(`statuses: 'pending'`)도 존재하나 이는 `checkoutApi.getCheckouts()` 호출부이고 `status:` 형태가 아닌 `statuses:` 형태라 M3 grep 패턴에 포함되지 않음.

### SHOULD Gaps

없음 — S1, S2 모두 구현 완료.

## Tracker Housekeeping 확인

- ① `rejectReturn` 스코프 순서: archive에 `[PR-2]`로 완료 처리 ✅
- ② `submitConditionCheck` FSM SSOT: archive L360에서 완료 처리 (`[2026-04-22 p1p3]`) ✅
- ③ `approvals-api UASVal 하드코딩`: archive L361에서 완료 처리 (`2026-04-24 완료`) ✅, tracker open 섹션에서 제거됨 ✅
- ④ `isError 분기 누락`: archive L362에서 완료 처리 (`2026-04-24 완료`) ✅, tracker open 섹션에서 제거됨 ✅

## Summary

M3 기준 1개 FAIL. 계약 verify 명령 `grep -n "status: 'pending'" approvals-api.ts`가 3건을 반환하며, 계약이 명시한 "→ 0건" 조건을 충족하지 못함. 해당 3건은 `equipmentImportApi`(다른 도메인)에 대한 호출이므로 UAS 하드코딩 제거 의도 자체는 달성됐으나, M3 criterion의 grep 범위가 더 넓어 false-positive를 포함한다. 나머지 M1·M2·M4~M9는 모두 PASS, SHOULD S1·S2도 구현 완료.

---

## Iteration 2 (M3 Fix Re-verification)

| Criterion | Result | Verdict |
|-----------|--------|---------|
| M1 tsc | `pnpm --filter frontend exec tsc --noEmit` → 0 errors (no output) | PASS |
| M3 no raw pending | `grep -n "status: 'pending'" approvals-api.ts` → **0건** | PASS |
| EIStVal import | L27: `EquipmentImportStatusValues as EIStVal,` 확인. L487/L489/L651에서 `EIStVal.PENDING` 사용 | confirmed |

**Overall Verdict: PASS** (M1~M9 전체 통과, S1·S2 구현 완료)
