# 캐시 무효화 / UI 상태 패턴 — verify-frontend-state references

> 2026-05-03 verify-frontend-state 분리 — 이 파일은 SKILL.md에서 위임된 sub-domain 상세 체크리스트.
> invalidateKeys, prefix-match, *CacheInvalidation 클래스, UI 상태 discriminated union, undo SSOT를 다룬다.

---

## Step 21: toast-templates toastFn 외부 주입 + useOnboardingHint 패턴 (2026-04-24 추가)

**toast 유틸 레이어는 React Hook을 직접 호출할 수 없다.** `lib/checkouts/toast-templates.ts`처럼
순수 유틸 레이어에서 토스트를 발송하려면 `toastFn`을 외부에서 주입받아야 한다.

**탐지 — 유틸 레이어에서 React Hook 직접 호출:**
```bash
# lib/ 하위에서 use-toast, useToast import 탐지
grep -rn "use-toast\|useToast\|useSonner" apps/frontend/lib --include="*.ts"
```

**✅ 올바른 패턴 — toastFn 외부 주입:**
```typescript
// toast-templates.ts (유틸 레이어)
export function notifyCheckoutAction(
  toastFn: CheckoutToastFn,  // ← 외부 주입
  action: CheckoutAction,
  ctx: CheckoutToastContext,
  t: CheckoutToastTranslate,
): void {
  toastFn({ title: t(`toast.${actionKey}.success`, ctx) });
}

// CheckoutGroupCard.tsx (React 컴포넌트 레이어)
const { toast } = useToast();
approveMutation.mutate({ ... }, {
  onSuccess: (_data, variables) =>
    notifyCheckoutAction(toast, 'approve', { equipmentName: variables.equipmentName }, t)
});
```

**❌ 금지 — 유틸 레이어에서 훅 직접 호출:**
```typescript
// lib/checkouts/toast-templates.ts
import { useToast } from '@/hooks/use-toast'; // ← lib 레이어에서 훅 호출 금지
export function notifyCheckoutAction(...) {
  const { toast } = useToast(); // React 규칙 위반
}
```

**PASS:** `lib/` 하위 `.ts` 파일에서 `useToast`/`useSonner` import 0건.
**FAIL:** 유틸 레이어에서 훅 직접 호출 → `toastFn` 파라미터 패턴으로 변환.

---

**useOnboardingHint: SSR-safe localStorage 힌트 훅 패턴**

`hooks/use-onboarding-hint.ts`가 SSOT. 동일 기능의 새 훅 생성 금지.
`useOnboardingHint(id)` — `isVisible`(표시 여부) + `dismiss()`(영구 해제).

**탐지 — STORAGE_KEY_PREFIX 직접 하드코딩 또는 훅 복제:**
```bash
# 'onboarding-dismissed:' 문자열 직접 사용 탐지
grep -rn "onboarding-dismissed" apps/frontend --include="*.ts" --include="*.tsx" \
  | grep -v "use-onboarding-hint.ts"
```

**PASS:** `use-onboarding-hint.ts` 외부에서 `onboarding-dismissed:` 문자열 0건.
**FAIL:** 컴포넌트 내 직접 localStorage.getItem('onboarding-dismissed:...') → 훅 경유로 전환.

**관련 파일:**
- `apps/frontend/hooks/use-onboarding-hint.ts` — SSOT 훅
- `apps/frontend/lib/checkouts/toast-templates.ts` — toastFn 외부 주입 패턴 참고 구현
- `apps/frontend/components/shared/NextStepPanel.tsx` — useOnboardingHint('checkout-next-step') 사용 예

---

## Step 24: Dual-Mode 비대칭 props — controlled/uncontrolled 절반 주입 silent bug 탐지 (2026-04-28 추가)

**규칙**: 컴포넌트가 `isControlled = propA !== undefined && propB !== undefined` 패턴으로 모드를 결정할 때, 호출처가 propA만 전달하고 propB를 누락하면 `isControlled=false`로 평가되어 자체 fetch 분기 활성화 → props + fetch 혼용 silent bug.

**근거 (사례)**: `CheckoutCard.tsx`는 `upcomingCheckouts`+`overdueCheckouts` 양쪽 주입 시 controlled. 한쪽만 주입하면 `isControlled=false` → 자체 useQuery + 누락 prop 무시.

