'use client';

import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import teamsApi from '@/lib/api/teams-api';
import { TeamForm } from './TeamForm';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { isNotFoundError } from '@/lib/api/error';

interface EditTeamFormClientProps {
  teamId: string;
}

/**
 * 팀 수정 폼 클라이언트 래퍼
 *
 * 팀 데이터를 fetch하고 TeamForm에 전달
 */
export function EditTeamFormClient({ teamId }: EditTeamFormClientProps) {
  const {
    data: team,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getTeam(teamId),
    retry: (failureCount, error) => {
      if (isNotFoundError(error)) return false;
      return failureCount < 3;
    },
  });

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
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return <TeamForm team={team} mode="edit" />;
}
