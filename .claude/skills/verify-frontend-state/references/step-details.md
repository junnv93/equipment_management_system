# 프론트엔드 상태 관리 검증 — Step 상세

## Step 1: useState로 서버 상태 관리

```bash
grep -rn "useState<.*Response\|useState<.*\[\]>\|useState<.*Data" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|isLoading\|isOpen\|isDialog\|isModal\|selected\|form\|input\|search\|filter\|tab\|page\|sort\|expanded\|collapsed\|visible\|show\|open\|close\|toggle\|active\|disabled\|error\|message\|text\|value\|checked\|node_modules"
```

## Step 2: onSuccess에서 setQueryData 금지

```bash
grep -rn "onSuccess" apps/frontend --include="*.ts" --include="*.tsx" -A 10 | grep "setQueryData"
```

참고: `onMutate`에서의 setQueryData는 optimistic update이므로 정상.

## Step 3: useOptimisticMutation 사용

```bash
grep -rn "useMutation(" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "useOptimisticMutation\|// \|node_modules\|use-optimistic-mutation"
```

## Step 4: invalidateQueries 위치

```bash
grep -rn "useOptimisticMutation" apps/frontend --include="*.ts" --include="*.tsx" -l | xargs grep -l "invalidateQueries" 2>/dev/null | grep -v "use-optimistic-mutation\|cache-invalidation"
```

규칙:
- `useOptimisticMutation` → 훅 자체가 `onSettled`에서 처리. 소비자가 별도 invalidate하면 중복 위반.
- `direct useMutation` → `onSuccess`에서 무효화 + UI 전환 순서 보장.

### Step 4b: Navigate-Before-Invalidate 안티패턴

```bash
grep -rn "onSuccess" apps/frontend/components apps/frontend/hooks --include="*.tsx" --include="*.ts" -A 15 | grep -B 5 "router\.push\|router\.replace" | grep "invalidateQueries" | grep -v "await"
```

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
```

## Step 5: QUERY_CONFIG 프리셋

```bash
grep -rn "staleTime:" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "QUERY_CONFIG\|query-config\|// "
```

### Step 5b: countsAll prefix 기반 캐시 무효화

```bash
grep -rn "approvals\.counts()" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|// "
```

```typescript
// ❌ WRONG — prefix 매칭 실패
invalidateKeys: [queryKeys.approvals.counts()],

// ✅ CORRECT — prefix 키
invalidateKeys: [queryKeys.approvals.countsAll],
```

### Step 5c: CheckoutCacheInvalidation SSOT

```bash
grep -rn "invalidateQueries.*queryKeys\.checkouts\." apps/frontend/components apps/frontend/hooks --include="*.ts" --include="*.tsx" | grep -v "cache-invalidation\|CheckoutCacheInvalidation\|// "
```

```bash
grep -rn "invalidateKeys:\s*\[queryKeys\." apps/frontend/app apps/frontend/components --include="*.tsx" --include="*.ts" | grep -v "// "
```

## Step 6: REFETCH_STRATEGIES 하드코딩

```bash
grep -rn "refetchInterval:\s*[0-9]" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "query-config\|QUERY_CONFIG\|// "
```

```tsx
// ❌ WRONG
refetchInterval: 60000,

// ✅ CORRECT
...QUERY_CONFIG.DASHBOARD, // REFETCH_STRATEGIES.NORMAL
```

4-level 전략: CRITICAL(30s), IMPORTANT(2m), NORMAL(focus만), STATIC(수동).

## Step 7: useDateFormatter 컨벤션

```bash
# 7a: formatDate 직접 import
grep -rn "import.*formatDate.*from.*lib/utils/date" apps/frontend/components --include="*.tsx" | grep -v "// "

