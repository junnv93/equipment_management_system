'use client';

import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  User,
  Shield,
  ShieldCheck,
  Crown,
} from 'lucide-react';

interface WelcomeHeaderProps {
  className?: string;
}

// 역할 정보 정의
interface RoleInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
  description: string;
}

const roleInfo: Record<string, RoleInfo> = {
  test_engineer: {
    label: '시험실무자',
    color: 'text-blue-700 dark:text-blue-300',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    icon: User,
    description: '장비 등록/수정 요청, 대여/반출 신청',
  },
  technical_manager: {
    label: '기술책임자',
    color: 'text-green-700 dark:text-green-300',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: Shield,
    description: '요청 승인/반려, 팀 내 장비 관리',
  },
  lab_manager: {
    label: '시험소 관리자',
    color: 'text-purple-700 dark:text-purple-300',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    icon: ShieldCheck,
    description: '시험소 전체 관리, 교정계획서 승인',
  },
  system_admin: {
    label: '시스템 관리자',
    color: 'text-orange-700 dark:text-orange-300',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: Crown,
    description: '전체 시스템 관리, 모든 권한',
  },
  admin: {
    label: '관리자',
    color: 'text-red-700 dark:text-red-300',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: Crown,
    description: '시스템 관리 권한',
  },
  user: {
    label: '사용자',
    color: 'text-gray-700 dark:text-gray-300',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    icon: User,
    description: '기본 사용자',
  },
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '새벽이네요';
  if (hour < 12) return '좋은 아침입니다';
  if (hour < 14) return '점심 식사하셨나요';
  if (hour < 18) return '좋은 오후입니다';
  if (hour < 22) return '좋은 저녁입니다';
  return '늦은 시간까지 수고하세요';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function WelcomeHeader({ className }: WelcomeHeaderProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className={cn('space-y-3', className)}>
        <Skeleton className="h-9 w-72" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || '사용자';
  const userRole = session?.user?.role?.toLowerCase() || 'user';
  const role = roleInfo[userRole] || roleInfo['user'];
  const RoleIcon = role.icon;

  const greeting = getGreeting();
  const today = formatDate(new Date());

  return (
    <div
      className={cn('space-y-2', className)}
      role="banner"
      aria-label="환영 메시지 및 사용자 정보"
    >
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
        {greeting}, <span className="text-primary">{userName}</span>님
      </h1>

      <div className="flex flex-wrap items-center gap-3">
        {/* 역할 배지 */}
        <Badge
          variant="secondary"
          className={cn(
            'flex items-center gap-1.5 py-1 px-2.5',
            role.bgColor,
            role.color
          )}
          aria-label={`현재 역할: ${role.label}`}
        >
          <RoleIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{role.label}</span>
        </Badge>

        {/* 온라인 상태 표시 */}
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full bg-ul-green animate-pulse"
            aria-hidden="true"
          />
          <span className="sr-only">온라인 상태</span>
          온라인
        </span>

        {/* 구분선 */}
        <span className="hidden sm:inline text-muted-foreground/30" aria-hidden="true">
          |
        </span>

        {/* 날짜 */}
        <time
          dateTime={new Date().toISOString()}
          className="text-sm text-muted-foreground"
        >
          {today}
        </time>
      </div>

      {/* 역할 설명 (작은 텍스트) */}
      <p className="text-xs text-muted-foreground/70 hidden md:block">
        {role.description}
      </p>
    </div>
  );
}
