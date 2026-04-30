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

### Step 3 — Esc 키로 onClearSelection (단, dialog open 시 dialog가 우선)

일괄 작업 중 Esc는 선택 해제 단축키. 다만 AlertDialog 등이 열려 있으면 dialog가 먼저 닫혀야 함 (Radix 기본 동작).

✅ **Required**: 컴포넌트 외부에서 keyboard handler 연결 시 `if (e.target.closest('[role="dialog"]')) return;` 가드.
❌ window-level keydown listener 추가 금지 — 이중 핸들링 위험.

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