# 7b: date-fns format() 직접 import
grep -rn "import.*{ *format *}.*from ['\"]date-fns['\"]" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|node_modules"
```

예외: `<input type="date">` value 생성 등 HTML spec 요구 고정 포맷은 직접 사용 정당.

## Step 8: 프론트엔드 성능 안티패턴

### 8a: Client Component에서 서버 함수 호출

```bash
grep -rn "'use client'" apps/frontend/app --include="*.tsx" -l | xargs grep -l "getServerAuthSession\|serverApiClient" 2>/dev/null
```

### 8b: 무거운 라이브러리 dynamic import 누락

```bash
grep -rn "^import.*from ['\"]recharts\|^import.*from ['\"]chart\.js\|^import.*from ['\"]@monaco-editor\|^import.*from ['\"]react-quill\|^import.*from ['\"]@tiptap" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|node_modules\|dynamic"
```

## Step 9: useAuth().can() 권한 SSOT

```bash
grep -rn "import.*hasPermission.*from.*shared-constants" apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v "// \|node_modules\|nav-config\|permission-helpers\|use-auth"
```

예외: `nav-config.ts`, `permission-helpers.ts`, `use-auth.ts`, Server Component(`page.tsx`).

## Step 39: 프론트엔드 mutation에 version 전달 — CAS 무력화 차단

상태 변경 API 함수(approve/reject/update/cancel/close)는 반드시 `version: number` 파라미터를 받아 서버에 전달해야 한다. 미전달 시 backend `updateWithVersion()`이 stale version으로 동작하여 CAS가 무력화됨.

```bash
# approve/reject API 함수에서 version 파라미터 누락 탐지
grep -rn "version" apps/frontend/lib/api/checkout-api.ts \
  apps/frontend/lib/api/calibration-api.ts \
  apps/frontend/lib/api/non-conformances-api.ts \
  apps/frontend/lib/api/equipment-api.ts | grep -i "approve\|reject\|update"
# PASS: 모든 상태 변경 API 함수가 version 파라미터 포함
# FAIL: version 누락 (CAS 비무력화 보장 깨짐)
```

```typescript
// ✅ CORRECT — version 명시 전달
export async function approveCheckout(id: string, version: number, dto: ApproveCheckoutDto) {
  return apiClient.patch(`/checkouts/${id}/approve`, { ...dto, version });
}

// ❌ WRONG — version 누락
export async function approveCheckout(id: string, dto: ApproveCheckoutDto) {
  return apiClient.patch(`/checkouts/${id}/approve`, dto); // backend CAS 무력화
}
```

상세 backend 검증: verify-zod Step 19 + [verify-zod/references/cas-checks.md](../../verify-zod/references/cas-checks.md) Step 1~11.

## Step 40: useCasGuardedMutation + 2-step Dialog AP-4 — confirm 진입 전 version 재조회

**규칙 (40-A)**: 3단계 승인 워크플로우(submit/approve/reject/confirm)에서는 `useCasGuardedMutation` 훅으로 fetch-before-mutate 패턴을 사용한다. mutation 직전 최신 `casVersion` 을 API에서 조회하여 stale closure 위험을 완전히 차단.

**규칙 (40-B)**: 2-step 확인 다이얼로그(input→confirm)에서 confirm 단계 진입 직전에 최신 버전을 재조회하여 다른 탭/세션의 stale 상태를 감지. NC Phase 4(AP-4)에서 도입.

필수 조건:
- `handleNext` 또는 confirm 진입 핸들러에서 API 재조회 후 version 비교
- 불일치 시 toast + invalidateQueries + dialog 닫기

```tsx
// ✅ CORRECT — confirm 진입 직전 version 재확인
const handleNext = form.handleSubmit(async () => {
  const latest = await api.getEntity(entity.id);
  if (latest.version !== entity.version) {
    toast({ title: t('toasts.versionMismatch'), variant: 'destructive' });
    queryClient.invalidateQueries({ queryKey: queryKeys.entity.detail(entity.id) });
    onClose();
    return;
  }
  setStep('confirm');
});

// ❌ WRONG — version 확인 없이 confirm 진입
const handleNext = form.handleSubmit(async () => {
  setStep('confirm'); // stale 상태로 submit 위험
});
```

```bash
# (40-A) useCasGuardedMutation 사용 확인 — calibration-plans submit/approve/reject/confirm
grep -rln "useCasGuardedMutation" apps/frontend/components --include="*.tsx"
# 기대: calibration-plans submit/approve/reject/confirm dialog에 적용

# (40-B) 2-step dialog (step state) 컴포넌트에서 version 비교 패턴 확인
grep -rln "step.*'confirm'\|setStep.*confirm" apps/frontend/components --include="*.tsx" | \
  xargs grep -l "handleNext\|handleConfirm"
# 위 파일 각각에서 version 비교가 있는지 확인:
# grep -n "\.version\s*!==\|!.*version" <file>
```

현재 적용: `NCRepairDialog.tsx` (handleNext), `NCEditDialog.tsx` (useCasGuardedMutation 내부 처리).

예외: confirm 없이 단일 step으로 submit하는 dialog — 패턴 불필요.

관련 파일:
- `apps/frontend/hooks/use-cas-guarded-mutation.ts` — fetch-before-mutate SSOT 훅
- `apps/frontend/hooks/use-optimistic-mutation.ts` — VERSION_CONFLICT 통합 핸들러
- backend 측 검증: verify-zod Step 19 + [verify-zod/references/cas-checks.md](../../verify-zod/references/cas-checks.md)
