'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Monitor, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import testSoftwareApi, { type TestSoftware } from '@/lib/api/software-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface TestSoftwareComboboxProps {
  value?: string;
  onChange: (softwareId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 이미 연결된 소프트웨어 ID 목록 — 목록에서 제외 */
  excludeIds?: string[];
}

/**
 * 범용 시험용 소프트웨어 검색 Combobox
 *
 * UserCombobox와 동일한 아키텍처:
 * - 팝오버를 열면 검색 입력 필드가 자동 포커스
 * - 1글자 이상 입력 시 서버 사이드 검색 (debounce 300ms)
 * - 선택된 소프트웨어의 관리번호 + 이름을 트리거 버튼에 표시
 */
export function TestSoftwareCombobox({
  value,
  onChange,
  placeholder,
  disabled,
  excludeIds = [],
}: TestSoftwareComboboxProps) {
  const t = useTranslations('common.equipmentCombobox'); // 동일 라벨 재사용
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const isQueryEnabled = open && debouncedSearch.length >= 1;

  const {
    data: searchResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [...queryKeys.testSoftware.lists(), { search: debouncedSearch, pageSize: 20 }],
    queryFn: () => testSoftwareApi.list({ search: debouncedSearch, pageSize: 20 }),
    enabled: isQueryEnabled,
    staleTime: CACHE_TIMES.SHORT,
  });

  const softwareList = (searchResult?.data ?? []).filter((sw) => !excludeIds.includes(sw.id));

  const { data: initialSoftware } = useQuery({
    queryKey: queryKeys.testSoftware.detail(value!),
    queryFn: () => testSoftwareApi.get(value!),
    enabled: !!value,
    staleTime: CACHE_TIMES.LONG,
  });

  const displayName =
    initialSoftware && initialSoftware.id === value
      ? `${initialSoftware.managementNumber} — ${initialSoftware.name}`
      : undefined;

  const handleSelect = (sw: TestSoftware) => {
    onChange(sw.id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10',
              !value && 'text-muted-foreground'
            )}
          >
            <Monitor className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
            <span className="truncate">{displayName || placeholder || t('placeholder')}</span>
          </Button>
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('clearAriaLabel')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto" role="listbox">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="py-6 text-center text-sm text-destructive" role="alert">
              {t('error')}
            </p>
          ) : !isQueryEnabled ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('typeToSearch')}</p>
          ) : softwareList.length > 0 ? (
            softwareList.map((sw) => (
              <button
                key={sw.id}
                type="button"
                role="option"
                aria-selected={sw.id === value}
                className={cn(
                  `flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 ${TRANSITION_PRESETS.fastColor}`,
                  sw.id === value && 'bg-muted'
                )}
                onClick={() => handleSelect(sw)}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{sw.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {sw.managementNumber}
                    </span>
                    {sw.softwareVersion && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        v{sw.softwareVersion}
                      </Badge>
                    )}
                  </div>
                </div>
                {sw.id === value && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noResults')}</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
