# Bulk Selection Tabs Integration — exec-plan

**Slug**: `bulk-selection-tabs-integration`
**Mode**: 2 (Planner → Generator → Evaluator)
**Source**: `tech-debt-tracker.md` sprint45-should-residual S3 후속
**Created**: 2026-05-05
**Author**: Harness Planner

---

## 1. 배경

Sprint 4.5 (commit `45833cdc`)에서 `CheckoutGroupCard`에 `selectedRowIds` / `onToggleGroup` / `onToggleRow` prop API surface를 사전 등록하고, 격리 fixture page로 카드 단위 동작은 검증 완료. **부모 탭 통합은 scope +50% 우려로 별도 sprint로 이연됨**.

본 sprint는 그 통합을 다음 원칙 하에 완료한다:
1. backend 신규 endpoint 도입 금지 (기존 `bulk-approve` / `bulk-reject` 활용)
2. 기존 SSOT 인프라 재사용 (`useRowSelection`, generic `BulkActionBar`, `useOptimisticMutation`, `CheckoutCacheInvalidation.APPROVAL_KEYS`)
3. ApprovalsClient 패턴 차용 (검증된 reference)

## 2. Scope 결정 — 무엇을 포함하고 제외하는가

### 포함 (in-scope)

- **OutboundCheckoutsTab**: `useRowSelection<EquipmentRow>` 통합. row 키 = `checkout.id` (Sprint 4.5 컨벤션 — 1 checkout = 1 row).
- **CheckoutGroupCard**: row-level 체크박스 셀(zone 0) 추가. `onToggleRow` prop을 실제로 emit.
- **CheckoutBulkActionBar**: 도메인 wrapper 신설 (approvals/BulkActionBar 패턴). approve + reject 액션. fixedBottom variant.
- **i18n**: `checkouts.bulk.*` 신규 (4 액션 + 토스트 + AlertDialog 텍스트). ko/en parity.
- **e2e**: `outbound-bulk-action.spec.ts` — admin 토큰으로 multi-row 선택 + bulk approve 흐름.

### 제외 (out-of-scope, tech-debt 분리)

- **InboundCheckoutsTab 통합**: standard 섹션은 본 사용자가 receiver 시점이라 approve scope 비대상. rental/internalShared는 별도 import flow → selection 의미 없음. 별도 sprint(`inbound-bulk-receive-integration`) 분리.
- **bulk-cancel / bulk-return / bulk-borrower-approve / bulk-borrower-reject**: backend endpoint 미구현. tech-debt에 분리(`checkout-bulk-extended-actions`).
- **그룹 헤더 "일괄 승인" 버튼**: 그룹 단위 빠른 액션 — 본 sprint의 페이지 단위 cross-group bulk와 별개. 공존 유지(제거 불가).
- **subTab='completed' bulk action**: completed 상태는 액션 불가능. selectable=false로 자동 비활성.

## 3. SSOT 재사용 매트릭스

| 항목 | SSOT 위치 | 재사용/신설 |
|------|-----------|-------------|
| Selection state | `apps/frontend/hooks/use-bulk-selection.ts` (`useRowSelection<T>`) | **재사용** |
| Generic bulk bar | `apps/frontend/components/common/BulkActionBar.tsx` | **재사용** |
| Domain wrapper | `apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx` | **신설** (approvals/BulkActionBar 패턴) |
| Bulk approve API | `checkoutApi.bulkApproveCheckouts` (`/checkouts/bulk-approve`) | **재사용** |
| Bulk reject API | `checkoutApi.bulkRejectCheckouts` (`/checkouts/bulk-reject`) | **재사용** |
| Optimistic mutation | `apps/frontend/hooks/use-optimistic-mutation.tsx` | **재사용** |
| Cache invalidation | `CheckoutCacheInvalidation.APPROVAL_KEYS` | **재사용** |
| Group selection 3-state | `apps/frontend/lib/checkouts/group-selection.ts` | **재사용** |
| Reject modal | `apps/frontend/components/approvals/RejectModal.tsx` (mode='bulk') | **재사용** |
| Validation rules | `VALIDATION_RULES.{BULK_OPERATION_MAX_COUNT, REJECTION_REASON_MIN_LENGTH, LONG_TEXT_MAX_LENGTH}` | **재사용** |
| i18n bulk shared | `messages/{ko,en}/common.json` `bulk.*` | **재사용** |
| i18n checkout bulk | `messages/{ko,en}/checkouts.json` `bulk.*` | **신설** |
| Permissions | `Permission.APPROVE_CHECKOUT` (backend가 보호) | **재사용** |
| queryKeys | `queryKeys.checkouts.view.outbound` + invalidation regex | **재사용** |
| Design tokens | `BULK_ACTION_BAR_TOKENS`, `APPROVAL_BULK_BAR_TOKENS`, `CHECKOUT_ITEM_ROW_TOKENS` | **재사용** |

