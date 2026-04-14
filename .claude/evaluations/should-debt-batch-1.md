---
slug: should-debt-batch-1
iteration: 1
verdict: PASS (SHOULD S2 실패)
evaluated_at: 2026-04-14
---

# Evaluation Report: should-debt-batch-1

## Summary

| Item | Result |
|------|--------|
| Mode | Mode 1 (Lightweight) |
| Iterations | 1 |
| Verdict | **PASS** (MUST 전체 통과, SHOULD S2 미완) |

---

## MUST Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M1: backend tsc --noEmit → 0 errors | **PASS** | `HISTORY_CARD_QUERY_LIMITS` business-rules.ts 추가로 해소 |
| M2: frontend tsc --noEmit → 0 errors | **PASS** | 클린 |
| M3: `HISTORY_CARD_QUERY_LIMIT,` 1 hit in index.ts | **PASS** | line 158 확인 |
| M4: `.limit(1000)\|.limit(500)` 0 hit in form-template-export.service.ts | **PASS** | `EXPORT_QUERY_LIMITS` 상수 사용 중 |
| M5: `Promise<unknown>` 0 hit in audit.controller.ts | **PASS** | 구체적 타입 명시됨 |
| M6: `process.env.NEXT_PUBLIC_API_URL` 0 hit in error-reporter.ts | **PASS** | `API_BASE_URL` import로 교체됨 |
| M7: `convertFiltersToApiParams` 1 hit in reports-filter-utils.ts | **PASS** | 함수 정의됨 |
| M8: `convertFiltersToApiParams` 1 hit in software-filter-utils.ts | **PASS** | 함수 정의됨 |

---

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1: backend test PASS | **SKIP** | 테스트 미실행 (SHOULD 기준) |
| S2: ReportsContent.tsx `convertFiltersToApiParams` 사용 | **FAIL** | 인라인 `additionalParams` 조건 로직 잔존 (lines 162-188) |
| S3: TestSoftwareListContent.tsx `convertFiltersToApiParams` 사용 | **PASS** | line 53 확인 |

---

## Root Cause Analysis

**핵심 결함**: prior uncommitted session이 `HISTORY_CARD_QUERY_LIMITS` (object)를 `history-card.service.ts`와 `index.ts`에서 참조했지만, `business-rules.ts`에 실제 상수 정의가 누락.

**수정**: `business-rules.ts` 하단에 `HISTORY_CARD_QUERY_LIMITS = { SECTION_ITEMS: 50 }` 추가 및 deprecated scalar `HISTORY_CARD_QUERY_LIMIT` alias 추가.

**S2 미완 사유**: `ReportsContent.tsx`의 `additionalParams` 인라인 조건 로직은 리포트 타입별 특화 파라미터를 생성하며, `convertFiltersToApiParams`의 단순 위임으로 대체하기 어려운 구조. tech-debt로 등록 후 별도 처리.

---

## Diff Summary

| File | Change |
|------|--------|
| `packages/shared-constants/src/business-rules.ts` | `HISTORY_CARD_QUERY_LIMITS` + deprecated `HISTORY_CARD_QUERY_LIMIT` 추가 |
| `packages/shared-constants/src/index.ts` | `HISTORY_CARD_QUERY_LIMIT` export 추가 |
| `packages/shared-constants/dist/index.d.ts` | 패키지 빌드 (dist 동기화) |
