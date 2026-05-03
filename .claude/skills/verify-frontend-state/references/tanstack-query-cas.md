# TanStack Query + CAS + Mutations — verify-frontend-state references

> 2026-05-03 verify-frontend-state 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> TanStack Query 설정 패턴, CAS 버전 관리, mutation 구현 패턴을 다룬다.

---

## Step 14: QUERY_CONFIG 스프레드 오버라이드

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

---

## Step 14b: placeholderData는 QUERY_CONFIG 스프레드 다음에 위치 (2026-04-22 추가)

`placeholderData`는 `...QUERY_CONFIG.XXX` 스프레드 **다음에** 위치해야 한다.
QUERY_CONFIG 프리셋이 미래에 `placeholderData` 키를 추가하면 스프레드가 먼저 오는 값을 덮어쓰기 때문이다.

**올바른 패턴:**
```typescript
useQuery({
  queryKey: queryKeys.checkouts.summary(),
  queryFn: () => checkoutApi.getSummary(),
  ...QUERY_CONFIG.CHECKOUT_SUMMARY,    // ← 스프레드 먼저
  placeholderData: initialSummary,     // ← placeholderData 나중에
});
```

**금지 패턴:**
```typescript
useQuery({
  queryKey: queryKeys.checkouts.summary(),
  queryFn: () => checkoutApi.getSummary(),
  placeholderData: initialSummary,     // ← QUERY_CONFIG 스프레드보다 먼저 오면 silent overwrite 위험
  ...QUERY_CONFIG.CHECKOUT_SUMMARY,
});
```

**탐지:**
```bash
# placeholderData 다음에 QUERY_CONFIG 스프레드가 오는 역순 패턴
grep -rn "placeholderData" apps/frontend --include="*.tsx" --include="*.ts" -A 3 \
  | grep "QUERY_CONFIG"
```

**PASS:** `placeholderData`가 `...QUERY_CONFIG.XXX` 스프레드 이후에 위치.
**FAIL:** `placeholderData`가 스프레드 이전에 위치 → 순서 교환 필요.

---

## Step 16: raw async mutation 금지 — delete/simple mutation도 useMutation 필수 (2026-04-21 추가)

파일 삭제·연결 해제 등 optimistic update가 불필요한 mutation도 **`useMutation`으로 감싸야 한다**.
raw `async/await` 직접 호출은 `isPending` 기반 중복 요청 방지, `onError` 에러 처리, 버튼 비활성화가 불가능하다.

**탐지:**
```bash
# onClick/handler 내부에서 await api.delete/remove/unlink 직접 호출 탐지
grep -rn "await.*api\.\(delete\|remove\|unlink\)" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "mutationFn\|mutation\.\|useMutation\|test\|spec\|node_modules"
```

**❌ 금지 — raw async:**
```typescript
const handleDelete = async (id: string) => {
  if (!confirm(t('deleteConfirm'))) return;
  await documentApi.deleteDocument(id);  // 중복 요청 방지 불가, 로딩 상태 없음
};
```

**✅ 올바른 패턴 — useMutation:**
```typescript
const deleteMutation = useMutation({
  mutationFn: (id: string) => documentApi.deleteDocument(id),
  onSuccess: () => { toast({ title: t('deleteSuccess') }); invalidateDocs(); },
  onError: () => { toast({ title: t('deleteError'), variant: 'destructive' }); },
});
const handleDelete = (id: string) => {
  if (!confirm(t('deleteConfirm'))) return;
  deleteMutation.mutate(id);
};
// 버튼: disabled={deleteMutation.isPending}
```

**PASS:** onClick 핸들러에서 raw `await api.delete/remove/unlink` 직접 호출 0건.

**근거:** 2026-04-21 harness C-1 — `ValidationDocumentsSection.tsx` delete handler가 raw async로 작성되어 버튼 중복 클릭 시 race condition 발생. `useMutation` 교체로 `isPending` 로딩 + 에러 분기 제공.

---

## Step 17: useQuery isError 분기 + 에러 UI 필수 (2026-04-21 추가)