## 4. Phase별 변경

### Phase A — Backend (변경 없음)

backend는 기존 `POST /checkouts/bulk-approve` / `POST /checkouts/bulk-reject`를 그대로 사용. fail-close 순서 (scope → FSM → reason)는 단건 `approve`/`reject` 동작에서 상속.

**검증 대상**: 기존 backend test 회귀 없음.

### Phase B — Frontend hook 일관성 (변경 없음)

기존 `useRowSelection` API + `useOptimisticMutation` API를 그대로 사용. 변경 없음.

### Phase C — Frontend domain wrapper 신설

#### C-1: `components/checkouts/CheckoutBulkActionBar.tsx` (신규)

- approvals/BulkActionBar 패턴을 거의 그대로 차용
- props: `selectedCount`, `totalCount`, `isAllPageSelected`, `isIndeterminate`, `onSelectAll`, `onClearSelection`, `onBulkApprove`, `onBulkReject` (optional)
- DOM 항상 유지 + `aria-hidden` 토글 (selectedCount 변동 시 200ms transition)
- `role="toolbar"` + `aria-live="polite"` SR 라이브 영역 (GenericBulkActionBar에 위임)
- approve: `AlertDialog` 확인 다이얼로그 → `onBulkApprove()`
- reject: `RejectModal mode='bulk'` → `onBulkReject(reason)`
- 토큰: `APPROVAL_BULK_BAR_TOKENS.fixedBottom` 재사용 (도메인 무관 — 위치/transition만 정의)

#### C-2: `components/checkouts/CheckoutGroupCard.tsx` (수정)

현재 `onToggleRow` prop이 정의만 있고 미사용. row-level 체크박스 셀(zone 0) 추가:
- `showRowCheckbox = selectedRowIds !== undefined && onToggleRow !== undefined`
- pending status + canApprove === true 일 때만 enabled (그 외 disabled + 툴팁 사유)
- `Checkbox` Radix — `onClick={(e) => e.stopPropagation()}` (row click과 충돌 방지)
- IME 가드: `e.nativeEvent.isComposing` (Sprint 4.5 표준)
- aria-label: `t('groupCard.selectRowAria', { equipment, status })`
- grid 토큰 갱신: `CHECKOUT_ITEM_ROW_TOKENS.grid`에 zone 0 추가 (column track `auto` 선두)

### Phase D — OutboundCheckoutsTab 통합

#### D-1: state setup

```ts
const filtersKey = JSON.stringify(filters);
const checkouts = checkoutsData?.data ?? [];

const selection = useRowSelection<CheckoutSummary>(
  checkouts,
  (c) => c.id,
  {
    isSelectable: (c) =>
      c.status === CSVal.PENDING && (c.meta?.availableActions?.canApprove ?? false),
    resetOn: [filtersKey],
  }
);
```

#### D-2: BulkAction handlers

