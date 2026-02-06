'use client';

import { memo, useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import debounce from 'lodash/debounce';

interface EquipmentSearchBarProps {
  /** 현재 검색어 */
  value: string;
  /** 검색어 변경 콜백 */
  onChange: (value: string) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 디바운스 딜레이 (ms) */
  debounceDelay?: number;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 장비 검색바 컴포넌트
 *
 * - 통합 검색 (장비명, 모델명, 시리얼넘버, 관리번호)
 * - 디바운스 적용 (기본 300ms)
 * - 로딩 상태 표시
 * - 검색어 초기화 버튼
 */
function EquipmentSearchBarComponent({
  value,
  onChange,
  isLoading = false,
  debounceDelay = 300,
  placeholder = '장비명, 모델명, 관리번호로 검색',
  className = '',
}: EquipmentSearchBarProps) {
  // 로컬 입력값 상태 (즉시 UI 업데이트용)
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 value 변경 시 로컬 값 동기화
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // 디바운스된 검색 함수
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      // 🔥 Trim whitespace before calling onChange
      onChange(searchValue.trim());
    }, debounceDelay),
    [onChange, debounceDelay]
  );

  // 컴포넌트 언마운트 시 디바운스 취소
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // 입력값 변경 핸들러
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedSearch(newValue);
    },
    [debouncedSearch]
  );

  // 검색어 초기화
  const handleClear = useCallback(() => {
    setLocalValue('');
    debouncedSearch.cancel();
    onChange('');
    inputRef.current?.focus();
  }, [onChange, debouncedSearch]);

  // Enter 키 처리 (즉시 검색)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        debouncedSearch.cancel();
        // 🔥 Trim whitespace before submitting search
        onChange(localValue.trim());
      }
      if (e.key === 'Escape') {
        setLocalValue('');
        debouncedSearch.cancel();
        onChange('');
        inputRef.current?.blur(); // 🔥 Escape 키로 포커스 해제
      }
    },
    [debouncedSearch, onChange, localValue]
  );

  return (
    <div className={`relative ${className}`} role="search" aria-label="장비 검색">
      <div className="relative">
        {/* 검색 아이콘 또는 로딩 스피너 */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
        </div>

        {/* 검색 입력 */}
        <Input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-10"
          aria-label="장비명, 모델명, 관리번호 검색"
          aria-describedby="search-hint"
        />

        {/* 검색어 초기화 버튼 */}
        {localValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 스크린 리더용 안내 텍스트 */}
      <span id="search-hint" className="sr-only">
        Enter를 눌러 검색하거나 검색어를 입력하면 자동으로 검색됩니다
      </span>
    </div>
  );
}

export const EquipmentSearchBar = memo(EquipmentSearchBarComponent);
export default EquipmentSearchBar;
