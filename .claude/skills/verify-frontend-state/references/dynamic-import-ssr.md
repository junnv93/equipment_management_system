# 동적 import / SSR 경계 / sessionStorage TTL — verify-frontend-state references

> 2026-05-03 verify-frontend-state 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> api-ts 훅 금지, server/client 경계, useEffect TDZ/deps 안정화, sessionStorage 패턴을 다룬다.
> Contract keyword guard: `dynamic(`.

---

## Step 18: `*-api.ts`에 React Hook 금지 (2026-04-21 추가)

`lib/api/*-api.ts` 파일은 순수 API 함수 집합이어야 한다. `useQuery`, `useMutation`, `useQueryClient` 등 React Hook import 또는 함수 정의가 포함되면 안 된다. 도메인별 훅 함수는 `hooks/use-<domain>.ts`로 분리한다.

**배경:** `calibration-api.ts`에 `useCalibrationDetail`이 혼재 → `hooks/use-calibration.ts`로 이동 (2026-04-21).

**탐지:**
```bash
# *-api.ts 파일에서 useQuery/useMutation 등 React Hook import 탐지
grep -rn "from '@tanstack/react-query'" \
  apps/frontend/lib/api \
  --include="*-api.ts"
```

**PASS:** `lib/api/*-api.ts` 파일에 `@tanstack/react-query` import 0건.
**FAIL:** `useQuery`/`useMutation`/`useQueryClient`가 api 파일에서 import됨 → `hooks/use-<domain>.ts`로 이동 필요.

**올바른 사용 패턴:**
```typescript
// ✅ 올바른 패턴 — VERSION_CONFLICT는 훅 내부에서 자동 처리
const reviewMutation = useCasGuardedMutation({
  fetchCasVersion: () => calibrationPlansApi.getCalibrationPlan(planUuid).then((p) => p.casVersion),
  mutationFn: (_, casVersion) => calibrationPlansApi.reviewCalibrationPlan(planUuid, { casVersion }),
  onSuccess: () => { invalidateAfterChange(); },
  onError: (error) => { toast({ variant: 'destructive', description: error.response?.data?.message }); },
  // VERSION_CONFLICT는 onError에 전달되지 않으므로 별도 분기 불필요
});
```

**예외:** `use-cas-guarded-mutation.ts` 자체 내부의 `isConflictError` 처리 — SSOT 정의이므로 정상.

---

## Step 19: shared/generic 컴포넌트에서 useAuth 금지 (2026-04-21 추가)

`components/shared/`, `components/ui/` 등 여러 도메인에서 재사용되는 **프레젠테이션 컴포넌트**는
`useAuth()`를 직접 호출해서는 안 된다. 권한 판단 결과를 props(`canAct`, `canEdit` 등)로 주입받아야 한다.

**이유:** 프레젠테이션 컴포넌트가 인증 컨텍스트(useAuth)에 의존하면:
- 스토리북/단위 테스트 시 AuthProvider 래핑 강제
- 컴포넌트를 서버 컴포넌트로 전환하기 어려움
- 같은 컴포넌트를 다른 권한 조건으로 재사용 불가

**탐지:**
```bash
# components/shared/, components/ui/ 에서 useAuth import 탐지
grep -rn "use-auth\|useAuth" \
  apps/frontend/components/shared \
  apps/frontend/components/ui \
  --include="*.tsx" --include="*.ts"
```

**❌ 금지 — 프레젠테이션 컴포넌트 내부 권한 판단:**
```typescript
// EmptyState.tsx — 수정 전 (anti-pattern)
export function EmptyState({ primaryAction }: EmptyStateProps) {
  const { can } = useAuth(); // ← 프레젠테이션 컴포넌트에 인프라 의존성 주입
  const showPrimary = primaryAction?.permission ? can(primaryAction.permission) : true;
}
```

**✅ 올바른 패턴 — Container가 권한 판단 후 props로 전달:**
```typescript
// EmptyState.tsx — 수정 후 (presentation)
export function EmptyState({ canAct }: EmptyStateProps) {
  const showPrimary = canAct !== false; // props 수신만
}

// OutboundCheckoutsTab.tsx — Container
const { can } = useAuth();
const canCreateCheckout = can(Permission.CREATE_CHECKOUT);
<EmptyState canAct={canCreateCheckout} />
```

