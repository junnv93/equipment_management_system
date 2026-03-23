---
name: verify-frontend-state
description: 프론트엔드 상태 관리 패턴 + 성능 안티패턴을 검증합니다. TanStack Query 사용, onSuccess setQueryData 금지, 프론트엔드 성능(동적 import, 서버/클라이언트 분리). 컴포넌트/훅 추가/수정 후 사용.
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

| File                                                                                                     | Purpose                                                     |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `apps/frontend/hooks/use-optimistic-mutation.ts`                                                         | SSOT: optimistic mutation 훅                                |
| `apps/frontend/lib/api/query-config.ts`                                                                  | queryKeys 팩토리 + QUERY_CONFIG 프리셋                      |
| `apps/frontend/lib/api/cache-invalidation.ts`                                                            | 캐시 무효화 SSOT (CheckoutCacheInvalidation 등 정적 클래스) |
| `apps/frontend/components/dashboard/DashboardClient.tsx`                                                 | useQuery 참조 구현                                          |
| `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`                                  | placeholderData 참조 구현                                   |
| `apps/frontend/hooks/use-team-filters.ts`                                                                | URL-driven 필터 훅 참조 구현                                |
| `apps/frontend/lib/utils/equipment-filter-utils.ts`                                                      | 필터 SSOT 유틸리티 참조 구현                                |
| `apps/frontend/app/(dashboard)/admin/calibration-approvals/CalibrationApprovalsContent.tsx`              | 1-step 승인 direct useMutation 참조                         |
| `apps/frontend/app/(dashboard)/admin/calibration-factor-approvals/CalibrationFactorApprovalsContent.tsx` | 1-step 승인 direct useMutation 참조                         |
| `apps/frontend/app/(dashboard)/admin/calibration-plan-approvals/CalibrationPlanApprovalsContent.tsx`     | 1-step 승인 direct useMutation 참조                         |
| `apps/frontend/app/(dashboard)/admin/software-approvals/SoftwareApprovalsContent.tsx`                    | 1-step 승인 direct useMutation 참조                         |
| `apps/frontend/app/(dashboard)/admin/equipment-approvals/EquipmentApprovalsContent.tsx`                  | 1-step 승인 direct useMutation 참조                         |
| `apps/frontend/components/notifications/IntermediateCheckAlert.tsx`                                      | 중간점검 완료 direct useMutation 참조                       |
| `apps/frontend/components/equipment/CalibrationFactorsClient.tsx`                                        | 보정계수 생성 direct useMutation 참조                       |
| `apps/frontend/components/calibration/CalibrationPlanDetailClient.tsx`                                   | 교정계획 상세 direct useMutation + placeholderData 참조     |
| `apps/frontend/components/calibration/ApprovalTimeline.tsx`                                              | 교정계획 승인 타임라인 direct useMutation 참조              |
| `apps/frontend/components/teams/TeamDetail.tsx`                                                          | 팀 상세 컴포넌트 (useQuery 참조)                            |
| `apps/frontend/components/calibration/PlanItemsTable.tsx`                                                | 교정계획 항목 테이블 direct useMutation 참조                |
| `apps/frontend/components/calibration/VersionHistory.tsx`                                                | 교정계획 버전 이력 useQuery 참조                            |
| `apps/frontend/hooks/use-user-preferences.ts`                                                            | 사용자 설정 조회 훅 (STATIC 캐시, 날짜/필터 기본값 소스)    |
| `apps/frontend/hooks/use-date-formatter.ts`                                                              | 사용자 dateFormat 적용 날짜 포맷 훅 (useDateFormatter)       |
| `apps/frontend/hooks/use-equipment-kpi.ts`                                                               | 장비 KPI 계산 훅 (TanStack Query 참조)                      |
| `apps/frontend/hooks/use-approval-kpi.ts`                                                                | 승인 KPI 계산 훅 (TanStack Query 참조)                      |
| `apps/frontend/hooks/use-sidebar-state.ts`                                                               | 사이드바 상태 훅 (localStorage UI 상태, 서버 상태 아님)     |
| `apps/frontend/hooks/use-idle-timeout.ts`                                                                | Idle Timeout 훅 (UI 타이머 상태, 서버 상태 아님)            |
| `apps/frontend/hooks/use-debounced-value.ts`                                                             | 디바운스 훅 (UI 입력 지연 — 서버 상태 아님, 재사용 유틸)    |
| `apps/frontend/components/non-conformances/NCDetailClient.tsx`                                           | NC 상세 클라이언트 (useOptimisticMutation 참조)             |
| `apps/frontend/app/(dashboard)/non-conformances/NonConformancesContent.tsx`                              | NC 목록 콘텐츠 (useQuery + KPI 참조)                        |
| `apps/frontend/components/teams/LeaderCombobox.tsx`                                                      | setQueryData 캐시 프라이밍 참조 (이벤트 핸들러)             |
| `apps/frontend/components/teams/TeamForm.tsx`                                                            | form.watch 연동 + 조건부 props 전달 참조                    |
| `apps/frontend/components/equipment/RepairHistoryClient.tsx`                                             | 수리 이력 CRUD direct useMutation + onSettled 참조          |
| `apps/frontend/components/equipment/CheckoutHistoryTab.tsx`                                              | 반출 이력 조회 + 반출 신청 direct useMutation 참조          |
| `apps/frontend/components/equipment/LocationHistoryTab.tsx`                                              | 위치 변동 이력 CRUD direct useMutation + onSettled 참조     |

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

