'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Search, User, Mail, MoreHorizontal, ShieldCheck, X } from 'lucide-react';
import { getStaggerDelay, MOTION_TOKENS, TRANSITION_PRESETS } from '@/lib/design-tokens';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import teamsApi, { type TeamMember } from '@/lib/api/teams-api';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { cn } from '@/lib/utils';
import { UserRoleValues, UserRoleValues as URVal } from '@equipment-management/schemas';
import { MemberProfileDialog } from './MemberProfileDialog';
import type { CurrentUserInfo } from './TeamDetail';
import { ROLE_BADGE_TOKENS, TEAM_MEMBER_GROUP_TOKENS } from '@/lib/design-tokens';

interface TeamMemberListProps {
  teamId: string;
  teamSite?: string;
  initialMembers?: TeamMember[];
  currentUser?: CurrentUserInfo;
}

/** 역할 표시 순서 */
const ROLE_ORDER = [
  URVal.TECHNICAL_MANAGER,
  URVal.TEST_ENGINEER,
  URVal.QUALITY_MANAGER,
  URVal.LAB_MANAGER,
  URVal.SYSTEM_ADMIN,
] as const;

/**
 * 팀원 목록 컴포넌트
 *
 * 기능:
 * - 팀원 검색 (이름, 역할, 이메일, 직함) + X 버튼으로 초기화
 * - 역할 필터 드롭다운
 * - 프로필 보기 다이얼로그
 * - 역할 변경 (TM: 같은 팀, LM: 같은 사이트)
 * - Conditional WHERE CAS로 동시 수정 방어
 */