**PASS:** `components/shared/`, `components/ui/` 내에서 `useAuth` import 0건.
**FAIL:** shared/ui 컴포넌트에서 `useAuth` 발견 → `canXxx?: boolean` prop으로 전환, 소비처(container)에서 `useAuth().can()` 호출.

**예외:** `hooks/use-auth.ts` 자체 정의 파일 — 제외.

**근거:** 2026-04-21 78차 반출 세션 — `EmptyState.tsx` 내부 `useAuth` 제거 + `canAct?: boolean` prop 전환. 동일 패턴 재도입 방지.

---

## Step 20: `isMounted` ref skip-first-render 패턴 (2026-04-22 추가)

`useEffect`가 마운트 시 실행되어 상태를 변경하는 것을 방지하려면 `useRef<boolean>`으로
마운트 여부를 추적하고 첫 번째 렌더링 시 effect를 건너뛰는 패턴을 사용한다.

이 패턴은 "상태 변경 → 가이던스 키 갱신 → 포커스 이전" 연쇄에서 마운트 시 불필요한
포커스 이전/애니메이션 실행을 방지하기 위해 도입됨 (NCDetailClient.tsx 기준).

**올바른 패턴:**
```typescript
const isMounted = useRef(false);

useEffect(() => {
  if (!isMounted.current) {
    isMounted.current = true;
    return; // 마운트 시 실행 건너뜀
  }
  // 실제 동작 (상태 변경 후에만 실행)
  guidanceTitleRef.current?.focus();
}, [guidanceKey]);
```

**탐지 — isMounted ref 없이 마운트 시 실행되는 포커스/애니메이션 effect:**
```bash
# guidanceKey, status 등 상태 의존 useEffect에서 isMounted guard 없이 focus 호출
grep -rn "useEffect" apps/frontend/components --include="*.tsx" -A 5 \
  | grep -B 3 "\.focus()" | grep -v "isMounted\|requestAnimationFrame"
```

**PASS:** 마운트 시 실행 방지가 필요한 포커스 전환 effect에 `isMounted.current` guard 존재.
**FAIL:** `useEffect(() => { ref.current?.focus() }, [someState])` — 첫 렌더에도 포커스 강제 이전.

**예외:**
- `useEffect(() => { ref.current?.focus() }, [])` — 의도적 마운트 포커스 (모달 오픈 등)
- `useEffect(() => { ref.current?.focus() }, [open])` — 열기/닫기 조건 포커스

**관련 파일:**
- `apps/frontend/components/non-conformances/NCDetailClient.tsx` — isMounted 패턴 최초 도입 (NC 가이던스 키 갱신 후 포커스 이전)

---

## Step 21: 런타임 feature flag로 union 타입 내로잉 금지 (2026-04-26 추가)

런타임 불리언 플래그(예: `isInboundBffEnabled()`)로 `A | B` union 타입 변수를 내로잉할 수 없다.
TypeScript는 함수 반환값이 타입 가드(`value is T`)가 아닌 이상 타입을 좁히지 않는다.
따라서 `if (bffEnabled) resolvedData?.items` 에서 `resolvedData`가 `A | B`이면 `.items` 접근이 불가능하다.

**올바른 패턴:** union 변수 대신 원본 소스 변수를 직접 ternary로 선택.

```typescript
// ❌ WRONG — resolved union 변수는 내로잉 불가
const resolvedRentalData: RentalImportListResponse | InboundOverviewSection | undefined =
  bffEnabled ? overviewData?.rental : rentalImportsData?.data;

// TypeScript: (A | B)['items'] — 두 타입 모두에 items 없으면 오류
const items = resolvedRentalData?.items; // ← TS2339

// ✅ CORRECT — 원본 소스 변수를 ternary로 직접 접근
const items = bffEnabled
  ? overviewData?.rental?.items
  : rentalImportsData?.data?.items;
```

**탐지 — feature flag ternary 결과로 union 변수 선언 후 필드 접근:**
```bash
# isXxxEnabled() 결과로 union 타입 변수를 선언하는 패턴
grep -rn "isInboundBffEnabled\|bffEnabled\|featureEnabled" \
  apps/frontend/app apps/frontend/components \
  --include="*.tsx" --include="*.ts" \
  | grep "? .*: " | grep -v "return\|className\|enabled:"
```

**PASS:** feature flag ternary 결과를 union 변수에 담지 않고 원본 소스 변수를 ternary로 직접 사용.
**FAIL:** `const resolvedX = flag ? A : B` 선언 후 `resolvedX.fieldName` 접근 — TypeScript 타입 오류 발생.

