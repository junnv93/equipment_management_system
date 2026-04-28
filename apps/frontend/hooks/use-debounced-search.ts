'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebouncedValue } from './use-debounced-value';

export interface UseDebouncedSearchOptions {
  /** 외부에서 제어되는 값 (URL 파라미터 등). 변경 시 inputValue 동기화 */
  value?: string;
  /** 디바운스 딜레이 (ms, 기본 300) */
  delay?: number;
  /** 디바운스 완료 후 호출되는 콜백 */
  onSearch: (value: string) => void;
  /** 공백 trim 여부 (기본 true) */
  trim?: boolean;
}

export interface UseDebouncedSearchReturn {
  /** 즉시 업데이트되는 입력 값 (Input value에 바인딩) */
  inputValue: string;
  /** 디바운스된 값 (API 요청에 사용) */
  debouncedValue: string;
  /** 입력값과 디바운스된 값이 다를 때 true (검색 아이콘 대신 스피너 표시 용도) */
  isPending: boolean;
  /** Input onChange에 연결 */
  handleChange: (value: string) => void;
  /** 검색어 초기화 (즉시 — 디바운스 우회) */
  handleClear: () => void;
  /** Enter: 즉시 검색, Escape: 초기화 */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * 디바운스 검색 훅 (SSOT)
 *
 * `useDebouncedValue` 래퍼 + `isPending` 상태 제공.
 * 컴포넌트는 `isPending`으로 디바운스 대기 중 스피너를 표시할 수 있음.
 *
 * @example
 * ```tsx
 * const { inputValue, isPending, handleChange, handleClear, handleKeyDown } = useDebouncedSearch({
 *   value: filters.search,
 *   onSearch: (v) => setFilters({ search: v }),
 * });
 *
 * <SearchInput
 *   value={inputValue}
 *   pending={isPending}
 *   onChange={(e) => handleChange(e.target.value)}
 *   onClear={handleClear}
 *   onKeyDown={handleKeyDown}
 * />
 * ```
 */
export function useDebouncedSearch({
  value = '',
  delay = 300,
  onSearch,
  trim = true,
}: UseDebouncedSearchOptions): UseDebouncedSearchReturn {
  const [inputValue, setInputValue] = useState(value);

  // Stable ref to avoid stale closure in effect
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  });

  const processedValue = trim ? inputValue.trim() : inputValue;
  const debouncedValue = useDebouncedValue(processedValue, delay);
  const isPending = processedValue !== debouncedValue;

  // 외부 value 변경 시 (URL 파라미터 등) 동기화
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // 디바운스 완료 시 onSearch 호출 (초기 렌더 제외)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearchRef.current(debouncedValue);
  }, [debouncedValue]);

  const handleChange = useCallback((val: string) => {
    setInputValue(val);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    onSearchRef.current('');
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const immediate = trim ? inputValue.trim() : inputValue;
        onSearchRef.current(immediate);
      }
      if (e.key === 'Escape') {
        setInputValue('');
        onSearchRef.current('');
      }
    },
    [inputValue, trim]
  );

  return {
    inputValue,
    debouncedValue,
    isPending,
    handleChange,
    handleClear,
    handleKeyDown,
  };
}