**검증 명령**:
```bash
# 1. dual-mode 패턴 정의 위치 확인
grep -rEn "isControlled\s*=" apps/frontend/components --include='*.tsx'

# 2. 각 컴포넌트 호출처에서 양측 prop 모두 주입 확인 (수동 검토)
grep -rn "<CheckoutCard\b" apps/frontend --include='*.tsx' | grep -v "//"
```

**PASS**: dual-mode 컴포넌트의 controlled props 양측을 모두 주입하거나 모두 omit.
**FAIL**: prop 절반만 전달 — silent fetch 활성화.
**개선 방안 (권장)**: discriminated union 타입으로 시그니처 강제.
```ts
type Props = { mode: 'controlled'; data: Data } | { mode: 'uncontrolled' };
```

**관련 파일**:
- `apps/frontend/components/dashboard/cards/CheckoutCard.tsx` — dual-mode 정의

---

## Step 25 (React.memo): `React.memo` atom 부모는 함수 prop을 `useCallback`으로 안정화 (2026-04-28 추가)

`React.memo`로 wrap된 atom(예: `InlineActionButton`)을 호출하는 부모 컴포넌트가 `onClick` 등 함수 prop을 *inline arrow* `(e) => {...}`로 전달하면 매 렌더 새 함수 → memo가 매번 props mismatch 판정 → 리렌더 발생 → memo overhead만 누적 (가짜 최적화).

부모가 atom의 memo 효과를 얻으려면:
1. **함수 prop은 `useCallback`** — 의존성 배열 명시
2. **객체 prop은 `useMemo`** (atom이 객체 prop을 받는 경우)
3. **부모 자체가 React.memo** — 그래야 부모 위 변경이 자식까지 캐스케이드되지 않음

```bash
# memo'd atom 호출처에 inline arrow 탐지 (FAIL 패턴)
# 1) memo'd atom 목록
grep -rn "React.memo(\|export const \w\+ = React\.memo" apps/frontend/components/ui
# 2) 각 atom 호출처에서 inline arrow onClick 찾기
grep -rnE "<InlineActionButton[^>]*onClick=\\{?\\(e?\\) ?=>" apps/frontend/components apps/frontend/app
# 기대: 0 hits (모두 useCallback 변수 또는 hoisted 함수 사용)

# useCallback 사용 확인
grep -n "useCallback" apps/frontend/components/shared/NextStepPanel.tsx
# 기대: ≥ 1건 (handler가 stabilize됨)
```

**PASS:**
- memo'd atom의 함수 prop은 모두 `useCallback` 결과 또는 module-level 함수
- inline arrow 0건

**FAIL:**
- `<InlineActionButton onClick={() => doSomething()}>` 같은 inline arrow — 매 렌더 새 함수, memo 무력화
- `<InlineActionButton onClick={(e) => { e.stopPropagation(); ... }}>` — 동일 문제
- atom prop 객체 전달 시 inline literal `{...}` — referential identity 매 렌더 변경

**예외:**
- 부모가 자체 memo 안 된 경우, atom memo 자체의 효과는 *제한적*. 그래도 useCallback은 추가하는 게 좋다 (부모가 추후 memo로 wrap될 때 자동으로 효과 발생).

**관련 파일:**
- `apps/frontend/components/ui/inline-action-button.tsx` — `React.memo` atom
- `apps/frontend/components/shared/NextStepPanel.tsx` — `handlePanelClick` / `handleCompactClick` `useCallback` 모범 사례

**발생 이력 (2026-04-28)**: Phase 3 P0-3 마이그레이션 1차에서 NextStepPanel가 atom에 inline arrow `onClick={(e) => {...}}` 전달 → memo 무력화 → review-architecture/verify-implementation FAIL. useCallback로 stabilize 후 PASS.

---

## Step 31: Nested interactive (a-in-a / Link-in-Link) 차단 (2026-04-28 추가)

**근거:** HTML Interactive Content Model 위반(`<a>` 안 `<a>`/`<button>` 등)은 React 19 hydration error의 직접 원인. 정적/동적 양쪽으로 차단해야 회귀 0 보장.

**검증:**

