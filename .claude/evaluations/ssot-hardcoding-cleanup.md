# Evaluation Report: ssot-hardcoding-cleanup

**Date**: 2026-04-14
**Iteration**: 1

## Verdict: FAIL

---

## MUST 기준

| Criterion | Result | Notes |
|-----------|--------|-------|
| M1: backend tsc exit 0 | **FAIL** | `error TS2724: '"@equipment-management/shared-constants"' has no exported member named 'HISTORY_CARD_QUERY_LIMITS'. Did you mean 'HISTORY_CARD_QUERY_LIMIT'?` — `history-card.service.ts:25` |
| M2: frontend tsc exit 0 | PASS | exit 0 확인 |
| M3: shared-constants exports 3 신규 상수 | **FAIL** | `index.ts:159`에서 `HISTORY_CARD_QUERY_LIMIT` (단수형, 구형)만 export. `HISTORY_CARD_QUERY_LIMITS` (복수형, 신규)는 export 누락. `EXPORT_QUERY_LIMITS`와 `SIGNATURE_UPLOAD_LIMITS`는 정상 export |
| M4: backend test 671/671 PASS | PASS | 671 passed, 50 suites |
| M5: NEXT_PUBLIC_API_URL → 0 hit | PASS | error-reporter.ts 0 hit 확인 |
| M6: private static readonly SIGNATURE → 0 hit | PASS | users.controller.ts 0 hit 확인 |
| M7: Promise<unknown> → 0 hit | PASS | audit.controller.ts 0 hit 확인 |
| M8: toApiFilters 여전히 존재 (하위 호환) | **FAIL** | `software-filter-utils.ts`에 `toApiFilters` 함수 자체가 없음. 0 hit. 계약 요구사항(하위 호환 유지)을 충족하지 못함 |
| M9: convertFiltersToApiParams in software-filter-utils.ts | PASS | line 73에 정의 확인 |
| M10: convertFiltersToApiParams in reports-filter-utils.ts | PASS | line 169에 정의 확인 |

---

## SHOULD 기준

| Criterion | Result | Notes |
|-----------|--------|-------|
| S1: 신규 상수에 JSDoc 주석 포함 | PASS | `HISTORY_CARD_QUERY_LIMITS`, `EXPORT_QUERY_LIMITS`, `SIGNATURE_UPLOAD_LIMITS` 모두 블록 JSDoc 및 인라인 `/** ... */` 주석 포함 |
| S2: toApiFilters deprecated 주석 + convertFiltersToApiParams 위임 구현 | FAIL | `toApiFilters` 함수 자체가 존재하지 않음. S2 이전에 M8부터 실패 |

---

## Issues Found

### Issue 1 (CRITICAL — M1/M3 FAIL)
**파일**: `packages/shared-constants/src/index.ts:159`

`HISTORY_CARD_QUERY_LIMITS` (복수형, 신규 상수)가 export 목록에 없음.
현재 index.ts line 159:
```
HISTORY_CARD_QUERY_LIMIT,   ← 단수형(구형 상수)만 export
```
`HISTORY_CARD_QUERY_LIMITS`가 누락되어 `history-card.service.ts`에서 import 시 TypeScript 에러 발생.

실제 tsc 에러:
```
src/modules/equipment/services/history-card.service.ts(25,3): error TS2724:
'"@equipment-management/shared-constants"' has no exported member named
'HISTORY_CARD_QUERY_LIMITS'. Did you mean 'HISTORY_CARD_QUERY_LIMIT'?
```

**수정 필요**: `index.ts`의 business-rules export 블록에 `HISTORY_CARD_QUERY_LIMITS` 추가.

---

### Issue 2 (CRITICAL — M8 FAIL)
**파일**: `apps/frontend/lib/utils/software-filter-utils.ts`

계약 M8 기준: `toApiFilters`가 여전히 존재해야 함 (하위 호환 유지).
그러나 `toApiFilters` 함수가 파일에 존재하지 않음. 이 함수를 참조하던 소비처가 있다면 런타임 에러 가능성 있음.

계약 요건: `grep "toApiFilters" apps/frontend/lib/utils/software-filter-utils.ts` → 여전히 존재해야 함.
실제: 0 hit.

`toApiFilters`가 원래부터 없었던 것인지, 이번 변경으로 제거된 것인지 확인 필요.
이 함수의 소비처가 없다면 M8 기준 자체가 stale일 가능성 있음.

---

### Issue 3 (경미 — 잠재적 혼동)
**파일**: `packages/shared-constants/src/business-rules.ts:84-87`, `:156-162`

동일 파일에 두 가지 유사한 상수가 공존:
- `HISTORY_CARD_QUERY_LIMITS` (복수형, 객체) — line 84-87: `{ SECTION_ITEMS: 50 }`
- `HISTORY_CARD_QUERY_LIMIT` (단수형, 스칼라) — line 162: `= 50`

단수형 구형 상수(`HISTORY_CARD_QUERY_LIMIT`)는 현재 index.ts에서만 export되고 있으며, 실제 사용처 확인 필요. 두 상수가 동시에 존재하면 혼동 가능성 있음.

---

## Pre-existing Items (이미 완료 상태였던 항목)

| 항목 | 상태 | 비고 |
|------|------|------|
| `users.controller.ts` — SIGNATURE_UPLOAD_LIMITS 사용 | 이미 완료 | `SIGNATURE_UPLOAD_LIMITS` import 및 `.MAX_SIZE_BYTES`, `.ALLOWED_MIME_TYPES` 정상 사용 확인 (line 52, 217, 223) |
| `audit.controller.ts` — Promise<unknown> 수정 | 이미 완료 | 0 hit 확인, 구체적 반환 타입으로 이미 교체된 상태 |

---

## 수정 지침

1. `packages/shared-constants/src/index.ts` business-rules export 블록에 `HISTORY_CARD_QUERY_LIMITS` 추가:
   ```typescript
   HISTORY_CARD_QUERY_LIMITS,  // ← 추가 필요
   HISTORY_CARD_QUERY_LIMIT,
   ```

2. `apps/frontend/lib/utils/software-filter-utils.ts`에 `toApiFilters` 하위 호환 함수 추가:
   ```typescript
   /**
    * @deprecated convertFiltersToApiParams로 대체. 하위 호환 유지용.
    */
   export const toApiFilters = convertFiltersToApiParams;
   ```
   단, `toApiFilters`가 원래부터 이 파일에 없었고 외부 소비처도 없다면 M8 기준이 stale임을 계약에 명시하고 제거 검토.