export function TeamMemberList({
  teamId,
  teamSite,
  initialMembers = [],
  currentUser,
}: TeamMemberListProps) {
  const t = useTranslations('teams');
  const tNav = useTranslations('navigation');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [profileMember, setProfileMember] = useState<TeamMember | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    member: TeamMember;
    newRole: string;
  } | null>(null);

  const membersQueryKey = queryKeys.teams.members(teamId);

  // 팀원 목록 조회
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: membersQueryKey,
    queryFn: () => teamsApi.getTeamMembers(teamId),
    placeholderData: initialMembers.length > 0 ? initialMembers : undefined,
    ...QUERY_CONFIG.USERS,
  });

  // 역할 변경 mutation (Optimistic Update)
  const changeRoleMutation = useOptimisticMutation<
    TeamMember,
    { userId: string; newRole: string; currentRole: string },
    TeamMember[]
  >({
    mutationFn: ({ userId, newRole, currentRole }) =>
      teamsApi.changeUserRole(userId, newRole, currentRole),
    queryKey: membersQueryKey,
    optimisticUpdate: (cachedMembers, { userId, newRole }) =>
      (cachedMembers || []).map((m) => (m.id === userId ? { ...m, role: newRole } : m)),
    invalidateKeys: [
      queryKeys.teams.detail(teamId),
      queryKeys.teams.lists(),
      queryKeys.users.list(),
      queryKeys.approvals.countsAll,
    ],
    successMessage: t('member.roleChangeSuccess'),
  });

  // 역할 변경 가능 여부 판단
  const canChangeRole = (member: TeamMember): boolean => {
    if (!currentUser) return false;
    if (currentUser.userId === member.id) return false;
    if (
      ![UserRoleValues.TEST_ENGINEER, UserRoleValues.TECHNICAL_MANAGER].includes(
        member.role as typeof UserRoleValues.TEST_ENGINEER
      )
    )
      return false;

    if (currentUser.role === UserRoleValues.TECHNICAL_MANAGER) {
      return member.teamId === currentUser.teamId;
    }
    if (currentUser.role === UserRoleValues.LAB_MANAGER) {
      return (teamSite || member.site) === currentUser.site;
    }
    if (currentUser.role === UserRoleValues.SYSTEM_ADMIN) {
      return true;
    }
    return false;
  };

  // 역할 변경 실행
  const handleRoleChange = () => {
    if (!roleChangeTarget) return;
    const { member, newRole } = roleChangeTarget;
    changeRoleMutation.mutate({
      userId: member.id,
      newRole,
      currentRole: member.role,
    });
    setRoleChangeTarget(null);
  };

  const getTargetRole = (currentRole: string) => {
    return currentRole === URVal.TEST_ENGINEER ? URVal.TECHNICAL_MANAGER : URVal.TEST_ENGINEER;
  };

  // 검색 + 역할 복합 필터링 — useMemo로 불필요한 재계산 방지
  const filteredMembers = useMemo(() => {
    return (members || []).filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        member.name.toLowerCase().includes(searchLower) ||
        member.role?.toLowerCase().includes(searchLower) ||
        member.email?.toLowerCase().includes(searchLower) ||
        member.position?.toLowerCase().includes(searchLower) ||
        member.department?.toLowerCase().includes(searchLower)
      );
    });
  }, [members, search, roleFilter]);

  // 역할별 그룹핑
  const groupedMembers = useMemo(() => {
    const groups: Record<string, TeamMember[]> = {};
    ROLE_ORDER.forEach((role) => {
      groups[role] = [];
    });
    filteredMembers.forEach((m) => {
      const role = m.role || URVal.TEST_ENGINEER;
      if (!groups[role]) groups[role] = [];
      groups[role].push(m);
    });
    return groups;
  }, [filteredMembers]);

  if (error) {
    return (
      <ErrorAlert error={error as Error} title={t('member.errorLoad')} onRetry={() => refetch()} />
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 + 역할 필터 + 팀원 수 */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2.5 flex-1 w-full sm:w-auto">
          {/* 검색 */}
          <div className="relative max-w-xs flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('member.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-sm"
              aria-label={t('member.searchAriaLabel')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className={cn(
                  'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground',
                  TRANSITION_PRESETS.fastColor
                )}
                aria-label={t('member.searchClear')}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 역할 필터 */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger
              className="w-[140px] h-9 text-sm"
              aria-label={t('member.roleFilterAriaLabel')}
            >
              <SelectValue placeholder={t('member.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('member.allRoles')}</SelectItem>
              {ROLE_ORDER.map((role) => (
                <SelectItem key={role} value={role}>
                  {tNav(`roles.${role}` as Parameters<typeof tNav>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
          {t('member.count', { count: filteredMembers.length })}
        </span>
      </div>

      {/* 팀원 목록 — 역할별 그룹 */}
      <div className="space-y-5">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-2 py-2.5">
                <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <User className="h-9 w-9 text-muted-foreground mb-2.5" />
            <p className="text-sm text-muted-foreground">
              {search || roleFilter !== 'all'
                ? t('member.empty.noResults')
                : t('member.empty.noMembers')}
            </p>
          </div>
        ) : (
          ROLE_ORDER.filter((role) => groupedMembers[role]?.length > 0).map((role) => (
            <div key={role}>
              {/* 역할 그룹 헤더 */}
              <div className={TEAM_MEMBER_GROUP_TOKENS.groupHeader}>
                <span
                  className={cn(
                    TEAM_MEMBER_GROUP_TOKENS.groupBadge,
                    ROLE_BADGE_TOKENS[role] || 'bg-muted text-muted-foreground'
                  )}
                >
                  {tNav(`roles.${role}` as Parameters<typeof tNav>[0])}
                </span>
                <span className={TEAM_MEMBER_GROUP_TOKENS.groupCount}>
                  {groupedMembers[role].length}명
                </span>
              </div>

              {/* 해당 역할 팀원 목록 */}
              <div className="mt-1">
                {groupedMembers[role].map((member, index) => (
                  <div
                    key={member.id}
                    className={cn(
                      TEAM_MEMBER_GROUP_TOKENS.memberRow,
                      member.isActive === false && 'opacity-50',
                      'motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-forwards'
                    )}
                    style={{
                      animationDelay: getStaggerDelay(index, 'list'),
                      animationDuration: `${MOTION_TOKENS.transition.fast.duration}ms`,
                    }}
                    onClick={() => setProfileMember(member)}
                  >
                    {/* 아바타 */}
                    <div
                      className={cn(
                        TEAM_MEMBER_GROUP_TOKENS.avatar,
                        ROLE_BADGE_TOKENS[member.role] || 'bg-muted text-muted-foreground'
                      )}
                      data-testid="member-avatar"
                      aria-label={member.name}
                    >
                      {member.name.charAt(0)}
                    </div>

                    {/* 이름 + 부서/이메일 */}
                    <div className={TEAM_MEMBER_GROUP_TOKENS.memberInfo}>
                      <p className={TEAM_MEMBER_GROUP_TOKENS.memberName}>
                        {member.name}
                        {member.isActive === false && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0">
                            {t('member.inactive')}
                          </Badge>
                        )}
                      </p>
                      <p className={TEAM_MEMBER_GROUP_TOKENS.memberSub}>
                        {[member.department, member.email].filter(Boolean).join(' · ')}
                      </p>
                    </div>

                    {/* 역할 변경 또는 액션 메뉴 */}
                    <div
                      className="flex items-center gap-1.5 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canChangeRole(member) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setRoleChangeTarget({
                              member,
                              newRole: getTargetRole(member.role),
                            })
                          }
                          className="h-7 text-xs px-2"
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {t('member.changeRoleButton', {
                            role: tNav(
                              `roles.${getTargetRole(member.role)}` as Parameters<typeof tNav>[0]
                            ),
                          })}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label={t('member.menuAriaLabel', { name: member.name })}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {member.email && (
                            <DropdownMenuItem asChild>
                              <a href={`mailto:${member.email}`}>
                                <Mail className="h-4 w-4 mr-2" />
                                {t('member.sendEmail')}
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setProfileMember(member)}>
                            <User className="h-4 w-4 mr-2" />
                            {t('member.viewProfile')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 프로필 다이얼로그 */}
      {profileMember && (
        <MemberProfileDialog
          member={profileMember}
          open={!!profileMember}
          onOpenChange={(open) => !open && setProfileMember(null)}
        />
      )}

      {/* 역할 변경 확인 다이얼로그 */}
      {roleChangeTarget && (
        <AlertDialog open={true} onOpenChange={(open) => !open && setRoleChangeTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('member.roleChangeDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('member.roleChangeDialog.description', {
                  name: roleChangeTarget.member.name,
                  from: tNav(`roles.${roleChangeTarget.member.role}` as Parameters<typeof tNav>[0]),
                  to: tNav(`roles.${roleChangeTarget.newRole}` as Parameters<typeof tNav>[0]),
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('member.roleChangeDialog.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleRoleChange}>
                {t('member.roleChangeDialog.confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
