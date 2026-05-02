import { act, renderHook } from '@testing-library/react';
import { useUndoableState } from '../use-undoable-state';

// 테스트용 단순 clone (숫자 배열)
const cloneArr = (v: number[]) => [...v];

describe('useUndoableState', () => {
  // ── M8 필수 4케이스 ──

  it('push → undo: 이전 snapshot으로 복원', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ current }: { current: number[] }) =>
        useUndoableState({ current, onChange, clone: cloneArr }),
      { initialProps: { current: [1, 2, 3] } }
    );

    // [1,2,3] snapshot push
    act(() => result.current.push());
    expect(result.current.canUndo).toBe(true);

    // current를 [4,5,6]으로 변경했다고 가정
    rerender({ current: [4, 5, 6] });

    // undo → onChange([1,2,3])
    act(() => result.current.undo());
    expect(onChange).toHaveBeenLastCalledWith([1, 2, 3]);
    expect(result.current.canUndo).toBe(false);
  });

  it('push → undo → redo: redo로 앞 snapshot 복원', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ current }: { current: number[] }) =>
        useUndoableState({ current, onChange, clone: cloneArr }),
      { initialProps: { current: [1, 2, 3] } }
    );

    act(() => result.current.push());
    rerender({ current: [4, 5, 6] });

    // undo: back to [1,2,3]
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    // current가 [1,2,3]으로 됐다고 simulate — rerender
    rerender({ current: [1, 2, 3] });

    // redo: onChange([4,5,6])
    act(() => result.current.redo());
    expect(onChange).toHaveBeenLastCalledWith([4, 5, 6]);
    expect(result.current.canRedo).toBe(false);
  });

  it('limit 초과 시 가장 오래된 snapshot shift', () => {
    const onChange = jest.fn();
    const limit = 3;
    let current = [0];
    const { result, rerender } = renderHook(
      ({ c }: { c: number[] }) =>
        useUndoableState({ current: c, onChange, clone: cloneArr, limit }),
      { initialProps: { c: current } }
    );

    // limit+1 회 push (4회)
    for (let i = 1; i <= limit + 1; i++) {
      act(() => result.current.push());
      current = [i];
      rerender({ c: current });
    }

    // 스택에는 최대 3개만 남아있어야 함
    // undo를 3번 할 수 있고, 4번째는 canUndo=false
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(true); // 2개 남음
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(true); // 1개 남음
    act(() => result.current.undo());
    expect(result.current.canUndo).toBe(false); // 스택 비어있음
  });

  it('빈 stack undo는 no-op (onChange 호출 없음)', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useUndoableState({ current: [1], onChange, clone: cloneArr })
    );

    expect(result.current.canUndo).toBe(false);
    act(() => result.current.undo());
    expect(onChange).not.toHaveBeenCalled();
  });

  // ── 추가 안정성 케이스 ──

  it('빈 stack redo는 no-op (onChange 호출 없음)', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useUndoableState({ current: [1], onChange, clone: cloneArr })
    );

    expect(result.current.canRedo).toBe(false);
    act(() => result.current.redo());
    expect(onChange).not.toHaveBeenCalled();
  });

  it('push는 redo 스택을 초기화 (새 변경 시 redo 불가)', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ c }: { c: number[] }) => useUndoableState({ current: c, onChange, clone: cloneArr }),
      { initialProps: { c: [1] } }
    );

    act(() => result.current.push());
    rerender({ c: [2] });
    act(() => result.current.undo());
    rerender({ c: [1] });
    expect(result.current.canRedo).toBe(true);

    // 새 변경 push → redo 스택 비워짐
    act(() => result.current.push());
    expect(result.current.canRedo).toBe(false);
  });

  it('push/undo/redo 참조는 안정 (enableKeyboard=false)', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ c }: { c: number[] }) => useUndoableState({ current: c, onChange, clone: cloneArr }),
      { initialProps: { c: [1] } }
    );

    const { push: push1, undo: undo1, redo: redo1 } = result.current;
    rerender({ c: [2] });
    const { push: push2, undo: undo2, redo: redo2 } = result.current;

    // current 변경 후에도 참조 동일
    expect(push1).toBe(push2);
    expect(undo1).toBe(undo2);
    expect(redo1).toBe(redo2);
  });
});
