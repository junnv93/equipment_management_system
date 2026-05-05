---
name: verify-bulk-action-bar
description: BulkActionBar 패턴 SSOT 검증 — count chip aria-live, role=toolbar, Esc clear, indeterminate Radix, focus management, IME guard. 일괄 작업 UI 변경 시 트리거. canonical = components/common/BulkActionBar.tsx (도메인 무관 generic), components/approvals/BulkActionBar.tsx는 approvals 특화 wrapper.
disable-model-invocation: true
---

# verify-bulk-action-bar

BulkActionBar 패턴 SSOT 검증 + 도메인 일괄 작업 UX 일관성 확보.

## When to Run

- 신규 일괄 작업 UI 추가 (e.g. bulk-approve, bulk-reject, bulk-export)
- BulkActionBar 또는 그 wrapper 컴포넌트 수정 시
- BulkActionBar 사용 컴포넌트의 키보드 단축키 / focus 동작 변경 시

## Related Files

| 파일 | 역할 | canonical 여부 |
|------|------|---------------|
| `components/common/BulkActionBar.tsx` | 도메인 무관 generic — actions slot 패턴 | ✅ canonical |
| `components/approvals/BulkActionBar.tsx` | approvals 특화 wrapper (승인/반려 도메인 액션) | wrapper |
| `lib/design-tokens/{form-field-tokens,index}.ts` | `BULK_ACTION_BAR_TOKENS` 색상/간격/sticky-z 토큰 SSOT | 토큰 정의 |
| `hooks/use-bulk-selection.ts` | `useBulkSelection` / `useRowSelection` — 선택 상태 SSOT | 상태 hook |
| `components/common/RowSelectCell.tsx` | 행 단위 체크박스 셀 (Enter/Space toggle) | row hook |

> **Future Work** (별도 세션): `components/approvals/BulkActionBar.tsx` 와 `components/common/BulkActionBar.tsx` 의 dedup. 본 SKILL은 dedup하지 않고 패턴 일관성만 보장.

## Workflow Steps

### Step 1 — count chip aria-live

선택 카운트 표시는 스크린리더에 변화를 알려야 합니다.

✅ **Required**: `role="toolbar"` 컨테이너 자체에 `aria-live="polite"` 또는 별도 sr-only 미러.
❌ `aria-live="assertive"` 금지 — 카운트 변화는 critical이 아님 (WCAG 2.2 SC 4.1.3 Status Messages).

```bash
grep -A 5 'role="toolbar"' apps/frontend/components/common/BulkActionBar.tsx | grep "aria-live"
# 기대: ≥1 hit
```

### Step 2 — role="toolbar" + aria-label 필수

```bash
grep -E 'role="toolbar"' apps/frontend/components/common/BulkActionBar.tsx | wc -l  # ≥1
grep -A 2 'role="toolbar"' apps/frontend/components/common/BulkActionBar.tsx | grep "aria-label"  # ≥1
```

### Step 3 — Esc 키로 onClearSelection (선택적 UX 강화 — 필수 아님)

일괄 작업 중 Esc는 선택 해제 단축키. 다만 AlertDialog 등이 열려 있으면 dialog가 먼저 닫혀야 함 (Radix 기본 동작).

✅ **권장 (선택적)**: 컴포넌트 외부에서 keyboard handler 연결 시 `if (e.target.closest('[role="dialog"]')) return;` 가드.
❌ window-level keydown listener 추가 금지 — 이중 핸들링 위험.

**정책 (2026-05-06 갱신)**: Esc 단축키 자체는 **필수 아님**. WCAG 2.1 AA "Keyboard accessible" 원칙은 Tab+Enter+Space로 충족되며, ARIA Authoring Practices Guide의 Toolbar 패턴도 Esc를 권장 단축키로만 명시. 본 SKILL은 Esc 구현 시 **window-level 우회 금지**만 강제하고, 미구현은 위반 아님. UX enhancement sprint에서 일괄 도입 권장 (`tech-debt-tracker.md` mutateAsync-ux-consistency 등과 묶음 처리).

### Step 4 — 0건 시 `return null` 또는 `aria-hidden="true"` + `pointer-events-none`

```bash
grep "selectedCount === 0" apps/frontend/components/common/BulkActionBar.tsx | grep -E "return null|aria-hidden"
# 기대: ≥1 hit
```

