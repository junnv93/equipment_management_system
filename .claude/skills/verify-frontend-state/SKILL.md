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

**제네릭 타입 패턴:** `useOptimisticMutation<ResponseType, RequestType, OptimisticType>` — 3개 타입 인자 명시 필수.

**invalidateKeys 배열 구문:** 추가 캐시 무효화는 `invalidateKeys: [queryKeys.xxx.lists()]` 옵션으로 처리. 훅 외부에서 별도 `invalidateQueries` 호출 불필요.

**정상 패턴:**
```typescript
const updateMutation = useOptimisticMutation<Entity, UpdateDto, Entity>({
  mutationFn: async (dto) => api.update(id, dto),
  queryKey: queryKeys.entity.detail(id),
  optimisticUpdate: (old, dto) => ({ ...old, ...dto }),
  invalidateKeys: [queryKeys.entity.lists()],
});
```

### Step 3b: CAS stale closure 금지 (4차 재발 패턴)

CAS version을 렌더 시점 캡처(stale closure)로 사용하면 다른 세션에서 수정 후 이 페이지가 열려 있을 때 항상 VERSION_CONFLICT 발생.

**탐지:**
```bash
# mutationFn 클로저가 외부 변수 version을 캡처하는 패턴
grep -rn "mutationFn.*version\|\.version\s*\?" apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" -B 2 | grep -v "getQueryData"
```

**❌ 금지 — stale closure:**
```typescript
const toggleMutation = useOptimisticMutation({
  mutationFn: () => api.toggle(id, entity?.version ?? 0), // entity는 렌더 캡처
});
```

**✅ 올바른 패턴 — mutationFn 내부 fresh read:**
```typescript
const toggleMutation = useOptimisticMutation({
  mutationFn: () => {
    const current = queryClient.getQueryData<Entity>(queryKeys.entity.detail(id));
    return api.toggle(id, current?.version ?? 0); // 호출 시점 최신 버전
  },
});
```

**PASS:** mutationFn 클로저에서 `entity?.version` 형태 캡처 0건. 또는 `queryClient.getQueryData` 경유.

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

### Step 10: useToast SSOT (단일 hook 경로)

`useToast` / `toast` 는 반드시 `@/components/ui/use-toast` 1곳에서만 import. 과거 `@/hooks/use-toast` 사본은 별도 `memoryState`/`listeners` 를 가져 `<Toaster />` 가 구독하지 않아 해당 컴포넌트의 토스트가 화면에 렌더되지 않는 silent production bug 를 유발했다 (2026-04-08 toast-ssot-dedup 작업에서 6개 컴포넌트 영향 확인).

**검증:**
```bash
grep -rn "@/hooks/use-toast" apps/frontend --include="*.ts" --include="*.tsx"
```

**PASS:** 0 hit.

### Step 12: count 전용 쿼리 키 분리 (pageSize:1 캐시 오염 방지)

`pageSize: 1`로 total count만 조회하는 쿼리가 전체 목록 쿼리와 **동일한 queryKey**를 사용하면, 1건 응답이 전체 목록 캐시를 오염시켜 올바른 데이터가 보이지 않는 버그를 유발한다.

**규칙:**
- `pageSize: 1` + 총 건수만 사용하는 위젯 → `pendingCount()`, `summaryCount()` 등 전용 키 사용
- 동일 엔티티의 전체 목록 쿼리와 키가 겹치면 안 됨

**검증:**
```bash
# pageSize: 1 쿼리 중 전용 count 키를 쓰지 않고 일반 목록 키를 재사용하는 패턴 탐지
grep -rn "pageSize.*1\b" apps/frontend --include="*.tsx" --include="*.ts" -B 3 | grep "queryKey" | grep -v "Count\|count\|summary\|Summary"
```

**참고 패턴 (정상):**
```typescript
// ✅ 전용 키 사용
queryKey: queryKeys.checkouts.pendingCount(),     // ['checkouts', 'pending-count']
queryFn: () => checkoutApi.getPendingChecks({ pageSize: 1 }),

// ❌ 목록 키 재사용 (오염 위험)
queryKey: queryKeys.checkouts.pending(),          // ['checkouts', 'pending', undefined]
queryFn: () => checkoutApi.getPendingChecks({ pageSize: 1 }),
```

**배경**: `CheckoutsContent.tsx`에서 `pending()` 키로 `pageSize:1` 결과를 캐시 → `PendingChecksClient`가 동일 키의 1건 캐시를 사용해 전체 탭에서 1건만 표시되던 버그 발생 (2026-04-13 수정).

**PASS:** pageSize:1 쿼리가 전용 count 키를 사용하거나 0건.

### Step 11: E2E 토스트 매칭은 expectToastVisible helper 사용

Radix Toast 는 의도적으로 시각 토스트(`<li role="status">`) + visually-hidden status mirror (`<span role="status" aria-live="assertive">`) 를 동시에 노출한다 (스크린리더 a11y). 따라서 `page.getByText('...').first()` 같은 직접 매칭은 strict mode 충돌을 우회할 뿐 의도(시각 발화 검증)가 코드에 드러나지 않고, mirror span 의 "Notification " 접두사 변경 시 silent break 위험이 있다.

**규칙:**
- 토스트 메시지 검증은 `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` 의 `expectToastVisible(page, text)` 사용
- 두 후보 토스트(성공/에러 분기)는 `toastLocator(page, text)` 로 좁힌 뒤 `.or()` 로 결합
- spec 안에서 토스트 텍스트에 직접 `.first()` 사용 금지