**근거:** `InboundCheckoutsTab.tsx` Sprint 3.2에서 `resolvedRentalData: RentalImportListResponse | InboundOverviewSection`
패턴을 사용했다가 `.items`, `.meta.totalItems` 등 필드 접근 시 8개 TS 오류 발생 (2026-04-26).

---

## Step 21 확장: `useOnlineStatus` SSOT 훅 — 클라이언트 컴포넌트의 `navigator.onLine` 직접 사용 금지 (2026-04-28 추가)

**규칙**: 오프라인/온라인 상태 감지가 필요한 컴포넌트는 반드시 `hooks/use-online-status.ts`의 `useOnlineStatus()` 훅을 경유. `navigator.onLine`, `'online'/'offline'` 이벤트 리스너 직접 등록 금지.

**근거**: `useOnboardingHint`와 동일한 SSOT 훅 패턴. 다른 페이지에서 독자적인 오프라인 감지 로직이 생기면 (1) `navigator.onLine` false positive 처리 분산, (2) 이벤트 리스너 cleanup 누락, (3) `lastOnlineAt` 추적 일관성 깨짐.

**검증 명령**:
```bash
grep -rEn "navigator\.onLine|addEventListener\(['\"](online|offline)['\"]" \
  apps/frontend/components apps/frontend/app apps/frontend/hooks \
  --include='*.ts' --include='*.tsx' \
  | grep -v "use-online-status\|//\|node_modules"
# 기대: 0건
```

**PASS**: 모든 사용처가 `useOnlineStatus()` 훅 경유.
**FAIL**: 컴포넌트에서 `addEventListener('online'|'offline', ...)` 직접 등록 또는 `useState(navigator.onLine)` 초기값.
**예외**: `hooks/use-online-status.ts` 자체.

**관련 파일**:
- `apps/frontend/hooks/use-online-status.ts` — SSOT
- `apps/frontend/components/dashboard/OfflineBanner.tsx` — 소비처
- `apps/frontend/components/checkouts/CheckoutEmptyState.tsx` — 소비처 (network variant)

---

## Step 25: `useEffect` dependency array TDZ 패턴 — 선언 이전 변수 참조 금지 (2026-04-29 추가)

React 함수 컴포넌트에서 `useEffect`의 dependency array는 **렌더 함수 실행 중 동기적으로 평가**된다.
따라서 `const { data: teamsData } = useQuery(...)` 선언 이전에 `useEffect(() => {...}, [teamsData?.data])` 를 두면,
dependency array 평가 시점에 `teamsData`가 Temporal Dead Zone(TDZ)에 있어 `ReferenceError`가 발생한다.

콜백 함수 내부(`() => { teamsData?.data.find(...) }`)는 나중에 실행되는 클로저라서 괜찮지만,
**dependency array 자체는 렌더 시 즉시 평가되는 표현식**이라 TDZ를 벗어나지 못한다.

**규칙:** `useQuery`/`useState`/`useMemo`로 선언된 변수를 참조하는 `useEffect`는 해당 선언 이후에 위치해야 한다.

**탐지 — useQuery 결과를 dep array에서 참조하는 useEffect가 선언보다 앞에 있는지:**

정적 grep으로 정확한 순서를 판정하기는 어렵지만, 같은 파일에서 의심 패턴을 좁힐 수 있다:
```bash
# 컴포넌트 파일에서 useQuery 결과를 dep array에 쓰는 useEffect 패턴 탐지
# (수동 검토: 해당 변수 선언이 useEffect 이후에 있는지 확인)
grep -rn "useEffect" apps/frontend/components apps/frontend/app \
  --include="*.tsx" -A 10 \
  | grep -E "\[.*Data\?\.|\[.*data\?" \
  | grep -v "node_modules\|// "
```

실질적인 검증은 빌드 타임 오류로 확인:
```bash
pnpm --filter frontend exec tsc --noEmit 2>&1 | grep "ReferenceError\|before initialization"
```

**❌ FAIL 패턴 (TDZ 유발):**
```typescript
// Effect B — teamsData를 dep array에서 참조
useEffect(() => {
  if (!teamsData?.data) return;          // 콜백 내부는 OK (클로저)
  // ...
}, [teamsData?.data, ...]);             // ← dep array 동기 평가 시 TDZ!

// ← teamsData 선언이 아직 없음
const { data: teamsData } = useQuery({ ... }); // 선언이 뒤에 있음
```