### Step 4b: Navigate-Before-Invalidate 안티패턴 탐지

`onSuccess`에서 `invalidateQueries`를 `await` 없이 호출한 뒤 `router.push`로 네비게이션하면, 대상 페이지에서 stale 캐시를 읽습니다.

```bash
# onSuccess에서 invalidateQueries 후 router.push가 있는 패턴 탐지
# await 없이 invalidateQueries → router.push 순서
grep -rn "onSuccess" apps/frontend/components apps/frontend/hooks --include="*.tsx" --include="*.ts" -A 15 | grep -B 5 "router\.push\|router\.replace" | grep "invalidateQueries" | grep -v "await"
```

**PASS 기준:** `invalidateQueries` 호출에 `await`가 있거나, `router.push`보다 먼저 완료가 보장됨.

**FAIL 기준:** `invalidateQueries` (await 없음) → `router.push` 순서 — 대상 페이지에서 stale 데이터 표시.

```typescript
// ❌ WRONG — invalidate 완료 전 네비게이션
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ... }); // await 없음
  router.push('/target');
}

// ✅ CORRECT — invalidate 완료 후 네비게이션
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ... });
  router.push('/target');
}

// ✅ CORRECT — 여러 키 병렬 무효화 후 네비게이션
onSuccess: async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: key1 }),
    queryClient.invalidateQueries({ queryKey: key2 }),
  ]);
  router.push('/target');
}
```

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

### Step 5b: countsAll prefix 기반 캐시 무효화

승인 카운트 캐시 무효화 시 역할 무관 prefix 키(`countsAll`)를 사용하는지 확인합니다.

```bash
# approvals.counts() (undefined 포함)로 무효화하는 패턴 탐지
grep -rn "approvals\.counts()" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|// "
```

**PASS 기준:** 캐시 무효화 시 `queryKeys.approvals.countsAll` 사용.

**FAIL 기준:** `queryKeys.approvals.counts()` → `['approval-counts', undefined]`는 `['approval-counts', 'technical_manager']`와 prefix 매칭 안 됨 — 네비게이션 배지/대시보드 카운트 갱신 누락.

**올바른 패턴:**

```typescript
// ❌ WRONG — undefined 인자 포함, prefix 매칭 실패
invalidateKeys: [queryKeys.approvals.counts()],
// 생성: ['approval-counts', undefined] — 역할별 키와 불일치

// ✅ CORRECT — prefix 키, 모든 역할의 카운트 무효화
invalidateKeys: [queryKeys.approvals.countsAll],
// 생성: ['approval-counts'] — prefix 매칭으로 모든 하위 키 무효화
```

### Step 5c: CheckoutCacheInvalidation SSOT 사용

체크아웃 관련 캐시 무효화가 `CheckoutCacheInvalidation` 정적 클래스를 통해 수행되는지 확인합니다.

```bash
# 컴포넌트에서 checkout 캐시를 직접 무효화하는 패턴 탐지
grep -rn "invalidateQueries.*queryKeys\.checkouts\." apps/frontend/components apps/frontend/hooks --include="*.ts" --include="*.tsx" | grep -v "cache-invalidation\|CheckoutCacheInvalidation\|// "
```

