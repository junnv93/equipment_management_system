---
name: verify-frontend-state
description: 프론트엔드 상태 관리 패턴을 검증합니다. 컴포넌트/훅 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 컴포넌트 경로]'
---

# 프론트엔드 상태 관리 패턴 검증

## Purpose

프론트엔드 코드가 상태 관리 규칙을 올바르게 준수하는지 검증합니다:

1. **TanStack Query 사용** — 서버 상태는 반드시 `useQuery`/`useMutation` 사용
2. **useState 서버 상태 금지** — `useState`로 API 응답 데이터를 관리하지 않음
3. **onSuccess setQueryData 금지** — mutation의 `onSuccess`에서 `setQueryData(queryKey, data)` 호출 금지
4. **useOptimisticMutation 생명주기** — 4단계 생명주기 (onMutate → onSuccess → onError → onSettled) 준수
5. **invalidateQueries in onSettled** — 서버 동기화는 반드시 `onSettled`에서 수행

## When to Run

- 새로운 컴포넌트에서 API 데이터를 사용한 후
- mutation 훅을 추가/수정한 후
- 상태 관리 관련 리팩토링 후
- 프론트엔드 코드 리뷰 시

## Related Files

| File                                                                                                     | Purpose                                |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `apps/frontend/hooks/use-optimistic-mutation.ts`                                                         | SSOT: optimistic mutation 훅           |
| `apps/frontend/lib/api/query-config.ts`                                                                  | queryKeys 팩토리 + QUERY_CONFIG 프리셋 |
| `apps/frontend/lib/api/cache-invalidation.ts`                                                            | 캐시 무효화 유틸리티                   |
| `apps/frontend/components/dashboard/DashboardClient.tsx`                                                 | useQuery 참조 구현                     |
| `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`                                  | placeholderData 참조 구현              |
| `apps/frontend/hooks/use-team-filters.ts`                                                                | URL-driven 필터 훅 참조 구현           |
| `apps/frontend/lib/utils/equipment-filter-utils.ts`                                                      | 필터 SSOT 유틸리티 참조 구현           |
| `apps/frontend/app/(dashboard)/admin/calibration-approvals/CalibrationApprovalsContent.tsx`              | 1-step 승인 direct useMutation 참조    |
| `apps/frontend/app/(dashboard)/admin/calibration-factor-approvals/CalibrationFactorApprovalsContent.tsx` | 1-step 승인 direct useMutation 참조    |
| `apps/frontend/app/(dashboard)/admin/calibration-plan-approvals/CalibrationPlanApprovalsContent.tsx`     | 1-step 승인 direct useMutation 참조    |
| `apps/frontend/app/(dashboard)/admin/software-approvals/SoftwareApprovalsContent.tsx`                    | 1-step 승인 direct useMutation 참조    |
| `apps/frontend/app/(dashboard)/admin/equipment-approvals/EquipmentApprovalsContent.tsx`                  | 1-step 승인 direct useMutation 참조    |
| `apps/frontend/components/notifications/IntermediateCheckAlert.tsx`                                      | 중간점검 완료 direct useMutation 참조  |
| `apps/frontend/components/equipment/CalibrationFactorsClient.tsx`                                        | 보정계수 생성 direct useMutation 참조  |

## Workflow

### Step 1: useState로 서버 상태 관리 탐지

API 응답 타입을 useState로 관리하는 패턴을 탐지합니다.

```bash
# useState에 API 응답 타입 사용 탐지
grep -rn "useState<.*Response\|useState<.*\[\]>\|useState<.*Data" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|isLoading\|isOpen\|isDialog\|isModal\|selected\|form\|input\|search\|filter\|tab\|page\|sort\|expanded\|collapsed\|visible\|show\|open\|close\|toggle\|active\|disabled\|error\|message\|text\|value\|checked\|node_modules"
```

**PASS 기준:** 서버 데이터를 useState로 관리하는 패턴이 없어야 함.

**FAIL 기준:** `useState<Equipment[]>`, `useState<CheckoutResponse>` 등 서버 데이터 타입이 useState에 사용되면 위반.

### Step 2: onSuccess에서 setQueryData 금지

mutation의 onSuccess 콜백에서 setQueryData를 호출하는 위반 패턴을 탐지합니다.

