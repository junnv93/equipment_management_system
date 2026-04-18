import { act, renderHook } from '@testing-library/react';
import { useBulkSelection, useRowSelection } from '../use-bulk-selection';

type Row = { id: number; name: string; status?: string };

const ITEMS: Row[] = [
  { id: 1, name: 'SUW-E0001' },
  { id: 2, name: 'SUW-E0002' },
  { id: 3, name: 'UIW-R0001' },
];

const keyFn = (item: Row): string => String(item.id);

// ────────────────────────────────────────────────────────────────────────────
// useRowSelection
// ────────────────────────────────────────────────────────────────────────────

describe('useRowSelection', () => {
  it('초기 상태는 빈 선택', () => {
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn));
    expect(result.current.count).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('toggle: 추가 → 제거', () => {
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn));

    act(() => result.current.toggle('1', ITEMS[0]));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);

    act(() => result.current.toggle('1', ITEMS[0]));
    expect(result.current.count).toBe(0);
  });

  it('snapshot 보존: 페이지 변경 후에도 selectedItems 유지', () => {
    const { result, rerender } = renderHook(
      ({ items }: { items: Row[] }) => useRowSelection<Row>(items, keyFn),
      { initialProps: { items: ITEMS } }
    );

    act(() => result.current.toggle('1', ITEMS[0]));
    act(() => result.current.toggle('2', ITEMS[1]));
    expect(result.current.count).toBe(2);

    // 페이지 변경으로 items가 완전히 다른 배열로 교체
    const page2Items: Row[] = [{ id: 4, name: 'SUW-E0004' }];
    rerender({ items: page2Items });

    // 이전 페이지 선택이 snapshot에서 복원됨
    expect(result.current.count).toBe(2);
    expect(result.current.selectedItems.map((i) => i.id)).toEqual([1, 2]);
  });

  it('isIndeterminate: 일부만 선택 시 true', () => {
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn));

    act(() => result.current.toggle('1', ITEMS[0]));
    expect(result.current.isIndeterminate).toBe(true);
    expect(result.current.isAllPageSelected).toBe(false);
  });

  it('isAllPageSelected: 페이지 전체 선택 시 true', () => {
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn));

    act(() => result.current.selectAllOnPage());
    expect(result.current.isAllPageSelected).toBe(true);
    expect(result.current.isIndeterminate).toBe(false);
    expect(result.current.count).toBe(ITEMS.length);
  });

  it('isSelectable: 비활성 아이템은 선택 불가', () => {
    const items: Row[] = [
      { id: 1, name: 'A', status: 'ACTIVE' },
      { id: 2, name: 'B', status: 'DISPOSED' },
      { id: 3, name: 'C', status: 'ACTIVE' },
    ];
    const { result } = renderHook(() =>
      useRowSelection<Row>(items, keyFn, { isSelectable: (i) => i.status !== 'DISPOSED' })
    );

    act(() => result.current.toggle('2', items[1])); // DISPOSED — 무시됨
    expect(result.current.isSelected('2')).toBe(false);

    act(() => result.current.selectAllOnPage());
    expect(result.current.count).toBe(2); // DISPOSED 제외
    expect(result.current.isSelected('1')).toBe(true);
    expect(result.current.isSelected('2')).toBe(false);
  });

  it('LRU cap: maxSnapshots 초과 시 가장 오래된 항목 해제', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn, { maxSnapshots: 2 }));

    act(() => result.current.toggle('1', ITEMS[0]));
    act(() => result.current.toggle('2', ITEMS[1]));
    // maxSnapshots=2 도달 — 이제 3번째 추가 시 '1'이 evict됨
    act(() => result.current.toggle('3', ITEMS[2]));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('maxSnapshots(2)'));
    // '1'이 evicted, '2', '3' 남음
    expect(result.current.isSelected('2')).toBe(true);
    expect(result.current.isSelected('3')).toBe(true);

    consoleSpy.mockRestore();
  });

  it('resetOn: deps 변경 시 선택 자동 초기화', () => {
    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) => useRowSelection<Row>(ITEMS, keyFn, { resetOn: [filter] }),
      { initialProps: { filter: 'A' } }
    );

    act(() => result.current.toggle('1', ITEMS[0]));
    expect(result.current.count).toBe(1);

    rerender({ filter: 'B' }); // filter 변경 → 선택 초기화
    expect(result.current.count).toBe(0);
  });

  it('clear: 선택 전체 해제', () => {
    const { result } = renderHook(() => useRowSelection<Row>(ITEMS, keyFn));

    act(() => result.current.selectAllOnPage());
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// useBulkSelection (deprecated alias)
// ────────────────────────────────────────────────────────────────────────────

describe('useBulkSelection', () => {
  it('initializes empty', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    expect(result.current.count).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('toggle adds then removes a key', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));

    act(() => result.current.toggle('1'));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected('1')).toBe(true);

    act(() => result.current.toggle('1'));
    expect(result.current.count).toBe(0);
  });

  it('selectAll selects every item', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    act(() => result.current.selectAll());
    expect(result.current.count).toBe(ITEMS.length);
  });

  it('clear empties the selection', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    act(() => result.current.selectAll());
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
  });
});
