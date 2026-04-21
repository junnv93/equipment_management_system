'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, User, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import usersApi, { type UserOption } from '@/lib/api/users-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface UserComboboxProps {
  value?: string;
  onChange: (userId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  'aria-labelledby'?: string;
}

/**
 * 범용 사용자 검색 Combobox
 *
 * - 팝오버를 열면 검색 입력 필드가 자동 포커스
 * - 1글자 이상 입력 시 서버 사이드 검색 (debounce 300ms)
 * - 선택된 사용자의 이름을 트리거 버튼에 표시
 */
export function UserCombobox({
  value,
  onChange,
  placeholder,
  disabled,
  'aria-labelledby': ariaLabelledby,
}: UserComboboxProps) {
  const t = useTranslations('common.userCombobox');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const isQueryEnabled = open && debouncedSearch.length >= 1;

  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.users.search({ search: debouncedSearch }),
    queryFn: () => usersApi.search({ search: debouncedSearch }),
    enabled: isQueryEnabled,
    staleTime: CACHE_TIMES.SHORT,
  });

  const { data: initialUser } = useQuery({
    queryKey: queryKeys.users.detail(value!),
    queryFn: () => usersApi.get(value!),
    enabled: !!value,
    staleTime: CACHE_TIMES.LONG,
  });

  const displayName = initialUser && initialUser.id === value ? initialUser.name : undefined;

  const handleSelect = (user: UserOption) => {
    onChange(user.id);
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
            aria-labelledby={ariaLabelledby}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10',
              !value && 'text-muted-foreground'
            )}
          >
            <User className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
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
          ) : !isQueryEnabled ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('typeToSearch')}</p>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={user.id === value}
                className={cn(
                  `flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 ${TRANSITION_PRESETS.fastColor}`,
                  user.id === value && 'bg-muted'
                )}
                onClick={() => handleSelect(user)}
              >
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  {user.department && (
                    <span className="text-xs text-muted-foreground truncate">
                      {user.department}
                    </span>
                  )}
                </div>
                {user.id === value && <Check className="h-4 w-4 text-primary shrink-0" />}
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
