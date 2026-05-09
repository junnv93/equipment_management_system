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
| `apps/frontend/hooks/use-cas-guarded-mutation.ts` | CAS fetch-before-mutate 훅 (3단계 승인 워크플로우용) |
| `apps/frontend/lib/api/query-config.ts` | queryKeys 팩토리 + QUERY_CONFIG 프리셋 |
| `apps/frontend/lib/api/cache-invalidation.ts` | 캐시 무효화 SSOT |
| `apps/frontend/hooks/use-date-formatter.ts` | 사용자 dateFormat 적용 날짜 포맷 훅 |
| `apps/frontend/hooks/use-calibration.ts` | 교정 기록 도메인 훅 (useCalibrationDetail) |
| `apps/frontend/hooks/use-undoable-state.ts` | undo/redo 히스토리 SSOT 훅 (Step 38) |

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

### Step 3c: fetch-before-mutate 패턴 — `useCasGuardedMutation` SSOT (2026-04-20~)

3단계 승인 워크플로우처럼 두 사용자가 동시에 같은 레코드를 진행시킬 위험이 높은 경우, 단순 getQueryData 보다 강력한 API fetch-before-mutate 패턴 사용.

**SSOT 훅:** `apps/frontend/hooks/use-cas-guarded-mutation.ts`

**탐지 — stale casVersion를 직접 캡처하는 패턴:**
```bash
# casVersion을 외부 변수에서 캡처하는 mutationFn (useCasGuardedMutation 미사용)
grep -rn "casVersion" apps/frontend/components apps/frontend/hooks \
  --include="*.tsx" --include="*.ts" | grep -v "useCasGuardedMutation\|CasGuarded\|use-cas-guarded"
```

**PASS:** calibration-plans 도메인의 상태 변경 mutation(submit/approve/reject/confirm)이 `useCasGuardedMutation` 또는 동등한 fetch-before-mutate 패턴 경유.

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

`pageSize: 1`로 total count만 조회하는 쿼리가 전체 목록 쿼리와 동일한 queryKey를 사용하면, 1건 응답이 전체 목록 캐시를 오염시켜 올바른 데이터가 보이지 않는 버그를 유발한다.

**검증:**
```bash
# pageSize: 1 쿼리 중 전용 count 키를 쓰지 않고 일반 목록 키를 재사용하는 패턴 탐지
grep -rn "pageSize.*1\b" apps/frontend --include="*.tsx" --include="*.ts" -B 3 | grep "queryKey" | grep -v "Count\|count\|summary\|Summary"
```

**PASS:** pageSize:1 쿼리가 전용 count 키를 사용하거나 0건.

### Step 11: E2E 토스트 매칭은 expectToastVisible helper 사용

토스트 메시지 검증은 `apps/frontend/tests/e2e/shared/helpers/toast-helpers.ts` 의 `expectToastVisible(page, text)` 사용. spec 안에서 토스트 텍스트에 직접 `.first()` 사용 금지.

**검증:**
```bash
grep -rn "getByText.*되었\|getByText.*완료\|getByText.*실패.*\.first()" \
  apps/frontend/tests/e2e --include="*.spec.ts"
```

**PASS:** 토스트 텍스트에 직접 `.first()` 적용된 매칭 0건.

### Step 13: 비동기 타이머 cleanup (useRef + clearTimeout)

`window.setTimeout` + setState 패턴은 `useRef<number | null>` + `clearTimeout` + `useEffect` cleanup 필수.

**탐지:**
```bash
grep -rn "window\.setTimeout.*setPhase\|window\.setTimeout.*setState\|window\.setTimeout.*set[A-Z]" \
  apps/frontend/components --include="*.tsx" --include="*.ts"
```

**PASS:** 0건이거나 모두 `timerRef.current = window.setTimeout(...)` + `clearTimeout` cleanup 패턴.
**FAIL:** `window.setTimeout(() => setXxx(...), N)` 직접 호출.

### Step 14: QUERY_CONFIG 스프레드 오버라이드

`{ ...QUERY_CONFIG.XXX, extraKey: value }` 형태는 주석 필수. INFO: 반복 시 QUERY_CONFIG 신규 프리셋 추가 검토.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-14-query_config-스프레드-오버라이드)