### Step 5 — indeterminate 상태 Radix Checkbox

Radix `<Checkbox checked='indeterminate'>`은 자동으로 `aria-checked="mixed"`를 부여합니다 (WCAG 2.2 SC 4.1.2 Name, Role, Value).

```bash
grep -E "checked.*indeterminate|isIndeterminate" apps/frontend/components/common/BulkActionBar.tsx
# 기대: ≥1 hit
```

❌ HTML 기본 `<input type="checkbox" indeterminate>` 사용 금지 — React가 controlled로 indeterminate를 직접 지원 안 함.

### Step 6 — Focus management (ESC → 다음 focusable)

선택 해제 후 focus는 toolbar 외부의 다음 focusable element로 이동해야 함. Radix Toolbar primitive 사용 시 자동 처리.

✅ **Pattern**: Toolbar 내 첫 focusable은 dismiss(clear) 또는 primary action.
❌ `tabIndex={-1}`로 toolbar 자체를 focus blackhole 만들지 않기.

### Step 7 — IME composition guard (한글 입력 보호)

BulkActionBar 호출자(또는 RowSelectCell, KPI strip 등)의 onKeyDown 핸들러는 한글 IME composition 중에는 단축키를 무시해야 합니다.

✅ **Required pattern (React 19)**:
```tsx
onKeyDown={(e) => {
  if (e.nativeEvent.isComposing) return;  // IME 가드
  if (e.key === 'Enter') { ... }
}}
```

❌ window-level `compositionstart`/`compositionend` listener 추가 금지 — React 합성 이벤트로 충분.

```bash
grep -rn "isComposing\|nativeEvent.isComposing" \
  apps/frontend/components/common apps/frontend/components/approvals 2>/dev/null \
  | grep -v "__tests__" | wc -l
# 기대: ≥1 (BulkActionBar 호출자 중 onKeyDown 가진 것은 모두)
```

### Step 8 — Group header indeterminate (그룹 단위 마스터 체크박스)

CheckoutGroupCard 등 행을 그룹화하는 컴포넌트에서 그룹 헤더 마스터 체크박스의 `none/indeterminate/all` 3상태 SSOT 사용.

✅ **Required pattern** (`lib/checkouts/group-selection.ts` SSOT):
```tsx
import {
  getGroupRowIds,
  deriveGroupSelectionState,
  toCheckboxCheckedProp,
} from '@/lib/checkouts/group-selection';

const rowIds = getGroupRowIds(group);
const state = deriveGroupSelectionState(rowIds, selectedRowIds);
// state: 'none' | 'indeterminate' | 'all'

<Checkbox
  checked={toCheckboxCheckedProp(state)}  // boolean | 'indeterminate'
  onCheckedChange={(next) => onToggleGroup(rowIds, next === true)}
  aria-checked={state === 'indeterminate' ? 'mixed' : state === 'all'}
/>
```

Radix Checkbox는 `checked='indeterminate'`일 때 자동으로 `data-state="indeterminate"`를 부여하고 SR로 `aria-checked="mixed"`를 매핑한다.

❌ 안티패턴:
- 그룹 헤더가 ad-hoc `selectedRowIds.filter(id => rowIds.includes(id)).length` 삼항분기 — `getGroupRowIds` 우회
- `<input type="checkbox" indeterminate>` HTML 기본 — controlled indeterminate 미지원
- `aria-checked={state}` 로 'none'/'all'/'indeterminate' 그대로 전달 — WAI-ARIA spec 위반 (`true`/`false`/`mixed`만 허용)

```bash
# SSOT 사용 확인
grep -rn "getGroupRowIds\|deriveGroupSelectionState\|toCheckboxCheckedProp" \
  apps/frontend/components --include="*.tsx" 2>/dev/null | grep -v "__tests__"
# 기대: 그룹 체크박스 사용 컴포넌트마다 ≥1 hit

# data-state="indeterminate" Radix wiring
grep -rn 'data-state="indeterminate"' apps/frontend/components apps/frontend/app --include="*.tsx" 2>/dev/null
# 기대: 0 (Radix가 자동 부여, 직접 사용 금지)
```

### Step 9 — 격리 fixture page로 단독 검증

