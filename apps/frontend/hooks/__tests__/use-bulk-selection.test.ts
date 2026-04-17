import { act, renderHook } from '@testing-library/react';
import { useBulkSelection } from '../use-bulk-selection';

type Row = { id: number; name: string };

const ITEMS: Row[] = [
  { id: 1, name: 'SUW-E0001' },
  { id: 2, name: 'SUW-E0002' },
  { id: 3, name: 'UIW-R0001' },
];

const keyFn = (item: Row) => String(item.id);

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
    expect(result.current.selectedItems).toEqual([ITEMS[0]]);

    act(() => result.current.toggle('1'));
    expect(result.current.count).toBe(0);
    expect(result.current.isSelected('1')).toBe(false);
  });

  it('setSelected(true/false) is idempotent', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));

    act(() => result.current.setSelected('2', true));
    const ref1 = result.current.selected;
    act(() => result.current.setSelected('2', true)); // no-op
    expect(result.current.selected).toBe(ref1);
  });

  it('selectAll selects every item', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    act(() => result.current.selectAll());
    expect(result.current.count).toBe(ITEMS.length);
    expect(result.current.selectedItems).toEqual(ITEMS);
  });

  it('clear empties the selection', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    act(() => result.current.selectAll());
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
    expect(result.current.selectedItems).toEqual([]);
  });

  it('selectedItems preserves input order (not selection order)', () => {
    const { result } = renderHook(() => useBulkSelection<Row>(ITEMS, keyFn));
    act(() => result.current.toggle('3'));
    act(() => result.current.toggle('1'));
    // selectedItems reflects ITEMS order (id 1 before id 3)
    expect(result.current.selectedItems.map((i) => i.id)).toEqual([1, 3]);
  });

  it('keeps selection when items list is updated (by key identity)', () => {
    const { result, rerender } = renderHook(
      ({ items }: { items: Row[] }) => useBulkSelection<Row>(items, keyFn),
      { initialProps: { items: ITEMS } }
    );
    act(() => result.current.toggle('2'));

    const renamed = [{ id: 2, name: 'SUW-E0002-RENAMED' }, ITEMS[0], ITEMS[2]];
    rerender({ items: renamed });
    expect(result.current.count).toBe(1);
    expect(result.current.selectedItems.map((i) => i.name)).toEqual(['SUW-E0002-RENAMED']);
  });
});
