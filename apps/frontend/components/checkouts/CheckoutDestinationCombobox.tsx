'use client';

import { useState, useRef, useId, useCallback } from 'react';
import { ChevronsUpDown, Check, Plus, ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { VALIDATION_RULES } from '@equipment-management/shared-constants';
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

type Mode = 'browse' | 'create';

/**
 * 반출지 자동완성 combobox + 인라인 등록 폼 (S-6).
 *
 * - browse 모드: 자동완성 + 선택 (`fuzzyFilter`).
 * - create 모드: 새 목적지 등록 form — `VALIDATION_RULES.DESTINATION_MAX_LENGTH(255)` SSOT,
 *   trim, 빈값/whitespace-only 차단, 중복 체크.
 * - destination은 `varchar(255)` 단순 문자열 entity가 아님 — 등록 = onChange로 값 삽입,
 *   recent list는 백엔드 first-use 자동 누적.
 *
 * 키보드: ↑↓ 항목 이동, Enter 선택/등록, Esc 닫기.
 * IME: `nativeEvent.isComposing` 가드 (React 19 표준).
 *
 * 참조: ADR-0011 (fuzzy-search 자체 구현 유지 결정).
 * `+ 새 목적지 등록` 옵션 → create 모드 전환 (이전엔 query 그대로 onChange — 무명시).
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
  const [mode, setMode] = useState<Mode>('browse');
  const [createInput, setCreateInput] = useState('');
  const listId = useId();
  const createInputId = useId();
  const counterId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: recentDestinations = [] } = useRecentDestinations();

  const destinations = recentDestinations.map((d) => d.destination);
  const filtered = fuzzyFilter(destinations, query, (d) => d);

  const showCreateOption = query.trim().length > 0 && !filtered.includes(query.trim());
  const totalItems = filtered.length + (showCreateOption ? 1 : 0);

  const resetState = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActiveIndex(-1);
    setMode('browse');
    setCreateInput('');
  }, []);

  const handleSelect = useCallback(
    (dest: string) => {
      onChange(dest);
      resetState();
    },
    [onChange, resetState]
  );

  const enterCreateMode = useCallback((seed: string) => {
    setMode('create');
    setCreateInput(seed);
  }, []);

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
          } else if (activeIndex === filtered.length && showCreateOption) {
            enterCreateMode(query.trim());
          } else if (query.trim() && showCreateOption) {
            enterCreateMode(query.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [activeIndex, filtered, showCreateOption, query, handleSelect, totalItems, enterCreateMode]
  );

  const trimmedCreate = createInput.trim();
  const createLen = createInput.length;
  const isDuplicate = trimmedCreate.length > 0 && destinations.includes(trimmedCreate);
  const isCreateValid =
    trimmedCreate.length > 0 &&
    !isDuplicate &&
    createLen <= VALIDATION_RULES.DESTINATION_MAX_LENGTH;

  const handleCreateSubmit = () => {
    if (!isCreateValid) return;
    handleSelect(trimmedCreate);
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isDuplicate) {
        // 중복 시 기존 값으로 redirect
        handleSelect(trimmedCreate);
      } else {
        handleCreateSubmit();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMode('browse');
    }
  };

  const activeDescendant = activeIndex >= 0 ? `${listId}-item-${activeIndex}` : undefined;

  return (
    <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : resetState())}>
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
        {mode === 'browse' ? (
          <>
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
              {filtered.length === 0 && !showCreateOption && (
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
                  <Check
                    className={cn('mr-2 h-4 w-4', dest === value ? 'opacity-100' : 'opacity-0')}
                  />
                  {dest}
                </li>
              ))}
              {showCreateOption && (
                <li
                  id={`${listId}-item-${filtered.length}`}
                  role="option"
                  aria-selected={false}
                  className={cn(
                    'flex cursor-pointer items-center px-4 py-2 text-sm text-primary border-t',
                    activeIndex === filtered.length && 'bg-accent text-accent-foreground'
                  )}
                  onClick={() => enterCreateMode(query.trim())}
                  onMouseEnter={() => setActiveIndex(filtered.length)}
                >
                  <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('create.trigger', { value: query.trim() })}
                </li>
              )}
            </ul>
          </>
        ) : (
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMode('browse')}
                aria-label={t('create.backToList')}
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Button>
              <label htmlFor={createInputId} className="text-sm font-medium">
                {t('create.inputLabel')}
              </label>
            </div>
            <Input
              id={createInputId}
              value={createInput}
              onChange={(e) => setCreateInput(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              maxLength={VALIDATION_RULES.DESTINATION_MAX_LENGTH}
              placeholder={t('create.inputPlaceholder')}
              aria-invalid={!isCreateValid && trimmedCreate.length > 0}
              aria-describedby={counterId}
              autoFocus
            />
            <p
              id={counterId}
              className="text-2xs font-mono text-muted-foreground text-right"
              aria-live="polite"
            >
              {createLen} / {VALIDATION_RULES.DESTINATION_MAX_LENGTH}
            </p>
            {isDuplicate && (
              <p className="text-xs text-amber-600 dark:text-amber-400" role="status">
                {t('create.duplicate')}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setMode('browse')}>
                {t('create.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={isDuplicate ? () => handleSelect(trimmedCreate) : handleCreateSubmit}
                disabled={
                  trimmedCreate.length === 0 || createLen > VALIDATION_RULES.DESTINATION_MAX_LENGTH
                }
              >
                {isDuplicate ? t('create.useExisting') : t('create.submit')}
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