부모 컴포넌트(예: CheckoutsTab) 통합 없이 그룹/체크박스 동작만 단독 검증할 때, `app/(dashboard)/__visual__/<scenario>/page.tsx` 격리 fixture 패턴 사용.

✅ **Required pattern**:
- 경로: `apps/frontend/app/(dashboard)/__visual__/<scenario>/page.tsx`
- 목적: 실제 데이터/권한/네트워크 의존 없이 컴포넌트 prop API만 e2e/visual 검증
- 시드 데이터는 page 내 `const FIXTURE_GROUPS = [...]` 인라인 — 백엔드 의존 0
- E2E spec은 `__visual__/<scenario>` 경로로 직접 navigate

```bash
# 격리 fixture page 존재 확인
ls apps/frontend/app/\(dashboard\)/__visual__/group-indeterminate/page.tsx
# 기대: 존재

# E2E spec이 fixture URL 사용
grep -rn "__visual__/group-indeterminate\|/__visual__/" tests/e2e/ 2>/dev/null
# 기대: ≥1 hit

# 격리 fixture page는 server-only fetch 또는 useQuery 사용 금지 (시드 데이터 인라인이어야)
grep -E "fetch\(|useQuery\(|getServerSession\(" \
  apps/frontend/app/\(dashboard\)/__visual__/*/page.tsx 2>/dev/null
# 기대: 0 (네트워크/세션 의존 0)
```

❌ 안티패턴:
- `__visual__` 안에서 실제 API 호출 — fixture 격리 무력화
- 시드 fixture를 `lib/`나 `__fixtures__/`에 분산 — page.tsx 단일 파일 검증 원칙 깨짐
- E2E가 부모 컴포넌트 통합을 통해서만 컴포넌트 검증 — 격리 fixture 우회

### Step 10 — 도메인 wrapper 신설 패턴 (2026-05-06, bulk-selection-tabs-integration sprint)

새 도메인이 일괄 작업 UI를 추가할 때 generic `BulkActionBar`를 직접 사용하지 말고 도메인 wrapper를 신설한다 — `components/<domain>/<Domain>BulkActionBar.tsx`.

✅ **Required wrapper 구조** (canonical reference: `components/approvals/BulkActionBar.tsx`, `components/checkouts/CheckoutBulkActionBar.tsx`):

```tsx
import { BulkActionBar as GenericBulkActionBar } from '@/components/common/BulkActionBar';
import { APPROVAL_BULK_BAR_TOKENS, getApprovalActionButtonClasses } from '@/lib/design-tokens';

export function CheckoutBulkActionBar({
  selectedCount,
  onBulkApprove,
  onBulkReject,           // optional — 도메인 권한/상태에 따라 reject 비활성
  ...
}: CheckoutBulkActionBarProps) {
  return (
    <>
      {/* SR-only aria-live (DOM 항상 유지) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isVisible ? t('bulkBar.selectionCount', { count }) : t('bulkBar.selectionCleared')}
      </div>
      {/* fixed-bottom + aria-hidden 토글 */}
      <div data-testid="bulk-action-bar" aria-hidden={!isVisible}>
        {isVisible && (
          <GenericBulkActionBar
            selectedCount={selectedCount}
            actions={                        // 도메인 버튼은 actions slot 주입 (하드코딩 금지)
              <>
                <Button onClick={() => setIsApproveDialogOpen(true)}>{t('bulk.approve')}</Button>
                {onBulkReject && (           // optional prop 게이트 — 권한/상태로 분기
                  <Button onClick={() => setIsRejectModalOpen(true)}>{t('bulk.reject')}</Button>
                )}
              </>
            }
          />
        )}
      </div>
      {/* approve confirmation: AlertDialog */}
      <AlertDialog>...</AlertDialog>
      {/* reject confirmation: RejectModal mode='bulk' (SSOT) */}
      {onBulkReject && <RejectModal mode="bulk" count={selectedCount} ... />}
    </>
  );
}
```

❌ 안티패턴:
- 도메인 컴포넌트가 `<GenericBulkActionBar />`를 직접 렌더 — wrapper 우회
- `actions` slot 미사용 + variant prop으로 도메인 분기 (`<BulkActionBar variant="checkout">`) — generic 오염
- `onBulkReject`를 required로 강제 → 권한 없는 사용자에게 disabled 버튼 노출
- 도메인 wrapper에 RejectModal 직접 만들지 말고 `components/approvals/RejectModal.tsx mode='bulk'` 재사용