```bash
# 1) ESLint custom rule (no-restricted-syntax) 정의 + 적용 블록 검증
grep -nE "NESTED_LINK_RULE|NESTED_ANCHOR_RULE" apps/frontend/eslint.config.mjs
# 기대: ≥ 4 hits (정의 2 + 글로벌 룰 + 예외 블록 적용)

# 2) lint 실측
pnpm --filter frontend run lint 2>&1 | grep -E "Nested <Link>|Nested <a>"
# 기대: 0 hits

# 3) JSX 정적 검출 (lint 백업)
grep -rEn "<Link[^>]*>[[:space:]]*<Link|<a[^>]*>[[:space:]]*<a" apps/frontend/components apps/frontend/app
# 기대: 0 hits

# 4) Playwright e2e 회귀 스펙 존재
test -f apps/frontend/tests/e2e/features/layout/sidebar-nav-action.spec.ts && echo "OK"
# 기대: OK
```

**PASS:**
- ESLint `NESTED_LINK_RULE` / `NESTED_ANCHOR_RULE`이 frontend 전체에 적용
- lint 실측 0 violation
- 사이드바 nav row 패턴은 `NavRowWithSecondaryAction`을 사용 (sibling anchor)
- e2e가 콘솔 hydration 에러 0건 + DOM `a > a` 0건 검증

**FAIL:**
- caller가 `<Link>` 안에 또 `<Link>` 직접 렌더 (NavBadge `badgeLinkHref` 분기로 Link 렌더한 회귀 사례)
- caller가 `<a>` 안에 `<button onClick=router.push>` 사용 — WCAG 4.1.1 parsing 위반 + URL 공유/우클릭 새 탭 손실

**예외 정책:**
- 정당한 polymorphic 컴포넌트 충돌 (예: shadcn Slot가 Link로 리졸브되는 경우): `// eslint-disable-next-line no-restricted-syntax -- <사유>` 명시

**해결 패턴 참조:**
- `docs/references/frontend-patterns.md` "Row with Secondary Action Pattern" 섹션
- `apps/frontend/components/layout/NavRowWithSecondaryAction.tsx` 구현 예시

**발생 이력 (2026-04-28):** SidebarItem의 NavBadge가 `badgeLinkHref` optional prop 분기로 Link를 렌더 → `<a>` 안 `<a>` hydration error. `NavRowWithSecondaryAction` 신설 + discriminated union 데이터 모델 + ESLint 룰로 해결.

---

## Step 33: TableRow onClick 내 router.push 네비게이션 금지 (2026-04-29 추가)

**규칙:** `<TableRow onClick={() => router.push(...)}>` 패턴으로 detail 페이지 이동 금지.
올바른 방법: NavLink overlay 패턴 (`absolute inset-0` + `TableRow className="... relative"`) 또는 `useNavigateWithPending`.

```bash
# TableRow에 router.push 네비게이션 탐지
grep -rn "TableRow" apps/frontend/app apps/frontend/components \
  --include="*.tsx" -l | xargs grep -l "router\.push" | \
  xargs grep -n "onClick.*router\.push\|router\.push.*DETAIL\|router\.push.*ROUTES"
```

각 결과 라인:
1. `onClick={() => router.push(ROUTES.DETAIL(id))}` + 같은 파일에 NavLink overlay 없음 → 안티패턴
2. `router.push` in ButtonClick / 폼 submit → 허용 (네비게이션 목적이 아닌 액션)
3. `router.replace(...)` → URL sync 전용 허용

**PASS:** `TableRow onClick` 내 detail 이동 목적 `router.push` 0건.
**FAIL:** `<TableRow onClick={() => router.push(ROUTES.DETAIL(id))}>` 발견 → NavLink overlay로 전환.

> **배경:** 2026-04-29 TestSoftwareListContent `<TableRow onClick={router.push}>` → NavLink overlay 전환으로 해결. `TableRow onClick` 패턴은 키보드 접근성(`Tab+Enter`) 불가, `aria-label` 제공 불가, GlobalProgressBar 미연동 3가지 결함 동시 발생.

---

## Step 34: 다중 다이얼로그 상태 — discriminated union `ActiveDialog` 패턴 (2026-04-30 추가)

**규칙:** 동일 컴포넌트에서 3종 이상의 다이얼로그를 관리할 때, `isOpen + target + comment` 트리플 `useState` 세트를 다이얼로그당 반복하는 대신 단일 discriminated union `ActiveDialog` 상태를 사용한다. TypeScript가 `type` 필드로 narrowing하므로 별도 null-check 불필요.