**PASS 기준:** 컴포넌트/훅에서 체크아웃 캐시 무효화는 `CheckoutCacheInvalidation` 사용.

**FAIL 기준:** 컴포넌트에서 직접 queryKeys 배열 조합으로 invalidateQueries 호출 시 무효화 누락 가능.

### Step 6: REFETCH_STRATEGIES 하드코딩 탐지

refetchInterval을 직접 설정하는 대신 REFETCH_STRATEGIES 프리셋을 사용하는지 확인합니다.

```bash
# refetchInterval 하드코딩 탐지
grep -rn "refetchInterval:\s*[0-9]" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "query-config\|QUERY_CONFIG\|// "
```

**PASS 기준:** refetchInterval 하드코딩이 없어야 함 (QUERY_CONFIG 프리셋 사용).

**FAIL 기준:** `refetchInterval: 60000` 같은 하드코딩된 ms 값이 발견되면 위반.

**권장 패턴:**

```tsx
// ❌ WRONG - 하드코딩
const { data } = useQuery({
  queryKey: queryKeys.dashboard.stats(),
  queryFn: () => api.getStats(),
  refetchInterval: 60000, // 60초
});

// ✅ CORRECT - SSOT 프리셋 사용
const { data } = useQuery({
  queryKey: queryKeys.dashboard.stats(),
  queryFn: () => api.getStats(),
  ...QUERY_CONFIG.DASHBOARD, // REFETCH_STRATEGIES.NORMAL
});
```

**참고:** Architecture v3에서 4-level 전략 도입:

- `REFETCH_STRATEGIES.CRITICAL` — 30초 폴링 + window focus (SSE 추천, 현재: 폴링)
- `REFETCH_STRATEGIES.IMPORTANT` — 2분 폴링 + window focus
- `REFETCH_STRATEGIES.NORMAL` — window focus만 (폴링 없음)
- `REFETCH_STRATEGIES.STATIC` — 수동 갱신 (refetchOnMount/focus 모두 false)

### Step 7: useDateFormatter 사용 컨벤션

사용자에게 표시되는 날짜가 `useDateFormatter()` 훅을 통해 포맷되는지 확인합니다. 직접 `formatDate()` 호출은 사용자 `dateFormat` 설정을 무시합니다.

```bash
# 컴포넌트에서 formatDate 직접 import 탐지
grep -rn "import.*formatDate.*from.*lib/utils/date" apps/frontend/components --include="*.tsx" | grep -v "// "
```

**PASS 기준:** 사용자에게 표시되는 날짜는 `useDateFormatter().fmtDate` 또는 `fmtDateTime` 사용.

**FAIL 기준:** 컴포넌트에서 `formatDate(value, 'yyyy-MM-dd')` 직접 호출은 사용자 dateFormat 설정 무시.

**예외:** `<input type="date">` value 생성 등 HTML spec이 요구하는 고정 포맷(`'yyyy-MM-dd'`)은 직접 `formatDate` 사용이 정당. 폼 필드 초기값, 내부 계산용 날짜 포맷은 사용자 설정과 무관.

### Step 8: 프론트엔드 성능 안티패턴 탐지

grep으로 탐지 가능한 프론트엔드 성능 안티패턴을 확인합니다. 아키텍처 수준의 성능 판단(캐시 전략 적절성, 확장성 등)은 `/review-architecture` Step 6b가 담당합니다.

#### 8a: 'use client' 컴포넌트에서 불필요한 데이터 패칭

Server Component에서 가능한 데이터 패칭을 Client Component로 넘기면 클라이언트 번들 증가 + 워터폴 발생 (컴포넌트 JS 로드 → fetch 시작).

```bash
# 'use client' 파일에서 서버 API 직접 호출 탐지 (Server Component에서 props로 전달해야 할 수 있음)
grep -rn "'use client'" apps/frontend/app --include="*.tsx" -l | xargs grep -l "getServerAuthSession\|serverApiClient" 2>/dev/null
```

**PASS 기준:** 0개 결과. `'use client'` 파일에서 서버 전용 함수(getServerAuthSession, serverApiClient) 호출 없음.

**참고:** 이 검사는 명백한 위반만 탐지합니다. Client Component에서 `useQuery`로 데이터를 가져오는 것 자체는 정상 — Server Component에서 prefetch하여 props로 전달할 수 있는데 하지 않은 경우가 아키텍처 수준 판단이며 `/review-architecture`가 담당합니다.

