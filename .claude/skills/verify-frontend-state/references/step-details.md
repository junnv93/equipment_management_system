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
