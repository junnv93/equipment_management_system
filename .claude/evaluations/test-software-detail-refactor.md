---
slug: test-software-detail-refactor
date: 2026-04-19
iteration: 1
verdict: PASS
---

# Evaluation Report

## MUST Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | tsc PASS | PASS | Generator 확인 + `pnpm --filter frontend exec tsc --noEmit` 오류 없이 완료 (출력 없음) |
| M2 | build PASS | PASS | Generator 확인: "✓ Compiled successfully in 14.3s" |
| M3 | `toggleMutation.mutationFn` 내부에서 `queryClient.getQueryData`로 최신 version 읽음 | PASS | Line 172: `queryClient.getQueryData<TestSoftware>(queryKeys.testSoftware.detail(id))` — 패턴 `getQueryData.*testSoftware.detail` 충족 |
| M4 | 상세 쿼리에 `QUERY_CONFIG.TEST_SOFTWARE_DETAIL` 사용 | PASS | Line 70: `...QUERY_CONFIG.TEST_SOFTWARE_DETAIL` |
| M5 | `updateMutation`이 `useOptimisticMutation`으로 교체됨 | PASS | Line 157: `const updateMutation = useOptimisticMutation<...>` |
| M6 | `toggleMutation`이 `useOptimisticMutation`으로 교체됨 | PASS | Line 170: `const toggleMutation = useOptimisticMutation<...>` |
| M7 | `linkedEquipment` 쿼리에 `QUERY_CONFIG.HISTORY` 사용 | PASS | Line 77: `...QUERY_CONFIG.HISTORY` |
| M8 | `CACHE_TIMES` import 없음 | PASS | Grep 결과 파일 내 `CACHE_TIMES` 0건 |
| M9 | `updateMutation`/`toggleMutation`은 `useOptimisticMutation` 사용, `link/unlink`는 `useMutation` 유지 | PASS | `useMutation`은 line 89(`linkEquipmentMutation`), line 104(`unlinkEquipmentMutation`)에만 사용 — CAS 미사용 뮤테이션이므로 계약 보완에 따라 허용 |
| M10 | `handleMutationError` 제거됨 | PASS | Grep 결과 파일 내 `handleMutationError` 0건 |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | `optimisticUpdate`이 `old === undefined` 케이스 안전하게 처리 | PARTIAL | `if (!old) return old!` 패턴 사용 (line 161, 177). 분기 자체는 존재하나 `old!` non-null assertion으로 TypeScript를 속이며 undefined를 반환함. 런타임에서 undefined가 반환되어 낙관적 업데이트가 스킵되는 동작은 의도적으로 보임 (기존 값 없으면 아무 것도 하지 않음). 기능상 안전하나 `return old as TestSoftware` 또는 early-return 패턴이 더 명확함 |
| S2 | `invalidateKeys`에 `queryKeys.testSoftware.lists()` 포함 | PASS | Line 165: `invalidateKeys: [queryKeys.testSoftware.lists()]`, Line 183: 동일 패턴 — `updateMutation`, `toggleMutation` 양쪽 모두 포함 |
| S3 | `isConflictError` import 제거 | PASS | Grep 결과 파일 내 `isConflictError` 0건 |

## Issues Found

M1–M10 전체 PASS. 수정 필요한 FAIL 항목 없음.

S1 부분 지적:
- `if (!old) return old!;` 패턴은 동작은 하지만 `old!`는 undefined에 non-null assertion을 붙여 타입 체커를 우회함. 엄밀히는 `return undefined as unknown as TestSoftware`와 동일. SHOULD 기준이므로 루프 차단 아님.
- 권장 수정: `if (!old) return old;` 로 변경하고 `useOptimisticMutation`의 제네릭 반환 타입을 `TestSoftware | undefined`로 수용하거나, hook 내부에서 undefined를 처리하도록 조정.

## Verdict

**PASS**

모든 MUST 기준(M1–M10) 충족. SHOULD 기준 S2, S3 충족, S1 부분 충족(기능 이상 없음, 타입 표현만 개선 여지). 계약 요건 전부 통과.
