---
slug: tech-debt-5items-closure
iteration: 1
date: 2026-05-09
verdict: FAIL
---

# Evaluation: tech-debt-5items-closure

## MUST Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M-1 | `reviewDisposalSchema`가 `discriminatedUnion` 사용 (`grep -c` ≥ 2) | PASS | Count = 8 (approveDisposalSchema + reviewDisposalSchema 각 1 + JSDoc/comments 추가) — ≥ 2 충족 |
| M-2 | 수동 min-check 제거: `REJECTION_REASON_MIN_LENGTH` 가 reviewDisposal 메서드 본체에 없음 (`awk` range = 0) | PASS | awk range grep = 0. service line 175 주석만 존재 |
| M-3 | backend tsc 0 errors | PASS | `npx tsc --noEmit` 출력 없음 (0 errors) |
| M-4 | backend tests PASS | PASS | 136 suites, 1684 tests all PASS (pnpm filter 재실행 확인) |
| M-5 | `MAINTENANCE_TIMELINE_TOKENS` exported from equipment-timeline.ts | PASS | `grep -c` = 1 |
| M-6 | MaintenanceHistoryTab.tsx에 `text-brand-warning` 인라인 리터럴 없음 | PASS | `grep -c` = 0 |
| M-7 | MaintenanceHistoryTab.tsx에 `text-brand-info` 직접 className 없음 | **FAIL** | `grep -c` = 1. Line 317: `<Wrench className="h-5 w-5 text-brand-info" />` — main return block (history.length > 0)에서 인라인 리터럴 사용. MAINTENANCE_TIMELINE_TOKENS.headerIcon(`'h-5 w-5 text-brand-info'`)로 교체되지 않음 |
| M-8 | MaintenanceHistoryTab.tsx에 `bg-brand-ok` 직접 className 없음 | PASS | `grep -c` = 0 |
| M-9 | MaintenanceHistoryTab.tsx가 MAINTENANCE_TIMELINE_TOKENS 사용 (≥ 3) | PASS | import + 3 usages = count 4 (errorIcon line 279, headerIcon line 293, node line 330) |
| M-10 | `getApprovalsInvalidationKeys` 헬퍼 exported | PASS | `grep -c` = 1 |
| M-11 | item-mutations 훅이 헬퍼 import | PASS | `grep -c` = 3 |
| M-12 | bulk-mutations 훅이 헬퍼 import | PASS | `grep -c` = 3 |
| M-13 | `use-approval-row-transitions.ts`가 useSafeTimeout 사용 | PASS | `grep -c` = 3 (import + 2 callsites) |
| M-14 | `pendingTimers` 수동 ref 패턴 없음 | PASS | `grep -c` = 0 |
| M-15 | `filtersKey`가 `useMemo` 경유 | PASS | Line 145: `const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);` |
| M-16 | frontend tsc 0 errors | PASS | Confirmed via frontend build (no TS errors) |
| M-17 | frontend build PASS | PASS | `✓ Compiled successfully in 22.4s` |

## SHOULD Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S-1 | backend E2E tests PASS (disposal 경로 포함) | NOT VERIFIED | E2E tests require running DB/server — not run in this evaluation |
| S-2 | `ReviewDisposalDto` Swagger 어노테이션이 discriminatedUnion 분기 반영 | PARTIAL | `@ApiProperty` description에 "승인 시 선택(max 500자), 반려 시 필수(min 10자)" 텍스트 기술됨. 그러나 `minLength` 어노테이션 속성 없음 — approve 분기에만 `required: false, maxLength` 명시. reject 분기 전용 minLength constraint가 Swagger schema에 기계 읽기 가능 형태로 반영되지 않음 |
| S-3 | `MAINTENANCE_TIMELINE_TOKENS`이 `design-tokens/index.ts` re-export에 추가됨 | PASS | Line 303 in index.ts: `MAINTENANCE_TIMELINE_TOKENS,` |

## Build Results

