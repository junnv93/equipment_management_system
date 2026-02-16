'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import dashboardApi from '@/lib/api/dashboard-api';
import type { EquipmentByTeam } from '@/lib/api/dashboard-api';
import { AlertTriangle, Users, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { DASHBOARD_MOTION, getDashboardStaggerDelay } from '@/lib/design-tokens';

interface TeamStats {
  id: string;
  name: string;
  totalEquipment: number;
  availableEquipment: number;
  loanedEquipment: number;
  calibrationDue: number;
}

export default function TeamEquipmentStats() {
  // TanStack Query로 서버 상태 관리
  const {
    data: teamStats = [],
    isLoading: loading,
    isError,
    refetch,
  } = useQuery<TeamStats[]>({
    queryKey: queryKeys.dashboard.equipmentByTeam(),
    queryFn: async () => {
      const data = await dashboardApi.getEquipmentByTeam();
      return data.map(
        (team: EquipmentByTeam): TeamStats => ({
          id: team.id,
          name: team.name,
          totalEquipment: team.count || 0,
          availableEquipment: Math.floor(team.count * 0.8),
          loanedEquipment: Math.floor(team.count * 0.15),
          calibrationDue: Math.floor(team.count * 0.05),
        })
      );
    },
    ...QUERY_CONFIG.DASHBOARD,
  });

  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx}>
                    <Skeleton className="h-3 w-2/3 mb-1" />
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Skeleton className="h-3 w-1/3 mb-1" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // 에러 상태 표시
  if (isError) {
    return (
      <Card className="p-4 bg-destructive/10 border-destructive/20 dark:bg-destructive/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <span>데이터를 불러올 수 없습니다.</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            재시도
          </Button>
        </div>
      </Card>
    );
  }

  // 데이터가 없는 경우
  if (teamStats.length === 0) {
    return (
      <Card className="p-4 text-center py-12">
        <div className="inline-block motion-safe:animate-gentle-bounce">
          <div className="h-12 w-12 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Users className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          </div>
        </div>
        <h3 className="mt-4 text-base font-medium tracking-tight text-foreground">데이터 없음</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          팀별 장비 통계 데이터가 없습니다.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {teamStats.map((team, index) => (
        <TeamCard key={team.id} team={team} index={index} />
      ))}
    </div>
  );
}

function TeamCard({ team, index }: { team: TeamStats; index: number }) {
  // 가용률 계산
  const availabilityRate = Math.round((team.availableEquipment / team.totalEquipment) * 100);

  return (
    <Card
      hoverable
      className="motion-safe:animate-[staggerFadeIn_0.3s_ease-out_forwards]"
      style={{ animationDelay: getDashboardStaggerDelay(index, 'grid') }}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg tracking-tight">{team.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <StatItem label="총 장비" value={team.totalEquipment} />
          <StatItem label="사용 가능" value={team.availableEquipment} highlight />
          <StatItem label="대여 중" value={team.loanedEquipment} />
          <StatItem label="교정 예정" value={team.calibrationDue} />
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-1 tabular-nums">
            가용률: {availabilityRate}%
          </p>
          <Progress value={availabilityRate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums ${highlight ? 'text-ul-green dark:text-ul-green' : 'text-foreground'}`}
      >
        {value}
      </p>
    </div>
  );
}

// Named export for simple inline usage in dashboard
export function TeamEquipmentStatsItem({
  team,
  selected = false,
  onClick,
}: {
  team: EquipmentByTeam;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between p-2.5 bg-card rounded-lg border hover:bg-muted/50 ${DASHBOARD_MOTION.listItem} motion-reduce:transition-none cursor-pointer ${
        selected ? 'bg-primary/10 border-primary' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span className="font-medium text-sm">{team.name}</span>
      <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded tabular-nums">
        {team.count}대
      </span>
    </div>
  );
}

// Re-export with alias for backwards compatibility
export { TeamEquipmentStatsItem as TeamEquipmentStats };
