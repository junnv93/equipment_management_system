'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Settings,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import type { TeamDetail as TeamDetailType, TeamMember } from '@/lib/api/teams-api';
import { SITE_CONFIG } from '@/lib/api/teams-api';
import { TeamTypeIcon, TeamTypeBadge } from './TeamTypeIcon';
import { TeamMemberList } from './TeamMemberList';
import { TeamEquipmentList } from './TeamEquipmentList';

// 삭제 모달은 dynamic import로 지연 로딩
const DeleteTeamModal = dynamic(
  () => import('./DeleteTeamModal').then((mod) => ({ default: mod.DeleteTeamModal })),
  { ssr: false }
);

interface TeamDetailProps {
  team: TeamDetailType;
  members?: TeamMember[];
}

/**
 * 팀 상세 컴포넌트
 *
 * 기능:
 * - 팀 기본 정보 표시
 * - 팀원 목록 탭
 * - 팀 장비 목록 탭 (링크)
 * - 팀 수정/삭제 (권한 있는 경우)
 *
 * 권한:
 * - test_engineer: 조회만 가능
 * - technical_manager: 수정 가능
 * - lab_manager: 시험소 내 팀 수정/삭제 가능
 * - system_admin: 모든 팀 삭제 가능
 */
export function TeamDetail({ team, members = [] }: TeamDetailProps) {
  const router = useRouter();
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('members');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const siteInfo = team.site ? SITE_CONFIG[team.site as keyof typeof SITE_CONFIG] : null;

  // 권한 확인
  const canEdit = hasRole(['technical_manager', 'lab_manager', 'system_admin']);
  const canDelete = hasRole(['system_admin']); // system_admin만 팀 삭제 가능

  // 날짜 포맷팅
  const formatDate = (date: string | Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* 상단 네비게이션 및 액션 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/teams')}
            aria-label="팀 목록으로 돌아가기"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-3">
            <TeamTypeIcon type={team.type || team.id} size="lg" />
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
            <Button
              variant="outline"
              onClick={() => router.push(`/teams/${team.id}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          )}
        </div>
      </div>

      {/* 팀 정보 카드 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>팀 정보</CardTitle>
            <TeamTypeBadge type={team.type || team.id} />
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 왼쪽: 기본 정보 */}
          <div className="space-y-4">
            {team.description && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  팀 설명
                </h3>
                <p className="text-sm">{team.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  생성일
                </h3>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(team.createdAt)}</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  최종 수정일
                </h3>
                <div className="flex items-center gap-1.5 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(team.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 통계 및 팀장 정보 */}
          <div className="space-y-4">
            {/* 팀장 정보 */}
            {team.leaderId && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  팀장
                </h3>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {team.leaderName || team.leaderId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      팀 리더
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">팀원 수</span>
                </div>
                <p className="text-2xl font-semibold">{team.memberCount || 0}명</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">보유 장비</span>
                </div>
                <p className="text-2xl font-semibold">{team.equipmentCount || 0}개</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 탭 네비게이션 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="gap-2">
            <Users className="h-4 w-4" />
            팀원 ({team.memberCount || 0})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="gap-2">
            <Settings className="h-4 w-4" />
            장비 ({team.equipmentCount || 0})
          </TabsTrigger>
        </TabsList>

        {/* 팀원 탭 */}
        <TabsContent value="members" className="m-0">
          <TeamMemberList teamId={team.id} initialMembers={members} />
        </TabsContent>

        {/* 장비 탭 */}
        <TabsContent value="equipment" className="m-0">
          <TeamEquipmentList teamId={team.id} />
        </TabsContent>
      </Tabs>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteTeamModal
          team={team}
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
        />
      )}
    </div>
  );
}
