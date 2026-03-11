'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Team } from '@/lib/api/teams-api';
import { SITE_CONFIG, CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';
import { TeamTypeIcon } from './TeamTypeIcon';
import { TeamMemberAvatars } from './TeamMemberAvatars';
import { TEAM_CARD_TOKENS } from '@/lib/design-tokens/components/team';

interface TeamCardProps {
  team: Team;
  className?: string;
}

/**
 * 팀 카드 컴포넌트 — v2 리디자인
 *
 * 변경사항:
 * - 분류 accent line (3px top border, data-driven color)
 * - KPI 3열 그리드: 팀원 / 장비 / 팀장
 * - 팀장 표시: UserCheck 아이콘 + 이름 or "팀장 미지정" 경고 배지
 * - 사이트 코드를 monospace 배지로 표시
 */
export function TeamCard({ team, className }: TeamCardProps) {
  const router = useRouter();
  const siteInfo = team.site ? SITE_CONFIG[team.site as keyof typeof SITE_CONFIG] : null;
  const clsConfig =
    (team.classification && CLASSIFICATION_CONFIG[team.classification]) ||
    CLASSIFICATION_CONFIG.fcc_emc_rf;

  const memberCount = team.memberCount ?? 0;
  const equipmentCount = team.equipmentCount ?? 0;

  const handleClick = () => router.push(`/teams/${team.id}`);
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
      className={cn(TEAM_CARD_TOKENS.interactive, 'relative overflow-hidden', className)}
    >
      {/* 분류 accent line — 데이터 기반 색상 */}
      <div
        className={TEAM_CARD_TOKENS.accentLine}
        style={{ background: clsConfig.color }}
        aria-hidden="true"
      />

      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start gap-2.5">
          <TeamTypeIcon classification={team.classification || ''} size="lg" />
          <div className="flex-1 min-w-0">
            <h3
              id={`team-name-${team.id}`}
              className="text-[14.5px] font-semibold text-foreground leading-tight truncate"
            >
              {team.name}
            </h3>
            {siteInfo && (
              <span className="inline-flex items-center mt-1 text-[10.5px] font-mono font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {siteInfo.code}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3 pb-4">
        {/* 팀 설명 */}
        {team.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        )}

        {/* KPI 3열 */}
        <div className={TEAM_CARD_TOKENS.kpiGrid} aria-label="팀 현황">
          <div className={TEAM_CARD_TOKENS.kpiItem}>
            <div className={TEAM_CARD_TOKENS.kpiValue}>{memberCount}</div>
            <div className={TEAM_CARD_TOKENS.kpiLabel}>팀원</div>
          </div>
          <div className={TEAM_CARD_TOKENS.kpiItem}>
            <div className={TEAM_CARD_TOKENS.kpiValue}>{equipmentCount}</div>
            <div className={TEAM_CARD_TOKENS.kpiLabel}>장비</div>
          </div>
          <div className={TEAM_CARD_TOKENS.kpiItem}>
            <div
              className={cn(
                TEAM_CARD_TOKENS.kpiValue,
                team.leaderName
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-500 dark:text-amber-400'
              )}
            >
              {team.leaderName ? '✓' : '−'}
            </div>
            <div className={TEAM_CARD_TOKENS.kpiLabel}>팀장</div>
          </div>
        </div>

        {/* Footer: 팀장 정보 + 아바타 */}
        <div className="flex items-center justify-between min-h-[24px]">
          {team.leaderName ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <UserCheck className="h-3 w-3 text-green-500 flex-shrink-0" aria-hidden="true" />
              <span className="truncate">{team.leaderName}</span>
            </div>
          ) : (
            <span className={TEAM_CARD_TOKENS.noLeaderBadge}>
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              팀장 미지정
            </span>
          )}

          {memberCount > 0 && (
            <TeamMemberAvatars teamId={team.id} memberCount={memberCount} maxDisplay={4} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 팀 카드 스켈레톤 — v2 구조 동기화
 */
export function TeamCardSkeleton() {
  return (
    <Card className="motion-safe:animate-pulse overflow-hidden">
      <div className="h-0.5 bg-muted" aria-hidden="true" />
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start gap-2.5">
          <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-3.5 w-10 bg-muted rounded" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3 pb-4">
        <div className="space-y-1">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-lg p-2.5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-1 text-center">
              <div className="h-5 w-7 bg-muted rounded mx-auto" />
              <div className="h-2.5 w-6 bg-muted rounded mx-auto" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="flex -space-x-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 w-6 rounded-full bg-muted border-2 border-background" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
