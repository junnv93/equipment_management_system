import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseUndoableStateOptions<T> {
  /** 현재 상태 값 (controlled — 훅이 소유하지 않음) */
  current: T;
  /** 상태 복원 시 호출. undo/redo가 이 콜백으로 이전/다음 값을 전달 */
  onChange: (value: T) => void;
  /** snapshot 생성 함수. 호출부가 도메인에 맞는 복사 전략 선택 */
  clone: (value: T) => T;
  /** undo 스택 최대 크기. 초과 시 가장 오래된 snapshot shift */
  limit?: number;
  /**
   * true 시 window level Ctrl/Cmd+Z / Ctrl/Cmd+Shift+Z / Ctrl+Y 단축키 등록.
   * 컴포넌트가 마운트된 동안만 활성화 (자동 cleanup).
   * IME 합성 중 무시 (isComposing guard 내장).
   */
  enableKeyboard?: boolean;
}

export interface UseUndoableStateReturn {
  /** 현재 상태를 undo 스택에 push (변경 직전에 호출) */
  push: () => void;
  /** undo: 가장 최근 snapshot으로 복원 */
  undo: () => void;
  /** redo: undo로 되돌린 것을 다시 앞으로 */
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * useUndoableState — controlled 상태를 위한 제네릭 undo/redo 훅
 *
 * 설계 원칙:
 * - current/onChange는 ref 경유 → push/undo/redo 참조가 항상 안정 (stale closure 없음)
 * - 훅이 상태를 소유하지 않음 (uncontrolled 방지) — 호출부의 onChange가 SSOT
 * - clone 전략은 호출부 책임 — 불필요한 deep copy 강제 없음
 *
 * @example
 * const { push: pushHistory, undo, redo, canUndo, canRedo } = useUndoableState({
 *   current: { headers, rows },
 *   onChange: (snap) => handleTableChange(snap.headers, snap.rows),
 *   clone: (v) => ({ headers: [...v.headers], rows: v.rows.map((r) => [...r]) }),
 *   limit: 10,
 *   enableKeyboard: true,
 * });
 */
export function useUndoableState<T>({
  current,
  onChange,
  clone,
  limit = 10,
  enableKeyboard = false,
}: UseUndoableStateOptions<T>): UseUndoableStateReturn {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // ref로 최신 값 캡처 — push/undo/redo의 useCallback deps를 최소화
  const currentRef = useRef(current);
  currentRef.current = current;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const recompute = useCallback(() => {
    setCanUndo(pastRef.current.length > 0);
    setCanRedo(futureRef.current.length > 0);
  }, []);

  const push = useCallback(() => {
    pastRef.current.push(clone(currentRef.current));
    if (pastRef.current.length > limit) pastRef.current.shift();
    futureRef.current = [];
    recompute();
  }, [clone, limit, recompute]);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const previous = past.pop()!;
    futureRef.current.push(clone(currentRef.current));
    onChangeRef.current(previous);
    recompute();
  }, [clone, recompute]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const next = future.pop()!;
    pastRef.current.push(clone(currentRef.current));
    if (pastRef.current.length > limit) pastRef.current.shift();
    onChangeRef.current(next);
    recompute();
  }, [clone, limit, recompute]);

  useEffect(() => {
    if (!enableKeyboard) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // IME 합성 중 단축키 무시 (한글 입력 등)
      if (e.isComposing) return;
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      if (e.key === 'z' || e.key === 'Z') {
        if (e.shiftKey) {
          if (futureRef.current.length === 0) return;
          e.preventDefault();
          redo();
        } else {
          if (pastRef.current.length === 0) return;
          e.preventDefault();
          undo();
        }
      } else if (e.key === 'y' || e.key === 'Y') {
        if (futureRef.current.length === 0) return;
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enableKeyboard, undo, redo]);

  return { push, undo, redo, canUndo, canRedo };
}