```bash
# onSuccess 내 setQueryData 탐지
grep -rn "onSuccess" apps/frontend --include="*.ts" --include="*.tsx" -A 10 | grep "setQueryData"
```

**PASS 기준:** onSuccess 콜백 내에서 setQueryData 호출이 없어야 함.

**FAIL 기준:** `onSuccess: (data) => { queryClient.setQueryData(key, data) }` 패턴이 발견되면 위반.

**참고:** `onMutate`에서의 setQueryData는 optimistic update이므로 정상.

### Step 3: useOptimisticMutation 사용 확인

상태 변경 작업에서 useOptimisticMutation을 사용하는지 확인합니다.

```bash
# useMutation 직접 사용 탐지 (useOptimisticMutation 대신)
grep -rn "useMutation(" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "useOptimisticMutation\|// \|node_modules\|use-optimistic-mutation"
```

**PASS 기준:** 상태 변경 mutation은 `useOptimisticMutation`을 사용해야 함.

**참고:** 모든 useMutation이 위반은 아님 — 단순 API 호출(파일 업로드 등)은 직접 사용 가능.

### Step 4: invalidateQueries 위치 확인

서버 동기화가 onSettled에서 수행되는지 확인합니다.

```bash
# onSuccess에서 invalidateQueries 호출 탐지 (onSettled에서 해야 함)
grep -rn "onSuccess" apps/frontend --include="*.ts" --include="*.tsx" -A 10 | grep "invalidateQueries"
```

**참고:** `useOptimisticMutation` 훅 자체에서 onSettled 처리를 하므로, 훅 소비자(consumer)가 onSuccess에서 별도로 invalidate하면 중복.

### Step 5: QUERY_CONFIG 프리셋 사용 확인

쿼리에 적절한 staleTime/cacheTime 설정이 있는지 확인합니다.

```bash
# QUERY_CONFIG 프리셋 사용 확인
grep -rn "useQuery" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" -A 5 | grep "QUERY_CONFIG"
```

```bash
# staleTime 직접 설정 탐지 (프리셋 대신)
grep -rn "staleTime:" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "QUERY_CONFIG\|query-config\|// "
```

**참고:** staleTime 직접 설정이 반드시 위반은 아니지만, QUERY_CONFIG 프리셋 사용이 권장됨.

## Output Format

```markdown
| #   | 검사                       | 상태      | 상세                  |
| --- | -------------------------- | --------- | --------------------- |
| 1   | useState 서버 상태         | PASS/FAIL | 위반 위치 목록        |
| 2   | onSuccess setQueryData     | PASS/FAIL | 위반 위치 목록        |
| 3   | useOptimisticMutation 사용 | PASS/INFO | 직접 useMutation 위치 |
| 4   | invalidateQueries 위치     | PASS/FAIL | onSuccess 내 위치     |
| 5   | QUERY_CONFIG 프리셋        | PASS/INFO | 직접 설정 위치        |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **UI 전용 useState** — `useState(false)` (dialog), `useState('')` (input), `useState(0)` (tab index) 등 UI 상태는 정상
2. **use-management-number-check.ts의 setQueryData** — 수동 캐시 관리 목적, mutation onSuccess가 아님
3. **DashboardClient.tsx의 setQueryData** — WebSocket 업데이트 핸들러에서의 사용, mutation이 아님
4. **파일 업로드 등의 직접 useMutation** — optimistic update가 불필요한 단순 API 호출
5. **use-optimistic-mutation.ts 자체** — 훅 내부 구현의 setQueryData는 onMutate 단계이므로 정상
6. **폼 상태 useState** — `useState<FormData>`, `useState({ name: '', ... })` 등 폼 입력 관리는 서버 상태가 아님
7. **필터 훅 내부의 useMemo/useCallback** — `use-*-filters.ts` 훅 내부의 메모이제이션은 정상
8. **CreateCheckoutContent의 selectedEquipments** — 폼에서 선택된 장비 목록 관리는 UI 상태
9. **1-step 승인/완료 워크플로우의 direct useMutation** — `admin/*-approvals/` 및 `IntermediateCheckAlert`, `CalibrationFactorsClient` 등은 optimistic update 불필요 (비동기 확인 플로우). `onSettled`에서 `invalidateQueries` 호출 패턴 준수 시 정상
10. **SoftwareHistoryClient의 direct useMutation** — 소프트웨어 변경 요청은 신규 생성이므로 optimistic update 불필요