### Step 14b: placeholderData 순서

`placeholderData`는 `...QUERY_CONFIG.XXX` 스프레드 **다음에** 위치해야 한다.

**PASS:** `placeholderData`가 `...QUERY_CONFIG.XXX` 스프레드 이후에 위치.
**FAIL:** `placeholderData`가 스프레드 이전에 위치 → 순서 교환.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-14b-placeholderdata는-query_config-스프레드-다음에-위치-2026-04-22-추가)

### Step 15: useCasGuardedMutation — VERSION_CONFLICT 처리 및 캐시 무효화 패턴

`useCasGuardedMutation` 훅 미사용 수동 casVersion fetch + mutation 조합, 또는 onError에서 `isConflictError` 중복 처리 금지.

**탐지:**
```bash
grep -rn "fetchCasVersion\|getCalibrationPlan.*casVersion\|casVersion.*await" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-cas-guarded-mutation\|node_modules\|// "
```

```bash
grep -rn "isConflictError\|VERSION_CONFLICT" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-cas-guarded-mutation\|equipment-errors\|node_modules\|// "
```

**PASS:** `useCasGuardedMutation` 사용 컴포넌트의 onError에 `isConflictError` 중복 처리 없음.

### Step 16: raw async mutation 금지 — delete/simple mutation도 useMutation 필수

onClick 핸들러에서 raw `await api.delete/remove/unlink` 직접 호출 금지.

**PASS:** raw `await api.delete/remove/unlink` 직접 호출 0건.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-16-raw-async-mutation-금지--deleteSimple-mutation도-usemutation-필수-2026-04-21-추가)

### Step 17: useQuery isError 분기 + 에러 UI 필수

`isLoading` 사용 컴포넌트에서 `isError` 누락 금지.

**PASS:** `isLoading`을 사용하는 컴포넌트가 `isError`도 구조분해하고 에러 분기 렌더링 포함.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-17-usequery-iserror-분기--에러-ui-필수-2026-04-21-추가)

### Step 18: `*-api.ts`에 React Hook 금지

`lib/api/*-api.ts`에 `@tanstack/react-query` import 0건 필수.

**탐지:**
```bash
grep -rn "from '@tanstack/react-query'" \
  apps/frontend/lib/api \
  --include="*-api.ts"
```

**PASS:** 0건. **FAIL:** `hooks/use-<domain>.ts`로 이동 필요.

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-18-api-ts에-react-hook-금지-2026-04-21-추가)

### Step 19: shared/generic 컴포넌트에서 useAuth 금지

`components/shared/`, `components/ui/` 내에서 `useAuth` import 0건 필수.

**탐지:**
```bash
grep -rn "use-auth\|useAuth" \
  apps/frontend/components/shared \
  apps/frontend/components/ui \
  --include="*.tsx" --include="*.ts"
```

**PASS:** 0건. **FAIL:** `canXxx?: boolean` prop 패턴으로 전환.

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-19-sharedgeneric-컴포넌트에서-useauth-금지-2026-04-21-추가)

### Step 20: `isMounted` ref skip-first-render 패턴

마운트 시 실행 방지가 필요한 포커스 전환 effect에 `isMounted.current` guard 필수.

**PASS:** guard 존재. **FAIL:** `useEffect(() => { ref.current?.focus() }, [someState])` — 첫 렌더에도 포커스 강제.

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-20-ismounted-ref-skip-first-render-패턴-2026-04-22-추가)

### Step 21: 런타임 feature flag union 내로잉 금지 + toast toastFn 외부 주입 + useOnboardingHint SSOT

- feature flag ternary 결과를 union 변수에 담지 않고 원본 소스 변수를 ternary로 직접 접근
- `lib/` 하위 `.ts` 파일에서 `useToast`/`useSonner` import 0건
- `use-onboarding-hint.ts` 외부에서 `onboarding-dismissed:` 문자열 0건

