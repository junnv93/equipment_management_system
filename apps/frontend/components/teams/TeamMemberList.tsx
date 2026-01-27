'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, User, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/ErrorAlert';
import teamsApi, { type TeamMember } from '@/lib/api/teams-api';
import { cn } from '@/lib/utils';

interface TeamMemberListProps {
  teamId: string;
  initialMembers?: TeamMember[];
}

/**
 * 팀원 목록 컴포넌트
 *
 * 기능:
 * - 팀원 검색
 * - 팀원 정보 표시 (이름, 역할, 이메일 등)
 */
export function TeamMemberList({ teamId, initialMembers = [] }: TeamMemberListProps) {
  const [search, setSearch] = useState('');

  // 팀원 목록 조회
  const {
    data: members,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: () => teamsApi.getTeamMembers(teamId),
    initialData: initialMembers.length > 0 ? initialMembers : undefined,
    staleTime: 60 * 1000,
  });

  // 검색 필터링
  const filteredMembers = (members || []).filter((member) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      member.name.toLowerCase().includes(searchLower) ||
      member.role?.toLowerCase().includes(searchLower) ||
      member.email?.toLowerCase().includes(searchLower) ||
      member.position?.toLowerCase().includes(searchLower)
    );
  });

  if (error) {
    return (
      <ErrorAlert
        error={error as Error}
        title="팀원 목록을 불러올 수 없습니다"
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="팀원 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
          aria-label="팀원 검색"
        />
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
                {search ? '검색 결과가 없습니다' : '등록된 팀원이 없습니다'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      이름
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground">
                      역할
                    </th>
                    <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">
                      이메일
                    </th>
                    <th className="text-right p-4 font-medium text-muted-foreground">
                      <span className="sr-only">작업</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, index) => (
                    <tr
                      key={member.id}
                      className={cn(
                        'border-b last:border-0 hover:bg-muted/30 transition-colors',
                        'animate-in fade-in fill-mode-forwards'
                      )}
                      style={{
                        animationDelay: `${index * 30}ms`,
                        animationDuration: '200ms',
                      }}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center"
                            data-testid="member-avatar"
                            aria-label={member.name}
                          >
                            {member.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={member.avatarUrl}
                                alt={member.name}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            {member.position && (
                              <p className="text-xs text-muted-foreground">
                                {member.position}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                          {member.role || '팀원'}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {member.email && (
                          <a
                            href={`mailto:${member.email}`}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`${member.name} 메뉴`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {member.email && (
                              <DropdownMenuItem asChild>
                                <a href={`mailto:${member.email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  이메일 보내기
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <User className="h-4 w-4 mr-2" />
                              프로필 보기
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

      {/* 결과 정보 */}
      {filteredMembers.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {search && `검색 결과: `}
          {filteredMembers.length}명의 팀원
        </p>
      )}
    </div>
  );
}
