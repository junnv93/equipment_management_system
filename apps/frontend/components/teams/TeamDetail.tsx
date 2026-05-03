'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ArrowLeft, Edit, Trash2, MapPin, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Permission } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import type { TeamDetail as TeamDetailType, TeamMember } from '@/lib/api/teams-api';
import { SITE_CONFIG, CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';
import { useSiteLabels } from '@/lib/i18n/use-enum-labels';
import { TeamTypeIcon, TeamTypeBadge } from './TeamTypeIcon';
import { TeamMemberList } from './TeamMemberList';
import { SITE_PANEL_TOKENS, SUB_PAGE_HEADER_TOKENS, TEAM_DETAIL_TOKENS } from '@/lib/design-tokens';

// 삭제 모달은 dynamic import로 지연 로딩
const DeleteTeamModal = dynamic(
  () => import('./DeleteTeamModal').then((mod) => ({ default: mod.DeleteTeamModal })),
  { loading: () => null, ssr: false }
);

export interface CurrentUserInfo {
  userId: string;
  role: UserRole;
  teamId?: string;
  site?: string;
}

interface TeamDetailProps {
  team: TeamDetailType;
  members?: TeamMember[];
  currentUser?: CurrentUserInfo;
}

/**
 * 팀 상세 컴포넌트 — 팀원 중심 리디자인
 *
 * 구조:
 * - 상단 헤더 (팀 이름 + 수정/삭제 버튼)
 * - 팀 정보 배너 (유형, 사이트, 리더, 팀원 수 — 1~2줄)
 * - 팀원 관리 (메인 콘텐츠 — 전체 화면)
 *
 * 장비 탭 제거: 장비 정보는 대시보드/장비관리 페이지에서 접근
 */
export function TeamDetail({ team, members = [], currentUser }: TeamDetailProps) {
  const router = useRouter();
  const t = useTranslations('teams');
  const siteLabels = useSiteLabels();
  const { can } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const siteInfo = team.site ? SITE_CONFIG[team.site as keyof typeof SITE_CONFIG] : null;
  const clsConfig =
    (team.classification && CLASSIFICATION_CONFIG[team.classification]) ||
    CLASSIFICATION_CONFIG.fcc_emc_rf;
  const memberCount = team.memberCount ?? members.length;
  const activeMemberCount = members.filter((member) => member.isActive !== false).length;
  const equipmentCount = team.equipmentCount ?? 0;
  const hasLeader = Boolean(team.leaderName);

  // SSOT: 백엔드 teams 컨트롤러 @RequirePermissions와 정렬
  const canEdit = can(Permission.UPDATE_TEAMS);
  const canDelete = can(Permission.DELETE_TEAMS);

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 및 액션 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/teams')}
            aria-label={t('detail.backToList')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <TeamTypeIcon classification={team.classification || team.id} size="lg" />
            <div>
              <h1 className={SUB_PAGE_HEADER_TOKENS.title}>{team.name}</h1>
              {siteInfo && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{siteLabels[team.site as keyof typeof siteLabels] || team.site}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/teams/${team.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('detail.edit')}
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('detail.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* 팀 정보 배너 — 분류 accent line으로 목록 ↔ 상세 시각 identity 연결 */}
      <Card className={TEAM_DETAIL_TOKENS.infoCard}>
        <div
          className={SITE_PANEL_TOKENS.accentBar}
          style={{ background: clsConfig.color }}
          aria-hidden="true"
        />
        <CardContent className={TEAM_DETAIL_TOKENS.contentGrid}>
          <div className={TEAM_DETAIL_TOKENS.narrative}>
            <div className="flex flex-wrap items-center gap-2">
              <TeamTypeBadge classification={team.classification || team.id} />
              {siteInfo && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {siteLabels[team.site as keyof typeof siteLabels] || team.site}
                  <span className="font-mono text-xs">· {siteInfo.code}</span>
                </span>
              )}
            </div>

            <p className={TEAM_DETAIL_TOKENS.description}>
              {team.description || t('detail.noDescription')}
            </p>

            <div className={TEAM_DETAIL_TOKENS.metaGrid}>
              <div>
                <div className={TEAM_DETAIL_TOKENS.metaLabel}>{t('detail.leaderMetric')}</div>
                <div className={TEAM_DETAIL_TOKENS.metaValue}>
                  <User
                    className={
                      hasLeader ? 'h-3.5 w-3.5 text-brand-ok' : 'h-3.5 w-3.5 text-brand-warning'
                    }
                    aria-hidden="true"
                  />
                  <span className="truncate">{team.leaderName || t('card.leaderNotAssigned')}</span>
                </div>
              </div>
              <div>
                <div className={TEAM_DETAIL_TOKENS.metaLabel}>
                  {t('detail.classificationMetric')}
                </div>
                <div className={TEAM_DETAIL_TOKENS.metaValue}>
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ background: clsConfig.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate">{clsConfig.label}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={TEAM_DETAIL_TOKENS.kpiGrid} aria-label={t('detail.kpiAriaLabel')}>
            <TeamKpiTile label={t('detail.kpi.members')} value={memberCount} />
            <TeamKpiTile
              label={t('detail.kpi.activeMembers')}
              value={activeMemberCount}
              suffix={`/${memberCount}`}
            />
            <TeamKpiTile label={t('detail.kpi.equipment')} value={equipmentCount} />
            <div className={TEAM_DETAIL_TOKENS.kpiTile}>
              <div className={TEAM_DETAIL_TOKENS.kpiLabel}>{t('detail.kpi.leader')}</div>
              <div
                className={`${TEAM_DETAIL_TOKENS.kpiStatus} ${
                  hasLeader ? 'text-brand-ok' : 'text-brand-warning'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {hasLeader ? t('card.leaderAssigned') : t('card.leaderNotAssigned')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 팀원 관리 (메인 콘텐츠 — 탭 없이 직접) */}
      <TeamMemberList
        teamId={team.id}
        teamSite={team.site || undefined}
        initialMembers={members}
        currentUser={currentUser}
      />

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteTeamModal team={team} open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
      )}
    </div>
  );
}

function TeamKpiTile({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className={TEAM_DETAIL_TOKENS.kpiTile}>
      <div className={TEAM_DETAIL_TOKENS.kpiLabel}>{label}</div>
      <div className={TEAM_DETAIL_TOKENS.kpiValue}>
        {value}
        {suffix && <span className={TEAM_DETAIL_TOKENS.kpiSubValue}>{suffix}</span>}
      </div>
    </div>
  );
}
