'use client';

import { LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { getHeaderSizeClasses, HEADER_INTERACTIVE_STYLES } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';

// 역할 표시 이름 매핑
const roleDisplayNames: Record<string, string> = {
  test_engineer: '시험실무자',
  technical_manager: '기술책임자',
  quality_manager: '품질책임자',
  lab_manager: '시험소 관리자',
  system_admin: '시스템 관리자',
};

// 역할별 배지 색상
const roleBadgeColors: Record<string, string> = {
  test_engineer: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  technical_manager: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  quality_manager: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  lab_manager: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  system_admin: 'bg-ul-red/10 text-ul-red dark:bg-ul-red/20 dark:text-red-300',
};

/**
 * 사용자 프로필 드롭다운
 *
 * Design System:
 * - SSOT: lib/design-tokens/header.ts
 * - 아바타: 모바일 40px, 데스크톱 36px
 * - 포커스/호버 스타일 통일
 */
export function UserProfileDropdown() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className={cn('rounded-full', getHeaderSizeClasses('avatar'))} />
        <Skeleton className="h-4 w-20 hidden sm:block" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRole = user.role?.toLowerCase() || 'test_engineer';
  const roleDisplayName = roleDisplayNames[userRole] || userRole;
  const badgeColor = roleBadgeColors[userRole] || roleBadgeColors.test_engineer;

  // 이름의 첫 글자 추출 (아바타 fallback용)
  const getInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'flex items-center gap-2 px-2',
            HEADER_INTERACTIVE_STYLES.hover,
            HEADER_INTERACTIVE_STYLES.focus,
            HEADER_INTERACTIVE_STYLES.transition
          )}
          aria-label="사용자 메뉴"
        >
          <Avatar
            className={cn(
              'border-2 border-ul-midnight/20 dark:border-white/20',
              getHeaderSizeClasses('avatar')
            )}
          >
            <AvatarFallback className="bg-ul-midnight text-white text-xs font-medium">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
            {user.name || '사용자'}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* 사용자 정보 헤더 */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name || '사용자'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email || '이메일 없음'}</p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit mt-1 ${badgeColor}`}
            >
              {roleDisplayName}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 로그아웃 버튼 */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-ul-red focus:text-ul-red focus:bg-ul-red/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>로그아웃</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