상세 (feature flag): [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-21-런타임-feature-flag로-union-타입-내로잉-금지-2026-04-26-추가)
상세 (toast/onboarding): [references/cache-invalidation.md](references/cache-invalidation.md#step-21-toast-templates-toastfn-외부-주입--useonboardinghint-패턴-2026-04-24-추가)

### Step 21 확장: `useOnlineStatus` SSOT 훅

`navigator.onLine`, `addEventListener('online'/'offline', ...)` 직접 등록 금지. 반드시 `useOnlineStatus()` 경유.

**검증:**
```bash
grep -rEn "navigator\.onLine|addEventListener\(['\"](online|offline)['\"]" \
  apps/frontend/components apps/frontend/app apps/frontend/hooks \
  --include='*.ts' --include='*.tsx' \
  | grep -v "use-online-status\|//\|node_modules"
```

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-21-확장-useonlinestatus-ssot-훅--클라이언트-컴포넌트의-navigatoronline-직접-사용-금지-2026-04-28-추가)

### Step 22: `Promise.allSettled` 병렬 bulk mutation — `for...of` 순차 처리 금지

bulk 함수에서 `Promise.allSettled` 사용 필수.

**PASS:** bulk 함수에서 `Promise.allSettled` 사용. **FAIL:** `for...of + await` 패턴.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-22-promiseallsettled-병렬-bulk-mutation--forof-순차-처리-금지-2026-04-27-추가)

### Step 23: TanStack Query v5 `onError` snapshot rollback

`onMutate` → `getQueriesData` 스냅샷 → `onError` → `forEach setQueryData` 즉시 복원 패턴 필수.

**PASS:** `onError` 롤백이 스냅샷 복원 패턴 사용. **INFO:** `invalidateQueries`만 사용 시 깜빡임 주의.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-23-tanstack-query-v5-onerror-snapshot-rollback--getqueriesdata--foreach-setquerydata-2026-04-27-추가)

### Step 24: Dual-Mode 비대칭 props

dual-mode 컴포넌트의 controlled props 양측을 모두 주입하거나 모두 omit.

**PASS:** prop 양측 모두 주입 또는 모두 omit. **FAIL:** prop 절반만 전달 — silent fetch 활성화.

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-24-dual-mode-비대칭-props--controlleduncontrolled-절반-주입-silent-bug-탐지-2026-04-28-추가)

### Step 25: `useEffect` dependency array TDZ 패턴 + React.memo useCallback 안정화

- **TDZ:** `useQuery` 결과를 dep array에 사용하는 `useEffect`가 해당 `useQuery` 선언 이후에 위치
- **memo:** `React.memo` atom 호출처에서 inline arrow onClick 0건 — 모두 `useCallback` 변수

상세 (TDZ): [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-25-useeffect-dependency-array-tdz-패턴--선언-이전-변수-참조-금지-2026-04-29-추가)
상세 (memo): [references/cache-invalidation.md](references/cache-invalidation.md#step-25-reactmemo-reactmemo-atom-부모는-함수-prop을-usecallback으로-안정화-2026-04-28-추가)

### Step 31: Nested interactive (a-in-a / Link-in-Link) 차단

ESLint `NESTED_LINK_RULE` / `NESTED_ANCHOR_RULE` 전체 적용 + lint 실측 0 violation.

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-31-nested-interactive-a-in-a--link-in-link-차단-2026-04-28-추가)

### Step 32: useEffect deps 안정화 — useRef 패턴

eslint-disable react-hooks 0건 + stable ref(t/toast) deps 직접 포함 0건.

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-32-useeffect-deps-안정화--useref-패턴-eslint-disable-회피-2026-04-28-추가)

### Step 33: TableRow onClick 내 router.push 네비게이션 금지

`TableRow onClick` 내 detail 이동 목적 `router.push` 0건. NavLink overlay 패턴 사용.

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-33-tablerow-onclick-내-routerpush-네비게이션-금지-2026-04-29-추가)

### Step 34: 다중 다이얼로그 상태 — discriminated union `ActiveDialog` 패턴

동일 컴포넌트 내 `isXxxOpen + xxxTarget + xxxComment` 3-tuple 반복 금지 → `ActiveDialog` union 사용.

**PASS:** union 패턴 사용. **FAIL:** useState 6개 이상 반복.

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-34-다중-다이얼로그-상태--discriminated-union-activedialog-패턴-2026-04-30-추가)

### Step 35: bulk approve/reject는 `runWithConcurrency` worker pool 패턴

