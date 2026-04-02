---
name: verify-frontend-state
description: Verifies frontend state management patterns + performance anti-patterns — TanStack Query for server state (no useState), onSuccess setQueryData prohibition, dynamic imports for code splitting, Server/Client component separation. Run after adding/modifying components or hooks.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 컴포넌트 경로]'
---

# 프론트엔드 상태 관리 패턴 검증

## Purpose

1. **TanStack Query 사용** — 서버 상태는 `useQuery`/`useMutation` 사용
2. **useState 서버 상태 금지** — API 응답 데이터를 useState로 관리 금지
3. **onSuccess setQueryData 금지** — mutation onSuccess에서 `setQueryData` 호출 금지
4. **invalidateQueries 위치** — mutation 유형별 적절한 위치에서 캐시 무효화
5. **QUERY_CONFIG 프리셋** — staleTime/refetchInterval 직접 설정 대신 프리셋 사용

## When to Run

- 새로운 컴포넌트에서 API 데이터를 사용한 후
- mutation 훅을 추가/수정한 후
- 상태 관리 관련 리팩토링 후

## Related Files

| File | Purpose |
|------|---------|
| `apps/frontend/hooks/use-optimistic-mutation.ts` | SSOT: optimistic mutation 훅 |
| `apps/frontend/lib/api/query-config.ts` | queryKeys 팩토리 + QUERY_CONFIG 프리셋 |
| `apps/frontend/lib/api/cache-invalidation.ts` | 캐시 무효화 SSOT |
| `apps/frontend/hooks/use-date-formatter.ts` | 사용자 dateFormat 적용 날짜 포맷 훅 |

## Workflow

각 Step의 bash 명령어, 코드 예시: [references/step-details.md](references/step-details.md) 참조

### Step 1: useState로 서버 상태 관리

**PASS:** `useState<Equipment[]>` 등 서버 데이터 타입 useState 0개.

### Step 2: onSuccess setQueryData 금지

**PASS:** onSuccess 내 setQueryData 0개. 참고: onMutate에서의 setQueryData는 정상.

### Step 3: useOptimisticMutation 사용

**PASS:** 상태 변경 mutation에 useOptimisticMutation 사용. INFO: 단순 API는 직접 사용 가능.

### Step 4: invalidateQueries 위치 + (4b) Navigate-Before-Invalidate

**PASS:** useOptimisticMutation 소비자가 별도 invalidateQueries 미호출. `invalidateQueries`에 `await` 있거나 `router.push`보다 먼저 완료 보장.

### Step 5: QUERY_CONFIG + (5b) countsAll prefix + (5c) CheckoutCacheInvalidation

- **5:** staleTime 직접 설정 → QUERY_CONFIG 프리셋 권장
- **5b:** `queryKeys.approvals.counts()` 대신 `queryKeys.approvals.countsAll` 사용
- **5c:** 체크아웃 캐시 → `CheckoutCacheInvalidation` 정적 상수 사용

### Step 6: REFETCH_STRATEGIES 하드코딩

**PASS:** `refetchInterval: 60000` 등 하드코딩 0개.

### Step 7: useDateFormatter 컨벤션

**PASS:** 사용자 표시 날짜는 `useDateFormatter().fmtDate` 사용. formatDate/date-fns format 직접 import 0개.

### Step 8: 성능 안티패턴

- **8a:** `'use client'` + 서버 함수(getServerAuthSession, serverApiClient) 0개
- **8b:** 무거운 라이브러리(recharts, chart.js 등) 정적 import 0개

### Step 9: useAuth().can() 권한 SSOT

**PASS:** 클라이언트 컴포넌트에서 `hasPermission` 직접 import 0개.

## Output Format

```markdown
| #   | 검사                       | 상태      | 상세                          |
| --- | -------------------------- | --------- | ----------------------------- |
| 1   | useState 서버 상태         | PASS/FAIL | 위반 위치 목록                |
| 2   | onSuccess setQueryData     | PASS/FAIL | 위반 위치 목록                |
| 3   | useOptimisticMutation 사용 | PASS/INFO | 직접 useMutation 위치         |
| 4   | invalidateQueries 위치     | PASS/FAIL | onSuccess 내 위치             |
| 4b  | Navigate-Before-Invalidate | PASS/FAIL | await 없는 invalidate→navigate |
| 5   | QUERY_CONFIG 프리셋        | PASS/INFO | 직접 설정 위치                |
| 5b  | countsAll prefix 무효화    | PASS/FAIL | approvals.counts() 사용 위치  |
| 5c  | CheckoutCacheInvalidation  | PASS/FAIL | 직접 queryKeys 조합 위치      |
| 6   | REFETCH_STRATEGIES 사용    | PASS/INFO | refetchInterval 하드코딩 위치 |
| 7   | useDateFormatter 컨벤션    | PASS/FAIL | 직접 formatDate/format import |
| 8a  | Client에서 서버 함수 호출  | PASS/FAIL | 'use client' + 서버 함수 위치 |
| 8b  | 무거운 라이브러리 동적 분할 | PASS/FAIL | 정적 import 위치             |
| 9   | useAuth().can() 권한 SSOT  | PASS/FAIL | hasPermission 직접 import 위치 |
```

## Exceptions

1. **UI 전용 useState** — dialog, input, tab index 등 UI 상태는 정상
2. **use-management-number-check.ts의 setQueryData** — 수동 캐시 관리 (mutation onSuccess 아님)
3. **DashboardClient.tsx의 setQueryData** — WebSocket 업데이트 핸들러
4. **파일 업로드 등의 직접 useMutation** — optimistic update 불필요
5. **use-optimistic-mutation.ts 자체** — 훅 내부 setQueryData는 onMutate
6. **폼 상태 useState** — `useState<FormData>` 등 폼 입력 관리
7. **필터 훅 내부의 useMemo/useCallback** — 메모이제이션
8. **CreateCheckoutContent의 selectedEquipments** — UI 상태
9. **1-step 승인/완료 워크플로우의 direct useMutation** — optimistic update 불필요
10. **SoftwareHistoryClient의 direct useMutation** — 신규 생성
11. **refetchInterval 직접 설정 (특수 케이스)** — 주석으로 이유 명시 시 가능
12. **use-sidebar-state.ts의 localStorage useState** — UI 로컬 상태
13. **use-idle-timeout.ts의 useState** — UI 타이머 상태
14. **폼/내부 계산용 formatDate 직접 사용** — HTML spec 요구 고정 포맷
15. **direct useMutation + 네비게이션 시 onSuccess 내 invalidateQueries** — 올바른 패턴
16. **UI 기본 컴포넌트의 date-fns format** — shadcn/ui 원본 패턴
17. **Server Component에서의 hasPermission 직접 사용** — 훅 사용 불가
18. **이벤트 핸들러 내 setQueryData 캐시 프라이밍** — LeaderCombobox.tsx 성능 최적화
