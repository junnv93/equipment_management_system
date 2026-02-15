'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, User, Check, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import teamsApi, { type TeamMember } from '@/lib/api/teams-api';
import { queryKeys, CACHE_TIMES } from '@/lib/api/query-config';
import { USER_ROLE_LABELS } from '@equipment-management/shared-constants';

/** 역할 뱃지 색상 매핑 */
const ROLE_BADGE_VARIANT: Record<string, string> = {
  test_engineer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  technical_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  quality_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  lab_manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

interface LeaderComboboxProps {
  value?: string;
  onChange: (userId: string | undefined) => void;
  site?: string;
  teamId?: string; // Filter candidates by team (edit mode only)
  disabled?: boolean;
}

export function LeaderCombobox({ value, onChange, site, teamId, disabled }: LeaderComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query for user search
  const { data: users, isLoading } = useQuery({
    queryKey: queryKeys.users.search({ search: debouncedSearch, site, teams: teamId }),
    queryFn: () => teamsApi.searchUsers({ search: debouncedSearch, site, teams: teamId }),
    enabled: open && debouncedSearch.length >= 1,
    staleTime: CACHE_TIMES.SHORT,
  });

  // Resolve initial value to user name
  const { data: initialUser } = useQuery({
    queryKey: queryKeys.users.search({ search: '', site: '', id: value }),
    queryFn: () => teamsApi.searchUsers({ search: '' }),
    enabled: !!value && !selectedUser,
    staleTime: CACHE_TIMES.LONG,
    select: (data) => data.find((u) => u.id === value),
  });

  // Set selected user from initial value
  useEffect(() => {
    if (initialUser && !selectedUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser, selectedUser]);

  // Reset selected user when value is cleared externally
  useEffect(() => {
    if (!value) {
      setSelectedUser(null);
    }
  }, [value]);

  const handleSelect = (user: TeamMember) => {
    setSelectedUser(user);
    onChange(user.id);
    setSearch('');
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedUser(null);
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
            aria-label="팀장 선택"
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal h-10',
              !selectedUser && 'text-muted-foreground'
            )}
          >
            <User className="h-4 w-4 mr-2 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {selectedUser ? selectedUser.name : '팀장을 검색하여 선택...'}
            </span>
          </Button>
          {selectedUser && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="선택 해제"
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
              placeholder="이름으로 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
              aria-label="사용자 검색"
              autoFocus
            />
          </div>
        </div>

        {/* 결과 목록 */}
        <div className="max-h-60 overflow-y-auto" role="listbox" aria-label="사용자 목록">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !debouncedSearch ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              이름을 입력하여 검색하세요
            </p>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <button
                key={user.id}
                type="button"
                role="option"
                aria-selected={user.id === value}
                className={cn(
                  'flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors',
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
                        ROLE_BADGE_VARIANT[user.role] || 'bg-muted'
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
              {teamId ? '팀에 활성 멤버가 없습니다. 검색어를 변경하세요.' : '검색 결과가 없습니다'}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