`useQuery`로 데이터를 가져오는 컴포넌트는 `isError` 상태를 명시적으로 처리해야 한다.
로딩/빈 상태만 분기하고 에러 상태를 누락하면 네트워크 오류 시 빈 상태 UI가 표시되어
"데이터 없음"과 "데이터 로드 실패"를 사용자가 구분할 수 없다.

**탐지:**
```bash
# isLoading을 사용하지만 isError는 사용하지 않는 컴포넌트 파일 탐지
grep -rln "isLoading\b" \
  apps/frontend/components apps/frontend/app \
  --include="*.tsx" \
  | xargs grep -L "isError" \
  | grep -v "node_modules\|\.test\.\|\.spec\."
```

**❌ 금지 — isError 누락:**
```typescript
const { data: docs = [], isLoading } = useQuery({ ... });
// isLoading → skeleton, docs.length === 0 → 빈 상태
// 에러 상태 없음 → 네트워크 오류를 "빈 상태"로 오인
```

**✅ 올바른 패턴:**
```typescript
const { data: docs = [], isLoading, isError } = useQuery({ ... });
return isLoading ? <Skeleton /> : isError ? <ErrorUI /> : docs.length === 0 ? <Empty /> : <List />;
```

**PASS:** `isLoading`을 사용하는 컴포넌트가 `isError`도 구조분해하고 에러 분기 렌더링 포함.
**INFO:** 에러를 상위 `error.tsx` Error Boundary로 bubble up하는 경우 `isError` 분기 생략 가능.

**근거:** 2026-04-21 harness W-2 — `ValidationDocumentsSection.tsx` 첨부파일 로드 실패 시 빈 상태와 동일한 UI. `isError` 분기 추가 후 에러/빈 상태 구분 가능.

---

## Step 22: `Promise.allSettled` 병렬 bulk mutation — `for...of` 순차 처리 금지 (2026-04-27 추가)

여러 항목에 동일한 뮤테이션을 적용하는 bulk 작업은 `Promise.allSettled`로 병렬 실행해야 한다.
`for...of` + `await` 순차 처리는 N번 직렬 API 호출로 사용자 대기 시간이 N배가 되며,
한 건 실패 시 나머지가 중단될 수 있다.

**올바른 패턴 — `Promise.allSettled` + index-based 결과 매핑:**

```typescript
// ✅ 병렬 + 부분 실패 지원
const results = await Promise.allSettled(
  ids.map((id) => this.singleMutation(id, reason))
);

const success: string[] = [];
const failed: string[] = [];
results.forEach((result, i) => {
  if (result.status === 'fulfilled') success.push(ids[i]);
  else failed.push(ids[i]);
});
return { success, failed };

// ❌ 금지 — 순차 처리 (N배 지연 + 중간 실패 시 나머지 중단)
for (const id of ids) {
  await this.singleMutation(id, reason);
}
```

**탐지 — bulk 함수 내 for...of + await 순차 뮤테이션:**
```bash
# bulk* 함수 내 for...of + await 패턴 탐지
grep -A5 "async.*bulk\|bulkApprove\|bulkReject\|bulkDelete" \
  apps/frontend/lib/api/*.ts \
  | grep "for.*of\|await.*forEach"
```

**PASS:** bulk 함수에서 `Promise.allSettled` 사용.
**FAIL:** `for...of + await` 패턴 → `Promise.allSettled`로 교체.

**근거:** `approvals-api.ts`의 `bulkReject()`에서 `Promise.allSettled` 도입 (AP-03, 2026-04-27).
부분 실패 지원 필수 — `{ success: string[], failed: string[] }` 반환 타입이 API 계약.

**예외:**
- 순서 의존적 트랜잭션 (앞 항목 성공 후에만 다음 항목 처리 가능) — `for...of + await` 허용, 주석 필수.
- 단일 뮤테이션 — 해당 없음.

---

## Step 23: TanStack Query v5 `onError` snapshot rollback — `getQueriesData` + `forEach setQueryData` (2026-04-27 추가)

`useOptimisticMutation` 없이 직접 `useMutation`을 사용하는 경우, optimistic update 롤백은
`onMutate`에서 `getQueriesData` 스냅샷 → `onError`에서 `forEach setQueryData` 즉시 복원이 올바른 패턴.