**✅ PASS 패턴 (선언 이후 배치):**
```typescript
const { data: teamsData } = useQuery({ ... }); // 선언 먼저

useEffect(() => {
  if (!teamsData?.data) return;
  // ...
}, [teamsData?.data, ...]);             // ← dep array 평가 시점에 teamsData 선언됨
```

**PASS:** `useQuery` 결과를 dep array에 사용하는 `useEffect`가 해당 `useQuery` 선언 이후에 위치.
**FAIL:** `tsc --noEmit`에서 `Cannot access 'X' before initialization` 오류 발생.

**배경:** `CreateCheckoutContent.tsx`의 Effect B가 `teamsData` useQuery 선언 이전에 위치해 `ReferenceError` 발생 (2026-04-29). Radix UI Select 초기화 순서 요구사항으로 인해 팀 시드 effect를 teamsData 로드 이후로 분리하면서 발견.

**관련 파일:**
- `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` — TDZ 수정 사례

---

## Step 32: useEffect deps 안정화 — useRef 패턴 (eslint-disable 회피) (2026-04-28 추가)

**근거:** `t (next-intl)`, `toast (shadcn singleton)` 같은 stable ref이 useEffect deps에 포함되면 `react-hooks/exhaustive-deps` 만족하지만 향후 구현 변경(매 렌더 새 참조 반환)으로 re-render loop 회귀 위험. `eslint-disable-next-line react-hooks/exhaustive-deps`는 self-audit 7대 원칙(eslint-disable 0)에 위반. 시니어 표준은 useRef로 deps 외부화.

**검증:**

```bash
# 1) eslint-disable react-hooks/exhaustive-deps 0건 (self-audit 정합)
grep -rn "eslint-disable.*react-hooks/exhaustive-deps" \
  apps/frontend/components apps/frontend/hooks 2>/dev/null
# 기대: 0 hits

# 2) toast/t 같은 stable ref가 useEffect deps에 포함되면 useRef 외부화 패턴 권고
# (자동 검출 어려움 — 코드 리뷰에서 grep으로 확인)
grep -nB 1 "useEffect" apps/frontend/components apps/frontend/hooks --include="*.tsx" -r 2>/dev/null | \
  grep -E "}, \[.*toast|}, \[.*\bt[,)]"
# 0 hits 기대 (있으면 useRef 패턴으로 교체)
```

**PASS:** eslint-disable react-hooks 0건 + stable ref(t/toast) deps 직접 포함 0건.
**FAIL:** `}, [filters.id, t, toast]` 같은 deps 배열에 next-intl `t` 또는 shadcn `toast` 직접 포함.

**해결 패턴:**
```tsx
const tRef = useRef(t);
const toastRef = useRef(toast);
useEffect(() => {
  tRef.current = t;
  toastRef.current = toast;
});
useEffect(() => {
  // ...
  toastRef.current({ title: tRef.current('key') });
}, [otherDeps]); // t/toast 외부화
```

**예외:** `useTranslations(ns)` 결과를 `useMemo`로 처리 + dep로 포함 (권장 안 됨, useRef가 더 정합).

**발생 이력 (2026-04-28):** EquipmentFilters useEffect reconcile 안전망에 `t/toast` deps 포함 → eslint-disable 추가 시 self-audit FAIL → useRef 패턴(`tRef/toastRef`) 적용으로 양쪽 정합.

---

## Step 37: sessionStorage TTL + try/catch + one-shot 패턴 (2026-04-30 추가, Sprint 4.5 U-07)

**규칙**: `sessionStorage`/`localStorage`를 사용하는 클라이언트 헬퍼는 다음 3가지 패턴을 모두 만족해야 한다:

1. **try/catch silent fallback** — `setItem`/`getItem`/`removeItem` 모든 호출이 try/catch로 감싸져 있어야 함 (private mode, 권한 차단, 용량 초과 시 silent fallback). 호출자에게 throw 전파 금지.
2. **TTL 검증** — 시간 의존 데이터(컨텍스트 복원, 캐시 등)는 timestamp + TTL 비교 필수. 만료 시 null 반환 + storage에서 자동 삭제.
3. **One-shot read** — 일회성 데이터(돌아가기 컨텍스트 등)는 read 후 자동 `removeItem`으로 두 번 복원되지 않도록 보장.