**검증:**
```bash
# 토스트로 보이는 한국어 종결형 문구에 .first() 직접 매칭
grep -rn "getByText.*되었\|getByText.*완료\|getByText.*실패.*\.first()" \
  apps/frontend/tests/e2e --include="*.spec.ts"
```

**PASS:** 토스트 텍스트에 직접 `.first()` 적용된 매칭 0건. helper 우회만 한정 검출.

### Step 13: 비동기 타이머 cleanup (useRef + clearTimeout)

컴포넌트 내에서 `window.setTimeout`으로 상태를 변경하는 경우, unmount 후에도 타이머가 실행되면 `setPhase` 등의 setState가 호출됩니다. 이를 방지하려면 `useRef<number | null>`로 타이머 ID를 추적하고 `useEffect` cleanup에서 `clearTimeout`을 호출해야 합니다.

**규칙:**
- `window.setTimeout(() => setState(...), N)` 패턴 → `useRef<number | null>` + `clearTimeout` + `useEffect` cleanup 필수
- `useRef` 없이 직접 `window.setTimeout` → FAIL

**탐지:**
```bash
# cleanup 없는 직접 setTimeout으로 상태 변경 패턴
grep -rn "window\.setTimeout.*setPhase\|window\.setTimeout.*setState\|window\.setTimeout.*set[A-Z]" \
  apps/frontend/components --include="*.tsx" --include="*.ts"
```

**PASS:** 0건이거나 모두 `timerRef.current = window.setTimeout(...)` + `clearTimeout` cleanup 패턴.
**FAIL:** `window.setTimeout(() => setXxx(...), N)` 직접 호출.

**정상 패턴 (BulkLabelPrintButton.tsx 기준):**
```typescript
const timerRef = React.useRef<number | null>(null);
React.useEffect(() => { return () => { if (timerRef.current !== null) clearTimeout(timerRef.current); }; }, []);
// catch 블록
timerRef.current = window.setTimeout(() => setPhase('idle'), 1200);
```

### Step 14: QUERY_CONFIG 스프레드 오버라이드

`{ ...QUERY_CONFIG.XXX, extraKey: value }` 패턴은 프리셋에 없는 옵션을 추가하는 오버라이드입니다. 이 경우 QUERY_CONFIG 프리셋 자체가 불완전하거나, 개별 쿼리가 특수 요구사항을 가진 것입니다. 두 경우 모두 **명시적인 주석**이 없으면 추후 유지보수자가 의도를 파악할 수 없습니다.

**규칙:**
- `{ ...QUERY_CONFIG.XXX, someKey: value }` 형태로 추가 옵션을 덧붙이는 경우 → 이유 주석 필수
- 주석 없이 오버라이드 → INFO (QUERY_CONFIG 프리셋 확장 검토 권장)

**탐지:**
```bash
# QUERY_CONFIG 스프레드 후 추가 옵션 붙이는 패턴 (trailing comma = 추가 키 존재)
grep -rn "\.\.\.\bQUERY_CONFIG\.\w\+," apps/frontend --include="*.tsx" --include="*.ts"
```

**정상 패턴 (주석 포함):**
```typescript
useQuery({
  queryKey: ...,
  queryFn: ...,
  // 목록 전환 시 stale 데이터 즉시 노출 방지 — QUERY_CONFIG.EQUIPMENT_LIST에 없는 옵션
  ...QUERY_CONFIG.EQUIPMENT_LIST,
  refetchOnMount: 'always',
});
```

**INFO:** 스프레드 오버라이드가 반복되면 QUERY_CONFIG에 새 프리셋 추가 검토.

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
| 10  | useToast SSOT 단일 경로    | PASS/FAIL | `@/hooks/use-toast` import 위치 |
| 11  | E2E 토스트 helper 사용     | PASS/FAIL | 토스트 텍스트 직접 .first() 위치 |
| 13  | 타이머 cleanup (useRef)    | PASS/FAIL | window.setTimeout + setState 직접 호출 위치 |
| 12  | count 전용 쿼리 키 분리    | PASS/FAIL | pageSize:1 쿼리가 목록 키 재사용하는 위치 |
| 14  | QUERY_CONFIG 스프레드 오버라이드 | PASS/INFO | `...QUERY_CONFIG.XXX, extraKey` 주석 없는 위치 |
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
19. **StorageImage.tsx의 useRef+useEffect blob URL revoke** — TanStack Query(gcTime=SHORT) 캐시 만료 후 blob URL 메모리 해제를 위한 의도적 패턴. `data.isBlob` 조건부 revoke + 언마운트 클린업이 정상.
20. **DocumentPreviewDialog.tsx의 blobUrlRef+useEffect cleanup** — presigned/blob URL 미리보기용. `blobUrlRef.current`에 현재 blob URL 추적, cleanup에서 `revokeObjectURL` 호출. deps: `[open, doc?.id]`. 이 패턴은 stale closure 방지를 위한 ref 기반 cleanup으로 정상.
21. **`staleTime: Infinity` (런타임 불변 서버 설정값)** — `QUERY_CONFIG` 프리셋이 없는 값이지만, 앱 재시작 없이 변경되지 않는 서버 설정(NextAuth 인증 제공자 목록, 기능 플래그 등)에 대해 `staleTime: Infinity`를 주석과 함께 직접 사용하는 것은 정상. 예: `AuthProviders.tsx`의 `useQuery({ queryFn: getProviders, staleTime: Infinity })`. 주석 없이 사용하면 QUERY_CONFIG 프리셋 누락으로 보고.