`onError`에서 `invalidateQueries`를 사용하면 refetch 왕복 시간 동안 UI가 낙관적 상태로 남아 사용자에게 깜빡임.

**올바른 패턴 — `getQueriesData` 스냅샷 + `onError` forEach 즉시 복원:**

```typescript
// ✅ onMutate: 스냅샷 캡처 + optimistic update
onMutate: async ({ id }) => {
  await queryClient.cancelQueries({ queryKey: queryKeys.checkouts.view.all() });
  const previousViewQueries = queryClient.getQueriesData<PaginatedResponse<T>>(
    { queryKey: queryKeys.checkouts.view.all() }
  );
  queryClient.setQueriesData<PaginatedResponse<T>>(
    { queryKey: queryKeys.checkouts.view.all() },
    (old) => old ? { ...old, data: old.data.map((co) => co.id === id ? { ...co, status: newStatus } : co) } : old
  );
  return { previousViewQueries };
},

// ✅ onError: 스냅샷 즉시 복원 (refetch 없음)
onError: (error, variables, context) => {
  context?.previousViewQueries?.forEach(([key, data]) => {
    queryClient.setQueryData(key, data);   // ← onError 컨텍스트 — 허용
  });
},

// ❌ 금지 — invalidateQueries로 롤백 (UI 깜빡임)
onError: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.view.all() });
}
```

**탐지 — `onError` 내 `invalidateQueries` 롤백 (스냅샷 없이):**
```bash
# onError에 invalidateQueries만 있고 previousViewQueries 없는 패턴 탐지
grep -A 5 "onError\s*:" apps/frontend/components/**/*.tsx \
  | grep "invalidateQueries" | grep -v "//\|self-audit"
```

**PASS:** `onError` 롤백이 스냅샷 복원 패턴 사용.
**INFO:** `invalidateQueries`만 사용 시 의도적 여부 확인.

**Note:** `onError`에서의 `setQueryData`는 **허용** — 스냅샷 타입이 왕복 보존됨 (TData/TCachedData 불일치 없음).
`onSuccess`에서의 `setQueryData`만 금지 (Memory: useOptimisticMutation 버그 이력).

**예외:**
- `useOptimisticMutation` 사용 시 — 훅 내부에서 처리, 이 패턴 불필요.
- optimistic update 없는 단순 뮤테이션 — `onError`에서 `invalidateQueries` 허용.

---

## Step 35: bulk approve/reject는 `runWithConcurrency` worker pool 패턴 — `Promise.allSettled` 직접 호출 금지 (2026-04-30 추가)

**규칙**: `bulkApprove` / `bulkReject` 같은 대량 비동기 작업은 `Promise.allSettled(ids.map(...))` 직접 호출을 금지하고, 동시성 제한 worker pool인 `runWithConcurrency(tasks, BULK_CONCURRENCY_LIMIT)` 패턴을 사용한다.

**왜 직접 `Promise.allSettled`가 문제인가**: N개 항목 전체를 동시에 시작하면 백엔드 처리량을 초과해 rate-limit/timeout이 발생한다. Worker pool 패턴은 항상 `BULK_CONCURRENCY_LIMIT`개만 활성 상태를 유지하며, task 완료 즉시 다음 task를 grab하므로 slow outlier가 전체 배치를 지연시키지 않는다.

**검증 명령**:
```bash
# bulkApprove / bulkReject 함수 본문에서 직접 Promise.allSettled 호출 탐지
# (runWithConcurrency 내부에서의 사용은 허용)
grep -n "Promise.allSettled" apps/frontend/lib/api/approvals/actions.ts | \
  grep -v "runWithConcurrency"
# 기대: 0건 — Promise.allSettled는 runWithConcurrency 내부에서만 허용
```

```bash
# runWithConcurrency 존재 + BULK_CONCURRENCY_LIMIT 상수 확인
grep -n "runWithConcurrency\|BULK_CONCURRENCY_LIMIT" \
  apps/frontend/lib/api/approvals/actions.ts
# 기대: runWithConcurrency 함수 정의 1건 + BULK_CONCURRENCY_LIMIT 상수 1건 + 사용처 2건(bulkApprove/bulkReject)
```

