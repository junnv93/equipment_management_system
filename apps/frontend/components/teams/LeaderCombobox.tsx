'use client';

import { useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, X, User, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import teamsApi, { type TeamMember } from '@/lib/api/teams-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { USER_ROLE_LABELS } from '@equipment-management/shared-constants';
import { ROLE_BADGE_TOKENS, TRANSITION_PRESETS } from '@/lib/design-tokens';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface LeaderComboboxProps {
  value?: string;
  onChange: (userId: string | undefined) => void;
  site?: string;
  teamId?: string;
  disabled?: boolean;
}

/**
 * 팀장 선택 Combobox
 *
 * 필터링 전략:
 * - Edit 모드 (teamId 존재): teamId로만 필터링 (site는 팀에 내포)
 *   → 팝오버 열면 해당 팀원 즉시 표시, 검색으로 추가 필터링
 * - Create 모드 (teamId 없음): site로 필터링
 *   → 검색어 1글자 이상 입력 시 해당 사이트 사용자 표시
 */
export function LeaderCombobox({ value, onChange, site, teamId, disabled }: LeaderComboboxProps) {
  const t = useTranslations('teams');
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // 필터 전략: Edit 모드는 teamId만, Create 모드는 site만
  const searchParams = teamId
    ? { search: debouncedSearch || undefined, teams: teamId }
    : { search: debouncedSearch || undefined, site };

  // 쿼리 활성화 조건: Edit 모드는 팝오버 열면 즉시, Create 모드는 검색어 필요
  const isQueryEnabled = open && (!!teamId || debouncedSearch.length >= 1);

  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.users.search(searchParams),
    queryFn: () => teamsApi.searchUsers(searchParams),
    enabled: isQueryEnabled,
    staleTime: CACHE_TIMES.SHORT,
  });

  // 초기값 해석: 단건 조회 API로 효율적 처리
  const { data: initialUser } = useQuery({
    queryKey: queryKeys.users.detail(value!),
    queryFn: () => teamsApi.getUser(value!),
    enabled: !!value,
    staleTime: CACHE_TIMES.LONG,
  });

  // 표시할 사용자 이름 결정
  const displayName = (() => {
    if (initialUser && initialUser.id === value) return initialUser.name;
    return undefined;
  })();

  const handleSelect = (user: TeamMember) => {
    // invalidateQueries로 서버 데이터와 동기화 (setQueryData는 TData≠TCachedData 불일치 위험)
    void queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user.id) });
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
            aria-label={t('leaderCombobox.ariaLabel')}
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10',
              !value && 'text-muted-foreground'
            )}
          >
            <User className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
            <span className="truncate">{displayName || t('leaderCombobox.placeholder')}</span>
          </Button>
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t('leaderCombobox.clearAriaLabel')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {/* 검색 입력 */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="search"
              placeholder={t('leaderCombobox.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              aria-label={t('leaderCombobox.searchAriaLabel')}
              autoFocus
            />
          </div>
        </div>

        {/* 결과 목록 */}
        <div
          className="max-h-60 overflow-y-auto"
          role="listbox"
          aria-label={t('leaderCombobox.listAriaLabel')}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" />
            </div>
          ) : !isQueryEnabled ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('leaderCombobox.typeToSearch')}
            </p>
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
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium',
                        ROLE_BADGE_TOKENS[user.role] || 'bg-muted'
                      )}
                    >
                      {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] || user.role}
                    </span>
                    {user.department && (
                      <span className="text-xs text-muted-foreground truncate">
                        {user.department}
                      </span>
                    )}
                  </div>
                </div>
                {user.id === value && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              {teamId ? t('leaderCombobox.noTeamMembers') : t('leaderCombobox.noResults')}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