- `handleBulkApprove` → `bulkApproveMutation.mutate({ ids: Array.from(selection.selected) })`
- `handleBulkReject(reason)` → `bulkRejectMutation.mutateAsync({ ids: ..., reason })`
- 두 mutation 모두 `useOptimisticMutation` + `invalidateKeys: CheckoutCacheInvalidation.APPROVAL_KEYS`
- `onSuccessCallback`: 부분 실패 토스트 분기 (전체 성공/부분 성공/전체 실패) — ApprovalsClient 패턴 그대로
- `clearSelection` on success

#### D-3: CheckoutGroupCard prop wiring

```tsx
<CheckoutGroupCard
  group={group}
  onCheckoutClick={handleCheckoutClick}
  isOverdueGroup={...}
  selectedRowIds={selection.selected}
  onToggleGroup={(rowIds, allCurrentlySelected) => {
    if (allCurrentlySelected) {
      rowIds.forEach((id) => selection.setSelected(id, false, /* item */));
    } else {
      rowIds.forEach((id) => {
        const item = checkouts.find((c) => c.id === id);
        if (item) selection.setSelected(id, true, item);
      });
    }
  }}
  onToggleRow={(rowId) => {
    const item = checkouts.find((c) => c.id === rowId);
    if (item) selection.toggle(rowId, item);
  }}
/>
```

> **헬퍼 추출 권고**: 위 핸들러는 `lib/checkouts/group-selection.ts`에 `createGroupToggleHandler(selection, items)` 추가하면 더 깔끔. 단, 본 sprint scope는 통합 검증이 우선이라 인라인 → 후속 PR 헬퍼화는 SHOULD.

#### D-4: CheckoutBulkActionBar 렌더

```tsx
<CheckoutBulkActionBar
  selectedCount={selection.count}
  totalCount={checkouts.length}
  isAllPageSelected={selection.isAllPageSelected}
  isIndeterminate={selection.isIndeterminate}
  onSelectAll={selection.selectAllOnPage}
  onClearSelection={selection.clear}
  onBulkApprove={handleBulkApprove}
  onBulkReject={handleBulkReject}
/>
```

`subTab === 'completed'` 또는 `selection.count === 0`일 때 GenericBulkActionBar가 자동 hidden (DOM 유지 + aria-hidden=true).

### Phase E — i18n

`messages/{ko,en}/checkouts.json`에 `bulk.*` 신규:

```json
{
  "bulk": {
    "approve": "선택 일괄 승인",
    "reject": "선택 일괄 반려",
    "confirmApproveTitle": "{count}건 일괄 승인",
    "confirmApproveDescription": "선택한 반출 {count}건을 모두 승인합니다. 부분 실패가 발생할 수 있습니다.",
    "approveAll": "{count}건 일괄 승인 완료",
    "approveResult": "성공 {success}건 / 실패 {failed}건",
    "approveError": "일괄 승인에 실패했습니다",
    "rejectAll": "{count}건 일괄 반려 완료",
    "rejectResult": "성공 {success}건 / 실패 {failed}건",
    "rejectError": "일괄 반려에 실패했습니다",
    "ariaLabel": "반출 일괄 액션 도구모음"
  },
  "groupCard": {
    "selectRowAria": "{equipment} 선택 ({status})",
    "selectRowDisabled": "현재 상태에서는 선택할 수 없습니다"
  }
}
```

### Phase F — E2E spec

`apps/frontend/tests/e2e/checkouts/outbound-bulk-action.spec.ts` (신규):

1. admin 토큰으로 `/checkouts` 진입
2. `data-testid="bulk-action-bar"` 초기 hidden 확인 (aria-hidden=true)
3. row checkbox 2개 선택
4. BulkActionBar visible 확인 (count=2 표시)
5. 일괄 승인 버튼 → AlertDialog → 확인 → toast `approveAll` 확인
6. selection 자동 clear 확인

verify-e2e Step 25 준수: 권한 spec이 아닌 **워크플로 spec**이므로 `loginAs('systemAdmin')` 또는 `loginAs('admin')` 사용 가능.

## 5. 검증 명령

### Build/typecheck

```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run lint
pnpm --filter frontend run build  # bundle baseline 영향 확인
```

