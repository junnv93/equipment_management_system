'use client';

import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FOCUS_TOKENS } from '@/lib/design-tokens';

export interface SearchInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> {
  /** 디바운스 대기 중일 때 true — Search 아이콘 대신 Loader2 스피너 표시 */
  pending?: boolean;
  /** 검색어 초기화 버튼 클릭 핸들러 (없으면 초기화 버튼 숨김) */
  onClear?: () => void;
  /** role="search" 래퍼의 aria-label */
  searchAriaLabel?: string;
  /** 검색어 초기화 버튼의 aria-label */
  clearAriaLabel?: string;
  /** 래퍼 div 추가 클래스 */
  containerClassName?: string;
}

/**
 * 검색 입력 컴포넌트 (SSOT)
 *
 * `useDebouncedSearch` 훅과 조합하여 사용.
 * `pending` prop으로 디바운스 대기 중 스피너 표시 가능.
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
 *   searchAriaLabel={t('search.ariaLabel')}
 *   clearAriaLabel={t('search.clearAriaLabel')}
 * />
 * ```
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      pending = false,
      onClear,
      searchAriaLabel,
      clearAriaLabel,
      containerClassName,
      className,
      value,
      ...props
    },
    ref
  ) => {
    const hasValue = Boolean(value) && String(value).length > 0;

    return (
      <div
        role="search"
        aria-label={searchAriaLabel}
        className={cn('relative', containerClassName)}
      >
        {/* 검색 아이콘 또는 디바운스 대기 스피너 */}
        <div
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <Input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            'pl-10',
            onClear && hasValue ? 'pr-10' : '',
            FOCUS_TOKENS.classes.default,
            className
          )}
          {...props}
        />

        {/* 검색어 초기화 버튼 */}
        {onClear && hasValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onClear}
            aria-label={clearAriaLabel}
            tabIndex={0}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = 'SearchInput';
