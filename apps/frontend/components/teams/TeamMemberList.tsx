'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Search, User, Mail, MoreHorizontal, ShieldCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { UserRoleValues } from '@equipment-management/schemas';
import { MemberProfileDialog } from './MemberProfileDialog';
import type { CurrentUserInfo } from './TeamDetail';

interface TeamMemberListProps {
  teamId: string;
  teamSite?: string;
  initialMembers?: TeamMember[];
  currentUser?: CurrentUserInfo;
}

/** 역할 뱃지 색상 매핑 */
const ROLE_BADGE_VARIANT: Record<string, string> = {
  test_engineer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  technical_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  quality_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  lab_manager: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

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
      queryKeys.approvals.counts(),
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
    return currentRole === 'test_engineer' ? 'technical_manager' : 'test_engineer';
  };

  // 검색 + 역할 복합 필터링
  const filteredMembers = (members || []).filter((member) => {
    // 역할 필터
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    // 검색 필터
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

  if (error) {
    return (
      <ErrorAlert error={error as Error} title={t('member.errorLoad')} onRetry={() => refetch()} />
    );
  }

  const roleKeys = [
    'test_engineer',
    'technical_manager',
    'quality_manager',
    'lab_manager',
  ] as const;

  return (
    <div className="space-y-4">
      {/* 검색 + 역할 필터 + 팀원 수 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          {/* 검색 (+ clear 버튼) */}
          <div className="relative max-w-md flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder={t('member.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-8"
              aria-label={t('member.searchAriaLabel')}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={t('member.searchClear')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 역할 필터 */}
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]" aria-label={t('member.roleFilterAriaLabel')}>
              <SelectValue placeholder={t('member.allRoles')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('member.allRoles')}</SelectItem>
              {roleKeys.map((role) => (
                <SelectItem key={role} value={role}>
                  {tNav(`roles.${role}` as Parameters<typeof tNav>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 팀원 수 */}
        <span
          className="text-sm text-muted-foreground shrink-0"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {t('member.count', { count: filteredMembers.length })}
        </span>
      </div>

      {/* 팀원 목록 */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {search || roleFilter !== 'all'
                  ? t('member.empty.noResults')
                  : t('member.empty.noMembers')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      {t('member.table.name')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      {t('member.table.role')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">
                      {t('member.table.department')}
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                      {t('member.table.email')}
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">
                      <span className="sr-only">{t('member.table.actionsLabel')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr
                      key={member.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/30 transition-colors',
                        'motion-safe:animate-in motion-safe:fade-in motion-safe:fill-mode-forwards',
                        member.isActive === false && 'opacity-50'
                      )}
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animationDuration: '200ms',
                      }}
                    >
                      {/* 이름/직함 */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0"
                            data-testid="member-avatar"
                            aria-label={member.name}
                          >
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              {member.name}
                              {member.isActive === false && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {t('member.inactive')}
                                </Badge>
                              )}
                            </p>
                            {member.position && (
                              <p className="text-xs text-muted-foreground truncate">
                                {member.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 역할 + 역할 변경 버튼 */}
                      <td className="p-4">
                        {canChangeRole(member) ? (
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                ROLE_BADGE_VARIANT[member.role] || 'bg-muted'
                              )}
                            >
                              {tNav(`roles.${member.role}` as Parameters<typeof tNav>[0])}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRoleChangeTarget({
                                  member,
                                  newRole: getTargetRole(member.role),
                                })
                              }
                              className="h-7 text-xs"
                            >
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              {t('member.changeRoleButton', {
                                role: tNav(
                                  `roles.${getTargetRole(member.role)}` as Parameters<
                                    typeof tNav
                                  >[0]
                                ),
                              })}
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                              ROLE_BADGE_VARIANT[member.role] || 'bg-muted'
                            )}
                          >
                            {tNav(`roles.${member.role}` as Parameters<typeof tNav>[0])}
                          </span>
                        )}
                      </td>

                      {/* 부서 */}
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {member.department || '-'}
                        </span>
                      </td>

                      {/* 이메일 */}
                      <td className="p-4 hidden md:table-cell">
                        {member.email ? (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* 작업 */}
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={t('member.menuAriaLabel', { name: member.name })}
                            >
                              <MoreHorizontal className="h-4 w-4" />
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 프로필 다이얼로그 */}
      {profileMember && (
        <MemberProfileDialog
          member={profileMember}
          open={!!profileMember}
          onOpenChange={(open) => !open && setProfileMember(null)}
        />
      )}

      {/* 역할 변경 확인 다이얼로그 */}
      <AlertDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => !open && setRoleChangeTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('member.roleChangeDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('member.roleChangeDialog.description', {
                name: roleChangeTarget?.member.name || '',
                from: tNav(`roles.${roleChangeTarget?.member.role}` as Parameters<typeof tNav>[0]),
                to: tNav(`roles.${roleChangeTarget?.newRole}` as Parameters<typeof tNav>[0]),
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
    </div>
  );
}