**PASS**: `bulkApprove`/`bulkReject` 본문에 `Promise.allSettled` 직접 호출 0건, `runWithConcurrency` 경유 확인.
**FAIL**: 직접 호출 발견 → `runWithConcurrency` 함수로 래핑.

**올바른 패턴**:
```typescript
// ✅ CORRECT — worker pool: 항상 BULK_CONCURRENCY_LIMIT개만 active
const results = await runWithConcurrency(
  ids.map((id) => () => approve(category, id, comment, equipmentId, originalData)),
  BULK_CONCURRENCY_LIMIT
);

// ❌ WRONG — N개 동시 실행 → rate-limit 위험
const results = await Promise.allSettled(
  ids.map((id) => approve(category, id, comment))
);
```

**관련 파일**:
- `apps/frontend/lib/api/approvals/actions.ts` — `runWithConcurrency` + `BULK_CONCURRENCY_LIMIT = 5` 정의 및 사용

**발생 이력 (2026-04-30 신설)**: tech-debt-batch-0430b bulk-approve-rate-limit 작업. 초기 배치 방식(`chunk` 기반)에서 진짜 세마포어(worker pool) 방식으로 교체. 배치 방식은 slow outlier가 전체 chunk를 지연시키는 문제가 있어, `nextIndex` 공유 변수로 worker가 즉시 다음 task를 grab하는 구조로 개선.

**예외 (2026-04-30 보강, Sprint 4.5 D2 delegation)**: 도메인이 backend bulk endpoint(`/api/<domain>/bulk-approve`, `/bulk-reject`)를 제공하는 경우, frontend는 `runWithConcurrency` 우회가 **허용**된다. 이유: backend가 `Promise.allSettled` + AuditLog `entityIdPath: 'body.ids'` 통합 기록 + DB transaction 단위로 처리하므로 frontend의 worker pool은 불필요. 이 경우 `approvalsApi.bulkApprove/bulkReject`에 `isCheckoutCategory(category)` 같은 도메인 분기를 두고 `checkoutApi.bulkApproveCheckouts`/`bulkRejectCheckouts`로 위임. 다른 도메인(equipment, calibration 등)은 기존 worker pool 패턴 유지.

**Delegation 검증 명령**:
```bash
# 도메인 분기 + 단일 HTTP 호출 패턴 확인
grep -B2 -A5 "isCheckoutCategory\|isCalibrationCategory\|is.*Category" \
  apps/frontend/lib/api/approvals/actions.ts | grep -E "bulk(Approve|Reject)Checkouts|bulk(Approve|Reject)Calibrations"
# 기대: domain-specific bulk 함수 호출 (return 1줄)

# 도메인 카테고리 SSOT derive 확인 (인라인 배열 금지)
grep -n "CHECKOUT_CATEGORIES\s*=" apps/frontend/lib/api/approvals/actions.ts
# 기대: ApprovalCategoryValues.OUTGOING/INCOMING 같은 SSOT 경유 (리터럴 인라인 0)
```

---

## Step 39: 프론트엔드 mutation에 version 전달 — CAS 무력화 차단 (2026-05-03 verify-cas Step 9 흡수)

상태 변경 API 함수(approve/reject/update/cancel/close)는 반드시 `version: number` 파라미터를 받아 서버에 전달한다. 상세 탐지 명령어와 예시는 [references/step-details.md](references/step-details.md#step-39-프론트엔드-mutation에-version-전달--cas-무력화-차단)를 참조.

---

## Step 40: useCasGuardedMutation + 2-step Dialog AP-4 — confirm 진입 전 version 재조회 (2026-05-03 verify-cas Step 12·13 흡수)

3단계 승인 워크플로우는 `useCasGuardedMutation` fetch-before-mutate 패턴을 사용하고, 2-step 확인 다이얼로그는 confirm 진입 직전 최신 버전을 재조회한다. 상세 탐지 명령어와 예시는 [references/step-details.md](references/step-details.md#step-40-usecasguardedmutation--2-step-dialog-ap-4--confirm-진입-전-version-재조회)를 참조.
