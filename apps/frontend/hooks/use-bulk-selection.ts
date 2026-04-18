'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ────────────────────────────────────────────────────────────────────────────
// useRowSelection — AD-4 확장 (AD-4: selectedSnapshots Map + LRU cap)
// ────────────────────────────────────────────────────────────────────────────

export interface RowSelectionOptions<T> {
  /** 선택 불가 row 필터 (권한/상태 기반) */
  isSelectable?: (item: T) => boolean;
  /** selectAllOnPage가 현재 페이지만 선택할지 결정 (기본 'page') */
  selectAllMode?: 'page' | 'all';
  /** snapshot Map LRU 상한 (기본 500) — 초과 시 가장 오래된 항목 해제 */
  maxSnapshots?: number;
  /** 이 deps 배열이 변경되면 선택 자동 초기화 */
  resetOn?: readonly unknown[];
}

export interface RowSelectionAPI<T> {
  /** 현재 선택된 키 집합 */
  selected: ReadonlySet<string>;
  /** 페이지 이동 후에도 snapshot 기반으로 보존된 선택 항목 목록 */
  selectedItems: readonly T[];
  /** 선택된 항목 수 */
  count: number;
  /** 키를 토글하고 snapshot에 item 저장 */
  toggle: (key: string, item: T) => void;
  /** 키 선택 상태를 명시적으로 설정하고 snapshot 갱신 */
  setSelected: (key: string, checked: boolean, item: T) => void;
  /** 현재 페이지의 선택 가능한 항목 전체 선택 */
  selectAllOnPage: () => void;
  /** 선택 전체 해제 */
  clear: () => void;
  /** 지정 키의 선택 여부 조회 */
  isSelected: (key: string) => boolean;
  /** 현재 페이지의 선택 가능한 항목이 모두 선택된 상태 */
  isAllPageSelected: boolean;
  /** 현재 페이지에서 일부만 선택된 상태 (체크박스 indeterminate 표시용) */
  isIndeterminate: boolean;
}

