'use client';

import { LogOut, ChevronDown, User, Settings } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
import {
  getHeaderSizeClasses,
  HEADER_INTERACTIVE_STYLES,
  getSemanticSolidBgClasses,
} from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { FRONTEND_ROUTES } from '@equipment-management/shared-constants';
import { UserRoleValues as URVal } from '@equipment-management/schemas';

// 역할별 배지 색상
const roleBadgeColors: Record<string, string> = {
  test_engineer: 'bg-brand-info/10 text-brand-info',
  technical_manager: 'bg-brand-ok/10 text-brand-ok',
  quality_manager: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  lab_manager: 'bg-brand-purple/10 text-brand-purple',
  system_admin: 'bg-brand-critical/10 text-brand-critical',
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
  const t = useTranslations('navigation');

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

  const userRole = user.role?.toLowerCase() || URVal.TEST_ENGINEER;
  const roleNames: Record<string, string> = {
    test_engineer: t('roles.test_engineer'),
    technical_manager: t('roles.technical_manager'),
    quality_manager: t('roles.quality_manager'),
    lab_manager: t('roles.lab_manager'),
    system_admin: t('roles.system_admin'),
  };
  const roleDisplayName = roleNames[userRole] ?? userRole;
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
          aria-label={t('layout.userMenu')}
        >
          <Avatar
            className={cn(
              'border-2 border-ul-midnight/20 dark:border-white/20',
              getHeaderSizeClasses('avatar')
            )}
          >
            <AvatarFallback className={`${getSemanticSolidBgClasses('info')} text-xs font-medium`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
            {user.name || t('layout.user')}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* 사용자 정보 헤더 */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-none">{user.name || t('layout.user')}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email || t('layout.noEmail')}
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit mt-1 ${badgeColor}`}
            >
              {roleDisplayName}
            </span>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 내 프로필 링크 */}
        <DropdownMenuItem asChild>
          <Link href={FRONTEND_ROUTES.SETTINGS.PROFILE} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t('settingsProfile')}</span>
          </Link>
        </DropdownMenuItem>

        {/* 설정 링크 */}
        <DropdownMenuItem asChild>
          <Link href={FRONTEND_ROUTES.SETTINGS.INDEX} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('settings')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 로그아웃 버튼 */}
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-brand-critical focus-visible:text-brand-critical focus-visible:bg-brand-critical/10 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('layout.logout')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
