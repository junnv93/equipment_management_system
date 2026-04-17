'use client';

import { useCallback, useMemo, useState } from 'react';

/**
 * 범용 다건 선택 프리미티브 훅.
 *
 * ## 사용 사례
 * - QR 라벨 PDF 일괄 인쇄 (Phase 2)
 * - 향후 체크아웃 일괄 승인, 문서 일괄 다운로드 등 확장
 *
 * ## 설계 원칙
 * - **React Query 무접촉** — 캐시 변경/조회 없이 순수 로컬 상태만 관리.
 *   서버 상태와 독립적인 UI 선택 로직의 SSOT.
 * - 키 기반 Set 저장 — 객체 참조 변경(refetch/reorder)에도 선택 보존.
 * - `selectedItems`는 `useMemo`로 파생 — 선택 변경 없을 시 참조 안정성 유지.
 *
 * ## 예시
 * ```tsx
 * const { selected, selectedItems, toggle, selectAll, clear, isSelected, count } =
 *   useBulkSelection(equipmentList, (e) => String(e.id));
 *
 * <Checkbox checked={isSelected(String(row.id))} onCheckedChange={() => toggle(String(row.id))} />
 * <BulkLabelPrintButton items={selectedItems} />
 * ```
 */
export interface BulkSelectionAPI<T> {
  /** 현재 선택된 키 집합 (Set). */
  selected: Set<string>;
  /** `items` 배열에서 선택된 원소만 순서 유지하여 파생. */
  selectedItems: T[];
  /** 키를 토글(있으면 제거, 없으면 추가). */
  toggle: (key: string) => void;
  /**
   * 키 선택 상태를 명시적으로 설정.
   * 체크박스 `onCheckedChange(checked)`와 직결.
   */
  setSelected: (key: string, checked: boolean) => void;
  /** `items` 배열의 모든 키를 선택. */
  selectAll: () => void;
  /** 선택 전체 해제. */
  clear: () => void;
  /** 지정 키의 선택 여부 조회. */
  isSelected: (key: string) => boolean;
  /** 선택된 항목 수. */
  count: number;
}

export function useBulkSelection<T>(
  items: readonly T[],
  keyFn: (item: T) => string
): BulkSelectionAPI<T> {
  const [selected, setSelectedSet] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((key: string) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const setSelected = useCallback((key: string, checked: boolean) => {
    setSelectedSet((prev) => {
      const isIn = prev.has(key);
      if (checked === isIn) return prev; // No-op: 참조 안정성 유지
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedSet(new Set(items.map(keyFn)));
  }, [items, keyFn]);

  const clear = useCallback(() => {
    setSelectedSet((prev) => (prev.size === 0 ? prev : new Set()));
  }, []);

  const isSelected = useCallback((key: string) => selected.has(key), [selected]);

  const selectedItems = useMemo(
    () => items.filter((item) => selected.has(keyFn(item))),
    [items, selected, keyFn]
  );

  return {
    selected,
    selectedItems,
    toggle,
    setSelected,
    selectAll,
    clear,
    isSelected,
    count: selected.size,
  };
}