#### 8b: 무거운 라이브러리 dynamic import 누락

큰 라이브러리를 정적 import하면 초기 번들에 포함되어 로딩 지연. `dynamic(() => import(...), { ssr: false })`로 코드 분할 필요.

```bash
# 무거운 차트/에디터 라이브러리 정적 import 탐지
grep -rn "^import.*from ['\"]recharts\|^import.*from ['\"]chart\.js\|^import.*from ['\"]@monaco-editor\|^import.*from ['\"]react-quill\|^import.*from ['\"]@tiptap" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|node_modules\|dynamic"
```

**PASS 기준:** 무거운 라이브러리의 정적 import 0개.

**FAIL 기준:** `import { BarChart } from 'recharts'`가 직접 사용되면 해당 컴포넌트를 dynamic import로 래핑 필요.

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
| 7   | useDateFormatter 컨벤션    | PASS/FAIL | 직접 formatDate import 위치   |
| 8a  | Client에서 서버 함수 호출  | PASS/FAIL | 'use client' + 서버 함수 위치 |
| 8b  | 무거운 라이브러리 동적 분할 | PASS/FAIL | 정적 import 위치             |
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
9. **1-step 승인/완료 워크플로우의 direct useMutation** — `admin/*-approvals/`, `IntermediateCheckAlert`, `CalibrationFactorsClient`, `CalibrationPlanDetailClient`, `ApprovalTimeline`, `PlanItemsTable` 등은 optimistic update 불필요 (비동기 확인 플로우). `onSettled` 또는 `onSuccess`에서 `invalidateQueries` 호출 패턴 준수 시 정상
15. **direct useMutation + 네비게이션 시 onSuccess 내 invalidateQueries** — `useMutation`(비-optimistic)에서 `router.push()`로 네비게이션하는 경우, `onSuccess`에서 invalidation → navigation 순서로 호출하는 것이 올바른 패턴 (`useFormSubmission` 훅 참조). `onSettled`에서 invalidation하면 네비게이션 후에 실행되어 대상 페이지에서 stale 캐시가 표시됨. 단, `useOptimisticMutation` 사용 시에는 `onSettledCallback`을 통해 캐시 무효화 완료 후 네비게이션해야 함
10. **SoftwareHistoryClient의 direct useMutation** — 소프트웨어 변경 요청은 신규 생성이므로 optimistic update 불필요
11. **refetchInterval 직접 설정 (특수 케이스)** — QUERY_CONFIG 프리셋으로 커버되지 않는 특수한 polling 요구사항이 있을 때 직접 설정 가능. 단, 주석으로 이유를 명시해야 함
12. **use-sidebar-state.ts의 localStorage useState** — 사이드바 접기/펼치기 상태는 UI 로컬 상태 (서버 상태 아님). localStorage에서 읽는 SSR 안전 패턴은 정상 (useState false 초기화 → useEffect로 복원)
13. **use-idle-timeout.ts의 useState** — `isWarningVisible(boolean)`, `secondsRemaining(number)`는 UI 타이머 상태 (서버 상태 아님). `setInterval` 기반 카운트다운 로직이므로 TanStack Query 대상 아님
14. **폼/내부 계산용 formatDate 직접 사용** — `CalibrationRegisterDialog`, `CalibrationHistorySection`, `CalibrationInfoSection`, `EquipmentForm` 등에서 `<input type="date">` value 생성을 위해 `formatDate(date, 'yyyy-MM-dd')` 직접 사용은 HTML spec 요구사항. 사용자에게 표시되는 날짜가 아닌 내부 form value이므로 `useDateFormatter` 불필요
15. **이벤트 핸들러 내 setQueryData 캐시 프라이밍** — `LeaderCombobox.tsx`의 `handleSelect`에서 `queryClient.setQueryData(queryKeys.users.detail(user.id), user)` 호출은 mutation onSuccess가 아닌 이벤트 핸들러에서의 캐시 프라이밍. 이미 가용한 데이터(목록에서 선택된 항목)를 detail 캐시에 즉시 반영하여 후속 useQuery의 네트워크 왕복을 제거하는 성능 최적화 패턴. `onSuccess setQueryData 금지` 규칙과 무관