```typescript
// ✅ CORRECT — 단일 union 상태
type ActiveDialog =
  | { type: 'approve'; target: SomeEntity }
  | { type: 'qualityApprove'; target: SomeEntity }
  | { type: 'reject'; target: SomeEntity }
  | null;

const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

// 다이얼로그 열기
setActiveDialog({ type: 'approve', target: item });

// 다이얼로그에서 target 접근 (TypeScript narrowing)
if (activeDialog?.type === 'approve') {
  mutation.mutate({ id: activeDialog.target.id });
}

// 닫기
setActiveDialog(null);

// ❌ WRONG — 다이얼로그당 3개 상태 × N개 다이얼로그 = 상태 폭발
const [isApproveOpen, setIsApproveOpen] = useState(false);
const [approveTarget, setApproveTarget] = useState<SomeEntity | null>(null);
const [approveComment, setApproveComment] = useState('');
const [isRejectOpen, setIsRejectOpen] = useState(false);
const [rejectTarget, setRejectTarget] = useState<SomeEntity | null>(null);
...
```

```bash
# 동일 컴포넌트에서 다이얼로그 관련 useState 3쌍 이상 탐지
grep -rn "useState<.*null>" apps/frontend --include="*.tsx" | \
  awk -F: '{print $1}' | sort | uniq -c | sort -rn | \
  awk '$1 >= 3 { print $2 }' | \
  xargs -I{} grep -c "useState" {} | \
  paste - - | awk '$2 >= 6 { print $1 " — useState", $2, "개 (union 패턴 검토)" }'
```

**PASS:** 동일 컴포넌트 내 `isXxxOpen + xxxTarget + xxxComment` 같은 3-tuple 반복 패턴 없이 `ActiveDialog` union 사용.
**FAIL:** 동일 기능 다이얼로그 제어용 `useState` 6개 이상 반복 — `ActiveDialog` discriminated union으로 통합 권장.

**예외:** 독립적 목적의 다이얼로그(create + filter + detail 등 서로 다른 도메인)는 별도 boolean으로 유지 가능.

**발생 이력 (2026-04-30):** `SoftwareValidationContent.tsx` approve/qualityApprove/reject 다이얼로그 8개 `useState` → `ActiveDialog` union 1개로 압축. 타입 narrowing 덕에 `if (approveTarget)` null-guard 불필요.

**관련 파일:**
- `apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx` — ActiveDialog union 패턴 참조 구현

---

## Step 36: 카운트 기반 조건부 UI — `!!count` 방어 가드 패턴 (2026-04-30 추가)

**규칙**: 숫자 카운트를 기반으로 UI 요소를 조건부 렌더링하거나 레이블 조합에 포함할 때,
`count > 0` 대신 `!!count`(또는 `count !== 0`) 방어 가드를 사용해야 한다.
`count === 0`을 falsy로 취급해 UI에서 자동 제거되도록 처리하는 패턴이다.

**규칙 근거:**
- `count && <Badge>{count}</Badge>` — `count === 0`이면 `0`이 렌더링됨 (React 텍스트 노드 버그)
- `!!count && <Badge>{count}</Badge>` — `count === 0`이면 `false`가 되어 렌더링 안 됨
- `currentEquipmentCount` 같은 집계값은 데이터 로딩 중 `undefined`이거나 결과 0일 수 있음

**올바른 패턴 (CheckoutListTabs.tsx 기준):**
```typescript
// ✅ !!count 방어 가드 — 0 또는 undefined 모두 렌더링 안 함
{!!currentEquipmentCount && (
  <Badge>{t('list.count.equipment', { count: currentEquipmentCount })}</Badge>
)}

// ❌ 미가드 — count === 0이면 React가 "0"을 렌더링
{currentEquipmentCount && (
  <Badge>{t('list.count.equipment', { count: currentEquipmentCount })}</Badge>
)}
```

**탐지 — 숫자 카운트 미가드 렌더링 패턴:**
```bash
# 카운트 변수에 !! 없이 직접 && 렌더링하는 패턴 탐지
grep -rn "{\s*\(current\|inbound\|outbound\|pending\|total\).*Count\s*&&" \
  apps/frontend/components/checkouts/ \
  apps/frontend/app/\(dashboard\)/checkouts/ \
  --include="*.tsx" \
  | grep -v "!!\|> 0\|!== 0\|// "
# 기대: 0건 (모두 !!count 또는 count > 0 가드 사용)
```

