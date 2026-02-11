'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import teamsApi, { type Team, type TeamQuery, SITE_CONFIG } from '@/lib/api/teams-api';
import type { PaginatedResponse } from '@/lib/api/types';
import { TeamCard, TeamCardSkeleton } from './TeamCard';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface TeamListProps {
  initialData?: PaginatedResponse<Team>;
}

/**
 * 팀 목록 컴포넌트 ('use client')
 *
 * 기능:
 * - 사이트별 팀 필터링
 * - 검색 기능
 * - URL 상태 동기화
 * - stagger 애니메이션
 *
 * 권한:
 * - lab_manager: 시험소 내 팀 관리
 * - system_admin: 전체 팀 관리
 */
export function TeamList({ initialData }: TeamListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();

  // URL에서 초기 필터값 읽기
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [siteFilter, setSiteFilter] = useState(searchParams.get('site') || 'all');
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // 검색어 디바운스
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // URL 상태 동기화
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (siteFilter && siteFilter !== 'all') params.set('site', siteFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `/teams?${queryString}` : '/teams';

    // 현재 URL과 다를 때만 업데이트
    if (window.location.pathname + window.location.search !== newUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearch, siteFilter, router]);

  // 쿼리 파라미터 생성
  const queryParams: TeamQuery = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      site: siteFilter !== 'all' ? (siteFilter as 'suwon' | 'uiwang') : undefined,
      pageSize: 50, // 팀은 보통 많지 않으므로 한 번에 로드
    }),
    [debouncedSearch, siteFilter]
  );

  // 팀 목록 쿼리
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['teams', queryParams],
    queryFn: () => teamsApi.getTeams(queryParams),
    placeholderData: initialData,
    staleTime: 60 * 1000, // 1분
  });

  const teams = data?.data || [];
  const canCreateTeam = hasRole(['lab_manager', 'system_admin', 'technical_manager']);

  // 필터 초기화
  const handleClearFilters = () => {
    setSearch('');
    setSiteFilter('all');
  };

  const hasActiveFilters = !!debouncedSearch || siteFilter !== 'all';

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            aria-label="팀 검색"
          />
        </div>

        {/* 사이트 필터 */}
        <Select value={siteFilter} onValueChange={setSiteFilter}>
          <SelectTrigger className="w-[160px]" aria-label="사이트 필터">
            <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
            <SelectValue placeholder="사이트 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 사이트</SelectItem>
            {Object.entries(SITE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
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
              {siteFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs">
                  사이트: {SITE_CONFIG[siteFilter as keyof typeof SITE_CONFIG]?.label}
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