- Backend tsc: PASS
- Frontend build: PASS (✓ Compiled successfully in 22.4s)
- Backend tests: PASS (136 suites, 1684 tests)

## Issues Found (FAIL criteria only)

### M-7 FAIL — `text-brand-info` inline literal not fully removed

**File**: `apps/frontend/components/equipment/MaintenanceHistoryTab.tsx`
**Line 317**:
```tsx
<Wrench className="h-5 w-5 text-brand-info" />
```

This is in the **main return block** (the `history.length > 0` render path, inside `history.map()`). The token `MAINTENANCE_TIMELINE_TOKENS.headerIcon` is defined as `'h-5 w-5 text-brand-info'` and is correctly used at line 293 (empty state render path) and line 279 (error state), but **line 317 was not updated** — it still uses the direct brand literal.

The contract criterion `grep -c "text-brand-info" ... = 0` is unambiguous. The count is 1, not 0. This is a FAIL.

## Verdict

**FAIL** — M-7 fails. `text-brand-info` inline literal remains at line 317 of `MaintenanceHistoryTab.tsx` in the main history-list render path. All other 16 MUST criteria pass.

---
iteration: 2
date: 2026-05-09
verdict: PASS
---

## Iteration 2

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M-1 | `reviewDisposalSchema`가 `discriminatedUnion` 사용 (`grep -c` ≥ 2) | PASS | Count = 8 — unchanged from iter 1 |
| M-2 | 수동 min-check 제거: `REJECTION_REASON_MIN_LENGTH` 가 reviewDisposal 메서드 본체에 없음 (`awk` range = 0) | PASS | Count = 0 — unchanged from iter 1 |
| M-3 | backend tsc 0 errors | PASS | `npx tsc --noEmit` 출력 없음 (0 errors) |
| M-4 | backend tests PASS | PASS | 136 suites, 1684 tests all PASS |
| M-5 | `MAINTENANCE_TIMELINE_TOKENS` exported from equipment-timeline.ts | PASS | `grep -c` = 1 |
| M-6 | MaintenanceHistoryTab.tsx에 `text-brand-warning` 인라인 리터럴 없음 | PASS | `grep -c` = 0 |
| M-7 | MaintenanceHistoryTab.tsx에 `text-brand-info` 직접 className 없음 | **PASS** | `grep -c` = 0. Fix applied: inline `<Wrench className="h-5 w-5 text-brand-info" />` at former line 317 replaced with token reference. |
| M-8 | MaintenanceHistoryTab.tsx에 `bg-brand-ok` 직접 className 없음 | PASS | `grep -c` = 0 |
| M-9 | MaintenanceHistoryTab.tsx가 MAINTENANCE_TIMELINE_TOKENS 사용 (≥ 3) | PASS | Count = 5 (import + usages ≥ 3) |
| M-10 | `getApprovalsInvalidationKeys` 헬퍼 exported | PASS | `grep -c` = 1 |
| M-11 | item-mutations 훅이 헬퍼 import | PASS | `grep -c` = 3 |
| M-12 | bulk-mutations 훅이 헬퍼 import | PASS | `grep -c` = 3 |
| M-13 | `use-approval-row-transitions.ts`가 useSafeTimeout 사용 | PASS | `grep -c` = 3 |
| M-14 | `pendingTimers` 수동 ref 패턴 없음 | PASS | `grep -c` = 0 |
| M-15 | `filtersKey`가 `useMemo` 경유 | PASS | Line 145: `const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);` confirmed. useMemo count=6, JSON.stringify count=1 |
| M-16 | frontend tsc 0 errors | PASS | `npx tsc --noEmit` 출력 없음 (0 errors) |
| M-17 | frontend build PASS | PASS | `✓ Compiled successfully in 14.4s` |

## Verdict (Iteration 2)

**PASS** — All 17 MUST criteria pass. M-7 fix confirmed: `grep -c "text-brand-info" MaintenanceHistoryTab.tsx` = 0. Backend 136 suites / 1684 tests all PASS. Frontend tsc 0 errors. Frontend build compiled successfully.