```bash
# CheckoutListTabs.tsx에서 !!currentEquipmentCount 가드 확인
grep -n "!!currentEquipmentCount" \
  apps/frontend/components/checkouts/CheckoutListTabs.tsx
# 기대: 1건 이상 (조건부 렌더링 가드 존재)
```

**PASS:** 숫자 카운트 기반 JSX 조건부 렌더링에 `!!count` 또는 `count > 0` 가드 사용.
**FAIL:** `{someCount && <Component />}` 패턴 — `count === 0` 시 "0" 텍스트 노드 노출.

**예외:**
- `count > 0 ? <A /> : <B />` ternary — 명시적 분기이므로 정상
- 이미 `number | undefined` 타입인 경우 `!!count`는 `undefined`도 처리하므로 권장

**관련 파일:**
- `apps/frontend/components/checkouts/CheckoutListTabs.tsx` — `!!currentEquipmentCount` 방어 패턴 참조 구현

---

## Step 38: useUndoableState SSOT — 인라인 undo/redo 스택 컴포넌트 내 선언 금지 (2026-05-02 추가)

**규칙**: 컴포넌트에서 undo/redo 히스토리 관리가 필요할 때 `pastRef`/`futureRef`를 인라인 선언하거나 `recomputeUndoRedo`/`pushHistory`/`undoStructural`/`redoStructural`을 직접 구현하지 말고 `useUndoableState` 훅을 사용해야 한다.

**안티패턴:**
```typescript
// ❌ 인라인 undo 히스토리 — 56줄 보일러플레이트, deps 관리 복잡
const pastRef = useRef<TableSnapshot[]>([]);
const futureRef = useRef<TableSnapshot[]>([]);
const [canUndo, setCanUndo] = useState(false);
const recomputeUndoRedo = useCallback(() => { ... }, []);
const pushHistory = useCallback(() => { ... }, [headers, rows, recomputeUndoRedo]);
const undoStructural = useCallback(() => { ... }, [headers, rows, onChange, recomputeUndoRedo]);
useEffect(() => { /* Ctrl+Z 단축키 */ }, [undoStructural, redoStructural]);
```

**올바른 패턴:**
```typescript
// ✅ useUndoableState 훅 위임 — 8줄
const {
  push: pushHistory,
  undo: undoStructural,
  redo: redoStructural,
  canUndo,
  canRedo,
} = useUndoableState<TableSnapshot>({
  current: { headers, rows },
  onChange: (snap) => onChange(snap.headers, snap.rows),
  clone: (snap) => cloneSnapshot(snap.headers, snap.rows),
  limit: HISTORY_LIMIT,
  enableKeyboard: true,  // Ctrl/Cmd+Z / Ctrl+Y 단축키 자동 등록 (IME 가드 내장)
});
```

**탐지 — 인라인 undo 패턴 잔존:**
```bash
# pastRef + futureRef 조합 또는 recomputeUndoRedo 인라인 선언
grep -rn "pastRef\|futureRef\|recomputeUndoRedo\|pushHistory.*useCallback\|undoStructural\|redoStructural" \
  apps/frontend/components --include="*.tsx" --include="*.ts"
# 기대: 0건 (모든 undo/redo는 useUndoableState 위임)
```

**예외:**
- `apps/frontend/hooks/use-undoable-state.ts` — SSOT 정의 파일 자체는 제외
- undo/redo가 1곳 이하인 단순 토글 (e.g. `const [prev, setPrev] = useState(...)`) — 보일러플레이트 3종 세트 없으면 제외

**관련 파일:**
- `apps/frontend/hooks/use-undoable-state.ts` — SSOT 정의 (2026-05-02, inspection-undo-hook-extraction-reject-spec)
- `apps/frontend/hooks/__tests__/use-undoable-state.test.ts` — 7개 케이스: push→undo 복원, push→undo→redo, limit shift, 빈 stack undo no-op, 빈 stack redo no-op, push redo 스택 초기화, 참조 안정성
- `apps/frontend/components/inspections/result-sections/VisualTableEditor.tsx` — 참조 구현 (인라인 56줄 → 위임 8줄)