`bulkApprove`/`bulkReject` 본문에 `Promise.allSettled` 직접 호출 0건, `runWithConcurrency` 경유 필수.

상세: [references/tanstack-query-cas.md](references/tanstack-query-cas.md#step-35-bulk-approvereject는-runwithconcurrency-worker-pool-패턴--promiseallsettled-직접-호출-금지-2026-04-30-추가)

### Step 36: 카운트 기반 조건부 UI — `!!count` 방어 가드

숫자 카운트 기반 JSX 조건부 렌더링에 `!!count` 또는 `count > 0` 가드 사용.

**FAIL:** `{someCount && <Component />}` 패턴 — `count === 0` 시 "0" 텍스트 노드 노출.

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-36-카운트-기반-조건부-ui--count-방어-가드-패턴-2026-04-30-추가)

### Step 37: sessionStorage TTL + try/catch + one-shot 패턴

storage 헬퍼는 ① try/catch wrap + ② TTL 검증 + ③ one-shot removeItem 3패턴 모두 필수.

상세: [references/dynamic-import-ssr.md](references/dynamic-import-ssr.md#step-37-sessionstorage-ttl--trycatch--one-shot-패턴-2026-04-30-추가-sprint-45-u-07)

### Step 38: useUndoableState SSOT — 인라인 undo/redo 스택 금지

`pastRef`/`futureRef` 인라인 선언 또는 `recomputeUndoRedo`/`pushHistory`/`undoStructural`/`redoStructural` 직접 구현 금지 → `useUndoableState` 위임 필수.

**탐지:**
```bash
grep -rn "pastRef\|futureRef\|recomputeUndoRedo\|pushHistory.*useCallback\|undoStructural\|redoStructural" \
  apps/frontend/components --include="*.tsx" --include="*.ts"
# 기대: 0건
```

상세: [references/cache-invalidation.md](references/cache-invalidation.md#step-38-useundoablestate-ssot--인라인-undoredo-스택-컴포넌트-내-선언-금지-2026-05-02-추가)

### Step 39: 프론트엔드 mutation에 version 전달 — CAS 무력화 차단 (2026-05-03 verify-cas Step 9 흡수)

상태 변경 API 함수(approve/reject/update/cancel/close)는 반드시 `version: number` 파라미터를 받아 서버에 전달한다. 상세: [references/step-details.md](references/step-details.md#step-39-프론트엔드-mutation에-version-전달--cas-무력화-차단)

### Step 40: useCasGuardedMutation + 2-step Dialog AP-4 — confirm 진입 전 version 재조회 (2026-05-03 verify-cas Step 12·13 흡수)

3단계 승인 워크플로우는 `useCasGuardedMutation` fetch-before-mutate 패턴을 사용하고, 2-step 확인 다이얼로그는 confirm 진입 직전 최신 버전을 재조회한다. 상세: [references/step-details.md](references/step-details.md#step-40-usecasguardedmutation--2-step-dialog-ap-4--confirm-진입-전-version-재조회)

### Step 41: toCsvParam SSOT — API 파라미터 조립 레이어 CSV 직렬화 단일 진입점 (2026-05-08 추가; 2026-05-08 scope 확장)

`apps/frontend/lib/api/query-csv.ts` 의 `toCsvParam` 함수가 frontend 전체 API 파라미터 조립 레이어의 CSV 직렬화 SSOT. 배열 → comma-separated string 변환을 인라인 `.join(',')` 로 수행하면 빈 값 처리·trim 정규화가 누락되고 SSOT가 분산된다.

**범위**: `lib/api/` + `lib/utils/` + `components/` 에서 API 쿼리 파라미터를 조립할 때 모두 `toCsvParam` 경유 필수.
단, 배열을 URL 파라미터로 변환하지 않는 순수 UI 로직(렌더링/필터 상태 비교 등)의 `.join(',')`는 제외.

**검증 grep:**

```bash
# CSV 직렬화 인라인 차단 — API 파라미터 조립 레이어 전체에서 .join(',') 0건이어야 함
# lib/api/ (쿼리 함수 정의)
grep -rn "\.join\(['\"][,]['\"]" apps/frontend/lib/api/ \
  --include="*.ts" \
  | grep -v "__tests__\|\.spec\.\|query-csv\.ts"
# 기대: 0건

# lib/utils/ (필터→API params 변환 유틸)
grep -rn "\.join\(['\"][,]['\"]" apps/frontend/lib/utils/ \
  --include="*.ts" \
  | grep -v "__tests__\|\.spec\."
# 기대: 0건 (API 파라미터 조립 컨텍스트 한정 — 순수 UI join은 제외)

# toCsvParam import 경로 SSOT — 모든 사용처는 '@/lib/api/query-csv' 경유
grep -rn "toCsvParam" apps/frontend/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|\.spec\.\|query-csv\.ts"
# 기대: import 모두 '@/lib/api/query-csv' 절대경로 — 다른 경로 0건

# SSOT 진입점 단일 보장 — toCsvParam 함수가 query-csv.ts 에만 export
grep -rn "export function toCsvParam\|export const toCsvParam" apps/frontend/ \
  --include="*.ts" \
  | grep -v "__tests__\|\.spec\."
# 기대: query-csv.ts 1건
```

**FAIL 조건:** `lib/api/` 또는 `lib/utils/` 내 API 파라미터 조립 목적의 `.join(',')` 1건 이상 (query-csv.ts 제외) / toCsvParam 진입점 2건 이상.

### Step 42: RejectModal `mode='domain'` 위임 패턴 — 인라인 반려 UI 금지 (2026-05-09 추가)

도메인 반려(reject) UI는 `<RejectModal mode='domain'>` SSOT 컴포넌트로 위임 필수.
컴포넌트 내 인라인 `showRejectInput` 토글 state + textarea 패턴은 UX 일관성 파괴 및 유효성 로직 분산.

**올바른 패턴**:
```tsx
const [rejectModalOpen, setRejectModalOpen] = useState(false);

const handleRejectConfirm = async (reason: string): Promise<void> => {
  try {
    await mutation.mutateAsync({ decision: 'reject', comment: reason });
    setRejectModalOpen(false); // 성공 시만 닫음 — 실패 시 모달 유지로 retry 지원
  } catch {} // onError가 toast 처리
};

<RejectModal
  mode="domain"
  isOpen={rejectModalOpen}
  onClose={() => setRejectModalOpen(false)}
  onConfirm={handleRejectConfirm}
  title={t('rejectDialog.title')}
  description={t('rejectDialog.description')}
/>
```

**금지 패턴**:
- 컴포넌트 내 `showRejectInput`, `isRejectInputVisible` 등 인라인 토글 state
- `<textarea>` 반려 사유 입력을 Dialog 본체에 직접 임베드

**검증 grep:**

```bash
# 인라인 반려 토글 state 탐지 — 0건이어야 함
grep -rn "showRejectInput\|isRejectInputVisible\|rejectInputOpen\|rejectTextareaVisible" \
  apps/frontend/components --include="*.tsx"
# 기대: 0건

# RejectModal mode='domain' 사용처 확인 — ≥8건 (disposal 2 + approval 1 + 5 도메인)
grep -rn 'mode="domain"' apps/frontend/components --include="*.tsx" | grep -v "RejectModal.tsx"
# 기대: ≥ 8건 (신규 도메인 추가 시 증가)
```

**FAIL 기준:** `showRejectInput` 등 인라인 반려 토글 state 발견. `mode="domain"` 0건이면 RejectModal SSOT 회귀.

**관련 sprint**: `reject-modal-ssot-closure` (2026-05-09) — DisposalApprovalDialog/DisposalReviewDialog 인라인 reject UI → RejectModal SSOT 통합

### Step 43: useEquipmentCalibrations dual-variant hook SSOT — `calibrationApi.getEquipmentCalibrations` / `getCalibrationHistory` 직접 호출 차단 (2026-05-09 추가)

**배경** (2026-05-09 phase-c-followup-closure r2 — BasicInfoTab cache config compete silent bug):
`CalibrationHistoryTab` 과 `BasicInfoTab` 이 동일 `queryKeys.calibrations.byEquipment` queryKey 에 다른 `QUERY_CONFIG` (`HISTORY` vs `CALIBRATION_LIST`) 적용 → 마지막 caller config 가 cache override 위험.
`apps/frontend/hooks/use-equipment-calibrations.ts` 가 `useEquipmentCalibrations` (Tab variant — `Calibration[]`) + `useEquipmentCalibrationHistory` (Sub variant — `PaginatedResponse<CalibrationHistory>`) dual export 로 queryKey/queryFn/QUERY_CONFIG pairing 결빙.

**올바른 패턴**:
```tsx
// ✅ Tab/Detail/요약 캐러셀 (Calibration[])
const { data: calibrations = [], isLoading, isError } = useEquipmentCalibrations(equipmentId);

// ✅ Sub-route Client (PaginatedResponse<CalibrationHistory>)
const { data: historyData, isLoading, isError } =
  useEquipmentCalibrationHistory(equipmentId, { pageSize: SELECTOR_PAGE_SIZE });
```

**금지 패턴**: useQuery 내부에서 `calibrationApi.getEquipmentCalibrations` 또는 `calibrationApi.getCalibrationHistory({ equipmentId })` 직접 호출.

**검증 grep**:

```bash
# (1) production 컴포넌트/훅에서 calibrationApi.getEquipmentCalibrations 직접 호출 0건
#     (예외: hook 본체 use-equipment-calibrations.ts + EquipmentForm.tsx imperative form-submit 콜백)
grep -rn "calibrationApi.getEquipmentCalibrations" apps/frontend/components apps/frontend/app apps/frontend/hooks \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-equipment-calibrations.ts\|EquipmentForm.tsx"
# 기대값: 0

# (2) production 컴포넌트에서 calibrationApi.getCalibrationHistory 직접 호출은 메인 /calibration page 만 정당
#     (단일 장비 컨텍스트 sub-route 는 useEquipmentCalibrationHistory hook 경유)
grep -rn "calibrationApi.getCalibrationHistory" apps/frontend/components apps/frontend/hooks \
  --include="*.tsx" --include="*.ts" \
  | grep -v "use-equipment-calibrations.ts"
# 기대값: 0 (메인 page 는 app/(dashboard)/calibration/CalibrationContent.tsx — 본 grep 범위 외)
```

**위반 시 수정 지시**: useQuery + calibrationApi 직접 호출 → `useEquipmentCalibrations` 또는 `useEquipmentCalibrationHistory` hook 호출로 교체. 새 caller 는 hook 우선.

**관련 sprint**: `phase-c-followup-closure (+ r2/r3)` (2026-05-08~09) — Tab/Sub fetch hook 추출 + BasicInfoTab cache config compete 회귀 차단

### Step 44: `useSafeTimeout` SSOT — setState 포함 setTimeout 수동 cleanup 패턴 회귀 차단 (2026-05-09 추가)

**배경** (srp-decomposition-final-closure 시니어 자기검토):
`apps/frontend/hooks/use-safe-timeout.ts` 의 `useSafeTimeout()` 가 SSOT 이나 실제 사용처 0건.
신규 코드(`use-approval-row-transitions.ts`)가 `useRef<ReturnType<typeof setTimeout>[]>` + `useEffect` cleanup 패턴을 수동 재구현 → SSOT 드리프트.

**금지 패턴 — 수동 타이머 배열 관리**:
```typescript
// ❌ 수동 패턴 — use-approval-row-transitions.ts (기존 tech-debt S-3)
const pendingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
useEffect(() => {
  const timers = pendingTimers.current;
  return () => { timers.forEach(clearTimeout); };
}, []);
// ... setTimeout(...); pendingTimers.current.push(timerId);
```

**올바른 패턴 — `useSafeTimeout` 위임**:
```typescript
// ✅ hooks/use-safe-timeout.ts SSOT 사용
import { useSafeTimeout } from '@/hooks/use-safe-timeout';
const setSafeTimeout = useSafeTimeout();
// mutation onSuccessCallback 내부
setSafeTimeout(() => { setExitingIds((prev) => ...); }, APPROVAL_MOTION.exitDurationMs);
```

**검증 grep (신규 코드 회귀 탐지)**:
```bash
# hooks/ 내 타이머 배열 수동 관리 패턴 탐지 (use-safe-timeout.ts 본체 제외)
grep -rn "useRef<ReturnType<typeof setTimeout>\[\]>" \
  apps/frontend/hooks/ apps/frontend/components/ \
  --include="*.ts" --include="*.tsx" \
  | grep -v "use-safe-timeout.ts"
# 기대값: 0 — 신규 코드는 useSafeTimeout() 사용
```

**예외 (pre-existing tech-debt, SHOULD 마이그레이션 대상)**:
- `use-approval-row-transitions.ts` — 수동 패턴 현재 1건 (S-3, tech-debt-tracker 등록)
- `window.setTimeout` 패턴 (Step 13 커버) 및 단일 ref 패턴(`use-management-number-check.ts`)은 별도 분류

**관련 파일**: `apps/frontend/hooks/use-safe-timeout.ts` (SSOT)

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
| 14b | placeholderData 순서        | PASS/FAIL | QUERY_CONFIG 스프레드 이전에 placeholderData 위치 |
| 15  | useCasGuardedMutation 패턴    | PASS/INFO | onError 중복 처리 또는 수동 casVersion 조합 위치 |
| 16  | raw async mutation 금지    | PASS/FAIL | onClick에서 await api.delete/remove/unlink 직접 호출 위치 |
| 17  | useQuery isError 분기      | PASS/INFO | isLoading 사용 컴포넌트에서 isError 누락 위치 |
| 18  | *-api.ts React Hook 금지   | PASS/FAIL | lib/api/*-api.ts에 @tanstack/react-query import 위치 |
| 19  | shared/ui 컴포넌트 useAuth 금지 | PASS/FAIL | components/shared·ui에서 useAuth import 위치 |
| 20  | isMounted ref skip-first-render | PASS/FAIL | 상태 의존 포커스 effect에 isMounted guard 누락 위치 |
| 21  | toast toastFn 외부 주입 + useOnboardingHint SSOT | PASS/FAIL | lib/ 레이어에서 useToast 직접 호출 위치 |
| 22  | bulk 뮤테이션 `Promise.allSettled` 병렬 | PASS/FAIL | bulk 함수 내 for...of+await 패턴 위치 |
| 23  | onError snapshot rollback  | PASS/INFO | invalidateQueries 롤백 패턴 위치 |
| 24  | Dual-Mode 비대칭 props      | PASS/FAIL | controlled props 절반만 주입 위치 |
| 25  | useEffect TDZ + memo useCallback | PASS/FAIL | TDZ 패턴 또는 inline arrow 위치 |
| 31  | Nested interactive 차단    | PASS/FAIL | a-in-a / Link-in-Link 위치 |
| 32  | useEffect deps useRef 안정화 | PASS/FAIL | eslint-disable 또는 t/toast deps 위치 |
| 33  | TableRow router.push 금지  | PASS/FAIL | TableRow onClick router.push 위치 |
| 34  | ActiveDialog discriminated union | PASS/FAIL | useState 6개 이상 반복 위치 |
| 35  | runWithConcurrency worker pool | PASS/FAIL | Promise.allSettled 직접 호출 위치 |
| 36  | 카운트 기반 `!!count` 방어 | PASS/FAIL | `{someCount && <JSX/>}` 패턴(0 텍스트 노출) 위치 |
| 37  | sessionStorage 3패턴       | PASS/FAIL | try/catch·TTL·one-shot 누락 위치 |
| 38  | useUndoableState SSOT      | PASS/FAIL | 인라인 pastRef/futureRef 위치 |
| 39  | mutation version 전달      | PASS/FAIL | version 파라미터 누락 API 함수 |
| 40  | useCasGuardedMutation + 2-step | PASS/FAIL | confirm 전 version 재조회 누락 위치 |
| 41  | toCsvParam SSOT               | PASS/FAIL | lib/api·lib/utils 내 `.join(',')` 인라인 위치 |
| 42  | RejectModal mode='domain' 위임 | PASS/FAIL | 인라인 showRejectInput 토글 또는 mode='domain' 누락 위치 |
| 43  | useEquipmentCalibrations dual-variant hook | PASS/FAIL | calibrationApi.getEquipmentCalibrations/getCalibrationHistory 직접 호출 위치 |
| 44  | useSafeTimeout SSOT                        | PASS/FAIL | 신규 hooks/components 내 수동 타이머 배열 관리(useRef<setTimeout[]>) 위치 |
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