```bash
# generic 직접 사용 + actions slot 누락 탐지 (도메인 컴포넌트 영역)
grep -rn "from '@/components/common/BulkActionBar'" apps/frontend/components --include="*.tsx" \
  | grep -v "/common/" | grep -v "BulkActionBar.tsx$"
# 기대: wrapper 파일 (e.g. CheckoutBulkActionBar.tsx, ApprovalsBulkActionBar.tsx) 만 hit
# 도메인 페이지/탭이 직접 import 시 위반
```

### Step 11 — applyGroupToggle SSOT 헬퍼 (그룹 토글 핸들러 인라인 forEach 금지, 2026-05-06)

부모 컴포넌트가 그룹 헤더 토글 핸들러를 인라인으로 작성하면 `useRowSelection.setSelected` API 변경 시 호출처마다 수동 동기화 필요 — `lib/checkouts/group-selection.ts`의 `applyGroupToggle` SSOT 경유 강제.

✅ **Required pattern**:
```tsx
import { applyGroupToggle } from '@/lib/checkouts/group-selection';

const handleToggleGroup = useCallback(
  (rowIds: readonly string[], allCurrentlySelected: boolean) => {
    applyGroupToggle(selection, items, rowIds, allCurrentlySelected);
  },
  [items, selection]
);
```

❌ 안티패턴 (회귀):
```tsx
// 인라인 forEach — SSOT 우회
const handleToggleGroup = (rowIds, allSelected) => {
  rowIds.forEach((id) => {
    const item = items.find((c) => c.id === id);
    if (!item) return;
    selection.setSelected(id, !allSelected, item);
  });
};
```

```bash
# applyGroupToggle 사용처 (그룹 토글 활용 컴포넌트마다 ≥1 hit 필요)
grep -rn "applyGroupToggle\|onToggleGroup" apps/frontend --include="*.tsx" 2>/dev/null \
  | grep -v "__tests__" | grep -v "lib/checkouts/group-selection.ts"

# 인라인 forEach 안티패턴 탐지 (rowIds.forEach + setSelected 조합)
grep -rB 1 -A 4 "rowIds\.forEach" apps/frontend --include="*.tsx" 2>/dev/null \
  | grep -A 3 "setSelected" | grep -v "applyGroupToggle"
# 기대: 0 hit (모두 SSOT 경유)
```

## verify 명령 (모두 실행)

```bash
cd /home/kmjkds/equipment_management_system

# Step 1 + 2: role + aria-live + aria-label
grep -E 'role="toolbar"' apps/frontend/components/common/BulkActionBar.tsx
grep -A 5 'role="toolbar"' apps/frontend/components/common/BulkActionBar.tsx | grep -E "aria-(live|label)"

# Step 4: 0건 처리
grep -E "selectedCount === 0\|return null" apps/frontend/components/common/BulkActionBar.tsx

# Step 5: indeterminate
grep -E "checked.*indeterminate|isIndeterminate" apps/frontend/components/common/BulkActionBar.tsx

# Step 7: IME guard 호출자에 적용됨
grep -rn "nativeEvent.isComposing" \
  apps/frontend/components/common apps/frontend/components/approvals \
  --include="*.tsx" 2>/dev/null
```

## Common Failures

| 증상 | 진단 | 수정 |
|------|------|------|
| 한글 입력 중 Ctrl+A로 모두 선택됨 | onKeyDown에 IME 가드 누락 | Step 7 패턴 적용 |
| 일부 선택 시 마스터 체크박스가 mixed로 안 보임 | `checkedState`가 boolean만 받음 | `checkedState='indeterminate'` 분기 추가 (Step 5) |
| 토스트와 카운트 chip 동시 발화로 SR 시끄러움 | `aria-live="assertive"` 잘못 사용 | `polite`로 강등 (Step 1) |
| Esc로 선택 해제했는데 dialog도 같이 닫힘 | window-level handler 사용 | 컴포넌트 단위 + `closest('[role=dialog]')` 가드 (Step 3) |