export function useRowSelection<T>(
  items: readonly T[],
  keyFn: (item: T) => string,
  options: RowSelectionOptions<T> = {}
): RowSelectionAPI<T> {
  const { isSelectable, maxSnapshots = 500, resetOn } = options;

  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set<string>());
  // snapshot은 ref — Map 변경이 re-render를 유발하지 않음
  const snapshotsRef = useRef<Map<string, T>>(new Map());

  // resetOn deps 변경 시 선택 자동 초기화
  // resetOn deps 변경 시 선택 자동 초기화 — JSON 직렬화로 stable dep 확보
  const resetOnStr = JSON.stringify(resetOn ?? []);
  const isFirstResetRender = useRef(true);
  useEffect(() => {
    if (isFirstResetRender.current) {
      isFirstResetRender.current = false;
      return;
    }
    setSelected(new Set());
    snapshotsRef.current.clear();
  }, [resetOnStr]);

  const addSnapshot = useCallback(
    (key: string, item: T) => {
      const map = snapshotsRef.current;
      if (map.has(key)) {
        // 이미 있으면 최신화만
        map.set(key, item);
        return;
      }
      // LRU: 상한 초과 시 가장 오래된(첫 번째) 항목 제거
      if (map.size >= maxSnapshots) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) {
          map.delete(oldest);
          // selected에서도 제거 (비동기 batch — 다음 렌더에 반영)
          setSelected((prev) => {
            if (!prev.has(oldest)) return prev;
            const next = new Set(prev);
            next.delete(oldest);
            return next;
          });
          console.warn(
            `[useRowSelection] maxSnapshots(${maxSnapshots}) 초과 — 가장 오래된 선택 항목이 해제되었습니다.`
          );
        }
      }
      map.set(key, item);
    },
    [maxSnapshots]
  );

  const toggle = useCallback(
    (key: string, item: T) => {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
          snapshotsRef.current.delete(key);
        } else {
          if (isSelectable && !isSelectable(item)) return prev;
          addSnapshot(key, item);
          next.add(key);
        }
        return next;
      });
    },
    [isSelectable, addSnapshot]
  );

  const setSelectedItem = useCallback(
    (key: string, checked: boolean, item: T) => {
      setSelected((prev) => {
        const isIn = prev.has(key);
        if (checked === isIn) return prev;
        if (checked && isSelectable && !isSelectable(item)) return prev;
        const next = new Set(prev);
        if (checked) {
          addSnapshot(key, item);
          next.add(key);
        } else {
          next.delete(key);
          snapshotsRef.current.delete(key);
        }
        return next;
      });
    },
    [isSelectable, addSnapshot]
  );

  const selectAllOnPage = useCallback(() => {
    const selectableItems = isSelectable ? items.filter(isSelectable) : items;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const item of selectableItems) {
        const key = keyFn(item);
        addSnapshot(key, item);
        next.add(key);
      }
      return next;
    });
  }, [items, keyFn, isSelectable, addSnapshot]);

  const clear = useCallback(() => {
    setSelected((prev) => (prev.size === 0 ? prev : new Set()));
    snapshotsRef.current.clear();
  }, []);

  const isSelectedFn = useCallback((key: string) => selected.has(key), [selected]);

  // selectedItems는 snapshot 기반 — 페이지 이동해도 보존
  const selectedItems = useMemo<readonly T[]>(() => {
    const result: T[] = [];
    for (const [key, item] of snapshotsRef.current) {
      if (selected.has(key)) result.push(item);
    }
    return result;
    // selected가 바뀔 때마다 재계산 (snapshot ref 변경은 비동기 반영)
  }, [selected]);

  // 현재 페이지의 선택 가능한 항목 기준으로 allSelected/indeterminate 계산
  const { isAllPageSelected, isIndeterminate } = useMemo(() => {
    const selectableOnPage = isSelectable ? items.filter(isSelectable) : items;
    if (selectableOnPage.length === 0) return { isAllPageSelected: false, isIndeterminate: false };
    const selectedOnPage = selectableOnPage.filter((item) => selected.has(keyFn(item))).length;
    return {
      isAllPageSelected: selectedOnPage === selectableOnPage.length,
      isIndeterminate: selectedOnPage > 0 && selectedOnPage < selectableOnPage.length,
    };
  }, [items, selected, keyFn, isSelectable]);

  return {
    selected,
    selectedItems,
    count: selected.size,
    toggle,
    setSelected: setSelectedItem,
    selectAllOnPage,
    clear,
    isSelected: isSelectedFn,
    isAllPageSelected,
    isIndeterminate,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// useBulkSelection — 기존 API (useRowSelection alias, 3개월 유예)
// ────────────────────────────────────────────────────────────────────────────

/** @deprecated useRowSelection으로 이전하세요. */
export interface BulkSelectionAPI<T> {
  selected: Set<string>;
  selectedItems: T[];
  toggle: (key: string) => void;
  setSelected: (key: string, checked: boolean) => void;
  selectAll: () => void;
  clear: () => void;
  isSelected: (key: string) => boolean;
  count: number;
}

/** @deprecated useRowSelection을 사용하세요. */
export function useBulkSelection<T>(
  items: readonly T[],
  keyFn: (item: T) => string
): BulkSelectionAPI<T> {
  const {
    selected,
    selectedItems,
    toggle: rowToggle,
    setSelected: rowSetSelected,
    selectAllOnPage,
    clear,
    isSelected,
    count,
  } = useRowSelection(items, keyFn);

  const toggle = useCallback(
    (key: string) => {
      const item = items.find((i) => keyFn(i) === key);
      if (item !== undefined) rowToggle(key, item);
    },
    [rowToggle, items, keyFn]
  );

  const setSelected = useCallback(
    (key: string, checked: boolean) => {
      const item = items.find((i) => keyFn(i) === key);
      if (item !== undefined) rowSetSelected(key, checked, item);
    },
    [rowSetSelected, items, keyFn]
  );

  return {
    selected: selected as Set<string>,
    selectedItems: selectedItems as T[],
    toggle,
    setSelected,
    selectAll: selectAllOnPage,
    clear,
    isSelected,
    count,
  };
}