### Unit test

```bash
pnpm --filter frontend run test -- components/checkouts
```

### E2E

```bash
pnpm --filter frontend run test:e2e -- outbound-bulk-action.spec.ts
```

### Verify skills

```bash
# verify-bulk-action-bar (Sprint 4.5 신설)
# verify-frontend-state (useOptimisticMutation, prop drilling)
# verify-cache-events (mutation invalidation)
# verify-i18n (ko/en parity)
# verify-design-tokens
# verify-checkout-fsm
# verify-ssot
# verify-implementation
```

## 6. 빌드 시퀀스

1. **C-1** 신설: `CheckoutBulkActionBar.tsx`
2. **C-2** 수정: `CheckoutGroupCard.tsx` row 체크박스 셀
3. **C-2 SSOT 보강**: `CHECKOUT_ITEM_ROW_TOKENS.grid` zone 0 컬럼
4. **D-1~D-4**: `OutboundCheckoutsTab.tsx` 통합
5. **E**: `checkouts.json` ko/en bulk.* 추가
6. **F**: e2e spec 작성
7. tsc → lint → unit test → e2e → verify-* 순서

## 7. 시니어 자기검토 체크리스트

- [ ] **L0 inferred** — 본 plan에 명시되지 않은 가정(예: subTab=in-progress 외 처리, 그룹 헤더 버튼 제거 여부)은 **명시적 비변경**으로 잠금
- [ ] **L4ext** — IME 가드, focus management, role=toolbar/aria-live, AlertDialog focus trap 모두 기존 SSOT에서 상속
- [ ] **관측성** — bulk action 결과는 toast로 user-facing. analytics SSOT(`lib/analytics/track.ts`) 호출은 본 sprint scope 외 (후속 sprint에서 일괄 등록 권장)
- [ ] **테스트 매트릭스** — RTL: CheckoutBulkActionBar 단위(분할 모달/포커스). E2E: outbound 시나리오 1건. backend: 회귀만(신규 endpoint 없음)
- [ ] **CAS 영향** — bulk endpoint 내부에서 단건 approve/reject 호출 → CAS version 미사용 (Promise.allSettled 결과로 부분 실패 표시). 단일 endpoint와 동일 동작
- [ ] **WCAG 2.1 AA** — 4.1.2 Name/Role/Value (role=toolbar + aria-label), 1.3.1 Info/Relationships (group checkbox 'mixed' state), 2.4.7 Focus Visible (Radix Checkbox 기본), 3.3.4 Error Prevention (AlertDialog 확인)
- [ ] **Pre-commit audit** — SSOT 경유 / 하드코딩 0 / eslint-disable 0 / 접근성 / 워크플로 재사용 / role 리터럴 0 / `setQueryData` 0

## 8. Out of scope (별도 tech-debt 분리)

다음 항목은 본 sprint 완료 후 `tech-debt-tracker.md`에 명시 분리:

1. **inbound-bulk-receive-integration** — InboundCheckoutsTab standard 섹션 receive flow bulk 처리 (UL-QP-18 receive workflow 정의 후)
2. **checkout-bulk-extended-actions** — bulk-cancel / bulk-return / bulk-borrower-approve backend endpoint + frontend wiring
3. **bulk-action-analytics-events** — analytics SSOT(`lib/analytics/track.ts`)에 `checkout.bulk_approve`, `checkout.bulk_reject` 이벤트 등록
4. **group-toggle-helper-extraction** — `lib/checkouts/group-selection.ts`에 `createGroupToggleHandler` 헬퍼 추출 (인라인 onToggleGroup 단순화)

## 9. 완료 정의

- [ ] tsc/lint/build/unit/e2e 모두 PASS
- [ ] verify-* 스킬 전부 PASS
- [ ] contract MUST 100% 충족
- [ ] tech-debt-tracker.md S3 항목 strikethrough + 4건 신규 항목 추가
- [ ] memory `project_*_20260505.md` 신규 등록
- [ ] git commit (push는 사용자 별도 지시)
