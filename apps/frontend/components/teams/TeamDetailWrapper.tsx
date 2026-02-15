'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import teamsApi from '@/lib/api/teams-api';
import { isNotFoundError } from '@/lib/api/error';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useBreadcrumb } from '@/contexts/BreadcrumbContext';
import { useAuth } from '@/hooks/use-auth';
import { TeamDetail } from './TeamDetail';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface TeamDetailWrapperProps {
  teamId: string;
}

/**
 * 팀 상세 래퍼 컴포넌트 (Client Component)
 *
 * Server Component에서 팀 ID를 받아 데이터를 fetch하고
 * TeamDetail 컴포넌트에 전달
 */
export function TeamDetailWrapper({ teamId }: TeamDetailWrapperProps) {
  const { setDynamicLabel, clearDynamicLabel } = useBreadcrumb();
  const { user } = useAuth();

  const {
    data: team,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: () => teamsApi.getTeam(teamId),
    ...QUERY_CONFIG.TEAMS,
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false;
      return failureCount < 3;
    },
  });

  // 브레드크럼 동적 라벨 설정
  useEffect(() => {
    if (team) {
      // 팀 정보를 사용해서 의미있는 라벨 생성
      setDynamicLabel(teamId, team.name);
    }

    // 컴포넌트 언마운트 시 라벨 제거
    return () => {
      clearDynamicLabel(teamId);
    };
  }, [team, teamId, setDynamicLabel, clearDynamicLabel]);

  // 404 에러 처리
  if (error && isNotFoundError(error)) {
    notFound();
  }

  // 에러 상태
  if (error) {
    return (
      <ErrorAlert
        error={error as Error}
        title="팀 정보를 불러올 수 없습니다"
        onRetry={() => refetch()}
      />
    );
  }

  // 로딩 상태
  if (isLoading || !team) {
    return <TeamDetailSkeleton />;
  }

  return (
    <TeamDetail
      team={team}
      currentUser={
        user
          ? {
              userId: user.id || '',
              role: user.role || '',
              teamId: user.teamId,
              site: user.site,
            }
          : undefined
      }
    />
  );
}

/**
 * 팀 상세 스켈레톤
 */
function TeamDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* 정보 카드 */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <div className="space-y-4">
        <div className="flex gap-2 border-b">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-28" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
