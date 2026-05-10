'use client';

import { useState, useRef, useId, useCallback } from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useRecentDestinations } from '@/hooks/use-recent-destinations';
import { fuzzyFilter } from '@/lib/utils/fuzzy-search';

interface CheckoutDestinationComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/**
 * 반출지 자동완성 combobox.
 *
 * - useRecentDestinations → SSOT queryKey + CACHE_TIMES.DAY
 * - fuzzyFilter: NFD normalization + lowercase (한글/영어 accent-insensitive)
 * - IME 가드: nativeEvent.isComposing (compositionstart 금지)
 * - 키보드: ↑↓ 항목 이동, Enter 선택, Esc 닫기
 * - 빈 결과 시 "+ 새 목적지 추가" 옵션 표시
 * - aria-expanded + aria-activedescendant
 */
export function CheckoutDestinationCombobox({
  value,
  onChange,
  disabled,
}: CheckoutDestinationComboboxProps) {
  const t = useTranslations('checkouts.destination');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: recentDestinations = [] } = useRecentDestinations();

  const destinations = recentDestinations.map((d) => d.destination);
  const filtered = fuzzyFilter(destinations, query, (d) => d);

  const showAddNew = query.trim() && !filtered.includes(query.trim());
  const totalItems = filtered.length + (showAddNew ? 1 : 0);

  const handleSelect = useCallback(
    (dest: string) => {
      onChange(dest);
      setOpen(false);
      setQuery('');
      setActiveIndex(-1);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.nativeEvent.isComposing) return;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex((prev) => Math.min(prev + 1, totalItems - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex((prev) => Math.max(prev - 1, -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < filtered.length) {
            handleSelect(filtered[activeIndex]);
          } else if (activeIndex === filtered.length && showAddNew) {
            handleSelect(query.trim());
          } else if (query.trim()) {
            handleSelect(query.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [activeIndex, filtered, showAddNew, query, handleSelect, totalItems]
  );

  const activeDescendant = activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={t('aria.combobox')}
          disabled={disabled}
          className="w-full justify-between font-normal"
          type="button"
        >
          <span className={cn(!value && 'text-muted-foreground')}>{value || t('placeholder')}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2">
          <Input
            ref={inputRef}
            placeholder={t('searchPlaceholder')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            aria-activedescendant={activeDescendant}
            autoFocus
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label={t('label')}
          className="max-h-56 overflow-y-auto py-1"
        >
          {filtered.length === 0 && !showAddNew && (
            <li className="px-4 py-2 text-sm text-muted-foreground">{t('noResults')}</li>
          )}
          {filtered.map((dest, index) => (
            <li
              key={dest}
              id={`${listId}-item-${index}`}
              role="option"
              aria-selected={dest === value}
              className={cn(
                'flex cursor-pointer items-center px-4 py-2 text-sm',
                activeIndex === index && 'bg-accent text-accent-foreground',
                dest === value && 'font-medium'
              )}
              onClick={() => handleSelect(dest)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <Check className={cn('mr-2 h-4 w-4', dest === value ? 'opacity-100' : 'opacity-0')} />
              {dest}
            </li>
          ))}
          {showAddNew && (
            <li
              id={`${listId}-item-${filtered.length}`}
              role="option"
              aria-selected={false}
              className={cn(
                'flex cursor-pointer items-center px-4 py-2 text-sm text-primary',
                activeIndex === filtered.length && 'bg-accent text-accent-foreground'
              )}
              onClick={() => handleSelect(query.trim())}
              onMouseEnter={() => setActiveIndex(filtered.length)}
            >
              {t('addNew', { value: query.trim() })}
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
