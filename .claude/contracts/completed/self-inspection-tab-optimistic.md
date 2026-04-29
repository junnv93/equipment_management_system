# Contract: self-inspection-tab-optimistic

## Scope
`apps/frontend/components/equipment/SelfInspectionTab.tsx` — 단일 파일

## MUST Criteria

1. `pnpm --filter frontend run tsc --noEmit` PASS (타입 오류 없음)
2. `pnpm --filter frontend run build` PASS
3. `useMutation` (TanStack Query)이 `SelfInspectionTab.tsx` 내에서 직접 사용되지 않음
4. `useOptimisticMutation` 6개 뮤테이션 모두 적용:
   - `submitMutation`, `withdrawMutation`, `approveMutation`, `rejectMutation`, `resubmitMutation`, `deleteMutation`
5. `handleConflictError` 함수 제거 (useOptimisticMutation 내부 처리)
6. `invalidate` 헬퍼 함수 제거 (useOptimisticMutation `onSettled` 처리)
7. `primaryQueryKey` + `crossInvalidateKeys` 패턴 사용
8. 각 뮤테이션 call site가 SelfInspection 전체 객체 대신 최소 변수 객체를 전달
   - 상태 전이 뮤테이션(submit/withdraw/approve/reject/resubmit): `{ id, version }` 포함
   - delete 뮤테이션: `{ id }` 만 전달 (백엔드 API가 version 불필요)
9. `resubmitMutation` optimisticUpdate → `'draft'` 상태 (백엔드 서비스 확인됨)
10. `SelfInspectionCache = { data: SelfInspection[]; total: number }` 타입으로 캐시 업데이트

## SHOULD Criteria

- `tSI` alias가 뮤테이션 정의 전에 선언됨 (코드 가독성)
- 충돌 에러 시 dialog 닫힘: rejectMutation, deleteMutation에 `onErrorCallback` 포함
