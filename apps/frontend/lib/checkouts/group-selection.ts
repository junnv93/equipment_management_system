/**
 * 그룹 단위 일괄 선택 SSOT — Sprint 4.5 S3
 *
 * `useRowSelection`의 단일 row 토글 모델을 그룹 헤더(다중 row) 토글로 확장하기 위한 헬퍼.
 * row 키 컨벤션은 **checkout 단위**(`checkout.id`) — 한 checkout = 한 row.
 *
 * 하드코딩 0건: 그룹 → row id 매핑 규칙은 본 파일이 유일한 SSOT.
 * `CheckoutGroup` 정의가 변할 경우 본 파일만 수정하면 모든 호출처가 동기화됨.
 */

import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';

/**
 * 그룹에 포함된 checkout id 목록을 반환한다.
 *
 * **불변성**: 입력 그룹의 checkouts 순서를 그대로 보존 (toggle 일관성 보장).
 */
export function getGroupRowIds(group: CheckoutGroup): readonly string[] {
  return group.checkouts.map((checkout) => checkout.id);
}

/**
 * 그룹 헤더 체크박스의 3-state.
 * - `'none'`: 그룹 내 선택 0건
 * - `'indeterminate'`: 그룹 내 일부 선택 (Radix `data-state="indeterminate"` + `aria-checked="mixed"` 매핑)
 * - `'all'`: 그룹 내 전체 선택
 */
export type GroupSelectionState = 'none' | 'indeterminate' | 'all';

/**
 * 그룹의 row id 목록과 외부 selection Set을 비교해 3-state를 결정한다.
 * 빈 그룹은 항상 `'none'`.
 */
export function deriveGroupSelectionState(
  groupRowIds: readonly string[],
  selectedRowIds: ReadonlySet<string>
): GroupSelectionState {
  if (groupRowIds.length === 0) return 'none';
  let selectedCount = 0;
  for (const id of groupRowIds) {
    if (selectedRowIds.has(id)) selectedCount++;
  }
  if (selectedCount === 0) return 'none';
  if (selectedCount === groupRowIds.length) return 'all';
  return 'indeterminate';
}

/**
 * Radix Checkbox `checked` prop으로 직접 사용 가능한 형태로 변환.
 * - `'all'` → `true`
 * - `'indeterminate'` → `'indeterminate'` (Radix 리터럴)
 * - `'none'` → `false`
 */
export function toCheckboxCheckedProp(state: GroupSelectionState): boolean | 'indeterminate' {
  if (state === 'all') return true;
  if (state === 'indeterminate') return 'indeterminate';
  return false;
}

/**
 * 그룹 헤더 토글을 부모 selection에 적용 — SSOT 헬퍼
 * (bulk-selection-tabs-integration sprint, 2026-05-05).
 *
 * useRowSelection.setSelected 시그니처에 정확히 맞춘 selection adapter를 받아
 * 그룹 내 모든 row를 일괄 select/deselect 한다. row 누락(items lookup miss)은 무시 — 페이지가
 * 변경되어 snapshot에 없는 row는 setSelected가 다시 등록.
 *
 * @param selection - useRowSelection이 반환하는 selection API (setSelected만 필요)
 * @param items - 현재 페이지의 row item 배열 (id 기반 lookup용)
 * @param rowIds - 그룹 헤더가 토글하는 row id 목록 (CheckoutGroupCard `getGroupRowIds` 결과)
 * @param allCurrentlySelected - 토글 직전 그룹 전체 선택 상태 (CheckoutGroupCard.onToggleGroup 인자)
 *
 * @example
 *   onToggleGroup={(rowIds, allSelected) =>
 *     applyGroupToggle(selection, items, rowIds, allSelected)
 *   }
 */
export function applyGroupToggle<T extends { id: string }>(
  selection: { setSelected: (key: string, checked: boolean, item: T) => void },
  items: readonly T[],
  rowIds: readonly string[],
  allCurrentlySelected: boolean
): void {
  for (const id of rowIds) {
    const item = items.find((c) => c.id === id);
    if (!item) continue;
    selection.setSelected(id, !allCurrentlySelected, item);
  }
}