**규칙 근거:**
- private/incognito mode → sessionStorage `setItem` throw `QuotaExceededError`. throw 전파 시 페이지 crash.
- TTL 없는 데이터는 사용자가 1주일 후 돌아왔을 때 stale context 복원 → 의도와 어긋난 UX.
- one-shot 미적용 시 detail → list → detail → list 반복할 때 매번 같은 stale context 복원.

**올바른 패턴 (`checkout-return-context.ts` 기준):**
```typescript
// ✅ try/catch 모든 storage 호출 wrap
export function saveCheckoutListContext(searchParams: URLSearchParams | string): void {
  try {
    const query = typeof searchParams === 'string' ? searchParams : searchParams.toString();
    if (!query) return;
    const payload: StoredContext = { query, ts: Date.now() };
    sessionStorage.setItem(CHECKOUT_RETURN_CONTEXT_KEY, JSON.stringify(payload));
  } catch {
    // private mode silent fallback (URL이 SSOT)
  }
}

// ✅ TTL 검증 + one-shot removeItem
export function restoreCheckoutListContext(): URLSearchParams | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_RETURN_CONTEXT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredContext(parsed)) return null;
    if (Date.now() - parsed.ts > CHECKOUT_RETURN_CONTEXT_TTL_MS) {
      sessionStorage.removeItem(CHECKOUT_RETURN_CONTEXT_KEY); // ← 만료 자동 청소
      return null;
    }
    sessionStorage.removeItem(CHECKOUT_RETURN_CONTEXT_KEY); // ← one-shot
    return new URLSearchParams(parsed.query);
  } catch {
    return null;
  }
}
```

**탐지 — try/catch 누락:**
```bash
# sessionStorage/localStorage setItem이 try/catch 외부에 있는 패턴 탐지
grep -B5 "sessionStorage\.\(setItem\|getItem\|removeItem\)\|localStorage\.\(setItem\|getItem\|removeItem\)" \
  apps/frontend/lib/utils/ apps/frontend/hooks/ \
  --include="*.ts" --include="*.tsx" \
  | grep -B5 -A1 "sessionStorage\|localStorage" | grep -v "try {" | grep "sessionStorage\|localStorage" | head -10
# 기대: 0건 (모든 호출이 try block 내부)
```

**탐지 — TTL 누락:**
```bash
# 시간 의존 storage 헬퍼에 TTL/expires/timestamp 키워드 존재 확인
grep -l "sessionStorage.setItem\|localStorage.setItem" apps/frontend/lib/utils/*.ts | \
  while read f; do
    if ! grep -qE "(TTL|EXPIRES|timestamp|ts:|expiresAt)" "$f"; then
      echo "TTL 누락 의심: $f"
    fi
  done
# 기대: 빈 출력 (storage 헬퍼는 TTL 또는 명시적 영구 보존 의도 주석 보유)
```

**탐지 — One-shot 패턴 (read 후 removeItem):**
```bash
# restore* 함수가 getItem 후 removeItem을 호출하는지 확인
grep -A20 "export function restore" apps/frontend/lib/utils/ apps/frontend/hooks/ \
  --include="*.ts" -r | grep -E "removeItem"
# 기대: 호출자 함수당 1건 이상 (one-shot 의도가 있는 경우)
```

**PASS:** 3 패턴 모두 적용 — try/catch wrap + TTL 검증 + one-shot removeItem.
**FAIL:** ① throw 전파 가능, ② TTL 없이 stale context 영구 보존, ③ 두 번 read 가능 → 헬퍼 재설계.

**예외:**
- 영구 사용자 설정 (예: 사이드바 collapsed 상태) — TTL 불필요, one-shot 불필요. try/catch만 필수.
- 플래그성 boolean (예: 첫 방문 마커) — TTL/one-shot 의도 명시 후 패턴 선택.

**관련 파일:**
- `apps/frontend/lib/utils/checkout-return-context.ts` — 3 패턴 모두 적용 참조 구현 (Sprint 4.5 U-07, 2026-04-30 신설)
- `apps/frontend/lib/utils/__tests__/checkout-return-context.test.ts` — TTL/private mode/one-shot 단위 테스트 20건

**발생 이력 (2026-04-30 신설)**: Sprint 4.5 U-07 돌아가기 컨텍스트 보존 작업에서 `restoreCheckoutListContext()`가 한 번 사용 후 sessionStorage에서 자동 삭제되어야 한다는 요구. private mode에서 throw 발생 시 silent fallback + URL이 SSOT이므로 storage 차단되어도 동작 보장. 단위 테스트로 3 패턴 모두 검증.
