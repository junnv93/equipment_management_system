---
slug: test-software-detail-refactor
created: 2026-04-19
target: apps/frontend/app/(dashboard)/software/[id]/TestSoftwareDetailContent.tsx
---

# Contract: TestSoftwareDetailContent 아키텍처 이슈 4건 수정

## MUST Criteria

| # | 기준 | 검증 방법 |
|---|------|----------|
| M1 | `pnpm --filter frontend run tsc --noEmit` PASS | CLI 실행 |
| M2 | `pnpm --filter frontend run build` PASS | CLI 실행 |
| M3 | `toggleMutation.mutationFn` 내부에서 `queryClient.getQueryData`로 최신 version 읽음 | Grep: `getQueryData.*testSoftware.detail` |
| M4 | 상세 쿼리에 `QUERY_CONFIG.TEST_SOFTWARE_DETAIL` 사용 (LIST 아님) | Grep: `TEST_SOFTWARE_DETAIL` |
| M5 | `updateMutation`이 `useOptimisticMutation`으로 교체됨 | Grep: `useOptimisticMutation` (2회 이상) |
| M6 | `toggleMutation`이 `useOptimisticMutation`으로 교체됨 | Grep: `useOptimisticMutation` |
| M7 | `linkedEquipment` 쿼리에 인라인 `staleTime: CACHE_TIMES.MEDIUM` 없음 → `QUERY_CONFIG.HISTORY` 사용 | Grep: `QUERY_CONFIG.HISTORY` |
| M8 | `CACHE_TIMES` 직접 import 없음 (SSOT: QUERY_CONFIG 경유) | Grep: `CACHE_TIMES` in file |
| M9 | `useMutation` 직접 import 없음 (link/unlink 포함 — 전부 useOptimisticMutation으로 대체 or useMutation 유지 시 VERSION_CONFLICT 불필요한 경우만 허용) | 판단 필요 |
| M10 | `handleMutationError` 제거 (useOptimisticMutation이 VERSION_CONFLICT 자동 처리) | Grep: `handleMutationError` |

> **M9 보완**: `linkEquipmentMutation`/`unlinkEquipmentMutation`은 CAS 미사용 → `useMutation` 유지 허용. `updateMutation`/`toggleMutation`은 CAS 사용 → `useOptimisticMutation` 필수.

## SHOULD Criteria (루프 차단 아님)

| # | 기준 |
|---|------|
| S1 | `optimisticUpdate` 함수가 `old === undefined` 케이스 안전하게 처리 |
| S2 | `invalidateKeys`에 `queryKeys.testSoftware.lists()` 포함 |
| S3 | `isConflictError` import 제거 (hook이 처리하므로 불필요) |

## Out of Scope

- `linkEquipmentMutation` / `unlinkEquipmentMutation` — CAS 없으므로 useMutation 유지 가능
- 다른 컴포넌트 수정 금지 (수술적 변경)
