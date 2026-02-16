'use client';

import { useRouter } from 'next/navigation';
import { Users, Settings, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Team } from '@/lib/api/teams-api';
import { SITE_CONFIG } from '@/lib/api/teams-api';
import { TeamTypeIcon } from './TeamTypeIcon';
import { TeamMemberAvatars } from './TeamMemberAvatars';

interface TeamCardProps {
  team: Team;
  className?: string;
}

/**
 * 팀 카드 컴포넌트
 *
 * 접근성 요구사항:
 * - role="article" 및 aria-labelledby로 팀 이름 연결
 * - 키보드 탐색: Tab 순서 논리적, Enter로 상세 이동
 * - 포커스 표시: ring-2 ring-offset-2 스타일
 *
 * 디자인 요구사항:
 * - 그림자 효과, hover 시 lift 효과
 * - 팀 유형별 색상/아이콘
 * - 팀원 아바타 그리드 (최대 5명 + "+N")
 */
export function TeamCard({ team, className }: TeamCardProps) {
  const router = useRouter();
  const siteInfo = team.site ? SITE_CONFIG[team.site as keyof typeof SITE_CONFIG] : null;

  const handleClick = () => {
    router.push(`/teams/${team.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      router.push(`/teams/${team.id}`);
    }
  };

  return (
    <Card
      role="article"
      aria-labelledby={`team-name-${team.id}`}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      data-testid="team-card"
      className={cn(
        'cursor-pointer motion-safe:transition-[box-shadow,transform] motion-safe:duration-200 motion-reduce:transition-none',
        'hover:shadow-lg hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'active:scale-[0.99]',
        className
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <TeamTypeIcon classification={team.classification || team.id} size="lg" />
            <div>
              <h3
                id={`team-name-${team.id}`}
                className="text-lg font-semibold text-foreground leading-tight"
              >
                {team.name}
              </h3>
              {siteInfo && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  <span>{siteInfo.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* 팀 설명 */}
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        )}

        {/* 통계 정보 */}
        <div className="flex items-center gap-4 text-sm">
          <div
            className="flex items-center gap-1.5 text-muted-foreground"
            aria-label={`팀원 ${team.memberCount || 0}명`}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span>{team.memberCount || 0}명</span>
          </div>
          <div
            className="flex items-center gap-1.5 text-muted-foreground"
            aria-label={`장비 ${team.equipmentCount || 0}개`}
          >
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted">
              <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <span>{team.equipmentCount || 0}개</span>
          </div>
        </div>

        {/* 팀원 아바타 그리드 */}
        {team.memberCount && team.memberCount > 0 && (
          <TeamMemberAvatars teamId={team.id} memberCount={team.memberCount} maxDisplay={5} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 팀 카드 스켈레톤
 */
export function TeamCardSkeleton() {
  return (
    <Card className="motion-safe:animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-3/4 bg-muted rounded" />
        </div>
        <div className="flex gap-4">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-16 bg-muted rounded" />
        </div>
        <div className="flex -space-x-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
