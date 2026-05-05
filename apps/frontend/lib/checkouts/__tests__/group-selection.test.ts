/**
 * group-selection SSOT 단위 테스트 — Sprint 4.5 S3
 *
 * 그룹 헤더 indeterminate 체크박스의 3-state 결정 로직을 격리 검증.
 * `useRowSelection` 훅이나 컴포넌트 렌더 의존성 없이 순수함수로 검증한다.
 */

import {
  getGroupRowIds,
  deriveGroupSelectionState,
  toCheckboxCheckedProp,
  applyGroupToggle,
} from '../group-selection';
import type { CheckoutGroup } from '@/lib/utils/checkout-group-utils';
import type { Checkout } from '@/lib/api/checkout-api';

function makeCheckout(id: string): Checkout {
  return { id } as Checkout;
}

function makeGroup(checkoutIds: readonly string[]): CheckoutGroup {
  return {
    key: 'test-key',
    date: '2026-04-30',
    latestCreatedAt: '2026-04-30T00:00:00Z',
    dateLabel: 'checkouts.groupCard.checkoutDateLabel',
    dateLabelKey: 'checkouts.groupCard.checkoutDateLabel',
    destination: 'Test Lab',
    checkouts: checkoutIds.map(makeCheckout),
    totalEquipment: checkoutIds.length,
    statuses: [],
    purposes: [],
  } satisfies CheckoutGroup;
}

describe('getGroupRowIds', () => {
  it('빈 그룹은 빈 배열', () => {
    expect(getGroupRowIds(makeGroup([]))).toEqual([]);
  });

  it('checkout id 순서를 보존', () => {
    const ids = ['c1', 'c2', 'c3'];
    expect(getGroupRowIds(makeGroup(ids))).toEqual(ids);
  });
});

describe('deriveGroupSelectionState', () => {
  it('빈 그룹은 항상 none', () => {
    expect(deriveGroupSelectionState([], new Set())).toBe('none');
    expect(deriveGroupSelectionState([], new Set(['c1', 'c2']))).toBe('none');
  });

  it('선택 0건 = none', () => {
    expect(deriveGroupSelectionState(['c1', 'c2', 'c3'], new Set())).toBe('none');
    expect(deriveGroupSelectionState(['c1', 'c2'], new Set(['other']))).toBe('none');
  });

  it('선택 일부 = indeterminate', () => {
    expect(deriveGroupSelectionState(['c1', 'c2', 'c3'], new Set(['c1']))).toBe('indeterminate');
    expect(deriveGroupSelectionState(['c1', 'c2', 'c3'], new Set(['c1', 'c2']))).toBe(
      'indeterminate'
    );
  });

  it('선택 전체 = all', () => {
    expect(deriveGroupSelectionState(['c1', 'c2', 'c3'], new Set(['c1', 'c2', 'c3']))).toBe('all');
  });

  it('Set이 그룹 외 항목을 포함해도 그룹 row만 카운트', () => {
    expect(deriveGroupSelectionState(['c1', 'c2'], new Set(['c1', 'c2', 'extra1', 'extra2']))).toBe(
      'all'
    );
    expect(deriveGroupSelectionState(['c1', 'c2'], new Set(['c1', 'extra1']))).toBe(
      'indeterminate'
    );
  });
});

describe('toCheckboxCheckedProp (Radix 매핑)', () => {
  it("'all' → true", () => {
    expect(toCheckboxCheckedProp('all')).toBe(true);
  });

  it("'indeterminate' → 'indeterminate' 리터럴 (Radix가 aria-checked='mixed' 자동 설정)", () => {
    expect(toCheckboxCheckedProp('indeterminate')).toBe('indeterminate');
  });

  it("'none' → false", () => {
    expect(toCheckboxCheckedProp('none')).toBe(false);
  });
});

describe('applyGroupToggle (bulk-selection-tabs-integration)', () => {
  function makeSelectionStub<T>() {
    const calls: Array<{ key: string; checked: boolean; item: T }> = [];
    return {
      calls,
      setSelected: (key: string, checked: boolean, item: T) => {
        calls.push({ key, checked, item });
      },
    };
  }

  it('allCurrentlySelected=false → 모든 row를 select(true)로 호출', () => {
    const items = [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }];
    const sel = makeSelectionStub<{ id: string }>();

    applyGroupToggle(sel, items, ['c1', 'c2', 'c3'], false);

    expect(sel.calls).toHaveLength(3);
    expect(sel.calls.every((c) => c.checked === true)).toBe(true);
    expect(sel.calls.map((c) => c.key)).toEqual(['c1', 'c2', 'c3']);
  });

  it('allCurrentlySelected=true → 모든 row를 deselect(false)로 호출', () => {
    const items = [{ id: 'c1' }, { id: 'c2' }];
    const sel = makeSelectionStub<{ id: string }>();

    applyGroupToggle(sel, items, ['c1', 'c2'], true);

    expect(sel.calls).toHaveLength(2);
    expect(sel.calls.every((c) => c.checked === false)).toBe(true);
  });

  it('items에 없는 rowId는 무시 (lookup miss → setSelected 미호출)', () => {
    const items = [{ id: 'c1' }];
    const sel = makeSelectionStub<{ id: string }>();

    applyGroupToggle(sel, items, ['c1', 'c-missing', 'c-also-missing'], false);

    expect(sel.calls).toHaveLength(1);
    expect(sel.calls[0]?.key).toBe('c1');
  });

  it('빈 rowIds → setSelected 미호출', () => {
    const sel = makeSelectionStub<{ id: string }>();
    applyGroupToggle(sel, [{ id: 'c1' }], [], false);
    expect(sel.calls).toHaveLength(0);
  });

  it('item 참조를 그대로 setSelected에 전달 (snapshot 정확성)', () => {
    const items = [{ id: 'c1', name: 'Equip A' }];
    const sel = makeSelectionStub<(typeof items)[number]>();

    applyGroupToggle(sel, items, ['c1'], false);

    expect(sel.calls[0]?.item).toBe(items[0]);
  });
});
