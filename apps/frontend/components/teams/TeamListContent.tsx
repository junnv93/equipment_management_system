'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, Users, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import teamsApi, { type Team, SITE_CONFIG, TEAM_TYPE_CONFIG } from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { TeamCard, TeamCardSkeleton } from './TeamCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTeamFilters } from '@/hooks/use-team-filters';
import type { UITeamFilters } from '@/lib/utils/team-filter-utils';
import type { Site } from '@equipment-management/schemas';

// 드롭다운에 표시할 주요 팀 유형 (레거시 제외)
const PRIMARY_TEAM_TYPES = [
  'FCC_EMC_RF',
  'GENERAL_EMC',
  'GENERAL_RF',
  'SAR',
  'AUTOMOTIVE_EMC',
  'SOFTWARE',
] as const;

interface TeamListContentProps {
  initialData?: PaginatedResponse<Team>;
  initialFilters?: UITeamFilters;
}

/**
 * 팀 목록 컴포넌트 ('use client')
 *
 * SSOT 패턴:
 * - URL 파라미터가 유일한 진실의 소스
 * - useTeamFilters 훅으로 필터 상태 관리
 * - 서버에서 전달받은 initialData를 placeholderData로 사용
 *
 * 기능:
 * - 사이트별 팀 필터링
 * - 검색 기능 (300ms 디바운스)
 * - stagger 애니메이션
 *
 * 권한:
 * - lab_manager, system_admin, technical_manager: 팀 생성 가능
 */
export function TeamListContent({ initialData, initialFilters }: TeamListContentProps) {
  const router = useRouter();
  const { hasRole } = useAuth();
  const { filters, apiFilters, activeCount, updateSearch, updateSite, updateType, clearFilters } =
    useTeamFilters(initialFilters);

  // 검색어 로컬 상태 (디바운스용)
  const [searchInput, setSearchInput] = useState(filters.search);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // 디바운스된 검색어를 URL에 반영
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateSearch(debouncedSearch);
    }
  }, [debouncedSearch, filters.search, updateSearch]);

  // 팀 목록 쿼리
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: queryKeys.teams.list(apiFilters),
    queryFn: () => teamsApi.getTeams(apiFilters),
    placeholderData: initialData, // ✅ 서버 데이터를 stale로 처리 → 백그라운드 refetch
    ...QUERY_CONFIG.TEAMS,
  });

  const teams = data?.data || [];
  const canCreateTeam = hasRole(['lab_manager', 'system_admin', 'technical_manager']);

  // 필터 초기화
  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    clearFilters();
  };

  const hasActiveFilters = activeCount > 0;

  // 에러 상태
  if (error) {
    return (
      <ErrorAlert
        error={error as Error}
        title="팀 목록을 불러올 수 없습니다"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6" aria-live="polite" aria-busy={isFetching}>
      {/* 검색 및 필터 영역 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 검색 입력 */}
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="팀 검색..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            aria-label="팀 검색"
          />
        </div>

        {/* 사이트 필터 */}
        <Select
          value={filters.site || '_all'}
          onValueChange={(value) => updateSite(value === '_all' ? '' : (value as Site))}
        >
          <SelectTrigger className="w-[160px]" aria-label="사이트 필터">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="사이트 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 사이트</SelectItem>
            {Object.entries(SITE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 팀 유형 필터 */}
        <Select
          value={filters.type || '_all'}
          onValueChange={(value: string) =>
            updateType(value === '_all' ? '' : (value as Parameters<typeof updateType>[0]))
          }
        >
          <SelectTrigger className="w-[180px]" aria-label="팀 유형 필터">
            <SelectValue placeholder="전체 유형" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">전체 유형</SelectItem>
            {PRIMARY_TEAM_TYPES.map((key) => (
              <SelectItem key={key} value={key}>
                {TEAM_TYPE_CONFIG[key]?.label || key}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* 필터 초기화 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="shrink-0"
            type="button"
          >
            필터 초기화
          </Button>
        )}

        {/* 팀 추가 버튼 (권한 있는 경우만) */}
        {canCreateTeam && (
          <Button onClick={() => router.push('/teams/create')} className="shrink-0 ml-auto">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />팀 추가
          </Button>
        )}
      </div>

      {/* 결과 정보 */}
      {teams.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data?.meta?.pagination?.total || teams.length}개의 팀
            {hasActiveFilters && ' (필터 적용됨)'}
          </span>
          {hasActiveFilters && (
            <div className="flex gap-2">
              {debouncedSearch && (
                <Badge variant="secondary" className="text-xs">
                  검색: {debouncedSearch}
                </Badge>
              )}
              {filters.site && (
                <Badge variant="secondary" className="text-xs">
                  사이트: {SITE_CONFIG[filters.site as keyof typeof SITE_CONFIG]?.label}
                </Badge>
              )}
              {filters.type && (
                <Badge variant="secondary" className="text-xs">
                  유형: {TEAM_TYPE_CONFIG[filters.type]?.label || filters.type}
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* 팀 카드 그리드 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <TeamCardSkeleton key={i} />
          ))}
        </div>
      ) : teams.length === 0 ? (
        <EmptyTeamList
          hasFilters={hasActiveFilters}
          searchTerm={debouncedSearch}
          onClearFilters={handleClearFilters}
          canCreate={canCreateTeam}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team, index) => (
            <div
              key={team.id}
              className={cn('animate-in fade-in slide-in-from-bottom-4', 'fill-mode-forwards')}
              style={{
                animationDelay: `${index * 50}ms`,
                animationDuration: '300ms',
              }}
            >
              <TeamCard team={team} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 빈 팀 목록 컴포넌트
 */
function EmptyTeamList({
  hasFilters,
  searchTerm,
  onClearFilters,
  canCreate,
}: {
  hasFilters: boolean;
  searchTerm?: string;
  onClearFilters: () => void;
  canCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted rounded-full p-4 mb-4">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>

      <h3 className="text-lg font-semibold mb-2">
        {hasFilters ? '검색 결과가 없습니다' : '등록된 팀이 없습니다'}
      </h3>

      <p className="text-muted-foreground max-w-md mb-6">
        {hasFilters ? (
          searchTerm ? (
            <>"{searchTerm}"에 대한 검색 결과가 없습니다.</>
          ) : (
            '선택한 필터 조건에 맞는 팀이 없습니다.'
          )
        ) : (
          '첫 번째 팀을 등록해보세요.'
        )}
      </p>

      <div className="flex gap-3">
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters} type="button">
            필터 초기화
          </Button>
        )}
        {canCreate && (
          <Button onClick={() => router.push('/teams/create')}>
            <Plus className="h-4 w-4 mr-2" />팀 추가
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 팀 목록 스켈레톤
 */
export function TeamListSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* 검색/필터 스켈레톤 */}
      <div className="flex gap-4">
        <div className="h-10 flex-1 max-w-md bg-muted rounded-md animate-pulse" />
        <div className="h-10 w-[160px] bg-muted rounded-md animate-pulse" />
      </div>

      {/* 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <TeamCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
