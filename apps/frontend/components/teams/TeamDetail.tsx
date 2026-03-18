'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { ArrowLeft, Edit, Trash2, Users, MapPin, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { UserRoleValues as URVal } from '@equipment-management/schemas';
import type { TeamDetail as TeamDetailType, TeamMember } from '@/lib/api/teams-api';
import { SITE_CONFIG, CLASSIFICATION_CONFIG } from '@/lib/api/teams-api';
import { TeamTypeIcon, TeamTypeBadge } from './TeamTypeIcon';
import { TeamMemberList } from './TeamMemberList';
import { SITE_PANEL_TOKENS } from '@/lib/design-tokens';

// 삭제 모달은 dynamic import로 지연 로딩
const DeleteTeamModal = dynamic(
  () => import('./DeleteTeamModal').then((mod) => ({ default: mod.DeleteTeamModal })),
  { loading: () => null, ssr: false }
);

export interface CurrentUserInfo {
  userId: string;
  role: string;
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
  const { hasRole } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const siteInfo = team.site ? SITE_CONFIG[team.site as keyof typeof SITE_CONFIG] : null;
  const clsConfig =
    (team.classification && CLASSIFICATION_CONFIG[team.classification]) ||
    CLASSIFICATION_CONFIG.fcc_emc_rf;

  // 권한 확인
  const canEdit = hasRole([URVal.TECHNICAL_MANAGER, URVal.LAB_MANAGER, URVal.SYSTEM_ADMIN]);
  const canDelete = hasRole([URVal.SYSTEM_ADMIN]); // system_admin만 팀 삭제 가능

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
              <h1 className="text-2xl font-bold">{team.name}</h1>
              {siteInfo && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{siteInfo.label}</span>
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
      <Card className="relative overflow-hidden">
        <div
          className={SITE_PANEL_TOKENS.accentBar}
          style={{ background: clsConfig.color }}
          aria-hidden="true"
        />
        <CardContent className="py-4 pt-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <TeamTypeBadge classification={team.classification || team.id} />
            {siteInfo && (
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {siteInfo.label}
              </span>
            )}
            {team.leaderName && (
              <span className="text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" aria-hidden="true" />
                {t('detail.leaderLabel')} {team.leaderName}
              </span>
            )}
            <span
              className="text-muted-foreground flex items-center gap-1"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              <Users className="h-3 w-3" aria-hidden="true" />
              {team.memberCount || 0}명
            </span>
          </div>
          {team.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{team.description}</p>
          )}
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
